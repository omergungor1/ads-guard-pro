# 🛡️ AdsGuardPro

Google Ads reklamlarınızı bot tıklamalarından ve zararlı trafikten koruyan profesyonel bir Click Fraud Protection sistemi. ClickCease benzeri bot engelleme servisi.

## ✨ Özellikler

### 🎯 Core Özellikler
- 🔐 **Supabase Auth** - Güvenli kullanıcı kimlik doğrulama
- 🌐 **Multi-Domain Support** - Birden fazla domain yönetimi
- 🤖 **Bot Detection** - Gelişmiş bot tespit algoritmaları
- 🚫 **Auto IP Blocking** - Otomatik IP engelleme
- 📊 **Real-time Tracking** - Gerçek zamanlı kullanıcı takibi
- 🔍 **Fingerprinting** - Cihaz parmak izi ile takip
- 🎨 **Modern UI** - Tailwind CSS ile responsive tasarım

### 📈 Tracking Sistemi
- **Tracking Script** - Site içi JavaScript tracking
- **Tracking Template** - Google Ads URL tracking
- **Session Tracking** - Kullanıcı davranış analizi
- **Event Tracking** - Scroll, click, visibility events
- **IP Geolocation** - IP lokasyon ve tehdit tespiti

### 🛡️ Koruma Özellikleri
- **Time-based Click Limits** - Zaman bazlı tıklama limitleri
- **VPN/Proxy Detection** - VPN ve proxy kullanıcılarını engelleme
- **Hosting/Datacenter IP Block** - Datacenter IP'lerini engelleme
- **Tor Exit Node Block** - Tor çıkış noktalarını engelleme
- **Google Ads API Integration** - Otomatik IP engelleme

## 🗄️ Veritabanı

Proje PostgreSQL (Supabase) kullanır. Detaylı şema için `db.sql` dosyasına bakın.

### Ana Tablolar:
- `profiles` - Kullanıcı profilleri
- `domains` - Domain yönetimi
- `domain_rules` - Koruma kuralları
- `sessions` - Kullanıcı session'ları
- `ad_clicks` - Google Ads tıklamaları
- `devices` - Cihaz fingerprint'leri
- `ip_blocklist` - Engellenen IP'ler
- `ip_threat_scores` - IP tehdit skorları

## 🚀 Kurulum

### 1. Gereksinimler

- Node.js 18+
- npm veya yarn
- Supabase hesabı
- Google Ads API Developer Token
- Google Cloud Console OAuth 2.0 credentials

### 2. Proje Kurulumu

```bash
# Repoyu klonlayın
git clone https://github.com/your-username/ads-guard-pro.git
cd ads-guard-pro

# Bağımlılıkları yükleyin
npm install

# .env.local dosyası oluşturun
cp .env.example .env.local
```

### 3. Supabase Kurulumu

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. SQL Editor'de `db.sql` dosyasını çalıştırın
4. API Keys'i alın (Project Settings > API)

### 4. Google Cloud Console Kurulumu

