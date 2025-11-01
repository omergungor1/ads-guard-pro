// app/api/track/end/route.js
// Session Sonlandırma

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';

export async function POST(request) {
    try {
        const body = await request.json();
        const { session_id } = body;

        if (!session_id) {
            return NextResponse.json(
                { error: 'session_id gerekli' },
                { status: 400 }
            );
        }

        // Session'ı al
        const { data: session } = await supabaseAdmin
            .from('sessions')
            .select('started_at')
            .eq('id', session_id)
            .single();

        if (!session) {
            return NextResponse.json(
                { error: 'Session bulunamadı' },
                { status: 404 }
            );
        }

        // Duration hesapla
        const startTime = new Date(session.started_at).getTime();
        const endTime = Date.now();
        const durationSeconds = Math.floor((endTime - startTime) / 1000);

        // Session'ı sonlandır
        const { error } = await supabaseAdmin
            .from('sessions')
            .update({
                ended_at: new Date().toISOString(),
                duration_seconds: durationSeconds
            })
            .eq('id', session_id);

        if (error) {
            console.error('Session sonlandırma hatası:', error);
            return NextResponse.json(
                { error: 'Session sonlandırılamadı' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            duration_seconds: durationSeconds
        });

    } catch (error) {
        console.error('Session end hatası:', error);
        return NextResponse.json(
            { error: 'Bir hata oluştu' },
            { status: 500 }
        );
    }
}

