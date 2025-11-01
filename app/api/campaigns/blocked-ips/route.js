// app/api/campaigns/blocked-ips/route.js
// Engellenen IP'leri listele - Domain bazlı

import { NextResponse } from 'next/server';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-client';
import { GoogleAdsClientOfficial } from '@/lib/google-ads-client-official';

export async function GET(request) {
    try {
        const { user } = await getServerSession(request.cookies);

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customer_id');
        const campaignId = searchParams.get('campaign_id');

        if (!customerId || !campaignId) {
            return NextResponse.json(
                { error: 'customer_id ve campaign_id parametresi gerekli' },
                { status: 400 }
            );
        }

        // Google Ads hesap bilgilerini al
        const { data: adsAccount } = await supabaseAdmin
            .from('google_oauth_tokens')
            .select('*')
            .eq('is_active', true)
            .single();

        if (!adsAccount) {
            return NextResponse.json({ error: 'Google Ads hesabı bulunamadı' }, { status: 404 });
        }

        // Google Ads API ile Engellenen IP'leri getir
        const googleAdsClient = new GoogleAdsClientOfficial(
            adsAccount.access_token,
            adsAccount.refresh_token,
            adsAccount.mcc_customer_id || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
        );

        const blockedIps = await googleAdsClient.getIpExclusions(customerId, campaignId);
        console.log('blockedIps:', blockedIps?.length || 0);

        return NextResponse.json({
            success: true,
            count: blockedIps?.length || 0,
            ips: blockedIps || []
        });

    } catch (error) {
        console.error('Blocked IPs API hatası:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Bir hata oluştu',
            ips: []
        }, { status: 500 });
    }
}
