// app/api/auth/logout/route.js
// Kullanıcı çıkışı

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const cookieStore = await cookies();

        // Tüm auth cookie'lerini sil
        const authCookies = [
            'google_access_token',
            'google_refresh_token',
            'google_user_email',
            'google_user_name',
            'sb-user-id',
            'sb-access-token',
            'sb-refresh-token'
        ];

        authCookies.forEach(cookieName => {
            cookieStore.delete(cookieName);
        });

        console.log('✅ Kullanıcı çıkış yaptı');

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Logout hatası:', error);
        return NextResponse.json(
            { error: 'Çıkış yapılamadı' },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    return POST(request);
}

