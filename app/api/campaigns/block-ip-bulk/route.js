// app/api/campaigns/block-ip-bulk/route.js
import { NextResponse } from 'next/server';
import { GoogleAdsClientOfficial } from '@/lib/google-ads-client-official';
import { getActiveGoogleTokens } from '@/lib/auth-helpers';

export async function POST(request) {
    try {
        // Database'den aktif token'ı al (gerekirse otomatik yenile)
        const tokens = await getActiveGoogleTokens();

        if (!tokens || !tokens.access_token || !tokens.refresh_token) {
            return NextResponse.json(
                { error: 'Google OAuth bağlantısı bulunamadı. Lütfen ayarlardan MCC hesabınızı bağlayın.' },
                { status: 401 }
            );
        }

        // Request body'yi al
        const body = await request.json();
        const { customer_id, ip_addresses, exclude_campaign_ids = [] } = body;

        // Validasyon
        if (!customer_id || !ip_addresses || !Array.isArray(ip_addresses)) {
            return NextResponse.json(
                { error: 'customer_id ve ip_addresses (array) gerekli' },
                { status: 400 }
            );
        }

        // Google Ads client oluştur
        const client = new GoogleAdsClientOfficial(
            tokens.access_token,
            tokens.refresh_token,
            process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
        );

        // Önce tüm kampanyaları al
        const campaigns = await client.getCampaigns(customer_id);

        // Hariç tutulanları filtrele
        const targetCampaigns = campaigns.filter(
            c => !exclude_campaign_ids.includes(c.id)
        );

        // Her kampanyaya IP'leri ekle
        const results = [];
        const errors = [];

        for (const campaign of targetCampaigns) {
            try {
                const result = await client.addIpExclusions(
                    customer_id,
                    campaign.id,
                    ip_addresses
                );

                results.push({
                    campaignId: campaign.id,
                    campaignName: campaign.name,
                    success: true,
                    ipCount: ip_addresses.length,
                });
            } catch (error) {
                errors.push({
                    campaignId: campaign.id,
                    campaignName: campaign.name,
                    success: false,
                    error: error.response?.data?.error?.message || error.message,
                });
            }
        }

        return NextResponse.json({
            success: true,
            affected_campaigns: results.length,
            summary: {
                totalCampaigns: targetCampaigns.length,
                successful: results.length,
                failed: errors.length,
                ipCount: ip_addresses.length,
            },
            results,
            errors,
        });

    } catch (error) {
        console.error('Toplu IP engelleme hatası:', error);

        return NextResponse.json(
            {
                error: 'Toplu IP engelleme başarısız',
                details: error.response?.data || error.message
            },
            { status: 500 }
        );
    }
}