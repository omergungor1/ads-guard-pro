// app/api/domains/[id]/google-ads-link/route.js
// Google Ads hesap bağlantısı için yönetici daveti gönderme

import { NextResponse } from 'next/server';
import { supabaseAdmin, getServerSession } from '@/lib/supabase-client';

/**
 * Google Ads yönetici daveti durumunu kontrol et
 */
export async function GET(request, { params }) {
    try {
        const { user } = await getServerSession(request.cookies);
        const { id } = await params;

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Domain'i getir
        const { data: domain } = await supabaseAdmin
            .from('domains')
            .select('ads_account_id')
            .eq('id', id)
            .eq('profile_id', user.id)
            .single();

        if (!domain || !domain.ads_account_id) {
            return NextResponse.json({
                status: 'not_configured',
                message: 'Google Ads hesap ID\'si henüz eklenmemiş'
            });
        }

        return NextResponse.json({
            status: 'pending',
            message: 'Google Ads hesap bağlantısı manuel olarak yapılmalıdır',
            instructions: getManualInstructions()
        });

    } catch (error) {
        console.error('Google Ads link GET hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}

/**
 * Manuel bağlantı talimatları
 */
function getManualInstructions() {
    return {
        title: 'Google Ads Hesap Bağlantısı - Manuel Kurulum',
        description: 'Google Ads hesabınıza yönetici erişimi vermek için aşağıdaki adımları takip edin.',
        steps: [
            {
                step: 1,
                title: 'Google Ads Hesabınıza Giriş Yapın',
                description: 'https://ads.google.com adresine gidin ve hesabınıza giriş yapın.',
                action: 'Google Ads\'ı Aç',
                url: 'https://ads.google.com'
            },
            {
                step: 2,
                title: 'Ayarlar Menüsüne Gidin',
                description: 'Sağ üst köşedeki araçlar simgesine tıklayın ve "Ayarlar" sekmesini seçin.',
                details: [
                    'Araçlar ve Ayarlar ikonu (🔧) → Ayarlar',
                    'Sol menüden "Erişim ve Güvenlik" seçeneğine tıklayın'
                ]
            },
            {
                step: 3,
                title: 'Yönetici Hesabı Bağlantısı',
                description: 'Yönetici sekmesine gidin ve yeni bağlantı isteği gönderin.',
                details: [
                    '"Yönetici" sekmesine tıklayın',
                    '"+" butonuna tıklayarak yeni bağlantı ekleyin',
                    'AdsGuardPro Yönetici ID\'sini girin: <MANAGER_ACCOUNT_ID>',
                    '"Erişim türü" olarak "Standart" seçin',
                    '"Davet Gönder" butonuna tıklayın'
                ],
                note: 'Not: Yönetici hesap ID\'sini AdsGuardPro dashboard\'unuzdan kopyalayabilirsiniz.'
            },
            {
                step: 4,
                title: 'Daveti Onaylayın',
                description: 'AdsGuardPro tarafından gönderilen davet kabul edilene kadar bekleyin.',
                details: [
                    'Davet genellikle birkaç dakika içinde görünür',
                    'E-posta bildirimi alabilirsiniz',
                    'Davet otomatik olarak kabul edilecektir'
                ]
            },
            {
                step: 5,
                title: 'Bağlantıyı Doğrulayın',
                description: 'AdsGuardPro dashboard\'unuzda bağlantının aktif olduğunu kontrol edin.',
                action: 'Bağlantıyı Kontrol Et'
            }
        ],
        alternative: {
            title: 'Alternatif Yöntem: API Access',
            description: 'Eğer manuel bağlantı kurmak istemiyorsanız, Google Ads API OAuth flow\'u kullanabilirsiniz.',
            steps: [
                'Dashboard\'dan "Google Ads Bağlantısı" butonuna tıklayın',
                'Google hesabınızla giriş yapın',
                'İzinleri onaylayın',
                'Otomatik olarak bağlanır'
            ]
        },
        important_notes: [
            '⚠️ Yönetici erişimi vermek, AdsGuardPro\'nun kampanyalarınıza IP engelleme eklemesine izin verir.',
            '🔒 AdsGuardPro sadece IP engelleme için gerekli minimum izinleri kullanır.',
            '📊 Reklam bütçenize veya kampanya ayarlarınıza dokunulmaz.',
            '🔑 Erişimi istediğiniz zaman iptal edebilirsiniz.'
        ]
    };
}

/**
 * Google Ads hesap ID'sini domain'e kaydet
 */
export async function POST(request, { params }) {
    try {
        const { user } = await getServerSession(request.cookies);
        const { id } = await params;
        const body = await request.json();

        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { ads_account_id } = body;

        if (!ads_account_id) {
            return NextResponse.json({ error: 'Google Ads hesap ID\'si gerekli' }, { status: 400 });
        }

        // Domain'i güncelle
        await supabaseAdmin
            .from('domains')
            .update({
                ads_account_id: ads_account_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('profile_id', user.id);

        // Google Ads API ile otomatik bağlantı isteği gönderme özelliği
        // Şu an için manuel kurulum talimatları döndürüyoruz
        // TODO: Google Ads CustomerClientLink API entegrasyonu

        return NextResponse.json({
            success: true,
            message: 'Google Ads hesap ID\'si kaydedildi. Lütfen manuel kurulum talimatlarını takip edin.',
            status: 'pending',
            instructions: getManualInstructions()
        });

    } catch (error) {
        console.error('Google Ads link POST hatası:', error);
        return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
    }
}

