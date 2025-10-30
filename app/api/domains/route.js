// app/api/domains/route.js
// Domain yönetimi - Liste ve Ekleme

import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-client';

// Domain listesini getir
export async function GET(request) {
    try {
        const { user } = await getServerSession(request.cookies);

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Kullanıcının domainlerini getir
        const { data: domains, error } = await supabaseAdmin
            .from('domains')
            .select(`
        *,
        domain_rules(*),
        ads_campaigns(count)
      `)
            .eq('profile_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Domain listesi hatası:', error);
            return NextResponse.json({ error: 'Domainler getirilemedi' }, { status: 500 });
        }

        return NextResponse.json({ domains });

    } catch (error) {
        console.error('Domains GET hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}

// Yeni domain ekle
export async function POST(request) {
    try {
        const { user } = await getServerSession(request.cookies);

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { domain, ads_account_id, timezone } = body;

        if (!domain) {
            return NextResponse.json({ error: 'Domain gerekli' }, { status: 400 });
        }

        // Kullanıcının profil bilgisini al
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('max_domains')
            .eq('id', user.id)
            .single();

        // Mevcut domain sayısını kontrol et
        const { count } = await supabaseAdmin
            .from('domains')
            .select('id', { count: 'exact', head: true })
            .eq('profile_id', user.id);

        if (count >= (profile?.max_domains || 1)) {
            return NextResponse.json(
                { error: `Maksimum ${profile.max_domains} domain ekleyebilirsiniz` },
                { status: 403 }
            );
        }

        // Unique tracking ID oluştur
        const trackingId = nanoid(16);

        // Domain ekle
        const { data: newDomain, error: domainError } = await supabaseAdmin
            .from('domains')
            .insert({
                profile_id: user.id,
                domain: domain,
                tracking_id: trackingId,
                ads_account_id: ads_account_id || null,
                timezone: timezone || 'UTC',
                is_active: true
            })
            .select()
            .single();

        if (domainError) {
            console.error('Domain ekleme hatası:', domainError);
            return NextResponse.json({ error: 'Domain eklenemedi' }, { status: 500 });
        }

        // Varsayılan domain rule ekle
        const { error: ruleError } = await supabaseAdmin
            .from('domain_rules')
            .insert({
                domain_id: newDomain.id,
                max_clicks: 3,
                time_window_days: 15,
                blocking_mode: 'moderate',
                auto_block_enabled: true,
                block_vpn: true,
                block_proxy: true,
                block_hosting: true,
                block_tor: true
            });

        if (ruleError) {
            console.error('Domain rule ekleme hatası:', ruleError);
        }

        console.log('✅ Domain eklendi:', newDomain.domain, trackingId);

        return NextResponse.json({
            success: true,
            domain: newDomain
        });

    } catch (error) {
        console.error('Domains POST hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}

