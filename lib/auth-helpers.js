// lib/auth-helpers.js
// System-wide Google OAuth authentication helpers (for MCC account)

import { supabaseAdmin } from './supabase-client.js';

/**
 * Sistem geneli Google OAuth token'larını kaydet (Sadece MCC hesabı için)
 * NOT: Her kullanıcı için değil, sadece sistem yöneticisi için bir kere
 */
export async function saveSystemGoogleTokens(tokens, mccCustomerId = null, authorizedEmail = null) {
    const { access_token, refresh_token, expiry_date, scope } = tokens;

    try {
        // Önce mevcut aktif token'ı pasif yap
        await supabaseAdmin
            .from('google_oauth_tokens')
            .update({ is_active: false })
            .eq('is_active', true);

        // Yeni token'ı kaydet
        const { error } = await supabaseAdmin
            .from('google_oauth_tokens')
            .insert({
                access_token: access_token,
                refresh_token: refresh_token,
                token_expiry: expiry_date ? new Date(expiry_date).toISOString() : null,
                mcc_customer_id: mccCustomerId,
                authorized_email: authorizedEmail,
                scopes: scope ? scope.split(' ') : ['https://www.googleapis.com/auth/adwords'],
                is_active: true
            });

        if (error) {
            console.error('Token kaydetme hatası:', error);
            throw error;
        }

        console.log('✅ Sistem Google OAuth token\'ları kaydedildi');
        return true;
    } catch (error) {
        console.error('saveSystemGoogleTokens hatası:', error);
        throw error;
    }
}

/**
 * Sistem geneli Google token'larını getir
 */
export async function getSystemGoogleTokens() {
    try {
        const { data, error } = await supabaseAdmin
            .from('google_oauth_tokens')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expiry_date: data.token_expiry ? new Date(data.token_expiry).getTime() : null,
            mcc_customer_id: data.mcc_customer_id
        };
    } catch (error) {
        console.error('getSystemGoogleTokens hatası:', error);
        return null;
    }
}

/**
 * Token'ın süresi dolmuş mu kontrol et
 */
export function isTokenExpired(expiryDate) {
    if (!expiryDate) return true;

    const now = Date.now();
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate).getTime() : expiryDate;

    // 5 dakika güvenlik payı
    return now >= (expiry - 5 * 60 * 1000);
}

/**
 * Sistemde Google OAuth var mı kontrol et
 */
export async function hasSystemGoogleAuth() {
    const tokens = await getSystemGoogleTokens();

    if (!tokens || !tokens.refresh_token) {
        return false;
    }

    return true;
}

/**
 * Google OAuth token'larını yenile (sistem geneli)
 */
export async function refreshSystemTokens() {
    try {
        const tokens = await getSystemGoogleTokens();

        if (!tokens || !tokens.refresh_token) {
            throw new Error('Refresh token bulunamadı');
        }

        const { refreshAccessToken } = await import('./google-auth.js');
        const newTokens = await refreshAccessToken(tokens.refresh_token);

        // Yeni token'ları güncelle
        await supabaseAdmin
            .from('google_oauth_tokens')
            .update({
                access_token: newTokens.access_token,
                token_expiry: newTokens.expiry_date ? new Date(newTokens.expiry_date).toISOString() : null,
                updated_at: new Date().toISOString()
            })
            .eq('is_active', true);

        console.log('✅ Token yenilendi');

        return {
            access_token: newTokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: newTokens.expiry_date
        };
    } catch (error) {
        console.error('refreshSystemTokens hatası:', error);
        throw error;
    }
}

/**
 * Aktif Google OAuth token'ı al (gerekirse yenile)
 */
export async function getActiveGoogleTokens() {
    let tokens = await getSystemGoogleTokens();

    if (!tokens) {
        return null;
    }

    // Token süresi dolmuşsa yenile
    if (isTokenExpired(tokens.expiry_date)) {
        console.log('🔄 Token süresi dolmuş, yenileniyor...');
        tokens = await refreshSystemTokens();
    }

    return tokens;
}
