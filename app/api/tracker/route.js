// app/api/tracker/route.js
// Google Ads Tracking Template Endpoint - AGRESİF ENGELLEME
// Ads'dan gelen HER IP → ANINDA ENGELLE (whitelist hariç)

import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabaseAdmin } from '@/lib/supabase-client';
import {
    checkIPWhitelist,
    createIPInfo,
    generateServerFingerprint,
    upsertDevice,
    parseUserAgent
} from '@/lib/helpers';
import { GoogleAdsClientOfficial } from '@/lib/google-ads-client-official';

export async function GET(request) {
    const startTime = Date.now();

    try {
        const { searchParams } = new URL(request.url);

        // Google Ads parametreleri
        const trackingId = searchParams.get('id');
        const campaignId = searchParams.get('campaign_id');
        const gclid = searchParams.get('gclid');
        const keyword = searchParams.get('keyword');
        const device = searchParams.get('device');
        const network = searchParams.get('network');
        const adPosition = searchParams.get('adpos');
        const placement = searchParams.get('placement');
        const finalUrl = searchParams.get('url');

        // Tracking ID ve URL zorunlu
        if (!trackingId || !finalUrl) {
            console.error('❌ Tracking ID veya URL eksik');
            return NextResponse.redirect(finalUrl || 'https://google.com');
        }

        // IP ve User Agent bilgisi
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const userAgent = request.headers.get('user-agent') || '';
        const acceptLanguage = request.headers.get('accept-language') || '';

        console.log('🎯 Tracking URL çağrıldı:', {
            trackingId,
            campaignId,
            ip,
            gclid: gclid?.substring(0, 20) + '...'
        });

        // ═══════════════════════════════════════════════════════════
        // STEP 1: Domain Bul
        // ═══════════════════════════════════════════════════════════
        const { data: domain, error: domainError } = await supabaseAdmin
            .from('domains')
            .select('id, domain, is_active, ads_account_id')
            .eq('tracking_id', trackingId)
            .eq('is_active', true)
            .single();

        if (domainError || !domain) {
            console.error('❌ Domain bulunamadı:', trackingId);
            return NextResponse.redirect(finalUrl);
        }

        console.log('✅ Domain bulundu:', domain.domain);

        // ═══════════════════════════════════════════════════════════
        // STEP 2: IP WHITELIST KONTROLÜ (İLK ÖNCE!)
        // ═══════════════════════════════════════════════════════════
        const isWhitelisted = await checkIPWhitelist(ip);

        if (isWhitelisted) {
            console.log('🤖 Whitelisted IP (Googlebot vb.), tracking atlanıyor:', ip);
            return NextResponse.redirect(finalUrl);
        }

        console.log('✅ IP whitelist\'te değil, devam ediliyor');

        // ═══════════════════════════════════════════════════════════
        // STEP 3: IP-API Çağrısı (HER SEFERINDE!)
        // ═══════════════════════════════════════════════════════════
        const ipInfo = await createIPInfo(ip, userAgent);

        if (!ipInfo) {
            console.error('⚠️ IP info oluşturulamadı, devam ediliyor');
        } else {
            console.log('✅ IP info kaydedildi:', {
                id: ipInfo.id,
                city: ipInfo.city,
                isp: ipInfo.isp,
                isHosting: ipInfo.is_hosting
            });
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 4: Server-side Fingerprint Oluştur
        // ═══════════════════════════════════════════════════════════
        const fingerprintId = generateServerFingerprint(ip, userAgent, acceptLanguage);
        console.log('✅ Server fingerprint:', fingerprintId);

        // ═══════════════════════════════════════════════════════════
        // STEP 5: Device Kaydet/Güncelle
        // ═══════════════════════════════════════════════════════════
        const device_record = await upsertDevice(fingerprintId, userAgent);

        if (!device_record) {
            console.error('⚠️ Device kaydedilemedi, devam ediliyor');
        } else {
            console.log('✅ Device kaydedildi:', device_record.id);
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 6: Campaign Kontrol Et (Yoksa Ekle - auto_detected)
        // ═══════════════════════════════════════════════════════════
        let campaign = null;

        if (campaignId) {
            const { data: existingCampaign } = await supabaseAdmin
                .from('ads_campaigns')
                .select('*')
                .eq('domain_id', domain.id)
                .eq('campaign_id', campaignId)
                .single();

            if (existingCampaign) {
                campaign = existingCampaign;
                console.log('✅ Kampanya mevcut:', campaign.campaign_name || campaignId);
            } else {
                // YENİ KAMPANYA TESPİT EDİLDİ!
                const { data: newCampaign, error: campaignError } = await supabaseAdmin
                    .from('ads_campaigns')
                    .insert({
                        domain_id: domain.id,
                        campaign_id: campaignId,
                        campaign_name: null, // Sonra Google Ads API'den çekilecek
                        added_method: 'auto_detected',
                        is_active: true
                    })
                    .select()
                    .single();

                if (!campaignError && newCampaign) {
                    campaign = newCampaign;
                    console.log('🆕 YENİ KAMPANYA TESPİT EDİLDİ:', campaignId);
                } else {
                    console.error('⚠️ Kampanya kaydedilemedi:', campaignError);
                }
            }
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 7: Ad Click Kaydet
        // ═══════════════════════════════════════════════════════════
        const { data: adClick, error: clickError } = await supabaseAdmin
            .from('ad_clicks')
            .insert({
                domain_id: domain.id,
                campaign_id: campaignId,
                ip_info_id: ipInfo?.id || null,
                device_id: device_record?.id || null,
                gclid: gclid,
                keyword: keyword,
                ad_position: adPosition,
                device_type: device,
                network: network,
                placement: placement,
                raw_params: Object.fromEntries(searchParams)
            })
            .select()
            .single();

        if (clickError) {
            console.error('❌ Ad click kaydedilemedi:', clickError);
        } else {
            console.log('✅ Ad click kaydedildi:', adClick.id);
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 8: IP ENGELLE - blocked_ips'e Ekle (Domain Bazlı)
        // ═══════════════════════════════════════════════════════════
        const { data: blockedIp, error: blockError } = await supabaseAdmin
            .from('blocked_ips')
            .upsert(
                {
                    domain_id: domain.id,
                    ip: ip,
                    ip_info_id: ipInfo?.id || null,
                    device_id: device_record?.id || null,
                    block_count: 1,
                    synced_to_ads: false,
                    last_seen_at: new Date().toISOString()
                },
                {
                    onConflict: 'domain_id,ip',
                    ignoreDuplicates: false
                }
            )
            .select()
            .single();

        if (blockError) {
            console.error('❌ Blocked IP kaydedilemedi:', blockError);
        } else {
            // Block count güncelle
            if (blockedIp && blockedIp.block_count > 1) {
                await supabaseAdmin
                    .from('blocked_ips')
                    .update({
                        block_count: blockedIp.block_count + 1,
                        last_seen_at: new Date().toISOString()
                    })
                    .eq('id', blockedIp.id);
            }
            console.log('🚫 IP blocked_ips\'e eklendi:', ip);
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 9: Google Ads API - TÜM KAMPANYALARA ANINDA GÖNDER!
        // ═══════════════════════════════════════════════════════════
        if (domain.ads_account_id && blockedIp) {
            try {
                // Google Ads hesap bilgilerini al
                const { data: adsAccount } = await supabaseAdmin
                    .from('google_oauth_tokens')
                    .select('*')
                    .eq('is_active', true)
                    .single();

                if (adsAccount) {
                    // Tüm aktif kampanyaları al
                    const { data: allCampaigns } = await supabaseAdmin
                        .from('ads_campaigns')
                        .select('campaign_id')
                        .eq('domain_id', domain.id)
                        .eq('is_active', true);

                    if (allCampaigns && allCampaigns.length > 0) {
                        console.log('🔑 MCC Customer ID:', adsAccount.mcc_customer_id);
                        console.log('🔑 Target Customer ID (ads_account_id):', domain.ads_account_id);

                        const googleAdsClient = new GoogleAdsClientOfficial(
                            adsAccount.access_token,
                            adsAccount.refresh_token,
                            adsAccount.mcc_customer_id || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
                        );

                        console.log(`📤 IP engelleme ${allCampaigns.length} kampanyaya gönderiliyor...`);

                        // Her kampanyaya IP'yi ekle
                        let successCount = 0;
                        let errorMessages = [];

                        for (const camp of allCampaigns) {
                            try {
                                await googleAdsClient.addIpExclusions(
                                    domain.ads_account_id,
                                    camp.campaign_id,
                                    [ip]
                                );
                                successCount++;
                            } catch (error) {
                                console.error(`❌ Kampanya ${camp.campaign_id} IP engelleme hatası:`, error.message);
                                errorMessages.push(`${camp.campaign_id}: ${error.message}`);
                            }
                        }

                        if (successCount > 0) {
                            // Sync durumunu güncelle
                            await supabaseAdmin
                                .from('blocked_ips')
                                .update({
                                    synced_to_ads: successCount === allCampaigns.length,
                                    synced_at: new Date().toISOString(),
                                    sync_error: errorMessages.length > 0 ? errorMessages.join('; ') : null
                                })
                                .eq('id', blockedIp.id);

                            // Kampanyaların last_sync_at'ini güncelle
                            await supabaseAdmin
                                .from('ads_campaigns')
                                .update({ last_sync_at: new Date().toISOString() })
                                .eq('domain_id', domain.id)
                                .in('campaign_id', allCampaigns.map(c => c.campaign_id));

                            console.log(`✅ IP ${successCount}/${allCampaigns.length} kampanyaya gönderildi`);
                        } else {
                            throw new Error('Hiçbir kampanyaya IP gönderilemedi');
                        }
                    } else {
                        console.warn('⚠️ Aktif kampanya bulunamadı');
                    }
                } else {
                    console.warn('⚠️ Google Ads hesabı bulunamadı');
                }
            } catch (error) {
                console.error('❌ Google Ads API hatası:', error);

                // Hata mesajını kaydet
                if (blockedIp) {
                    await supabaseAdmin
                        .from('blocked_ips')
                        .update({
                            sync_error: error.message
                        })
                        .eq('id', blockedIp.id);
                }
            }
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 10: Cookie Ayarla (Site Script için)
        // ═══════════════════════════════════════════════════════════
        const clickId = nanoid(32);
        const response = NextResponse.redirect(finalUrl, { status: 307 });

        response.cookies.set('cc_click_id', clickId, {
            path: '/',
            maxAge: 86400, // 24 saat
            sameSite: 'lax',
            httpOnly: false
        });

        response.cookies.set('cc_ad_click_id', adClick?.id || '', {
            path: '/',
            maxAge: 86400,
            sameSite: 'lax',
            httpOnly: false
        });

        response.cookies.set('cc_fingerprint', fingerprintId, {
            path: '/',
            maxAge: 86400,
            sameSite: 'lax',
            httpOnly: false
        });

        const processingTime = Date.now() - startTime;
        console.log(`✅ Tracking tamamlandı (${processingTime}ms):`, {
            domain: domain.domain,
            ip,
            blocked: !!blockedIp,
            clickId
        });

        return response;

    } catch (error) {
        console.error('❌ Tracker endpoint hatası:', error);

        // Hata olsa bile kullanıcıyı yönlendir
        const { searchParams } = new URL(request.url);
        const finalUrl = searchParams.get('url') || 'https://google.com';
        return NextResponse.redirect(finalUrl);
    }
}
