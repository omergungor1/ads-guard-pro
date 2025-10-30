// app/api/customers/route.js
import { NextResponse } from 'next/server';
import { GoogleAdsClientOfficial } from '@/lib/google-ads-client-official';
import { getActiveGoogleTokens } from '@/lib/auth-helpers';

export async function GET() {
    try {
        // Database'den aktif token'ı al (gerekirse otomatik yenile)
        const tokens = await getActiveGoogleTokens();

        if (!tokens || !tokens.access_token || !tokens.refresh_token) {
            return NextResponse.json(
                { error: 'Google OAuth bağlantısı bulunamadı. Lütfen ayarlardan MCC hesabınızı bağlayın.' },
                { status: 401 }
            );
        }

        // Google Ads client oluştur
        const client = new GoogleAdsClientOfficial(
            tokens.access_token,
            tokens.refresh_token,
            process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
        );

        // Erişilebilir hesapları getir
        const customerIds = await client.getAccessibleCustomers();

        return NextResponse.json({
            success: true,
            count: customerIds.length,
            customerIds,
        });

    } catch (error) {
        console.error('Customer listesi hatası:', error);

        return NextResponse.json(
            {
                error: 'Hesaplar alınamadı',
                details: error.response?.data || error.message
            },
            { status: 500 }
        );
    }
}