// app/api/domains/[id]/rules/route.js
// Domain kuralları yönetimi

import { NextResponse } from 'next/server';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-client';

// Domain kurallarını getir
export async function GET(request, { params }) {
    try {
        const { user } = await getServerSession(request.cookies);

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;

        // Domain'in kullanıcıya ait olduğunu doğrula
        const { data: domain } = await supabaseAdmin
            .from('domains')
            .select('id')
            .eq('id', id)
            .eq('profile_id', user.id)
            .single();

        if (!domain) {
            return NextResponse.json({ error: 'Domain bulunamadı' }, { status: 404 });
        }

        // Kuralları getir
        const { data: rules, error } = await supabaseAdmin
            .from('domain_rules')
            .select('*')
            .eq('domain_id', id)
            .single();

        if (error && error.code !== 'PGRST116') { // 116 = not found
            console.error('Domain rules getirme hatası:', error);
            return NextResponse.json({ error: 'Kurallar getirilemedi' }, { status: 500 });
        }

        return NextResponse.json({ rules });

    } catch (error) {
        console.error('Domain rules GET hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}

// Domain kurallarını güncelle
export async function PUT(request, { params }) {
    try {
        const { user } = await getServerSession(request.cookies);
        const { id } = await params;
        const body = await request.json();

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Domain'in kullanıcıya ait olduğunu doğrula
        const { data: domain } = await supabaseAdmin
            .from('domains')
            .select('id')
            .eq('id', id)
            .eq('profile_id', user.id)
            .single();

        if (!domain) {
            return NextResponse.json({ error: 'Domain bulunamadı' }, { status: 404 });
        }

        // İzin verilen alanları hazırla
        const allowedFields = [
            'time_window_days',
            'time_window_hours',
            'time_window_minutes',
            'max_clicks',
            'blocking_mode',
            'min_session_duration_seconds',
            'max_clicks_per_session',
            'min_scroll_depth_percent',
            'auto_block_enabled',
            'block_vpn',
            'block_proxy',
            'block_hosting',
            'block_tor'
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        updates.updated_at = new Date().toISOString();

        // Upsert (var olan kaydı güncelle veya yeni ekle)
        const { data: rules, error } = await supabaseAdmin
            .from('domain_rules')
            .upsert({
                domain_id: id,
                ...updates
            }, {
                onConflict: 'domain_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Domain rules güncelleme hatası:', error);
            return NextResponse.json({ error: 'Kurallar güncellenemedi' }, { status: 500 });
        }

        console.log('✅ Domain rules güncellendi:', id);

        return NextResponse.json({
            success: true,
            rules: rules
        });

    } catch (error) {
        console.error('Domain rules PUT hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}

