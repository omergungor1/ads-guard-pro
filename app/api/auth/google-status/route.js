// app/api/auth/google-status/route.js
// Google OAuth durumunu kontrol et (Sistem geneli)

import { NextResponse } from 'next/server';
import { hasSystemGoogleAuth, getSystemGoogleTokens } from '@/lib/auth-helpers';

export async function GET(request) {
    try {
        // Sistem geneli token kontrolü
        const hasAuth = await hasSystemGoogleAuth();

        if (!hasAuth) {
            return NextResponse.json({
                connected: false,
                email: null,
                mcc_customer_id: null
            });
        }

        // Token bilgilerini al
        const tokens = await getSystemGoogleTokens();

        return NextResponse.json({
            connected: true,
            email: tokens.authorized_email || 'Unknown',
            mcc_customer_id: tokens.mcc_customer_id,
            token_expiry: tokens.expiry_date
        });

    } catch (error) {
        console.error('Google OAuth status hatası:', error);
        return NextResponse.json({
            connected: false,
            email: null,
            error: error.message
        }, { status: 500 });
    }
}