1. [Google Cloud Console](https://console.cloud.google.com) giriş yapın
2. Yeni proje oluşturun
3. **Google Ads API** aktif edin
4. **OAuth 2.0 Credentials** oluşturun:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback`
5. **Developer Token** alın ([Apply for Developer Token](https://developers.google.com/google-ads/api/docs/first-call/dev-token))

### 5. Environment Variables

`.env.local` dosyasını düzenleyin:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Uygulamayı Başlatın

```bash
# Development modunda çalıştırın
npm run dev

# Tarayıcıda açın
# http://localhost:3000
```

## 📖 Kullanım

### Domain Ekleme

1. **Dashboard'a Gidin** - Ana sayfada "Yeni Domain Ekle" butonuna tıklayın
2. **Domain Bilgileri** - Domain adı ve Google Ads ID'nizi girin
3. **Google Ads Onayı** - Google Ads hesabınızda yönetici davetini onaylayın
4. **Tracking Kurulumu** - Tracking script ve template URL'leri sitenize ekleyin
5. **Koruma Kuralları** - Tıklama limitleri ve engelleme ayarlarını yapın

### Tracking Script Kurulumu

Sitenizin `<body>` taginden hemen sonra ekleyin:

```html
<!-- AdsGuardPro Tracking Script -->
<script>
  window.AGP_TRACKING_ID = 'your-tracking-id';
  window.AGP_API_URL = 'https://your-domain.com';
</script>
<script src="https://your-domain.com/js/tracker.js" async></script>
<!-- End AdsGuardPro -->
```

### Google Ads Tracking Template

Google Ads hesabınızda **Ayarlar > Tracking** sekmesine gidin ve aşağıdaki URL'i ekleyin:

```
https://your-domain.com/api/tracker?id={tracking_id}&gclid={gclid}&cpn={campaignid}&adgrp={adgroupid}&kw={keyword}&nw={network}&adpos={adposition}&device={device}&pl={placement}&locphisical={loc_physical_ms}&locinterest={loc_interest_ms}&url={lpurl}
```

## 🔧 API Endpoints

### Tracking API
- `GET /api/tracker` - Google Ads tracking redirect
- `POST /api/track/init` - Session başlatma
- `POST /api/track/event` - Event tracking

### Domain API
- `GET /api/domains` - Domain listesi
- `POST /api/domains` - Yeni domain ekle
- `GET /api/domains/[id]` - Domain detayı
- `PATCH /api/domains/[id]` - Domain güncelle
- `DELETE /api/domains/[id]` - Domain sil
- `GET /api/domains/[id]/rules` - Domain kuralları
- `PUT /api/domains/[id]/rules` - Kuralları güncelle
- `GET /api/domains/[id]/tracking-code` - Tracking kodları

### Google Ads API
- `GET /api/customers` - Hesap listesi
- `GET /api/campaigns?customer_id={id}` - Kampanya listesi
- `POST /api/campaigns/block-ip` - Tekil IP engelleme
- `POST /api/campaigns/block-ip-bulk` - Toplu IP engelleme

## 📊 İş Akışı

### 1. Ad Click Flow (Reklamdan Gelen Trafik)
```
User clicks ad 
  ↓
Google Ads Tracking Template 
  ↓
/api/tracker (creates ad_click record + sets cookies)
  ↓
Redirects to actual site
  ↓
Tracking script loads
  ↓
/api/track/init (links session to ad_click)
  ↓
Event tracking starts
  ↓
Bot score calculation
  ↓
Auto-block if threshold exceeded
```

### 2. Organic Traffic Flow
```
User visits site directly
  ↓
Tracking script loads
  ↓
/api/track/init (creates session)
  ↓
Event tracking starts
  ↓
No blocking (not ad traffic)
```

## 🛠️ Teknolojiler

- **Framework:** Next.js 16.0 (App Router)
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS 4
- **APIs:** Google Ads API, Google OAuth
- **Tracking:** FingerprintJS
- **Deployment:** Vercel

## 📁 Proje Yapısı

```
ads-guard-pro/
├── app/
│   ├── api/                  # API routes
│   │   ├── tracker/          # Tracking redirect
│   │   ├── track/            # Session & event tracking
│   │   ├── domains/          # Domain yönetimi
│   │   ├── campaigns/        # Google Ads kampanyalar
│   │   └── auth/             # OAuth endpoints
│   ├── dashboard/            # Ana dashboard
│   ├── domains/              # Domain yönetim sayfaları
│   │   ├── new/              # Domain ekleme wizard
│   │   └── [id]/             # Domain detay
│   └── ads-campaigns/        # Google Ads yönetimi
├── components/               # React components
├── lib/                      # Yardımcı fonksiyonlar
│   ├── supabase-client.js    # Supabase client
│   ├── google-auth.js        # Google OAuth
│   ├── google-ads-client.js  # Google Ads API
│   └── helpers.js            # Helper functions
├── public/
│   └── js/
│       └── tracker.js        # Client-side tracking script
├── db.sql                    # Database schema
└── README.md
```

## 🔐 Güvenlik

- Environment variables `.gitignore`'da
- Supabase RLS (Row Level Security) kullanılmalı
- API rate limiting uygulanmalı
- CORS ayarları yapılmalı
- HTTPS kullanılmalı (production)

## 📝 TODO / Roadmap

- [ ] Supabase RLS policies ekle
- [ ] Analytics dashboard geliştir
- [ ] Email bildirimleri
- [ ] Webhook entegrasyonları
- [ ] Advanced bot detection (ML)
- [ ] White-label support
- [ ] API key yönetimi
- [ ] Multi-language support

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje özel bir projedir. Ticari kullanım için izin gereklidir.

## 📧 İletişim

Sorularınız için: support@adsguardpro.com

---

Made with ❤️ by AdsGuardPro Team
