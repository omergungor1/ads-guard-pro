// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-auth';

export async function GET() {
    try {
        const authUrl = getAuthUrl();
        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error('Auth URL oluşturma hatası:', error);
        return NextResponse.json(
            { error: 'Authentication başlatılamadı' },
            { status: 500 }
        );
    }
}