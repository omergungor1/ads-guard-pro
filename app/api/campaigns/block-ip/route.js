// app/api/campaigns/block-ip/route.js
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
        const { customer_id, campaign_id, ip_addresses } = body;

        // Validasyon
        if (!customer_id || !campaign_id || !ip_addresses || !Array.isArray(ip_addresses)) {
            return NextResponse.json(
                { error: 'customer_id, campaign_id ve ip_addresses (array) gerekli' },
                { status: 400 }
            );
        }

        if (ip_addresses.length === 0) {
            return NextResponse.json(
                { error: 'En az bir IP adresi gerekli' },
                { status: 400 }
            );
        }

        // Google Ads client oluştur
        const client = new GoogleAdsClientOfficial(
            tokens.access_token,
            tokens.refresh_token,
            process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
        );

        // IP'leri engelle
        const result = await client.addIpExclusions(
            customer_id,
            campaign_id,
            ip_addresses
        );

        return NextResponse.json({
            success: true,
            message: `${ip_addresses.length} IP kampanyaya eklendi`,
            result,
        });

    } catch (error) {
        console.error('IP engelleme hatası:', error);

        return NextResponse.json(
            {
                error: 'IP engelleme başarısız',
                details: error.response?.data || error.message
            },
            { status: 500 }
        );
    }
}