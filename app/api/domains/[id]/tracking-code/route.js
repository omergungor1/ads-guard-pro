// app/api/domains/[id]/tracking-code/route.js
// Tracking code ve URL'leri döndür

import { NextResponse } from 'next/server';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-client';

export async function GET(request, { params }) {
    try {
        const { user } = await getServerSession(request.cookies);
        const { id } = await params;

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Domain'i getir
        const { data: domain, error } = await supabaseAdmin
            .from('domains')
            .select('id, domain, tracking_id')
            .eq('id', id)
            .eq('profile_id', user.id)
            .single();

        if (error || !domain) {
            return NextResponse.json({ error: 'Domain bulunamadı' }, { status: 404 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';

        // Tracking script kodu
        const trackingScript = `<!-- AdsGuardPro Tracking Script -->
<script>
  window.AGP_TRACKING_ID = '${domain.tracking_id}';
  window.AGP_API_URL = '${appUrl}';
</script>
<script src="${appUrl}/js/tracker.js" async></script>
<!-- End AdsGuardPro -->`;

        // Google Ads Tracking Template URL
        const trackingTemplateUrl = `${appUrl}/api/tracker?id=${domain.tracking_id}&gclid={gclid}&cpn={campaignid}&adgrp={adgroupid}&kw={keyword}&nw={network}&adpos={adposition}&device={device}&pl={placement}&locphisical={loc_physical_ms}&locinterest={loc_interest_ms}&url={lpurl}`;

        return NextResponse.json({
            tracking_script: trackingScript,
            tracking_template_url: trackingTemplateUrl,
            tracking_id: domain.tracking_id,
            instructions: {
                tracking_script: {
                    title: 'Tracking Script Kurulumu',
                    steps: [
                        'Yukarıdaki kodu kopyalayın',
                        'Sitenizin HTML kodunda <body> taginden hemen sonra ekleyin',
                        'Tüm sayfalarda bu kod bulunmalıdır',
                        'Next.js kullanıyorsanız app/layout.js veya _app.js dosyasına ekleyebilirsiniz'
                    ]
                },
                tracking_template: {
                    title: 'Google Ads Tracking Template Kurulumu',
                    steps: [
                        'Google Ads hesabınıza giriş yapın',
                        'Ayarlar > Hesap Ayarları > Tracking sekmesine gidin',
                        'Tracking template alanına yukarıdaki URL\'i yapıştırın',
                        'Kaydedin ve kampanyalarınızı yayınlayın',
                        'Not: Bu URL tüm kampanyalarınız için geçerli olacaktır'
                    ]
                }
            }
        });

    } catch (error) {
        console.error('Tracking code GET hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}

