// app/api/domains/[id]/campaigns/route.js
// Domain'e ait kampanyaları getir ve güncelle

import { NextResponse } from 'next/server';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-client';
import { GoogleAdsClientOfficial } from '@/lib/google-ads-client-official';
import { getActiveGoogleTokens } from '@/lib/auth-helpers';

export async function GET(request, { params }) {
    try {
        const { user } = await getServerSession(request.cookies);

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const resolvedParams = await params;
        const domainId = resolvedParams.id;
        console.log('domainId:', domainId);

        // Domain'in kullanıcıya ait olduğunu kontrol et
        const { data: domain, error: domainError } = await supabaseAdmin
            .from('domains')
            .select('id')
            .eq('id', domainId)
            .eq('profile_id', user.id)
            .single();

        if (domainError || !domain) {
            return NextResponse.json({ error: 'Domain bulunamadı' }, { status: 404 });
        }

        // Kampanyaları getir
        const { data: campaigns, error: campaignsError } = await supabaseAdmin
            .from('ads_campaigns')
            .select('*')
            .eq('domain_id', domainId)
            .order('created_at', { ascending: false });

        if (campaignsError) {
            console.error('Kampanyalar getirilemedi:', campaignsError);
            return NextResponse.json({ error: 'Kampanyalar getirilemedi' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            campaigns: campaigns || []
        });

    } catch (error) {
        console.error('Campaigns API hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const { user } = await getServerSession(request.cookies);

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const resolvedParams = await params;
        const domainId = resolvedParams.id;

        // Domain'i getir (ads_account_id lazım)
        const { data: domain, error: domainError } = await supabaseAdmin
            .from('domains')
            .select('id, domain, ads_account_id')
            .eq('id', domainId)
            .eq('profile_id', user.id)
            .single();

        if (domainError || !domain) {
            return NextResponse.json({ error: 'Domain bulunamadı' }, { status: 404 });
        }

        if (!domain.ads_account_id) {
            return NextResponse.json({
                error: 'Bu domain için Google Ads hesap ID tanımlanmamış'
            }, { status: 400 });
        }

        // Google OAuth token'larını al
        const tokens = await getActiveGoogleTokens();

        if (!tokens || !tokens.access_token || !tokens.refresh_token) {
            return NextResponse.json({
                error: 'Google OAuth bağlantısı bulunamadı. Lütfen ayarlardan MCC hesabınızı bağlayın.'
            }, { status: 401 });
        }

        // Google Ads client oluştur
        const client = new GoogleAdsClientOfficial(
            tokens.access_token,
            tokens.refresh_token,
            process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
        );

        console.log('🔍 Google Ads\'den kampanyalar çekiliyor...', {
            domainId,
            adsAccountId: domain.ads_account_id
        });

        // Google Ads'den kampanyaları çek
        const googleCampaigns = await client.getCampaigns(domain.ads_account_id);

        console.log(`📊 Google Ads'den ${googleCampaigns.length} kampanya geldi`);

        // Mevcut kampanyaları getir
        const { data: existingCampaigns, error: existingError } = await supabaseAdmin
            .from('ads_campaigns')
            .select('id, campaign_id, campaign_name, is_active')
            .eq('domain_id', domainId);

        if (existingError) {
            console.error('Mevcut kampanyalar alınamadı:', existingError);
            return NextResponse.json({
                error: 'Mevcut kampanyalar kontrol edilemedi'
            }, { status: 500 });
        }

        console.log(`📋 Veritabanında ${existingCampaigns?.length || 0} kampanya var`);

        // Kampanyaları campaign_id'ye göre map'e dönüştür
        const existingMap = new Map();
        (existingCampaigns || []).forEach(camp => {
            existingMap.set(camp.campaign_id, camp);
        });

        // Google'dan gelen kampanya ID'lerini set'e dönüştür
        const googleCampaignIds = new Set(googleCampaigns.map(c => c.id));

        const stats = {
            added: 0,
            updated: 0,
            deactivated: 0,
            total: googleCampaigns.length
        };

        // Google'dan gelen kampanyaları işle
        for (const googleCampaign of googleCampaigns) {
            const existing = existingMap.get(googleCampaign.id);

            if (!existing) {
                // Yeni kampanya - ekle
                const { error: insertError } = await supabaseAdmin
                    .from('ads_campaigns')
                    .insert({
                        domain_id: domainId,
                        campaign_id: googleCampaign.id,
                        campaign_name: googleCampaign.name,
                        added_method: 'sync',
                        is_active: true,
                        last_sync_at: new Date().toISOString()
                    });

                if (insertError) {
                    console.error('Kampanya eklenemedi:', googleCampaign.id, insertError);
                } else {
                    stats.added++;
                    console.log('✅ Yeni kampanya eklendi:', googleCampaign.name);
                }
            } else {
                // Mevcut kampanya - adı veya durumu değişmiş mi kontrol et
                const needsUpdate =
                    existing.campaign_name !== googleCampaign.name ||
                    existing.is_active === false;

                if (needsUpdate) {
                    const { error: updateError } = await supabaseAdmin
                        .from('ads_campaigns')
                        .update({
                            campaign_name: googleCampaign.name,
                            is_active: true,
                            last_sync_at: new Date().toISOString(),
                            sync_error: null
                        })
                        .eq('id', existing.id);

                    if (updateError) {
                        console.error('Kampanya güncellenemedi:', existing.id, updateError);
                    } else {
                        stats.updated++;
                        console.log('🔄 Kampanya güncellendi:', googleCampaign.name);
                    }
                } else {
                    // Sadece sync zamanını güncelle
                    await supabaseAdmin
                        .from('ads_campaigns')
                        .update({
                            last_sync_at: new Date().toISOString()
                        })
                        .eq('id', existing.id);
                }
            }
        }

        // Silinmiş kampanyaları bul (Google'da olmayan ama bizde aktif olan)
        for (const [campaignId, existing] of existingMap.entries()) {
            if (!googleCampaignIds.has(campaignId) && existing.is_active) {
                // Bu kampanya Google'da yok artık - deaktif et
                const { error: deactivateError } = await supabaseAdmin
                    .from('ads_campaigns')
                    .update({
                        is_active: false,
                        last_sync_at: new Date().toISOString(),
                        sync_error: 'Kampanya Google Ads\'de bulunamadı'
                    })
                    .eq('id', existing.id);

                if (deactivateError) {
                    console.error('Kampanya deaktif edilemedi:', existing.id, deactivateError);
                } else {
                    stats.deactivated++;
                    console.log('⚠️ Kampanya deaktif edildi:', existing.campaign_name);
                }
            }
        }

        console.log('✨ Senkronizasyon tamamlandı:', stats);

        // Güncellenmiş kampanya listesini döndür
        const { data: updatedCampaigns } = await supabaseAdmin
            .from('ads_campaigns')
            .select('*')
            .eq('domain_id', domainId)
            .order('created_at', { ascending: false });

        return NextResponse.json({
            success: true,
            message: 'Kampanyalar başarıyla senkronize edildi',
            stats,
            campaigns: updatedCampaigns || []
        });

    } catch (error) {
        console.error('❌ Kampanya senkronizasyon hatası:', error);

        return NextResponse.json({
            error: 'Kampanyalar senkronize edilemedi',
            details: error.message
        }, { status: 500 });
    }
}

