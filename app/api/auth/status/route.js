// app/api/auth/status/route.js
// Kullanıcının auth durumunu kontrol et

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase-client';

export async function GET(request) {
    try {
        const { user, session } = await getServerSession(request.cookies);

        if (!user || !session) {
            return NextResponse.json({
                authenticated: false,
                user: null
            });
        }

        return NextResponse.json({
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email
            }
        });

    } catch (error) {
        console.error('Auth status hatası:', error);
        return NextResponse.json({
            authenticated: false,
            user: null,
            error: error.message
        }, { status: 500 });
    }
}

