// app/api/auth/session/route.js
// Supabase session'ı cookie'ye kaydet

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const { access_token, refresh_token } = await request.json();

        if (!access_token || !refresh_token) {
            return NextResponse.json(
                { error: 'Token bilgileri eksik' },
                { status: 400 }
            );
        }

        const cookieStore = await cookies();

        // Session token'larını cookie'ye kaydet
        cookieStore.set('sb-access-token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 gün
            path: '/',
        });

        cookieStore.set('sb-refresh-token', refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 gün
            path: '/',
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Session kaydetme hatası:', error);
        return NextResponse.json(
            { error: 'Session kaydedilemedi' },
            { status: 500 }
        );
    }
}

// Session'ı sil (logout)
export async function DELETE() {
    try {
        const cookieStore = await cookies();

        cookieStore.delete('sb-access-token');
        cookieStore.delete('sb-refresh-token');

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Session silme hatası:', error);
        return NextResponse.json(
            { error: 'Session silinemedi' },
            { status: 500 }
        );
    }
}

