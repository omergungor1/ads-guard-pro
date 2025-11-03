// app/api/track/heartbeat/route.js
// Session Heartbeat - Session'ı canlı tutma

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';

// CORS Headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { session_id } = body;

        if (!session_id) {
            return NextResponse.json(
                { error: 'session_id gerekli' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Session'ın last_activity_at'ini güncelle
        const { error } = await supabaseAdmin
            .from('sessions')
            .update({ last_activity_at: new Date().toISOString() })
            .eq('id', session_id);

        if (error) {
            console.error('Heartbeat güncelleme hatası:', error);
            return NextResponse.json(
                { error: 'Heartbeat güncellenemedi' },
                { status: 500, headers: corsHeaders }
            );
        }

        return NextResponse.json({ success: true }, { headers: corsHeaders });

    } catch (error) {
        console.error('Heartbeat hatası:', error);
        return NextResponse.json(
            { error: 'Bir hata oluştu' },
            { status: 500, headers: corsHeaders }
        );
    }
}

