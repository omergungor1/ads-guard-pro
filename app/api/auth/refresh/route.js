// app/api/auth/refresh/route.js
import { NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/google-auth';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get('google_refresh_token')?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'Refresh token bulunamadı' },
                { status: 401 }
            );
        }

        // Yeni access token al
        const tokens = await refreshAccessToken(refreshToken);

        // Yeni access token'ı cookie'ye kaydet
        cookieStore.set('google_access_token', tokens.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: tokens.expiry_date ? (tokens.expiry_date - Date.now()) / 1000 : 3600,
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Token yenileme hatası:', error);
        return NextResponse.json(
            { error: 'Token yenilenemedi' },
            { status: 500 }
        );
    }
}