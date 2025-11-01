// lib/helpers.js
// Yardımcı fonksiyonlar - Yeni Tablo Yapısı için

import { UAParser } from 'ua-parser-js';
import { createHash } from 'crypto';
import { supabaseAdmin } from './supabase-client.js';

/**
 * User agent parse et
 */
export function parseUserAgent(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
        type: result.device.type || 'desktop',
        os: `${result.os.name || 'Unknown'}${result.os.version ? ' ' + result.os.version : ''}`,
        browser: `${result.browser.name || 'Unknown'}${result.browser.version ? ' ' + result.browser.version : ''}`,
        deviceType: result.device.type || 'desktop'
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
 * Server-side fingerprint oluştur (hızlı hash)
 */
export function generateServerFingerprint(ip, userAgent, acceptLanguage = '') {
    const hash = createHash('sha256')
        .update(ip + userAgent + acceptLanguage)
        .digest('hex')
        .substring(0, 16);

    return `fp_${hash}`;
}

/**
 * IP whitelist kontrolü (PostgreSQL INET/CIDR ile)
 * ÖNEMLİ: Her request'te İLK KONTROL bu olmalı!
 */
export async function checkIPWhitelist(ip) {
    if (!ip || ip === 'unknown') return false;

    try {
        // PostgreSQL INET operatörlerini kullanarak kontrol et
        const { data, error } = await supabaseAdmin.rpc('check_ip_whitelist', {
            check_ip: ip
        });

        if (error) {
            console.error('IP whitelist kontrolü hatası:', error);
            return false;
        }

        return data === true;
    } catch (error) {
        console.error('IP whitelist kontrolü hatası:', error);
        return false;
    }
}

/**
 * IP-API'den bilgi çek ve ip_info tablosuna KAYDET
 * ÖNEMLİ: Her seferinde YENİ KAYIT oluştur (UNIQUE DEĞİL!)
 */
export async function createIPInfo(ip, userAgent) {
    if (!ip || ip === 'unknown') return null;

    let ipApiData = {};
    let apiError = false;
    let apiErrorCode = null;
    let apiErrorMsg = null;

    // IP-API'yi çağır
    try {
        const response = await fetch(
            `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city,district,zip,lat,lon,isp,mobile,proxy,hosting`,
            { timeout: 3000 }
        );

        ipApiData = await response.json();

        if (ipApiData.status === 'fail') {
            apiError = true;
            apiErrorCode = 'FAIL';
            apiErrorMsg = ipApiData.message;
        }
    } catch (error) {
        apiError = true;
        apiErrorCode = 'TIMEOUT';
        apiErrorMsg = error.message;
        console.error('IP-API hatası:', error);
    }

    // Browser bilgisi parse et
    const browserInfo = parseUserAgent(userAgent);

    // ip_info tablosuna ekle (HER SEFERINDE YENİ KAYIT)
    try {
        const { data: ipInfo, error } = await supabaseAdmin
            .from('ip_info')
            .insert({
                ip: ip,
                country_code: ipApiData.countryCode || null,
                city: ipApiData.city || null,
                district: ipApiData.district || null,
                zip: ipApiData.zip || null,
                lat: ipApiData.lat || null,
                lon: ipApiData.lon || null,
                isp: ipApiData.isp || null,
                is_mobile: ipApiData.mobile || false,
                is_vpn: ipApiData.proxy || false, // ip-api proxy field'i VPN'i de kapsar
                is_proxy: ipApiData.proxy || false,
                is_hosting: ipApiData.hosting || false,
                browser: browserInfo.browser,
                user_agent: userAgent,
                api_error: apiError,
                api_error_code: apiErrorCode,
                api_error_message: apiErrorMsg
            })
            .select()
            .single();

        if (error) {
            console.error('ip_info kaydı oluşturma hatası:', error);
            return null;
        }

        return ipInfo;
    } catch (error) {
        console.error('ip_info kaydı oluşturma hatası:', error);
        return null;
    }
}

/**
 * Device kaydet veya güncelle
 */
export async function upsertDevice(fingerprintId, userAgent, screenWidth = null, screenHeight = null) {
    const deviceInfo = parseUserAgent(userAgent);

    try {
        const { data: device, error } = await supabaseAdmin
            .from('devices')
            .upsert(
                {
                    fingerprint_id: fingerprintId,
                    device_type: deviceInfo.deviceType,
                    os: deviceInfo.os,
                    browser: deviceInfo.browser,
                    screen_width: screenWidth,
                    screen_height: screenHeight,
                    last_seen_at: new Date().toISOString()
                },
                {
                    onConflict: 'fingerprint_id',
                    ignoreDuplicates: false
                }
            )
            .select()
            .single();

        if (error) {
            console.error('Device upsert hatası:', error);
            return null;
        }

        return device;
    } catch (error) {
        console.error('Device upsert hatası:', error);
        return null;
    }
}

/**
 * Traffic source belirle
 */
export function determineTrafficSource(referrer, gclid, adClickId) {
    // Ads traffic kontrolü
    if (adClickId || gclid) {
        return { isAdTraffic: true, trafficSource: 'google_ads' };
    }

    // Referrer kontrolü
    if (!referrer) {
        return { isAdTraffic: false, trafficSource: 'direct' };
    }

    const referrerLower = referrer.toLowerCase();

    if (referrerLower.includes('google.com')) {
        return { isAdTraffic: false, trafficSource: 'organic' };
    } else if (referrerLower.includes('facebook.com') || referrerLower.includes('instagram.com')) {
        return { isAdTraffic: false, trafficSource: 'social' };
    } else {
        return { isAdTraffic: false, trafficSource: 'referral' };
    }
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

