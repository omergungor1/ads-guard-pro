# 🚀 AdsGuardsPro - Hızlı Başlangıç

## ✅ 1. Database Migration Çalıştır

```bash
# Database bağlantı bilgilerini ayarla
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_NAME=adsguardspro

# Migration'ı çalıştır
./migrate.sh
```

VEYA manuel:

```bash
psql -h localhost -U postgres -d adsguardspro < db.sql
```

## ✅ 2. Environment Variables

`.env.local` dosyası oluştur:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/adsguardspro"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"

# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN="your-developer-token"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## ✅ 3. Dependencies

```bash
npm install
```

## ✅ 4. Development Server

```bash
npm run dev
```

Tarayıcıda aç: http://localhost:3000

## ✅ 5. İlk Kurulum

### 5.1. Google Ads Hesabını Bağla

1. Settings → Google Ads bağlantısı
2. MCC hesabı ile giriş yap
3. İzinleri onayla

### 5.2. Domain Ekle

1. Domains → Add Domain
2. Domain URL: `example.com`
3. Google Ads Account ID: `123-456-7890`
4. Save

**Kampanyalar otomatik çekilir!**

### 5.3. Tracking URL'i Google Ads'ta Ayarla

Tracking Template URL'i kopyala ve Google Ads'ta ayarla:

```
Google Ads → Account Settings → Tracking → Tracking Template
```

Template:
```
https://yourdomain.com/api/tracker?id={tracking_id}&campaign_id={campaignid}&gclid={gclid}&keyword={keyword}&device={device}&network={network}&adpos={adposition}&placement={placement}&url={lpurl}
```

✅ **Sistem artık aktif!** Ads'a tıklayan her IP anında engellenir.

### 5.4. (Opsiyonel) Site Tracking Code Ekle

Müşteri sitesine ekle (analytics için):

```html
<!-- HEAD içine -->
<script>
  window.AGP_API_URL = 'https://yourdomain.com';
  window.AGP_TRACKING_ID = 'your-tracking-id';
</script>
<script src="https://yourdomain.com/js/tracker.js"></script>
```

## 📋 Sistem Akışı

### Ads Tıklaması → Anında Engelleme

```
1. Bot clicks Google Ad
2. Tracking URL → /api/tracker
3. ✅ Whitelist check (Googlebot hariç)
4. ✅ IP-API çağrısı (konum/tehdit bilgisi)
5. ✅ Fingerprint oluştur
6. ✅ Device kaydet
7. ✅ Campaign kontrol (yoksa otomatik ekle)
8. ✅ Ad click kaydet
9. 🚫 IP'yi blocked_ips'e ekle
10. 📤 Google Ads API → TÜM kampanyalara gönder
11. ✅ Redirect to site
```

### Site Ziyareti → Session Tracking

```
1. User lands on site
2. Tracking script → /api/track/init
3. ✅ FingerprintJS
4. ✅ Session başlat
5. ✅ Events track (scroll, click, call button)
6. ✅ Heartbeat (30s)
7. ✅ Session end on page close
```

## 🎯 Özellikler

### ✅ Agresif Engelleme
- Ads'dan gelen TÜM IP'ler → Anında engelle
- Kural yok, threshold yok
- Whitelist (Googlebot vb.) hariç

### ✅ Domain Bazlı Engelleme
- 1 Domain → N Kampanya
- Bir IP engellendi mi? → TÜM kampanyalardan engellenir

### ✅ Auto Campaign Detection
- Tracking URL'den yeni kampanya geldi mi?
- Otomatik ads_campaigns tablosuna ekle
- added_method: 'auto_detected'

### ✅ Universal Session Tracking
- Ads traffic ✅
- Organic traffic ✅
- Direct traffic ✅
- Tüm ziyaretçiler tracked (whitelist hariç)

### ✅ Event Tracking
- page_view
- scroll (her %25)
- click
- call_button_click (ARA butonu!)
- form_submit
- conversion

## 📊 Tablolar

### Core Tables
- `profiles` - Kullanıcı profilleri
- `domains` - Domain yönetimi
- `ads_campaigns` - Kampanyalar (manual/auto)
- `blocked_ips` - Engellenen IP'ler (domain bazlı)

### Tracking Tables
- `ad_clicks` - Ads tıklamaları
- `sessions` - Kullanıcı oturumları
- `session_events` - Kullanıcı olayları
- `devices` - Device fingerprint'ler
- `ip_info` - IP bilgileri (her request yeni kayıt!)

### System Tables
- `ip_whitelist` - Global whitelist (Googlebot vb.)
- `google_oauth_tokens` - MCC hesap bilgileri

## 🔍 Önemli Notlar

### ⚠️ IP-API Rate Limit
- Free: 45 req/min
- Her request → yeni ip_info kaydı
- Gerekirse cache ekle (gelecekte)

### ⚠️ 500 IP Limit
- Google Ads: Max 500 IP/campaign
- Sistem: Domain bazlı 500 IP
- `get_top_500_ips_for_domain()` fonksiyonu ile kontrol

### ⚠️ Whitelist
- Her request'te İLK kontrol
- Googlebot, Bingbot vb. otomatik whitelist'te
- Custom IP eklenebilir

## 📁 Önemli Dosyalar

### Backend
- `/app/api/tracker/route.js` - Tracking URL (agresif engelleme)
- `/app/api/track/init/route.js` - Session başlatma
- `/app/api/domains/route.js` - Domain yönetimi
- `/app/api/campaigns/*` - Campaign API'leri

### Library
- `/lib/helpers.js` - Helper fonksiyonlar
- `/lib/google-ads-client-official.js` - Google Ads API

### Client
- `/public/js/tracker.js` - Site tracking script

### Database
- `/db.sql` - Schema + helper fonksiyonlar
- `/migrate.sh` - Migration script

## 🎉 Hazırsınız!

Artık sistem tamamen çalışır durumda. Test edin ve botları engelleyin! 🚀

---

**Daha fazla bilgi için:**
- `GUNCELLEME.md` - Detaylı değişiklikler
- `setup-2.md` - Tam proje dokümantasyonu

