// app/api/domains/route.js
// Domain Yönetimi - Yeni Yapı

import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-client';
import { GoogleAdsClientOfficial } from '@/lib/google-ads-client-official';

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

        if (!ads_account_id) {
            return NextResponse.json({ error: 'Google Ads hesap ID gerekli' }, { status: 400 });
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

        // Unique tracking ID oluştur (16 karakter)
        const trackingId = nanoid(16);

        // Domain ekle
        const { data: newDomain, error: domainError } = await supabaseAdmin
            .from('domains')
            .insert({
                profile_id: user.id,
                domain: domain,
                tracking_id: trackingId,
                ads_account_id: ads_account_id,
                timezone: timezone || 'UTC',
                is_active: true
            })
            .select()
            .single();

        if (domainError) {
            console.error('Domain ekleme hatası:', domainError);
            return NextResponse.json({ error: 'Domain eklenemedi' }, { status: 500 });
        }

        console.log('✅ Domain eklendi:', newDomain.domain, 'Tracking ID:', trackingId);

        // ═══════════════════════════════════════════════════════════
        // Google Ads API ile Kampanyaları Çek
        // ═══════════════════════════════════════════════════════════
        try {
            // Google Ads hesap bilgilerini al
            const { data: adsAccount } = await supabaseAdmin
                .from('google_oauth_tokens')
                .select('*')
                .eq('is_active', true)
                .single();

            if (adsAccount) {
                const googleAdsClient = new GoogleAdsClientOfficial(
                    adsAccount.access_token,
                    adsAccount.refresh_token,
                    adsAccount.mcc_customer_id
                );

                console.log('📡 Kampanyalar Google Ads API\'den çekiliyor...');

                // Kampanyaları çek
                const campaigns = await googleAdsClient.getCampaigns(ads_account_id);

                console.log(`✅ ${campaigns.length} kampanya bulundu`);

                // Kampanyaları veritabanına kaydet
                if (campaigns.length > 0) {
                    const campaignInserts = campaigns.map(campaign => ({
                        domain_id: newDomain.id,
                        campaign_id: campaign.id,
                        campaign_name: campaign.name,
                        added_method: 'manual', // İlk çekimde manual
                        is_active: campaign.status === 'ENABLED'
                    }));

                    const { error: campaignError } = await supabaseAdmin
                        .from('ads_campaigns')
                        .insert(campaignInserts);

                    if (campaignError) {
                        console.error('Kampanya kaydetme hatası:', campaignError);
                    } else {
                        console.log(`✅ ${campaigns.length} kampanya kaydedildi`);
                    }
                }
            } else {
                console.warn('⚠️ Google Ads hesabı bulunamadı, kampanyalar çekilemedi');
            }
        } catch (error) {
            console.error('❌ Kampanya çekme hatası:', error);
            // Domain eklendi ama kampanyalar çekilemedi, hata vermeden devam et
        }

        // Tracking URL'i oluştur
        const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.adguardy.com'}/api/tracker?id=${trackingId}&campaign_id={campaignid}&gclid={gclid}&keyword={keyword}&device={device}&network={network}&adpos={adposition}&placement={placement}&url={lpurl}`;

        return NextResponse.json({
            success: true,
            domain: newDomain,
            tracking_url: trackingUrl
        });

    } catch (error) {
        console.error('Domains POST hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}
