// app/api/track/init/route.js
// Session Başlatma Endpoint (Site Script için)
// Tüm ziyaretçileri (ads/organik/direkt) izler

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';
import {
    checkIPWhitelist,
    createIPInfo,
    upsertDevice,
    determineTrafficSource,
    extractGclid
} from '@/lib/helpers';

export async function POST(request) {
    try {
        const body = await request.json();

        const {
            tracking_id,
            ad_click_id,
            fingerprint_id,
            screen_width,
            screen_height,
            landing_page,
            referrer,
            fingerprint_data // FingerprintJS components
        } = body;

        // Tracking ID ve fingerprint zorunlu
        if (!tracking_id || !fingerprint_id) {
            return NextResponse.json(
                { error: 'tracking_id ve fingerprint_id gerekli' },
                { status: 400 }
            );
        }

        // IP ve User Agent
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const userAgent = request.headers.get('user-agent') || '';

        console.log('🎯 Session init çağrıldı:', {
            tracking_id,
            ip,
            fingerprint_id: fingerprint_id.substring(0, 15) + '...',
            has_ad_click: !!ad_click_id
        });

        // ═══════════════════════════════════════════════════════════
        // STEP 1: Domain Bul
        // ═══════════════════════════════════════════════════════════
        const { data: domain, error: domainError } = await supabaseAdmin
            .from('domains')
            .select('id, domain')
            .eq('tracking_id', tracking_id)
            .eq('is_active', true)
            .single();

        if (domainError || !domain) {
            return NextResponse.json(
                { error: 'Domain bulunamadı' },
                { status: 404 }
            );
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 2: IP WHITELIST KONTROLÜ
        // ═══════════════════════════════════════════════════════════
        const isWhitelisted = await checkIPWhitelist(ip);

        if (isWhitelisted) {
            console.log('🤖 Whitelisted IP, session atlanıyor:', ip);
            return NextResponse.json({
                skipped: true,
                reason: 'whitelisted'
            });
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 3: IP-API Çağrısı (HER SEFERINDE!)
        // ═══════════════════════════════════════════════════════════
        const ipInfo = await createIPInfo(ip, userAgent);

        if (!ipInfo) {
            console.error('⚠️ IP info oluşturulamadı');
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 4: Device Kaydet/Güncelle
        // ═══════════════════════════════════════════════════════════
        const device = await upsertDevice(
            fingerprint_id,
            userAgent,
            screen_width,
            screen_height
        );

        if (!device) {
            return NextResponse.json(
                { error: 'Device kaydedilemedi' },
                { status: 500 }
            );
        }

        // FingerprintJS data varsa güncelle
        if (fingerprint_data) {
            await supabaseAdmin
                .from('devices')
                .update({ fingerprint_data })
                .eq('id', device.id);
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 5: Ad Click Kontrol Et
        // ═══════════════════════════════════════════════════════════
        let adClick = null;

        if (ad_click_id) {
            const { data } = await supabaseAdmin
                .from('ad_clicks')
                .select('id')
                .eq('id', ad_click_id)
                .eq('domain_id', domain.id)
                .single();

            adClick = data;
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 6: Traffic Source Belirle
        // ═══════════════════════════════════════════════════════════
        const gclid = extractGclid(landing_page);
        const { isAdTraffic, trafficSource } = determineTrafficSource(
            referrer,
            gclid,
            adClick?.id
        );

        console.log('🚦 Traffic source:', {
            isAdTraffic,
            trafficSource,
            hasAdClick: !!adClick
        });

        // ═══════════════════════════════════════════════════════════
        // STEP 7: Session Oluştur
        // ═══════════════════════════════════════════════════════════
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .insert({
                domain_id: domain.id,
                device_id: device.id,
                ip_info_id: ipInfo?.id || null,
                ad_click_id: adClick?.id || null,
                is_ad_traffic: isAdTraffic,
                traffic_source: trafficSource,
                browser: device.browser,
                user_agent: userAgent,
                referrer: referrer,
                landing_page: landing_page,
                gclid: gclid,
                started_at: new Date().toISOString(),
                last_activity_at: new Date().toISOString()
            })
            .select()
            .single();

        if (sessionError) {
            console.error('❌ Session oluşturma hatası:', sessionError);
            return NextResponse.json(
                { error: 'Session oluşturulamadı' },
                { status: 500 }
            );
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 8: İlk Page View Event'i Kaydet
        // ═══════════════════════════════════════════════════════════
        await supabaseAdmin
            .from('session_events')
            .insert({
                session_id: session.id,
                event_type: 'page_view',
                page_url: landing_page,
                occurred_at: new Date().toISOString()
            });

        console.log('✅ Session oluşturuldu:', {
            sessionId: session.id,
            domain: domain.domain,
            isAdTraffic,
            trafficSource
        });

        return NextResponse.json({
            success: true,
            session_id: session.id,
            is_ad_traffic: isAdTraffic,
            traffic_source: trafficSource
        });

    } catch (error) {
        console.error('❌ Track init hatası:', error);
        return NextResponse.json(
            { error: 'Bir hata oluştu' },
            { status: 500 }
        );
    }
}
