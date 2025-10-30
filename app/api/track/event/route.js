// app/api/track/event/route.js
// Session event tracking endpoint'i

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';

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
            target_href,
            target_text,
            visibility_percentage,
            event_data
        } = body;

        if (!session_id || !event_type) {
            return NextResponse.json(
                { error: 'session_id ve event_type gerekli' },
                { status: 400 }
            );
        }

        // 1. Event kaydı oluştur
        const { error: eventError } = await supabaseAdmin
            .from('session_events')
            .insert({
                session_id: session_id,
                event_type: event_type,
                occurred_at: new Date().toISOString(),
                page_url: page_url,
                scroll_px: scroll_px,
                scroll_percent: scroll_percent,
                click_x: click_x,
                click_y: click_y,
                target_element: target_element,
                target_href: target_href,
                target_text: target_text,
                visibility_percentage: visibility_percentage,
                event_data: event_data
            });

        if (eventError) {
            console.error('Event kaydetme hatası:', eventError);
            return NextResponse.json(
                { error: 'Event kaydedilemedi' },
                { status: 500 }
            );
        }

        // 2. Session'ı güncelle (last_activity_at, sayaçlar)
        const updates = {
            last_activity_at: new Date().toISOString()
        };

        if (event_type === 'page_view') {
            const { data: session } = await supabaseAdmin
                .from('sessions')
                .select('page_views')
                .eq('id', session_id)
                .single();

            if (session) {
                updates.page_views = (session.page_views || 0) + 1;
            }
        } else if (event_type === 'click') {
            const { data: session } = await supabaseAdmin
                .from('sessions')
                .select('clicks')
                .eq('id', session_id)
                .single();

            if (session) {
                updates.clicks = (session.clicks || 0) + 1;
            }
        } else if (event_type === 'scroll') {
            const { data: session } = await supabaseAdmin
                .from('sessions')
                .select('scrolls, max_scroll_depth')
                .eq('id', session_id)
                .single();

            if (session) {
                updates.scrolls = (session.scrolls || 0) + 1;
                if (scroll_percent && scroll_percent > (session.max_scroll_depth || 0)) {
                    updates.max_scroll_depth = scroll_percent;
                }
            }
        } else if (event_type === 'conversion') {
            const { data: session } = await supabaseAdmin
                .from('sessions')
                .select('conversions')
                .eq('id', session_id)
                .single();

            if (session) {
                updates.conversions = (session.conversions || 0) + 1;
            }
        }

        await supabaseAdmin
            .from('sessions')
            .update(updates)
            .eq('id', session_id);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Track event hatası:', error);
        return NextResponse.json(
            { error: 'Bir hata oluştu' },
            { status: 500 }
        );
    }
}

