// app/api/campaigns/block-ip/route.js
// IP Engelleme - Domain'in TÜM kampanyalarına ekler

import { NextResponse } from 'next/server';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-client';
import { GoogleAdsClientOfficial } from '@/lib/google-ads-client-official';

export async function POST(request) {
    try {
        const { user } = await getServerSession(request.cookies);

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { domain_id, ip_address } = body;

        if (!domain_id || !ip_address) {
            return NextResponse.json(
                { error: 'domain_id ve ip_address gerekli' },
                { status: 400 }
            );
        }

        // Domain'i ve ads_account_id'yi al
        const { data: domain, error: domainError } = await supabaseAdmin
            .from('domains')
            .select('id, domain, ads_account_id, profile_id')
            .eq('id', domain_id)
            .eq('profile_id', user.id)
            .single();

        if (domainError || !domain) {
            return NextResponse.json({ error: 'Domain bulunamadı' }, { status: 404 });
        }

        if (!domain.ads_account_id) {
            return NextResponse.json(
                { error: 'Domain\'e Google Ads hesabı bağlı değil' },
                { status: 400 }
            );
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 1: blocked_ips tablosuna ekle
        // ═══════════════════════════════════════════════════════════
        const { data: blockedIp, error: blockError } = await supabaseAdmin
            .from('blocked_ips')
            .upsert(
                {
                    domain_id: domain.id,
                    ip: ip_address,
                    synced_to_ads: false,
                    block_count: 1,
                    last_seen_at: new Date().toISOString()
                },
                {
                    onConflict: 'domain_id,ip',
                    ignoreDuplicates: false
                }
            )
            .select()
            .single();

        if (blockError) {
            console.error('IP engelleme hatası:', blockError);
            return NextResponse.json({ error: 'IP engellenemedi' }, { status: 500 });
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 2: Domain'in TÜM aktif kampanyalarını al
        // ═══════════════════════════════════════════════════════════
        const { data: campaigns, error: campaignError } = await supabaseAdmin
            .from('ads_campaigns')
            .select('campaign_id, campaign_name')
            .eq('domain_id', domain.id)
            .eq('is_active', true);

        if (campaignError || !campaigns || campaigns.length === 0) {
            return NextResponse.json(
                { error: 'Aktif kampanya bulunamadı' },
                { status: 404 }
            );
        }

        console.log(`📤 IP ${campaigns.length} kampanyaya gönderiliyor:`, ip_address);

        // ═══════════════════════════════════════════════════════════
        // STEP 3: Google Ads API ile TÜM kampanyalara ekle
        // ═══════════════════════════════════════════════════════════
        try {
            // Google Ads hesap bilgilerini al
            const { data: adsAccount } = await supabaseAdmin
                .from('google_oauth_tokens')
                .select('*')
                .eq('is_active', true)
                .single();

            if (!adsAccount) {
                throw new Error('Google Ads hesabı bulunamadı');
            }

            const googleAdsClient = new GoogleAdsClientOfficial(
                adsAccount.access_token,
                adsAccount.refresh_token,
                adsAccount.mcc_customer_id
            );

            let successCount = 0;
            let errorMessages = [];

            // Her kampanyaya IP'yi ekle
            for (const campaign of campaigns) {
                try {
                    await googleAdsClient.addIpExclusions(
                        domain.ads_account_id,
                        campaign.campaign_id,
                        [ip_address]
                    );
                    successCount++;
                    console.log(`✅ ${campaign.campaign_name}: IP eklendi`);
                } catch (error) {
                    console.error(`❌ ${campaign.campaign_name}: Hata`, error.message);
                    errorMessages.push(`${campaign.campaign_name}: ${error.message}`);
                }
            }

            // Sync durumunu güncelle
            await supabaseAdmin
                .from('blocked_ips')
                .update({
                    synced_to_ads: successCount > 0,
                    synced_at: new Date().toISOString(),
                    sync_error: errorMessages.length > 0 ? errorMessages.join('; ') : null
                })
                .eq('id', blockedIp.id);

            // Kampanyaların last_sync_at'ini güncelle
            if (successCount > 0) {
                await supabaseAdmin
                    .from('ads_campaigns')
                    .update({ last_sync_at: new Date().toISOString() })
                    .eq('domain_id', domain.id)
                    .in('campaign_id', campaigns.map(c => c.campaign_id));
            }

            return NextResponse.json({
                success: true,
                message: `IP ${successCount}/${campaigns.length} kampanyaya eklendi`,
                blocked_ip: blockedIp,
                campaigns_affected: successCount,
                errors: errorMessages
            });

        } catch (error) {
            console.error('Google Ads API hatası:', error);

            // Hata mesajını kaydet
            await supabaseAdmin
                .from('blocked_ips')
                .update({
                    sync_error: error.message
                })
                .eq('id', blockedIp.id);

            return NextResponse.json(
                { error: 'Google Ads\'a gönderilemedi: ' + error.message },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('IP engelleme API hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}
