// app/api/domains/[id]/tracking-code/route.js
// Google Certified Tracking Code Generator
// Returns tracking script and Google Ads tracking template URL
// ✅ Compliant with Google's Third-Party Click Tracking Guidelines
// ✅ Fast redirect (< 100ms)
// ✅ Transparency parameter: redirection_url
// ✅ No foreign parameters added to final URL

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

        // Tracking script kodu
        const trackingScript = `<!-- AdsGuardPro Tracking Script -->
<script>
  window.ag_tracking_id = '${domain.tracking_id}';
  window.ag_api_url = 'https://app.adguardy.com';
</script>
<script src="https://www.adguardy.com/js/tracker.js" async></script>
<!-- End AdsGuardPro -->`;

        // Google Ads Tracking Template URL (Google Certified - Compliant with Transparency Guidelines)
        const trackingTemplateUrl = `https://app.adguardy.com/api/tracker?force_transparent=true&id=${domain.tracking_id}&redirection_url={lpurl}&campaign_id={campaignid}&gclid={gclid}&keyword={keyword}&device={device}&network={network}&adpos={adposition}&placement={placement}`;

        return NextResponse.json({
            tracking_script: trackingScript,
            tracking_template_url: trackingTemplateUrl,
            tracking_id: domain.tracking_id,
            instructions: {
                tracking_script: {
                    title: 'Site Tracking Script Kurulumu',
                    steps: [
                        '1. Yukarıdaki kodu kopyalayın',
                        '2. Sitenizin HTML kodunda <head> veya <body> taginin içine ekleyin',
                        '3. Tüm sayfalarda bu kod bulunmalıdır (özellikle landing page\'de)',
                        '4. Next.js: app/layout.js veya pages/_app.js dosyasına ekleyin',
                        '5. WordPress: tema ayarlarında "Header Scripts" alanına ekleyin'
                    ]
                },
                tracking_template: {
                    title: 'Google Ads Tracking Template Kurulumu',
                    steps: [
                        '1. Google Ads hesabınıza giriş yapın',
                        '2. Kampanya seçin → Ayarlar → Kampanya URL seçenekleri',
                        '3. "Tracking template" alanına yukarıdaki URL\'i yapıştırın',
                        '4. "Final URL suffix" alanını boş bırakın',
                        '5. Kaydet\'e tıklayın',
                        '⚠️ ÖNEMLİ: URL tam olarak kopyalanmalı (force_transparent=true dahil)',
                        '✅ Google Certified: Bu template Google\'ın tüm gereksinimlerini karşılar'
                    ]
                },
                google_certification: {
                    title: 'Google Sertifikasyonu',
                    features: [
                        '✅ Transparency Parameter: redirection_url aktif',
                        '✅ Force Transparent Mode: Etkin',
                        '✅ Fast Redirect: < 100ms',
                        '✅ URL Validation: Güvenlik kontrolleri aktif',
                        '✅ No Foreign Parameters: Final URL değiştirilmez',
                        '✅ SSL/TLS: HTTPS zorunlu'
                    ]
                }
            }
        });

    } catch (error) {
        console.error('Tracking code GET hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}

