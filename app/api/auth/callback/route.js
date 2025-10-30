// app/api/auth/callback/route.js
// Google OAuth callback - Sadece sistem admin (MCC hesabı) için

import { NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google-auth';
import { saveSystemGoogleTokens } from '@/lib/auth-helpers';
import { cookies } from 'next/headers';

export async function GET(request) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const returnUrl = searchParams.get('state') || '/dashboard';

    // Kullanıcı izin vermediyse
    if (error) {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=access_denied`
        );
    }

    // Code yoksa hata
    if (!code) {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=no_code`
        );
    }

    try {
        // Authorization code'u token'lara çevir
        const tokens = await getTokensFromCode(code);

        // Token'dan kullanıcı bilgisini al (MCC hesabı sahibi)
        // Access token ile direkt userinfo endpoint'ine istek at
        let userInfo;
        try {
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`
                }
            });

            if (!userInfoResponse.ok) {
                throw new Error('Userinfo alınamadı');
            }

            userInfo = await userInfoResponse.json();
        } catch (userInfoError) {
            console.error('Userinfo hatası:', userInfoError);
            // Fallback: Email olmadan devam et
            userInfo = {
                email: 'unknown@example.com',
                name: 'Unknown User'
            };
        }

        console.log('📧 OAuth Kullanıcısı:', userInfo.email);

        // Cookie store'u al
        const cookieStore = await cookies();

        // Sistem geneli token'ları kaydet (Database'de tek bir kayıt)
        if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
            await saveSystemGoogleTokens(
                tokens,
                null, // MCC customer ID sonra eklenebilir
                userInfo.email
            );
        }

        // OAuth başarılı flag'i için cookie set et
        cookieStore.set('google_oauth_success', 'true', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365, // 1 yıl
        });

        // Admin email'i kaydet (sistem yöneticisi)
        cookieStore.set('google_oauth_admin_email', userInfo.email, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365,
        });

        console.log('✅ Google OAuth başarılı (Sistem geneli):', userInfo.email);

        // Settings sayfasına yönlendir (başarı mesajı ile)
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?oauth_success=true`
        );

    } catch (error) {
        console.error('Token alma hatası:', error);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=token_failed`
        );
    }
}
