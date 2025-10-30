// lib/helpers.js
// Yardımcı fonksiyonlar

import { UAParser } from 'ua-parser-js';
import { supabaseAdmin } from './supabase-client.js';

/**
 * User agent parse et
 */
export function parseUserAgent(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
        type: result.device.type || 'desktop',
        os: result.os.name || 'Unknown',
        osVersion: result.os.version || '',
        browser: result.browser.name || 'Unknown',
        browserVersion: result.browser.version || ''
    };
}

/**
 * Bot user agent kontrolü
 */
export function detectBotUserAgent(userAgent) {
    if (!userAgent) return false;

    const botPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /crawling/i,
        /slurp/i,
        /mediapartners/i,
        /googlebot/i,
        /bingbot/i,
        /yahoo/i,
        /baiduspider/i,
        /facebookexternalhit/i,
        /twitterbot/i,
        /rogerbot/i,
        /linkedinbot/i,
        /embedly/i,
        /quora link preview/i,
        /showyoubot/i,
        /outbrain/i,
        /pinterest/i,
        /slackbot/i,
        /vkShare/i,
        /W3C_Validator/i,
        /whatsapp/i,
        /lighthouse/i,
        /headless/i,
        /phantom/i,
        /selenium/i,
        /webdriver/i,
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * URL'den gclid parametresini çıkar
 */
export function extractGclid(url) {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('gclid');
    } catch (e) {
        return null;
    }
}

/**
 * IP whitelist kontrolü
 */
export async function checkIPWhitelist(ip) {
    if (!ip) return false;

    // Database'den kontrol et
    const { data } = await supabaseAdmin
        .from('ip_whitelist')
        .select('id')
        .eq('is_active', true)
        .or(`ip.eq.${ip},ip_range.cs.${ip}`)
        .limit(1)
        .single();

    return !!data;
}

/**
 * IP lokasyon bilgisi al veya güncelle
 */
export async function enrichIPLocation(ip) {
    if (!ip) return null;

    // Önce cache'de var mı kontrol et
    const { data: existing } = await supabaseAdmin
        .from('ip_locations')
        .select('*')
        .eq('ip', ip)
        .single();

    // 30 günden eski değilse mevcut veriyi kullan
    if (existing) {
        const daysSinceUpdate = (Date.now() - new Date(existing.updated_at)) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 30) {
            return existing;
        }
    }

    // IP API'den bilgi çek (ip-api.com ücretsiz)
    try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting`);
        const data = await response.json();

        if (data.status === 'success') {
            const ipData = {
                ip: ip,
                country_code: data.countryCode,
                country_name: data.country,
                region: data.regionName,
                city: data.city,
                latitude: data.lat,
                longitude: data.lon,
                timezone: data.timezone,
                postal_code: data.zip,
                isp: data.isp,
                organization: data.org,
                asn: data.as,
                is_proxy: data.proxy || false,
                is_hosting: data.hosting || false,
                is_vpn: false, // ip-api.com'da VPN bilgisi yok
                is_tor: false,
                is_datacenter: data.hosting || false,
                updated_at: new Date().toISOString()
            };

            // Upsert
            const { data: savedData } = await supabaseAdmin
                .from('ip_locations')
                .upsert(ipData, { onConflict: 'ip' })
                .select()
                .single();

            return savedData;
        }
    } catch (error) {
        console.error('IP lokasyon hatası:', error);
    }

    return existing;
}

/**
 * Domain kurallarını kontrol et ve IP engellenecek mi?
 */
export async function shouldBlockIP(domainId, ip) {
    // Domain kurallarını al
    const { data: rule } = await supabaseAdmin
        .from('domain_rules')
        .select('*')
        .eq('domain_id', domainId)
        .single();

    if (!rule || !rule.auto_block_enabled) {
        return { shouldBlock: false, reason: null };
    }

    // Toplam zaman penceresi hesapla (dakika cinsinden)
    const totalMinutes =
        (rule.time_window_days || 0) * 24 * 60 +
        (rule.time_window_hours || 0) * 60 +
        (rule.time_window_minutes || 0);

    // Eğer time window 0 ise, max_clicks kontrolü yap
    if (totalMinutes === 0) {
        // İlk tıklamada engelle
        const { count } = await supabaseAdmin
            .from('ad_clicks')
            .select('id', { count: 'exact', head: true })
            .eq('domain_id', domainId)
            .eq('ip', ip);

        if (count >= rule.max_clicks) {
            return {
                shouldBlock: true,
                reason: `IP adresi ${rule.max_clicks} kez reklama tıkladı (limit: ${rule.max_clicks})`
            };
        }
    } else {
        // Belirli süre içinde kaç tıklama var?
        const timeAgo = new Date(Date.now() - totalMinutes * 60 * 1000);

        const { count } = await supabaseAdmin
            .from('ad_clicks')
            .select('id', { count: 'exact', head: true })
            .eq('domain_id', domainId)
            .eq('ip', ip)
            .gte('clicked_at', timeAgo.toISOString());

        if (count >= rule.max_clicks) {
            return {
                shouldBlock: true,
                reason: `IP adresi ${totalMinutes} dakika içinde ${count} kez tıkladı (limit: ${rule.max_clicks})`
            };
        }
    }

    // VPN/Proxy kontrolü
    if (rule.block_vpn || rule.block_proxy || rule.block_hosting || rule.block_tor) {
        const { data: ipLocation } = await supabaseAdmin
            .from('ip_locations')
            .select('*')
            .eq('ip', ip)
            .single();

        if (ipLocation) {
            if (rule.block_vpn && ipLocation.is_vpn) {
                return { shouldBlock: true, reason: 'VPN tespit edildi' };
            }
            if (rule.block_proxy && ipLocation.is_proxy) {
                return { shouldBlock: true, reason: 'Proxy tespit edildi' };
            }
            if (rule.block_hosting && ipLocation.is_hosting) {
                return { shouldBlock: true, reason: 'Hosting/Datacenter IP tespit edildi' };
            }
            if (rule.block_tor && ipLocation.is_tor) {
                return { shouldBlock: true, reason: 'Tor exit node tespit edildi' };
            }
        }
    }

    return { shouldBlock: false, reason: null };
}

/**
 * Cookie okuma helper'ı
 */
export function getCookie(name, cookieString) {
    if (!cookieString) return null;
    const value = `; ${cookieString}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

