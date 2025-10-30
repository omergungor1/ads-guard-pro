// app/api/campaigns/route.js
import { NextResponse } from 'next/server';
import { GoogleAdsClientOfficial } from '@/lib/google-ads-client-official';
import { getActiveGoogleTokens } from '@/lib/auth-helpers';

export async function GET(request) {
    try {
        // Database'den aktif token'ı al (gerekirse otomatik yenile)
        const tokens = await getActiveGoogleTokens();

        if (!tokens || !tokens.access_token || !tokens.refresh_token) {
            return NextResponse.json(
                { error: 'Google OAuth bağlantısı bulunamadı. Lütfen ayarlardan MCC hesabınızı bağlayın.' },
                { status: 401 }
            );
        }

        // URL'den customer_id al
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customer_id');

        if (!customerId) {
            return NextResponse.json(
                { error: 'customer_id parametresi gerekli' },
                { status: 400 }
            );
        }

        // Google Ads client oluştur
        const client = new GoogleAdsClientOfficial(
            tokens.access_token,
            tokens.refresh_token,
            process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
        );

        // Kampanyaları getir
        const campaigns = await client.getCampaigns(customerId);

        return NextResponse.json({
            success: true,
            count: campaigns.length,
            campaigns,
        });

    } catch (error) {
        console.error('Kampanya listesi hatası:', error);

        // Token expired ise refresh'e yönlendir
        if (error.response?.status === 401) {
            return NextResponse.json(
                { error: 'Token expired', needsRefresh: true },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                error: 'Kampanyalar alınamadı',
                details: error.response?.data || error.message
            },
            { status: 500 }
        );
    }
}