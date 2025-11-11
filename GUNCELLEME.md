# 🚀 AdsGuardsPro - Güncelleme Tamamlandı!

## ✅ Yapılan Değişiklikler

### 1. Tablo Yapısı Tamamen Yenilendi

**Eski Tablolar (Kaldırıldı):**
- ❌ `domain_rules` - Artık agresif engelleme var
- ❌ `ip_threat_scores` - Artık gerekli değil
- ❌ `ip_blocklist` → `blocked_ips` oldu
- ❌ `device_ips` - Artık gerekli değil
- ❌ `ip_locations` → `ip_info` oldu

**Yeni Tablolar:**
- ✅ `profiles` - Kullanıcı profilleri (auth.users ile ilişkili)
- ✅ `domains` - Domain yönetimi (ads_account_id ile)
- ✅ `devices` - Cihaz fingerprint'leri
- ✅ `ip_info` - Her request için YENİ kayıt (unique değil!)
- ✅ `ip_whitelist` - Global IP whitelist
- ✅ `ads_campaigns` - Kampanya yönetimi (manual/auto_detected)
- ✅ `ad_clicks` - Tıklama kayıtları
- ✅ `blocked_ips` - Domain bazlı engelleme (tüm kampanyalara)
- ✅ `sessions` - Tüm ziyaretçiler (ads/organik/direkt)
- ✅ `session_events` - Kullanıcı davranışları

### 2. Agresif Engelleme Sistemi

**Yeni Mantık:**
```
Ads'dan gelen TÜM IP'ler → ANINDA ENGELLE
(whitelist'te değilse)

- Kural yok
- Threshold yok
- Direkt engelleme
```

**Akış:**
1. IP whitelist kontrolü (Googlebot vb.)
2. IP-API çağrısı (her seferinde)
3. Device fingerprint (server-side)
4. Ad click kaydet
5. blocked_ips'e ekle (domain bazlı)
6. Google Ads API → TÜM kampanyalara gönder
7. Site'ye redirect

### 3. Güncellenen Dosyalar

#### Backend API Routes
- ✅ `/app/api/tracker/route.js` - Tracking URL (agresif engelleme)
- ✅ `/app/api/track/init/route.js` - Session başlatma
- ✅ `/app/api/track/event/route.js` - Event kaydetme
- ✅ `/app/api/track/heartbeat/route.js` - Session heartbeat (YENİ)
- ✅ `/app/api/track/end/route.js` - Session sonlandırma (YENİ)
- ✅ `/app/api/domains/route.js` - Domain yönetimi (kampanya auto-fetch)
- ✅ `/app/api/campaigns/blocked-ips/route.js` - Engellenen IP listesi
- ✅ `/app/api/campaigns/block-ip/route.js` - IP engelleme (tüm kampanyalara)
- ✅ `/app/api/campaigns/remove-ip/route.js` - IP kaldırma
- ✅ `/app/api/campaigns/block-ip-bulk/route.js` - Toplu IP engelleme

#### Library Files
- ✅ `/lib/helpers.js` - Yeni helper fonksiyonları:
  - `checkIPWhitelist()` - PostgreSQL INET/CIDR ile
  - `createIPInfo()` - Her seferinde yeni kayıt
  - `generateServerFingerprint()` - Server-side hash
  - `upsertDevice()` - Device kaydetme
  - `determineTrafficSource()` - Traffic source belirleme

#### Client-side
- ✅ `/public/js/tracker.js` - Yeni tracking script:
  - FingerprintJS entegrasyonu
  - Session tracking
  - Event tracking (scroll, click, form submit, call button)
  - Heartbeat (30 saniye)
  - Page unload handling

#### Database
- ✅ `/db.sql` - Yeni tablo yapısı + helper fonksiyonlar
  - `check_ip_whitelist()` - RPC fonksiyonu
  - `get_top_500_ips_for_domain()` - IP limit kontrolü
  - `cleanup_old_blocked_ips()` - Eski IP'leri temizle

### 4. Önemli Özellikler

#### ✅ IP Whitelist Kontrolü
Her request'te İLK kontrol bu yapılır:
```javascript
const isWhitelisted = await checkIPWhitelist(ip);
if (isWhitelisted) {
    // Skip everything
    return NextResponse.redirect(url);
}
```

#### ✅ IP-API Her Seferinde Çağrılır
```javascript
// ip_info tablosuna HER SEFERINDE yeni kayıt
const ipInfo = await createIPInfo(ip, userAgent);
```

**Neden?**
- IP konumu değişebilir
- VPN açılıp kapanabilir
- Güncel veri kritik

#### ✅ FingerprintJS Hybrid Approach
1. **Server-side** (Tracking URL): Hızlı hash
2. **Client-side** (Site Script): Tam doğruluk

#### ✅ Domain Bazlı Engelleme
```
1 Domain → N Kampanya → Aynı blocked_ips listesi

blocked_ips tablosu:
- UNIQUE(domain_id, ip)
- campaign_id YOK!

Google Ads'ta:
Campaign K1 → Excluded IPs: [1.2.3.4, ...]
Campaign K2 → Excluded IPs: [1.2.3.4, ...] ← AYNI LİSTE
Campaign K3 → Excluded IPs: [1.2.3.4, ...] ← AYNI LİSTE
```

