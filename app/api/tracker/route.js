// app/api/tracker/route.js
// Google Ads Tracking Template Redirect Endpoint

import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabaseAdmin } from '@/lib/supabase-client';
import { detectBotUserAgent, checkIPWhitelist, enrichIPLocation } from '@/lib/helpers';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);


        // Daha sonra daha iyi anlamak için db kaydet?
        console.log('**searchParams**', searchParams);

        // Google Ads parametreleri
        const trackingId = searchParams.get('id');
        const gclid = searchParams.get('gclid');
        const campaignId = searchParams.get('cpn');
        const adGroupId = searchParams.get('adgrp');
        const keyword = searchParams.get('kw');
        const network = searchParams.get('nw');
        const adPosition = searchParams.get('adpos');
        const device = searchParams.get('device');
        const placement = searchParams.get('pl');
        const locPhysical = searchParams.get('locphisical');
        const locInterest = searchParams.get('locinterest');
        const finalUrl = searchParams.get('url');

        // Tracking ID ve final URL zorunlu
        if (!trackingId || !finalUrl) {
            return NextResponse.redirect(finalUrl || 'https://google.com');
        }

        // IP ve User Agent bilgisi al
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const userAgent = request.headers.get('user-agent') || '';
        const referrer = request.headers.get('referer') || '';

        // 1. Domain'i bul
        const { data: domain, error: domainError } = await supabaseAdmin
            .from('domains')
            .select('id, domain, is_active, ads_account_id')
            .eq('tracking_id', trackingId)
            .eq('is_active', true)
            .single();

        if (domainError || !domain) {
            console.error('Domain bulunamadı:', trackingId);
            return NextResponse.redirect(finalUrl);
        }

        // 2. IP whitelist kontrolü (Googlebot vs.)
        const isWhitelisted = await checkIPWhitelist(ip);
        if (isWhitelisted) {
            console.log('Whitelisted IP, tracking atlanıyor:', ip);
            return NextResponse.redirect(finalUrl);
        }

        // 3. Unique click ID oluştur
        const clickId = nanoid(32);

        // 4. Bot user agent kontrolü
        const isBotUA = detectBotUserAgent(userAgent);

        // 5. Ad click kaydı oluştur
        const { data: adClick, error: clickError } = await supabaseAdmin
            .from('ad_clicks')
            .insert({
                domain_id: domain.id,
                ip: ip,
                click_id: clickId,
                gclid: gclid,
                campaign_id: campaignId,
                ad_group_id: adGroupId,
                keyword: keyword,
                network: network,
                ad_position: adPosition,
                device_type: device,
                placement: placement,
                loc_physical: locPhysical,
                loc_interest: locInterest,
                final_url: finalUrl,
                landing_page: finalUrl,
                referrer: referrer,
                user_agent: userAgent,
                is_bot_user_agent: isBotUA,
                clicked_at: new Date().toISOString()
            })
            .select()
            .single();

        if (clickError) {
            console.error('Ad click kaydı oluşturulamadı:', clickError);
        }

        // 6. IP lokasyon bilgisi zenginleştir (async, sonucu bekleme)
        enrichIPLocation(ip).catch(err =>
            console.error('IP enrichment hatası:', err)
        );

        // 7. Cookie ayarla (click_id ve tracking_id'yi on-site script için)
        const response = NextResponse.redirect(finalUrl);

        response.cookies.set('agp_click_id', clickId, {
            path: '/',
            maxAge: 86400, // 24 saat
            sameSite: 'lax',
            httpOnly: false // JavaScript'ten okunabilir olmalı
        });

        response.cookies.set('agp_tracking_id', trackingId, {
            path: '/',
            maxAge: 86400,
            sameSite: 'lax',
            httpOnly: false
        });

        console.log('✅ Ad click kaydedildi:', {
            clickId,
            domain: domain.domain,
            ip,
            gclid,
            campaignId
        });

        // 8. Redirect et
        return response;

    } catch (error) {
        console.error('Tracker endpoint hatası:', error);

        // Hata olsa bile kullanıcıyı yönlendir
        const { searchParams } = new URL(request.url);
        const finalUrl = searchParams.get('url') || 'https://google.com';
        return NextResponse.redirect(finalUrl);
    }
}

