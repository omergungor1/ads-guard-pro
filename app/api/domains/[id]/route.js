// app/api/domains/[id]/route.js
// Tekil domain yönetimi - Getir, Güncelle, Sil

import { NextResponse } from 'next/server';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-client';

// Domain detaylarını getir
export async function GET(request, { params }) {
    try {
        const { user } = await getServerSession(request.cookies);
        const { id } = await params;

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { data: domain, error } = await supabaseAdmin
            .from('domains')
            .select(`
        *,
        ads_campaigns(*),
        blocked_ips(count),
        ad_clicks(count)
      `)
            .eq('id', id)
            .eq('profile_id', user.id)
            .single();

        if (error || !domain) {
            return NextResponse.json({ error: 'Domain bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ domain });

    } catch (error) {
        console.error('Domain GET hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}

// Domain güncelle
export async function PATCH(request, { params }) {
    try {
        const { user } = await getServerSession(request.cookies);

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Önce domain'in kullanıcıya ait olduğunu doğrula
        const { data: existingDomain } = await supabaseAdmin
            .from('domains')
            .select('id')
            .eq('id', id)
            .eq('profile_id', user.id)
            .single();

        if (!existingDomain) {
            return NextResponse.json({ error: 'Domain bulunamadı' }, { status: 404 });
        }

        // İzin verilen alanları güncelle
        const allowedFields = ['domain', 'ads_account_id', 'is_active', 'timezone', 'max_blocked_ips'];
        const updates = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        updates.updated_at = new Date().toISOString();

        const { data: updatedDomain, error } = await supabaseAdmin
            .from('domains')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Domain güncelleme hatası:', error);
            return NextResponse.json({ error: 'Domain güncellenemedi' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            domain: updatedDomain
        });

    } catch (error) {
        console.error('Domain PATCH hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}

// Domain sil
export async function DELETE(request, { params }) {
    try {
        const { user } = await getServerSession(request.cookies);

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;

        // Önce domain'in kullanıcıya ait olduğunu doğrula
        const { data: existingDomain } = await supabaseAdmin
            .from('domains')
            .select('id, domain')
            .eq('id', id)
            .eq('profile_id', user.id)
            .single();

        if (!existingDomain) {
            return NextResponse.json({ error: 'Domain bulunamadı' }, { status: 404 });
        }

        // Domain'i sil (CASCADE ile ilişkili veriler de silinecek)
        const { error } = await supabaseAdmin
            .from('domains')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Domain silme hatası:', error);
            return NextResponse.json({ error: 'Domain silinemedi' }, { status: 500 });
        }

        console.log('🗑️ Domain silindi:', existingDomain.domain);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Domain DELETE hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}

