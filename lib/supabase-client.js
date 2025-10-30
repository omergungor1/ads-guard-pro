// lib/supabase-client.js
// Supabase client için wrapper

import { createClient } from '@supabase/supabase-js';

// Public credentials kontrolü (her zaman gerekli)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('⚠️ Supabase credentials eksik! NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY .env dosyasında tanımlanmalı.');
}

// Public client (browser ve server-side için - güvenli)
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Admin client (SADECE server-side için, tam yetkili)
// Client-side'da import edilirse hata vermemesi için lazy initialization
let _supabaseAdmin = null;

export const supabaseAdmin = new Proxy({}, {
    get: (target, prop) => {
        // Client-side'da admin client kullanılmaya çalışılırsa uyar
        if (typeof window !== 'undefined') {
            throw new Error('⚠️ supabaseAdmin sadece server-side kullanılabilir! Client-side\'da supabase kullanın.');
        }

        // Server-side'da lazy init
        if (!_supabaseAdmin) {
            if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
                throw new Error('⚠️ SUPABASE_SERVICE_ROLE_KEY eksik! .env.local dosyasında tanımlanmalı.');
            }

            _supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );
        }

        return _supabaseAdmin[prop];
    }
});

// Helper: Cookie'den session bilgisi al
export async function getServerSession(cookies) {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    if (!accessToken || !refreshToken) {
        return { user: null, session: null };
    }

    const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    if (error || !data.session) {
        return { user: null, session: null };
    }

    return { user: data.user, session: data.session };
}

// Helper: Kullanıcı profili al veya oluştur
export async function getOrCreateProfile(userId, email, fullName = null) {
    // Önce profile kontrol et
    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (existingProfile) {
        return existingProfile;
    }

    // Yoksa oluştur
    const { data: newProfile, error } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: userId,
            email: email,
            full_name: fullName,
            max_domains: 5, // Varsayılan
            is_active: true
        })
        .select()
        .single();

    if (error) {
        console.error('Profile oluşturma hatası:', error);
        throw error;
    }

    return newProfile;
}

