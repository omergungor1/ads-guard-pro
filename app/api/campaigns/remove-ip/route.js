// app/api/campaigns/remove-ip/route.js
// IP Engelini Kaldır - Domain'in TÜM kampanyalarından

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

        // Domain'i al
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
        // STEP 1: Domain'in TÜM aktif kampanyalarını al
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

        console.log(`🗑️ IP ${campaigns.length} kampanyadan kaldırılıyor:`, ip_address);

        // ═══════════════════════════════════════════════════════════
        // STEP 2: Google Ads API ile TÜM kampanyalardan kaldır
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

            // Her kampanyadan IP'yi kaldır
            for (const campaign of campaigns) {
                try {
                    await googleAdsClient.removeIpExclusions(
                        domain.ads_account_id,
                        campaign.campaign_id,
                        [ip_address]
                    );
                    successCount++;
                    console.log(`✅ ${campaign.campaign_name}: IP kaldırıldı`);
                } catch (error) {
                    console.error(`❌ ${campaign.campaign_name}: Hata`, error.message);
                    errorMessages.push(`${campaign.campaign_name}: ${error.message}`);
                }
            }

            // ═══════════════════════════════════════════════════════════
            // STEP 3: blocked_ips'ten sil
            // ═══════════════════════════════════════════════════════════
            if (successCount > 0) {
                const { error: deleteError } = await supabaseAdmin
                    .from('blocked_ips')
                    .delete()
                    .eq('domain_id', domain.id)
                    .eq('ip', ip_address);

                if (deleteError) {
                    console.error('IP silme hatası:', deleteError);
                }

                // Kampanyaların last_sync_at'ini güncelle
                await supabaseAdmin
                    .from('ads_campaigns')
                    .update({ last_sync_at: new Date().toISOString() })
                    .eq('domain_id', domain.id)
                    .in('campaign_id', campaigns.map(c => c.campaign_id));
            }

            return NextResponse.json({
                success: true,
                message: `IP ${successCount}/${campaigns.length} kampanyadan kaldırıldı`,
                campaigns_affected: successCount,
                errors: errorMessages
            });

        } catch (error) {
            console.error('Google Ads API hatası:', error);
            return NextResponse.json(
                { error: 'Google Ads\'dan kaldırılamadı: ' + error.message },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('IP kaldırma API hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}