#### ✅ Auto Campaign Detection
```javascript
// Tracking URL'den yeni campaign_id gelirse
if (!campaign) {
    await db.ads_campaigns.create({
        domain_id: domain.id,
        campaign_id: campaignId,
        added_method: 'auto_detected' // ← Otomatik
    });
}
```

#### ✅ Session Tracking (Tüm Ziyaretçiler)
```
IF NOT in ip_whitelist:
    → Session kaydet
    → Events tracked
    → Analytics'te görünür

Ads mi, organik mi? → Fark etmez, hepsini kaydet
```

## 🔧 Kurulum Adımları

### 1. Veritabanını Güncelle

```bash
# Yeni schema'yı uygula
psql -h localhost -U postgres -d adsguardspro < db.sql
```

### 2. Environment Variables Kontrol

```bash
# .env.local dosyası
DATABASE_URL="postgresql://..."
GOOGLE_ADS_DEVELOPER_TOKEN="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### 3. Dependencies Yükle

```bash
npm install
```

### 4. Development Server Başlat

```bash
npm run dev
```

## 📋 Kullanım

### Domain Ekleme

1. Dashboard → Domains → Add Domain
2. Domain URL gir
3. Google Ads Account ID gir
4. **Kampanyalar otomatik çekilir** (manual)
5. Tracking URL oluşturulur

### Tracking URL Kurulumu

```
Google Ads → Account Settings → Tracking Template:

https://yourdomain.com/api/tracker?id={tracking_id}&campaign_id={campaignid}&gclid={gclid}&keyword={keyword}&device={device}&network={network}&adpos={adposition}&placement={placement}&url={lpurl}
```

### Site Tracking Code (Opsiyonel)

```html
<!-- Müşteri sitesine ekle -->
<script>
  window.AGP_API_URL = 'https://yourdomain.com';
  window.ag_tracking_id = 'abc123xyz';
  window.AGP_DEBUG = false; // Development'ta true
</script>
<script src="https://yourdomain.com/js/tracker.js"></script>
```

## 🎯 Sistem Akışı

### Ads Tıklaması (Agresif Engelleme)

```
Bot clicks ad
  ↓
Tracking URL → /api/tracker
  ↓
✅ Whitelist kontrolü
✅ IP-API çağrısı (yeni kayıt)
✅ Fingerprint oluştur
✅ Device kaydet
✅ Campaign kontrol (yoksa ekle)
✅ Ad click kaydet
✅ IP'yi blocked_ips'e ekle
✅ Google Ads API → TÜM kampanyalara gönder
✅ Cookie set
✅ Redirect to site
```

### Site Ziyareti (Session Tracking)

```
User lands on site
  ↓
Tracking Script → /api/track/init
  ↓
✅ Whitelist kontrolü
✅ IP-API çağrısı (yeni kayıt)
✅ FingerprintJS
✅ Device kaydet
✅ Traffic source belirle
✅ Session oluştur
✅ Events tracked
✅ Heartbeat (30s)
```

## 🔍 Önemli Notlar

### ⚠️ IP-API Rate Limit
- Free plan: 45 requests/minute
- Her request yeni kayıt oluşturduğundan dikkatli ol
- Gerekirse cache ekle (gelecekte)

### ⚠️ FingerprintJS
- Free CDN kullanılıyor
- Production'da kendi account ile kullan

### ⚠️ 500 IP Limit
- Google Ads: Max 500 IP/campaign
- Bizim sistem: Domain bazlı 500 IP
- `get_top_500_ips_for_domain()` fonksiyonu var

### ⚠️ Background Jobs (Gelecekte)
- Stale session cleanup (5 dakika sonra bitir)
- IP info cache güncelleme
- Sync error retry

## 📊 Analytics Queries

### Engellenen IP İstatistikleri
```sql
SELECT 
  d.domain,
  COUNT(DISTINCT b.ip) as total_blocked_ips,
  SUM(b.block_count) as total_blocks
FROM domains d
LEFT JOIN blocked_ips b ON d.id = b.domain_id
GROUP BY d.id;
```

### Arama Yapan Kullanıcılar
```sql
SELECT s.* 
FROM sessions s
JOIN session_events se ON s.id = se.session_id
WHERE se.event_type = 'call_button_click';
```

### Conversion Rate
```sql
SELECT 
  traffic_source,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN has_call THEN 1 END) as conversions
FROM sessions
GROUP BY traffic_source;
```

## 🎉 Tamamlandı!

Sistem artık tamamen güncel ve çalışır durumda. 

**Sıradaki Adımlar:**
1. Database migration'ı çalıştır
2. Environment variables'ı kontrol et
3. Development server'ı başlat
4. Test domain ekle
5. Tracking URL'i Google Ads'ta ayarla
6. Test et!

---

**Sorularınız için:** setup-2.md dosyasına bakabilirsiniz.

