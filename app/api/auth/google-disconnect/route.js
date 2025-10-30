// app/api/auth/google-disconnect/route.js
// Google OAuth bağlantısını kes (Sistem geneli)

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';

export async function POST(request) {
    try {
        // Tüm aktif token'ları pasif yap
        const { error } = await supabaseAdmin
            .from('google_oauth_tokens')
            .update({ is_active: false })
            .eq('is_active', true);

        if (error) {
            console.error('Token pasifleştirme hatası:', error);
            return NextResponse.json(
                { error: 'Bağlantı kesilemedi' },
                { status: 500 }
            );
        }

        console.log('✅ Google OAuth bağlantısı kesildi');

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Google disconnect hatası:', error);
        return NextResponse.json(
            { error: 'Bir hata oluştu' },
            { status: 500 }
        );
    }
}

