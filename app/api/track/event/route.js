// app/api/track/event/route.js
// Session Event Kaydetme Endpoint

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

        const {
            session_id,
            event_type,
            page_url,
            scroll_px,
            scroll_percent,
            click_x,
            click_y,
            target_element,
            target_text,
            target_href,
            event_data
        } = body;

        // Session ID ve event type zorunlu
        if (!session_id || !event_type) {
            return NextResponse.json(
                { error: 'session_id ve event_type gerekli' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Event kaydı oluştur
        const { data: event, error: eventError } = await supabaseAdmin
            .from('session_events')
            .insert({
                session_id,
                event_type,
                page_url,
                scroll_px,
                scroll_percent,
                click_x,
                click_y,
                target_element,
                target_text: target_text?.substring(0, 255), // Maksimum 255 karakter
                target_href,
                event_data: event_data || null,
                occurred_at: new Date().toISOString()
            })
            .select()
            .single();

        if (eventError) {
            console.error('Event kaydetme hatası:', eventError);
            return NextResponse.json(
                { error: 'Event kaydedilemedi' },
                { status: 500, headers: corsHeaders }
            );
        }

        // Session'ın last_activity_at'ini güncelle
        await supabaseAdmin
            .from('sessions')
            .update({ last_activity_at: new Date().toISOString() })
            .eq('id', session_id);

        return NextResponse.json({
            success: true,
            event_id: event.id
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('Track event hatası:', error);
        return NextResponse.json(
            { error: 'Bir hata oluştu' },
            { status: 500, headers: corsHeaders }
        );
    }
}
