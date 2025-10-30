// app/api/track/init/route.js
// Session başlatma endpoint'i

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';
import { parseUserAgent, extractGclid, enrichIPLocation, shouldBlockIP } from '@/lib/helpers';

export async function POST(request) {
    try {
        const body = await request.json();

        const {
            click_id,
            tracking_id,
            fingerprint_id,
            screen_width,
            screen_height,
            device_pixel_ratio,
            landing_page,
            referrer,
            user_agent,
            components // FingerprintJS components
        } = body;

        // Tracking ID zorunlu
        if (!tracking_id || !fingerprint_id) {
            return NextResponse.json(
                { error: 'tracking_id ve fingerprint_id gerekli' },
                { status: 400 }
            );
        }

        // IP bilgisi al
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';

        // 1. Domain'i bul
        const { data: domain } = await supabaseAdmin
            .from('domains')
            .select('id, domain')
            .eq('tracking_id', tracking_id)
            .eq('is_active', true)
            .single();

        if (!domain) {
            return NextResponse.json(
                { error: 'Domain bulunamadı' },
                { status: 404 }
            );
        }

        // 2. Device'ı al veya oluştur
        let device = await supabaseAdmin
            .from('devices')
            .select('*')
            .eq('fingerprint_id', fingerprint_id)
            .single();

        if (!device.data) {
            // Yeni device oluştur
            const deviceData = parseUserAgent(user_agent || '');

            const { data: newDevice, error: deviceError } = await supabaseAdmin
                .from('devices')
                .insert({
                    fingerprint_id: fingerprint_id,
                    device_type: deviceData.type,
                    os: deviceData.os,
                    os_version: deviceData.osVersion,
                    browser: deviceData.browser,
                    browser_version: deviceData.browserVersion,
                    screen_width: screen_width,
                    screen_height: screen_height,
                    screen_pixel_ratio: device_pixel_ratio,
                    fingerprint_data: components,
                    first_seen_at: new Date().toISOString(),
                    last_seen_at: new Date().toISOString()
                })
                .select()
                .single();

            if (deviceError) {
                console.error('Device oluşturma hatası:', deviceError);
                return NextResponse.json(
                    { error: 'Device kaydedilemedi' },
                    { status: 500 }
                );
            }

            device.data = newDevice;
        }

        // 3. Ad click var mı kontrol et
        let adClickId = null;
        let isAdTraffic = false;

        if (click_id) {
            const { data: adClick } = await supabaseAdmin
                .from('ad_clicks')
                .select('id, domain_id')
                .eq('click_id', click_id)
                .single();

            if (adClick && adClick.domain_id === domain.id) {
                adClickId = adClick.id;
                isAdTraffic = true;

                // Ad click'i device ile ilişkilendir
                await supabaseAdmin
                    .from('ad_clicks')
                    .update({
                        device_id: device.data.id,
                        session_linked: true,
                        session_linked_at: new Date().toISOString()
                    })
                    .eq('id', adClickId);
            }
        }

        // 4. Session oluştur
        const gclid = extractGclid(landing_page);

        const { data: session, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .insert({
                domain_id: domain.id,
                device_id: device.data.id,
                ip: ip,
                landing_page: landing_page,
                referrer: referrer,
                gclid: gclid,
                started_at: new Date().toISOString(),
                last_activity_at: new Date().toISOString()
            })
            .select()
            .single();

        if (sessionError) {
            console.error('Session oluşturma hatası:', sessionError);
            return NextResponse.json(
                { error: 'Session oluşturulamadı' },
                { status: 500 }
            );
        }

        // 5. Device-IP ilişkisini güncelle
        await supabaseAdmin
            .from('device_ips')
            .upsert({
                device_id: device.data.id,
                ip: ip,
                last_seen_at: new Date().toISOString()
            }, {
                onConflict: 'device_id,ip'
            });

        // 6. IP lokasyon bilgisini zenginleştir (async)
        enrichIPLocation(ip).catch(err =>
            console.error('IP enrichment hatası:', err)
        );

        // 7. Eğer ad traffic ise, IP threat score'u güncelle
        if (isAdTraffic) {
            // Threat score güncelle
            const { data: existingThreat } = await supabaseAdmin
                .from('ip_threat_scores')
                .select('*')
                .eq('domain_id', domain.id)
                .eq('ip', ip)
                .single();

            if (existingThreat) {
                await supabaseAdmin
                    .from('ip_threat_scores')
                    .update({
                        click_count: (existingThreat.click_count || 0) + 1,
                        session_count: (existingThreat.session_count || 0) + 1,
                        last_click_at: new Date().toISOString()
                    })
                    .eq('id', existingThreat.id);
            } else {
                await supabaseAdmin
                    .from('ip_threat_scores')
                    .insert({
                        domain_id: domain.id,
                        ip: ip,
                        click_count: 1,
                        session_count: 1,
                        first_seen_at: new Date().toISOString(),
                        last_click_at: new Date().toISOString()
                    });
            }

            // IP engellenecek mi kontrol et
            const blockCheck = await shouldBlockIP(domain.id, ip);

            if (blockCheck.shouldBlock) {
                // IP blocklist'e ekle
                await supabaseAdmin
                    .from('ip_blocklist')
                    .upsert({
                        domain_id: domain.id,
                        ip: ip,
                        threat_level: 'high',
                        block_reason: { reason: blockCheck.reason },
                        blocked_at: new Date().toISOString(),
                        synced_to_ads: false
                    }, {
                        onConflict: 'domain_id,ip'
                    });

                console.log('🚫 IP engellendi:', ip, blockCheck.reason);
            }
        }

        console.log('✅ Session oluşturuldu:', {
            sessionId: session.id,
            domain: domain.domain,
            ip,
            isAdTraffic,
            fingerprintId: fingerprint_id
        });

        return NextResponse.json({
            success: true,
            session_id: session.id,
            is_ad_traffic: isAdTraffic
        });

    } catch (error) {
        console.error('Track init hatası:', error);
        return NextResponse.json(
            { error: 'Bir hata oluştu' },
            { status: 500 }
        );
    }
}

