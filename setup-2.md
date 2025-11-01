# AdsGuardsPro MVP - Tam Proje Dokümantasyonu

## 🎯 Proje Amacı

**AdsGuardsPro**, Google Ads reklamlarına tıklayan botları ve zararlı IP'leri tespit edip **anında engelleyen** bir sistemdir. Acil servis işletmeleri (tesisatçı, elektrikçi, vb.) için optimize edilmiştir.

### Temel Prensipler:
1. **Agresif Engelleme**: Ads'dan gelen her IP → Anında engelle
2. **Universal Tracking**: Tüm ziyaretçilerin (ads/organik) davranışlarını kaydet
3. **Real-time Protection**: Background job yok, anında Google Ads API'ye gönder

---

## 📊 Tablo Yapısı ve Görevleri

### **1. profiles** - Kullanıcı Hesapları
```
Görev: Sistemi kullanan müşterilerin hesapları
Kim: Acil servis işletme sahipleri, ajanslar

Örnek:
- Ahmet Bey: Tesisatçı, 1 domain
- X Ajansı: 5 müşteri, 5 domain
```

### **2. domains** - Korunacak Web Siteleri
```
Görev: Müşterilerin web siteleri
İçerik:
- domain: "tesisatcim.com"
- tracking_id: "abc123" (benzersiz, tracking script'te kullanılır)
- ads_account_id: "123-456-7890" (Google Ads hesap ID)

Örnek:
- tesisatcim.com → tracking_id: "abc123" → Ads Account: 123-456-7890
```

### **3. devices** - Cihaz Parmak İzleri (FingerprintJS)
```
Görev: Benzersiz cihazları tanımla
Nasıl: FingerprintJS ile tarayıcı parmak izi

Veri:
- fingerprint_id: "fp_a1b2c3d4e5f6" (benzersiz)
- device_type: "desktop" / "mobile"
- os: "Windows 10", "iOS 15"
- browser: "Chrome 120", "Safari 17"

Neden Önemli:
Bir bot 100 farklı IP kullanabilir ama AYNI cihazdan geliyorsa tespit edilir.

Örnek:
Device fp_abc123:
- 10:00 → IP: 1.2.3.4
- 10:30 → IP: 5.6.7.8
- 11:00 → IP: 9.10.11.12
→ Aynı device, 3 farklı IP = ŞÜPHELİ!
```

### **4. ip_info** - IP Bilgisi Deposu
```
Görev: Her gelen IP'nin konum ve tehdit bilgilerini sakla
Özellik: HER REQUEST YENİ KAYIT OLUŞTURUR (UNIQUE DEĞİL!)

Neden Unique Değil:
- IP konumu değişebilir (bugün İstanbul, yarın Ankara)
- VPN açılıp kapanabilir
- Hosting IP'si ev kullanıcısına atanabilir
→ Her seferinde IP-API çağır, güncel bilgiyi al

Veri Kaynağı: ip-api.com
Request: http://ip-api.com/json/203.0.113.50?fields=...

Response → Kaydet:
{
  ip: "203.0.113.50",
  country_code: "TR",
  city: "Istanbul",
  district: "Kadıköy",
  isp: "Turk Telekom",
  is_mobile: false,
  is_vpn: false,
  is_proxy: false,
  is_hosting: true,  // Data center IP!
  browser: "Chrome 120",
  user_agent: "Mozilla/5.0...",
  lat: 41.0082,
  lon: 28.9784
}

Hata Yönetimi:
IF IP-API fails:
{
  api_error: true,
  api_error_code: "429",
  api_error_message: "Rate limit exceeded"
}
```

### **5. ip_whitelist** - Güvenli IP Listesi (Global)
```
Görev: Asla engellenmemesi gereken IP'ler
İçerik:
- Googlebot (SEO için kritik!)
- Bingbot
- Diğer search engine crawler'ları

Kontrol: HER REQUEST'TE İLK KONTROL BU!

IF ip IN ip_whitelist:
  → Skip everything (no tracking, no blocking)
  → Redirect immediately

Örnek:
66.249.64.0/19 → Googlebot range
→ Bu IP'den gelen request → Hiçbir şey yapma
```

### **6. ads_campaigns** - Google Ads Kampanyaları
```
Görev: Domain'e ait kampanyaları takip et

İki Ekleme Yöntemi:

1. MANUAL (İlk Kurulum):
User adds domain → Google Ads API call → Fetch all campaigns
INSERT campaigns (added_method='manual')

2. AUTO_DETECTED (Tracking URL):
New campaign_id comes from tracking URL → Auto insert
INSERT campaign (added_method='auto_detected')

Örnek:
Domain: tesisatcim.com
Campaigns:
- K1: "Acil Tesisat İstanbul" (manual)
- K2: "Su Kaçağı Tamiri" (manual)
- K3: "Yeni Test Kampanyası" (auto_detected) ← Tracking URL'den geldi

Neden Gerekli:
- Yeni kampanya eklendiğinde tespit et
- Tüm kampanyalara aynı IP listesini gönder
```

### **7. ad_clicks** - Ads Tıklama Kayıtları
```
Görev: Tracking URL'den gelen her tıklamayı logla
Veri: Google Ads'dan gelen TÜM parametreler

Raw Params (JSON):
{
  "gclid": "EAIaIQobChMI...",
  "campaign_id": "123456",
  "keyword": "acil tesisat istanbul",
  "ad_position": "1t1",
  "device": "mobile",
  "network": "search",
  "placement": "google.com",
  "loc_physical_ms": "1012782",
  "loc_interest_ms": "1012782"
}

Kullanım Alanları:
- Analytics: Hangi keyword'den bot geliyor?
- Pattern Detection: Aynı placement'tan çok tıklama
- Cost Analysis: Hangi kampanyadan para kaybediyoruz?
```

### **8. blocked_ips** - Engellenen IP'ler (CORE!)
```
Görev: Engellenen IP'leri domain bazlı sakla

ÇOK ÖNEMLİ: 
- UNIQUE(domain_id, ip)
- campaign_id YOK!
→ Bir IP engellendiyse, domain'in TÜM kampanyalarından engellenir

500 IP Limit Mantığı:
Google Ads: Her kampanya max 500 IP
Bizim Sistem: Domain bazlı 500 IP

Örnek:
Domain: tesisatcim.com (3 kampanya)
Blocked IP: 1.2.3.4

Google Ads'ta:
Campaign K1 → Excluded IPs: [1.2.3.4, ...]
Campaign K2 → Excluded IPs: [1.2.3.4, ...]
Campaign K3 → Excluded IPs: [1.2.3.4, ...]

blocked_ips tablosu:
domain_id | ip        | synced_to_ads
uuid-123  | 1.2.3.4   | true

Sync Durumu:
- synced_to_ads = false: Henüz Google Ads'a gönderilmedi
- synced_to_ads = true: Gönderildi
- sync_error: Varsa hata mesajı
```

### **9. sessions** - Kullanıcı Oturumları
```
Görev: TÜM ziyaretçilerin (ads/organik) oturumlarını kaydet

Whitelist Hariç Herkes:
- Ads'dan gelen → is_ad_traffic = true
- Organik → is_ad_traffic = false
- Direct → is_ad_traffic = false

Veri:
- started_at: Oturum başlangıcı
- last_activity_at: Son aktivite (heartbeat ile güncellenir)
- ended_at: Oturum bitişi
- duration_seconds: Toplam süre

Browser Bilgisi:
- browser: "Chrome 120"
- user_agent: "Mozilla/5.0..."

Traffic Source:
- google_ads: Ads'dan geldi
- organic: Google organik
- direct: Direkt URL yazarak
- referral: Başka siteden
- social: Facebook, Instagram vb.

Örnek:
Session 1 (Ads Traffic):
- is_ad_traffic: true
- ad_click_id: uuid-789
- duration: 45 saniye
- traffic_source: google_ads

Session 2 (Organic):
- is_ad_traffic: false
- ad_click_id: null
- duration: 320 saniye
- traffic_source: organic
```

### **10. session_events** - Kullanıcı Davranışları
```
Görev: Session içinde olan HER OLAYI kaydet

Event Types:
- page_view: Yeni sayfa görüntülendi
- scroll: Kullanıcı scroll yaptı
- click: Herhangi bir tıklama
- button_click: Buton tıklaması
- call_button_click: ARA butonuna tıkladı! (ÖNEMLI!)
- form_submit: Form gönderildi
- conversion: Conversion (satış, lead)

Örnek: İyi Kullanıcı
[
  { event: "page_view", time: "10:00:00" },
  { event: "scroll", time: "10:00:03", scroll_percent: 25 },
  { event: "scroll", time: "10:00:08", scroll_percent: 50 },
  { event: "click", time: "10:00:15", target: "img.product" },
  { event: "page_view", time: "10:00:16", page: "/hizmetler" },
  { event: "scroll", time: "10:00:20", scroll_percent: 75 },
  { event: "call_button_click", time: "10:00:45" },  // ARAMA YAPTI!
]

Örnek: Bot
[
  { event: "page_view", time: "10:00:00" },
  { event: "click", time: "10:00:01", click_x: 100, click_y: 100 },
  { event: "click", time: "10:00:01.5", click_x: 200, click_y: 200 },
  { event: "click", time: "10:00:02", click_x: 300, click_y: 300 },
  // 2 saniyede 3 click, scroll yok → BOT!
]
```

---

## 🔄 Sistem Akışı - Detaylı

### **AKIŞ 1: Tracking URL Setup (İlk Kurulum)**

```
┌────────────────────────────────────────────────────────────┐
│ Kullanıcı (Tesisatçı Ahmet) sisteme kayıt oldu             │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ 1. Profile oluşturuldu                                     │
│    profiles:                                               │
│    - id: user-123                                          │
│    - full_name: "Ahmet Yılmaz"                             │
│    - email: "ahmet@tesisatcim.com"                         │
│    - max_domains: 1                                        │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ 2. Domain ekledi                                           │
│    domains:                                                │
│    - id: domain-456                                        │
│    - profile_id: user-123                                  │
│    - domain: "tesisatcim.com"                              │
│    - tracking_id: "abc123xyz" (otomatik üretildi)          │
│    - ads_account_id: "123-456-7890" (Ahmet'in Ads hesabı)  │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ 3. Google Ads API ile kampanyalar çekildi                 │
│                                                            │
│    Google Ads API Request:                                │
│    GET campaigns WHERE account_id = "123-456-7890"        │
│                                                            │
│    Response: [                                             │
│      { id: "camp-1", name: "Acil Tesisat İstanbul" },     │
│      { id: "camp-2", name: "Su Kaçağı Tamiri" }           │
│    ]                                                       │
│                                                            │
│    ads_campaigns:                                          │
│    - domain_id: domain-456                                 │
│      campaign_id: "camp-1"                                 │
│      campaign_name: "Acil Tesisat İstanbul"               │
│      added_method: 'manual'                                │
│                                                            │
│    - domain_id: domain-456                                 │
│      campaign_id: "camp-2"                                 │
│      campaign_name: "Su Kaçağı Tamiri"                     │
│      added_method: 'manual'                                │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ 4. Tracking URL oluşturuldu                                │
│                                                            │
│    Template:                                               │
│    https://tesisatcim.com/api/tracker?                     │
│      id={tracking_id}&                                     │
│      campaign_id={campaignid}&                             │
│      gclid={gclid}&                                        │
│      keyword={keyword}&                                    │
│      device={device}&                                      │
│      network={network}&                                    │
│      adpos={adposition}&                                   │
│      placement={placement}&                                │
│      url={lpurl}                                           │
│                                                            │
│    Gerçek URL:                                             │
│    https://tesisatcim.com/api/tracker?                     │
│      id=abc123xyz&                                         │
│      campaign_id={campaignid}&...                          │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ 5. Google Ads'ta Tracking Template ayarlandı              │
│                                                            │
│    Google Ads → Account Settings → Tracking Template      │
│    [Paste URL above]                                       │
│    [Save]                                                  │
│                                                            │
│    ✅ SİSTEM ARTIK AKTİF!                                   │
│    Ads'a tıklayan HER IP → Tespit edilip engellenir       │
└────────────────────────────────────────────────────────────┘
```

---

### **AKIŞ 2: Bot Tıkladı - Anında Engelleme**

```
┌────────────────────────────────────────────────────────────┐
│ Bot Google Ads'a tıkladı                                   │
│ Keyword: "acil tesisat istanbul"                           │
│ IP: 203.0.113.50                                           │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ Google Ads Redirect:                                       │
│ GET https://tesisatcim.com/api/tracker?                    │
│   id=abc123xyz&                                            │
│   campaign_id=camp-1&                                      │
│   gclid=EAIaIQobChMI...&                                   │
│   keyword=acil+tesisat+istanbul&                           │
│   device=mobile&                                           │
│   network=search&                                          │
│   adpos=1t1&                                               │
│   placement=google.com&                                    │
│   url=https://tesisatcim.com                               │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ Backend: /api/tracker Handler (NextJS API Route)          │
│                                                            │
│ export default async function handler(req, res) {         │
│                                                            │
│   // ────────────────────────────────────────────────     │
│   // STEP 1: Extract Data                                 │
│   // ────────────────────────────────────────────────     │
│   const trackingId = req.query.id;  // "abc123xyz"        │
│   const campaignId = req.query.campaign_id; // "camp-1"   │
│   const ip = req.headers['x-forwarded-for'];              │
│              // "203.0.113.50"                             │
│   const userAgent = req.headers['user-agent'];            │
│   const allParams = req.query;  // Tüm parametreler       │
│                                                            │
│   // ────────────────────────────────────────────────     │
│   // STEP 2: Get Domain                                   │
│   // ────────────────────────────────────────────────     │
│   const domain = await db.domains.findUnique({            │
│     where: { tracking_id: trackingId }                    │
│   });                                                      │
│   // domain-456                                           │
│                                                            │
│   if (!domain) {                                          │
│     return res.redirect(req.query.url); // Geçersiz ID    │
│   }                                                        │
│                                                            │
│   // ────────────────────────────────────────────────     │
│   // STEP 3: Check IP Whitelist (FIRST!)                  │
│   // ────────────────────────────────────────────────     │
│   const isWhitelisted = await db.$queryRaw`               │
│     SELECT 1 FROM ip_whitelist                            │
│     WHERE is_active = true                                │
│       AND (                                               │
│         ip = ${ip}::inet                                  │
│         OR ${ip}::inet <<= ip_range                       │
│       )                                                    │
│     LIMIT 1                                               │
│   `;                                                       │
│                                                            │
│   if (isWhitelisted.length > 0) {                         │
│     // Googlebot gibi bot → Skip everything              │
│     return res.redirect(req.query.url);                   │
│   }                                                        │
│                                                            │
│   // ────────────────────────────────────────────────     │
│   // STEP 4: Call IP-API (Her Seferinde!)                 │
│   // ────────────────────────────────────────────────     │
│   let ipApiData;                                          │
│   let apiError = false;                                   │
│   let apiErrorMsg = null;                                 │
│                                                            │
│   try {                                                    │
│     const response = await fetch(                         │
│       `http://ip-api.com/json/${ip}?fields=` +            │
│       `status,message,country,countryCode,` +             │
│       `city,district,zip,lat,lon,isp,` +                  │
│       `mobile,proxy,hosting`                              │
│     );                                                     │
│     ipApiData = await response.json();                    │
│                                                            │
│     if (ipApiData.status === 'fail') {                    │
│       apiError = true;                                    │
│       apiErrorMsg = ipApiData.message;                    │
│     }                                                      │
│   } catch (error) {                                       │
│     apiError = true;                                      │
│     apiErrorMsg = error.message;                          │
│     ipApiData = {};  // Empty object                      │
│   }                                                        │
│                                                            │
│   // ────────────────────────────────────────────────     │
│   // STEP 5: Insert ip_info (HER SEFERINDE YENİ KAYIT!)   │
│   // ────────────────────────────────────────────────     │
│   const ipInfo = await db.ip_info.create({                │
│     data: {                                               │
│       ip: ip,                                             │
│       country_code: ipApiData.countryCode || null,        │
│       city: ipApiData.city || null,                       │
│       district: ipApiData.district || null,               │
│       zip: ipApiData.zip || null,                         │
│       lat: ipApiData.lat || null,                         │
│       lon: ipApiData.lon || null,                         │
│       isp: ipApiData.isp || null,                         │
│       is_mobile: ipApiData.mobile || false,               │
│       is_vpn: ipApiData.proxy || false,                   │
│       is_proxy: ipApiData.proxy || false,                 │
│       is_hosting: ipApiData.hosting || false,             │
│       browser: parseBrowser(userAgent),                   │
│       user_agent: userAgent,                              │
│       api_error: apiError,                                │
│       api_error_code: apiError ? 'FAIL' : null,           │
│       api_error_message: apiErrorMsg                      │
│     }                                                      │
│   });                                                      │
│   // ip_info_id: "ipinfo-789"                             │
│                                                            │
│   // ────────────────────────────────────────────────     │
│   // STEP 6: Generate Server-Side Fingerprint             │
│   // ────────────────────────────────────────────────     │
│   const fingerprint = createHash('sha256')                │
│     .update(ip + userAgent + req.headers['accept-language'])│
│     .digest('hex')                                        │
│     .substring(0, 16);                                    │
│   const fingerprintId = `fp_${fingerprint}`;              │
│   // "fp_a1b2c3d4e5f6g7h8"                                │
│                                                            │
│   // ────────────────────────────────────────────────     │
│   // STEP 7: Get or Create Device                         │
│   // ────────────────────────────────────────────────     │
│   let device = await db.devices.findUnique({              │
│     where: { fingerprint_id: fingerprintId }              │
│   });                                                      │
│                                                            │
│   if (!device) {                                          │
│     const deviceInfo = parseUserAgent(userAgent);         │
│     device = await db.devices.create({                    │
│       data: {                                             │
│         fingerprint_id: fingerprintId,                    │
│         device_type: deviceInfo.type,  // 'mobile'        │
│         os: deviceInfo.os,  // 'Android 12'               │
│         browser: deviceInfo.browser  // 'Chrome Mobile'   │
│       }                                                    │
│     });                                                    │
│   }                                                        │
│   // device_id: "device-111"                              │
│                                                            │
│   // ────────────────────────────────────────────────     │
│   // STEP 8: Check/Create Campaign                        │
│   // ────────────────────────────────────────────────     │
│   let campaign = await db.ads_campaigns.findUnique({      │
│     where: {                                              │
│       domain_id_campaign_id: {                            │
│         domain_id: domain.id,                             │
│         campaign_id: campaignId                           │
│       }                                                    │
│     }                                                      │
│   });                                                      │
│                                                            │
│   if (!campaign) {                                        │
│     // YENİ KAMPANYA TESPİT EDİLDİ!                       │
│     campaign = await db.ads_campaigns.create({            │
│       data: {                                             │
│         domain_id: domain.id,                             │
│         campaign_id: campaignId,                          │
│         campaign_name: null,  // Sonra API'den çek        │
│         added_method: 'auto_detected'  // ← ÖNEMLİ!       │
│       }                                                    │
│     });                                                    │
│   }                                                        │
│                                                            │
│   // ────────────────────────────────────────────────     │
│   // STEP 9: Log Ad Click                                 │
│   // ────────────────────────────────────────────────     │
│   const adClick = await db.ad_clicks.create({             │
│     data: {                                               │
│       domain_id: domain.id,                               │
│       campaign_id: campaignId,                            │
│       ip_info_id: ipInfo.id,                              │
│       device_id: device.id,                               │
│       gclid: req.query.gclid,                             │
│       keyword: req.query.keyword,                         │
│       ad_position: req.query.adpos,                       │
│       device_type: req.query.device,                      │
│       network: req.query.network,                         │
│       placement: req.query.placement,                     │
│       raw_params: allParams  // Full JSON                 │
│     }                                                      │
│   });                                                      │
│   // ad_click_id: "adclick-222"                           │
│                                                            │
│   // ────────────────────────────────────────────────     │
│   // STEP 10: BLOCK IP (Domain bazlı)                     │
│   // ────────────────────────────────────────────────     │
│   const blockedIp = await db.blocked_ips.upsert({         │
│     where: {                                              │
│       domain_id_ip: {                                     │
│         domain_id: domain.id,                             │
│         ip: ip                                            │
│       }                                                    │
│     },                                                     │
│     create: {                                             │
│       domain_id: domain.id,                               │
│       ip: ip,                                             │
│       ip_info_id: ipInfo.id,                              │
│       device_id: device.id,                               │
│       block_count: 1,                                     │
│       synced_to_ads: false                                │
│     },                                                     │
│     update: {                                             │
│       block_count: { increment: 1 },                      │
│       last_seen_at: new Date()                            │
│     }                                                      │
│   });                                                      │
│                                                            │
│   // ────────────────────────────────────────────────     │
│   // STEP 11: Google Ads API - ANINDA ENGELLE!            │
│   // ────────────────────────────────────────────────     │
│   try {                                                    │
│     // Tüm kampanyaları al                                │
│     const allCampaigns = await db.ads_campaigns.findMany({│
│       where: {                                            │
│         domain_id: domain.id,                             │
│         is_active: true                                   │
│       }                                                    │
│     });                                                    │
│                                                            │
│     // Her kampanyaya IP'yi ekle                          │
│     for (const camp of allCampaigns) {                    │
│       await googleAdsAPI.addIPExclusion({                 │
│         customerId: domain.ads_account_id,                │
│         campaignId: camp.campaign_id,                     │
│         ipAddress: ip                                     │
│       });                                                  │
│     }                                                      │
│                                                            │
│     // Başarılı → synced = true                           │
│     await db.blocked_ips.update({                         │
│       where: { id: blockedIp.id },                        │
│       data: {                                             │
│         synced_to_ads: true,                              │
│         synced_at: new Date()                             │
│       }                                                    │
│     });                                                    │
│                                                            │
│     // Campaign last_sync güncelle                        │
│     await db.ads_campaigns.updateMany({                   │
│       where: { domain_id: domain.id },                    │
│       data: { last_sync_at: new Date() }                  │
│     });                                                    │
│                                                            │
│   } catch (error) {                                       │
│     // Hata → sync_error kaydet                           │
│     await db.blocked_ips.update({                         │
│       where: { id: blockedIp.id },                        │
│       data: {                                             │
│         sync_error: error.message                         │
│       }                                                    │
│     });                                                    │
│   }                                                        │
│                                                            │
│   // ────────────────────────────────────────────────     │
│   // STEP 12: Set Cookie (Site script için)               │
│   // ────────────────────────────────────────────────     │
│   const clickId = nanoid(32);                             │
│   res.setHeader('Set-Cookie', [                           │
│     `cc_click_id=${clickId}; ` +                          │
│       `Path=/; Max-Age=86400; SameSite=Lax`,              │
│     `cc_ad_click_id=${adClick.id}; ` +                    │
│       `Path=/; Max-Age=86400; SameSite=Lax`,              │
│     `cc_fingerprint=${fingerprintId}; ` +                 │
│       `Path=/; Max-Age=86400; SameSite=Lax`               │
│   ]);                                                      │
│                                                            │
│   // ────────────────────────────────────────────────     │
│   // STEP 13: Redirect to Site                            │
│   // ────────────────────────────────────────────────     │
│   res.redirect(307, req.query.url);                       │
│   // https://tesisatcim.com                               │
│                                                            │
│ }                                                          │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ SONUÇ:                                                     │
│                                                            │
│ ✅ IP 203.0.113.50 ENGELLENDİ!                             │
│                                                            │
│ Google Ads'ta:                                             │
│   Campaign "camp-1" → Excluded IPs: [203.0.113.50, ...]   │
│   Campaign "camp-2" → Excluded IPs: [203.0.113.50, ...]   │
│                                                            │
│ Database'de:                                               │
│   blocked_ips:                                             │
│     - domain_id: domain-456                                │
│     - ip: 203.0.113.50                                     │
│     - synced_to_ads: true                                  │
│     - synced_at: 2025-11-01 14:30:00                       │
│                                                            │
│ Bot artık reklama tıklayamaz!                              │
└────────────────────────────────────────────────────────────┘
```

---

### **AKIŞ 3: Site Script - Session Tracking (Opsiyonel)**

```
┌────────────────────────────────────────────────────────────┐
│ Kullanıcı siteye yönlendirildi (tesisatcim.com)            │
│ Cookie'lerde:                                              │
│   - cc_ad_click_id: "adclick-222"                          │
│   - cc_fingerprint: "fp_a1b2c3d4e5f6g7h8"                  │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ Site HTML yüklendi                                         │
│                                                            │
│ <html>                                                     │
│   <head>...</head>                                         │
│   <body>                                                   │
│     <!-- AdsGuardsPro Tracking Script -->                  │
│     <script>                                               │
│       window.adsGuardConfig = {                           │
│         trackingId: 'abc123xyz',                          │
│         apiUrl: 'https://tesisatcim.com'                  │
│       };                                                   │
│     </script>                                              │
│     <script src="/tracker.js"></script>                    │
│                                                            │
│     <!-- Site Content -->                                  │
│     <h1>Acil Tesisatçı</h1>                                │
│     <button class="call-btn">ARA: 0555 123 4567</button>  │
│   </body>                                                  │
│ </html>                                                    │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ tracker.js Çalıştı                                         │
│                                                            │
│ (function() {                                              │
│   'use strict';                                            │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // STEP 1: Cookie'leri Oku                               │
│   // ──────────────────────────────────────────────       │
│   const adClickId = getCookie('cc_ad_click_id');          │
│   const fingerprintFromCookie = getCookie('cc_fingerprint');│
│   const trackingId = window.adsGuardConfig.trackingId;    │
│   const apiUrl = window.adsGuardConfig.apiUrl;            │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // STEP 2: FingerprintJS (Client-side)                   │
│   // ──────────────────────────────────────────────       │
│   const fpPromise = import('https://cdn.jsdelivr.net/npm/ │
│     @fingerprintjs/fingerprintjs@3/dist/fp.min.js')       │
│     .then(FingerprintJS => FingerprintJS.load());          │
│                                                            │
│   fpPromise                                                │
│     .then(fp => fp.get())                                  │
│     .then(result => {                                      │
│       let fingerprintId;                                   │
│                                                            │
│       // Cookie'den varsa kullan, yoksa yeni oluştur      │
│       if (fingerprintFromCookie) {                         │
│         fingerprintId = fingerprintFromCookie;             │
│       } else {                                             │
│         fingerprintId = `fp_${result.visitorId}`;          │
│         setCookie('cc_fingerprint', fingerprintId, 365);   │
│       }                                                    │
│                                                            │
│       // ──────────────────────────────────────────       │
│       // STEP 3: Session Başlat                            │
│       // ──────────────────────────────────────────       │
│       return fetch(`${apiUrl}/api/track/init`, {          │
│         method: 'POST',                                    │
│         headers: { 'Content-Type': 'application/json' },  │
│         body: JSON.stringify({                             │
│           tracking_id: trackingId,                         │
│           ad_click_id: adClickId || null,                  │
│           fingerprint_id: fingerprintId,                   │
│           screen_width: window.screen.width,               │
│           screen_height: window.screen.height,             │
│           landing_page: window.location.href,              │
│           referrer: document.referrer,                     │
│           gclid: extractGclid(window.location.search)      │
│         })                                                  │
│       });                                                   │
│     })                                                      │
│     .then(res => res.json())                               │
│     .then(data => {                                        │
│       const sessionId = data.session_id;                   │
│       window.adsGuardSessionId = sessionId;                │
│                                                            │
│       // ──────────────────────────────────────────       │
│       // STEP 4: Event Tracking Başlat                     │
│       // ──────────────────────────────────────────       │
│       startEventTracking(sessionId, apiUrl);               │
│     })                                                      │
│     .catch(err => console.error('Tracking error:', err));  │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // Helper Functions                                      │
│   // ──────────────────────────────────────────────       │
│   function getCookie(name) {                               │
│     const value = `; ${document.cookie}`;                  │
│     const parts = value.split(`; ${name}=`);               │
│     if (parts.length === 2)                                │
│       return parts.pop().split(';').shift();               │
│   }                                                         │
│                                                            │
│   function setCookie(name, value, days) {                  │
│     const expires = new Date(                              │
│       Date.now() + days * 864e5                            │
│     ).toUTCString();                                       │
│     document.cookie = `${name}=${value}; ` +               │
│       `expires=${expires}; path=/; SameSite=Lax`;          │
│   }                                                         │
│                                                            │
│   function extractGclid(search) {                          │
│     const params = new URLSearchParams(search);            │
│     return params.get('gclid') || null;                    │
│   }                                                         │
│                                                            │
│ })();                                                       │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ Backend: /api/track/init Handler                           │
│                                                            │
│ export default async function handler(req, res) {         │
│                                                            │
│   const {                                                  │
│     tracking_id,                                           │
│     ad_click_id,                                           │
│     fingerprint_id,                                        │
│     landing_page,                                          │
│     referrer,                                              │
│     gclid                                                  │
│   } = req.body;                                            │
│                                                            │
│   const ip = req.headers['x-forwarded-for'] || req.ip;    │
│   const userAgent = req.headers['user-agent'];            │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // STEP 1: Get Domain                                    │
│   // ──────────────────────────────────────────────       │
│   const domain = await db.domains.findUnique({            │
│     where: { tracking_id }                                 │
│   });                                                      │
│                                                            │
│   if (!domain) {                                          │
│     return res.status(404).json({ error: 'Invalid ID' }); │
│   }                                                        │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // STEP 2: Check IP Whitelist                            │
│   // ──────────────────────────────────────────────       │
│   const isWhitelisted = await checkIPWhitelist(ip);       │
│                                                            │
│   if (isWhitelisted) {                                    │
│     // Googlebot → No session                             │
│     return res.json({ session_id: null, skipped: true }); │
│   }                                                        │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // STEP 3: Call IP-API (HER SEFERINDE)                   │
│   // ──────────────────────────────────────────────       │
│   const ipApiData = await callIPAPI(ip);                  │
│                                                            │
│   const ipInfo = await db.ip_info.create({                │
│     data: {                                               │
│       ip,                                                  │
│       country_code: ipApiData.countryCode,                 │
│       city: ipApiData.city,                                │
│       district: ipApiData.district,                        │
│       zip: ipApiData.zip,                                  │
│       lat: ipApiData.lat,                                  │
│       lon: ipApiData.lon,                                  │
│       isp: ipApiData.isp,                                  │
│       is_mobile: ipApiData.mobile,                         │
│       is_vpn: ipApiData.proxy,                             │
│       is_proxy: ipApiData.proxy,                           │
│       is_hosting: ipApiData.hosting,                       │
│       browser: parseBrowser(userAgent),                    │
│       user_agent: userAgent,                               │
│       api_error: ipApiData.error || false                  │
│     }                                                      │
│   });                                                      │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // STEP 4: Get or Create Device                          │
│   // ──────────────────────────────────────────────       │
│   let device = await db.devices.findUnique({              │
│     where: { fingerprint_id }                              │
│   });                                                      │
│                                                            │
│   if (!device) {                                          │
│     const deviceInfo = parseUserAgent(userAgent);         │
│     device = await db.devices.create({                    │
│       data: {                                             │
│         fingerprint_id,                                    │
│         device_type: deviceInfo.type,                      │
│         os: deviceInfo.os,                                 │
│         browser: deviceInfo.browser,                       │
│         screen_width: req.body.screen_width,               │
│         screen_height: req.body.screen_height              │
│       }                                                    │
│     });                                                    │
│   }                                                        │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // STEP 5: Determine Traffic Source                      │
│   // ──────────────────────────────────────────────       │
│   let isAdTraffic = false;                                │
│   let trafficSource = 'direct';                           │
│   let adClick = null;                                     │
│                                                            │
│   if (ad_click_id) {                                      │
│     // Ads'dan geldi                                      │
│     adClick = await db.ad_clicks.findUnique({             │
│       where: { id: ad_click_id }                          │
│     });                                                    │
│                                                            │
│     if (adClick) {                                        │
│       isAdTraffic = true;                                 │
│       trafficSource = 'google_ads';                       │
│     }                                                      │
│   } else if (gclid) {                                     │
│     // GCLID var ama ad_click yok (tracking URL atlandı)  │
│     isAdTraffic = true;                                   │
│     trafficSource = 'google_ads';                         │
│   } else if (referrer) {                                  │
│     // Referrer'dan belirle                               │
│     if (referrer.includes('google.com')) {                │
│       trafficSource = 'organic';                          │
│     } else if (referrer.includes('facebook.com')) {       │
│       trafficSource = 'social';                           │
│     } else {                                              │
│       trafficSource = 'referral';                         │
│     }                                                      │
│   }                                                        │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // STEP 6: Create Session                                │
│   // ──────────────────────────────────────────────       │
│   const session = await db.sessions.create({              │
│     data: {                                               │
│       domain_id: domain.id,                                │
│       device_id: device.id,                                │
│       ip_info_id: ipInfo.id,                               │
│       ad_click_id: adClick?.id || null,                    │
│       is_ad_traffic: isAdTraffic,                          │
│       traffic_source: trafficSource,                       │
│       browser: parseBrowser(userAgent),                    │
│       user_agent: userAgent,                               │
│       referrer,                                            │
│       landing_page,                                        │
│       gclid                                                │
│     }                                                      │
│   });                                                      │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // STEP 7: Initial page_view Event                       │
│   // ──────────────────────────────────────────────       │
│   await db.session_events.create({                        │
│     data: {                                               │
│       session_id: session.id,                              │
│       event_type: 'page_view',                             │
│       page_url: landing_page                               │
│     }                                                      │
│   });                                                      │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // Response                                              │
│   // ──────────────────────────────────────────────       │
│   return res.json({                                       │
│     session_id: session.id,                                │
│     is_ad_traffic: isAdTraffic,                            │
│     traffic_source: trafficSource                          │
│   });                                                      │
│                                                            │
│ }                                                          │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ Client: Event Tracking Başladı                             │
│                                                            │
│ function startEventTracking(sessionId, apiUrl) {          │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // 1. Scroll Tracking                                    │
│   // ──────────────────────────────────────────────       │
│   let lastScrollPercent = 0;                               │
│   const scrollHandler = debounce(() => {                   │
│     const scrollPercent = Math.round(                      │
│       (window.scrollY /                                    │
│        (document.body.scrollHeight - window.innerHeight))  │
│       * 100                                                │
│     );                                                      │
│                                                            │
│     // Her 25% artışta kaydet                             │
│     if (scrollPercent > lastScrollPercent + 25) {         │
│       lastScrollPercent = scrollPercent;                   │
│       trackEvent(sessionId, apiUrl, {                      │
│         event_type: 'scroll',                              │
│         scroll_percent: scrollPercent                      │
│       });                                                   │
│     }                                                       │
│   }, 500);                                                  │
│                                                            │
│   window.addEventListener('scroll', scrollHandler);        │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // 2. Click Tracking                                     │
│   // ──────────────────────────────────────────────       │
│   document.addEventListener('click', (e) => {              │
│     const target = e.target;                               │
│     const isCallButton = target.matches('.call-btn') ||    │
│       target.closest('.call-btn');                         │
│                                                            │
│     trackEvent(sessionId, apiUrl, {                        │
│       event_type: isCallButton ?                           │
│         'call_button_click' : 'click',                     │
│       click_x: e.clientX,                                  │
│       click_y: e.clientY,                                  │
│       target_element: target.tagName,                      │
│       target_text: target.textContent?.substring(0, 100),  │
│       target_href: target.href || null                     │
│     });                                                     │
│   });                                                       │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // 3. Form Submit Tracking                               │
│   // ──────────────────────────────────────────────       │
│   document.addEventListener('submit', (e) => {             │
│     const form = e.target;                                 │
│     trackEvent(sessionId, apiUrl, {                        │
│       event_type: 'form_submit',                           │
│       target_element: form.id || form.className,           │
│       event_data: {                                        │
│         form_id: form.id,                                  │
│         action: form.action                                │
│       }                                                     │
│     });                                                     │
│   });                                                       │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // 4. Heartbeat (Her 30 saniye)                          │
│   // ──────────────────────────────────────────────       │
│   const heartbeatInterval = setInterval(() => {            │
│     fetch(`${apiUrl}/api/track/heartbeat`, {              │
│       method: 'POST',                                      │
│       headers: { 'Content-Type': 'application/json' },    │
│       body: JSON.stringify({ session_id: sessionId })     │
│     }).catch(err => {                                      │
│       console.error('Heartbeat error:', err);              │
│     });                                                     │
│   }, 30000);  // 30 saniye                                 │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // 5. Page Unload (Session End)                          │
│   // ──────────────────────────────────────────────       │
│   window.addEventListener('beforeunload', () => {          │
│     clearInterval(heartbeatInterval);                      │
│     navigator.sendBeacon(                                  │
│       `${apiUrl}/api/track/end`,                           │
│       JSON.stringify({ session_id: sessionId })            │
│     );                                                      │
│   });                                                       │
│                                                            │
│   // ──────────────────────────────────────────────       │
│   // 6. Visibility Change (Tab değiştirme)                 │
│   // ──────────────────────────────────────────────       │
│   document.addEventListener('visibilitychange', () => {    │
│     if (document.hidden) {                                 │
│       // Tab gizlendi → heartbeat durdur                   │
│       clearInterval(heartbeatInterval);                    │
│     } else {                                               │
│       // Tab aktif oldu → heartbeat başlat                 │
│       // (yukarıdaki heartbeatInterval tekrar başlat)      │
│     }                                                       │
│   });                                                       │
│                                                            │
│ }                                                          │
│                                                            │
│ // ──────────────────────────────────────────────────     │
│ // Helper: Event Gönder                                    │
│ // ──────────────────────────────────────────────────     │
│ function trackEvent(sessionId, apiUrl, eventData) {        │
│   fetch(`${apiUrl}/api/track/event`, {                    │
│     method: 'POST',                                        │
│     headers: { 'Content-Type': 'application/json' },      │
│     body: JSON.stringify({                                 │
│       session_id: sessionId,                               │
│       ...eventData                                         │
│     })                                                      │
│   }).catch(err => {                                        │
│     console.error('Event tracking error:', err);           │
│   });                                                       │
│ }                                                          │
│                                                            │
│ // ──────────────────────────────────────────────────     │
│ // Helper: Debounce                                        │
│ // ──────────────────────────────────────────────────     │
│ function debounce(func, wait) {                            │
│   let timeout;                                             │
│   return function executedFunction(...args) {              │
│     clearTimeout(timeout);                                 │
│     timeout = setTimeout(() => func(...args), wait);       │
│   };                                                        │
│ }                                                          │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│ Backend: Event Handlers                                    │
│                                                            │
│ // POST /api/track/event                                   │
│ export default async function handler(req, res) {         │
│   const { session_id, event_type, ...eventData } = req.body;│
│                                                            │
│   // Session_events tablosuna ekle                         │
│   await db.session_events.create({                        │
│     data: {                                               │
│       session_id,                                          │
│       event_type,                                          │
│       page_url: eventData.page_url,                        │
│       scroll_px: eventData.scroll_px,                      │
│       scroll_percent: eventData.scroll_percent,            │
│       click_x: eventData.click_x,                          │
│       click_y: eventData.click_y,                          │
│       target_element: eventData.target_element,            │
│       target_text: eventData.target_text,                  │
│       target_href: eventData.target_href,                  │
│       event_data: eventData.event_data || {}               │
│     }                                                      │
│   });                                                      │
│                                                            │
│   // Session'ı güncelle (last_activity_at)                 │
│   await db.sessions.update({                              │
│     where: { id: session_id },                             │
│     data: { last_activity_at: new Date() }                 │
│   });                                                      │
│                                                            │
│   res.json({ success: true });                            │
│ }                                                          │
│                                                            │
│ // POST /api/track/heartbeat                               │
│ export default async function handler(req, res) {         │
│   const { session_id } = req.body;                        │
│                                                            │
│   await db.sessions.update({                              │
│     where: { id: session_id },                             │
│     data: { last_activity_at: new Date() }                 │
│   });                                                      │
│                                                            │
│   res.json({ success: true });                            │
│ }                                                          │
│                                                            │
│ // POST /api/track/end                                     │
│ export default async function handler(req, res) {         │
│   const { session_id } = req.body;                        │
│                                                            │
│   const session = await db.sessions.findUnique({          │
│     where: { id: session_id }                              │
│   });                                                      │
│                                                            │
│   if (session) {                                          │
│     const duration = Math.floor(                           │
│       (Date.now() - session.started_at.getTime()) / 1000   │
│     );                                                      │
│                                                            │
│     await db.sessions.update({                            │
│       where: { id: session_id },                           │
│       data: {                                             │
│         ended_at: new Date(),                              │
│         duration_seconds: duration                         │
│       }                                                    │
│     });                                                    │
│   }                                                        │
│                                                            │
│   res.json({ success: true });                            │
│ }                                                          │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ADSGUARDSPRO COMPLETE FLOW                       │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  PHASE 1: SETUP      │
└──────────────────────┘
         │
         ├─→ User registers → profiles
         ├─→ Add domain → domains (tracking_id generated)
         ├─→ Google Ads API → Fetch campaigns → ads_campaigns (manual)
         ├─→ Generate tracking URL
         └─→ Set tracking template in Google Ads

┌──────────────────────┐
│  PHASE 2: AD CLICK   │
└──────────────────────┘
         │
         ├─→ Bot clicks ad
         ├─→ Tracking URL redirect → /api/tracker
         │
         ├─→ Check ip_whitelist → IF whitelisted: SKIP
         ├─→ Call IP-API → ip_info (NEW RECORD EVERY TIME)
         ├─→ Generate fingerprint → devices (upsert)
         ├─→ Check campaign → ads_campaigns (auto_detected if new)
         ├─→ Log click → ad_clicks (raw_params)
         ├─→ Block IP → blocked_ips (domain-based, ALL campaigns)
         ├─→ Google Ads API → Add IP exclusion to ALL campaigns
         ├─→ Set cookies → cc_click_id, cc_ad_click_id, cc_fingerprint
         └─→ Redirect to site

┌──────────────────────┐
│  PHASE 3: SITE VISIT │
└──────────────────────┘
         │
         ├─→ Site loads → Tracking script runs
         ├─→ Read cookies
         ├─→ FingerprintJS → Get/generate fingerprint
         ├─→ POST /api/track/init
         │
         ├─→ Check ip_whitelist → IF whitelisted: SKIP
         ├─→ Call IP-API → ip_info (NEW RECORD)
         ├─→ Get/create device → devices
         ├─→ Determine traffic source (ads/organic/direct)
         ├─→ Create session → sessions (is_ad_traffic flag)
         ├─→ Log page_view → session_events
         └─→ Return session_id

┌──────────────────────┐
│  PHASE 4: TRACKING   │
└──────────────────────┘
         │
         ├─→ User scrolls → session_events (scroll)
         ├─→ User clicks → session_events (click)
         ├─→ User clicks ARA button → session_events (call_button_click)
         ├─→ User submits form → session_events (form_submit)
         ├─→ Heartbeat (30s) → sessions.last_activity_at
         └─→ User leaves → sessions.ended_at, duration_seconds

┌──────────────────────┐
│  PHASE 5: ANALYTICS  │
└──────────────────────┘
         │
         ├─→ Query sessions → Filter by is_ad_traffic
         ├─→ Query session_events → Calculate metrics
         ├─→ Join with ip_info → Geo analysis
         ├─→ Join with blocked_ips → Block stats
         └─→ Dashboard displays insights
```

---

## 🎯 Kritik Noktalar

### **1. IP Whitelist Kontrolü (Her İki Akışta da İLK ÖNCE!)**
```javascript
// Tracking URL'de
if (isWhitelisted) {
  return res.redirect(url);  // Hiçbir şey
  return res.redirect(url);  // Hiçbir şey yapma
}

// Site Script'te
if (isWhitelisted) {
  return res.json({ skipped: true });  // Session oluşturma
}
```

**Neden Önemli:**
- Googlebot engellersen → SEO felaketi
- Bingbot engellersen → Bing'de site yok
- Her request'te ilk kontrol bu olmalı

---

### **2. IP-API Her Seferinde Çağrılır**

**Tracking URL'de:**
```javascript
// Her ad click
const ipApiData = await fetch(`http://ip-api.com/json/${ip}`);
INSERT INTO ip_info (...);  // Yeni kayıt
```

**Site Script'te:**
```javascript
// Her session başlangıcı
const ipApiData = await fetch(`http://ip-api.com/json/${ip}`);
INSERT INTO ip_info (...);  // Yeni kayıt
```

**Neden:**
- IP konumu değişebilir
- VPN açılıp kapanabilir
- Güncel veri kritik
- Maliyet: ~$0.001/request → Kabul edilebilir

**Alternatif (Gelecekte):**
```javascript
// Cache logic ekle
const cached = await db.ip_info.findFirst({
  where: {
    ip,
    created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }  // 24 saat
  },
  orderBy: { created_at: 'desc' }
});

if (cached) {
  // Use cached data
} else {
  // Call IP-API
}
```

---

### **3. FingerprintJS: Hybrid Approach**

**Server-side (Tracking URL):**
```javascript
// Basit hash - hızlı
const fingerprint = createHash('sha256')
  .update(ip + userAgent + acceptLanguage)
  .digest('hex')
  .substring(0, 16);

const fingerprintId = `fp_${fingerprint}`;
// "fp_a1b2c3d4e5f6g7h8"
```

**Client-side (Site Script):**
```javascript
// FingerprintJS - tam doğruluk
import('@fingerprintjs/fingerprintjs@3')
  .then(FP => FP.load())
  .then(fp => fp.get())
  .then(result => {
    const fingerprintId = `fp_${result.visitorId}`;
    // "fp_x9y8z7w6v5u4t3s2"
  });
```

**Neden İki Yöntem:**
- Tracking URL: Hızlı olmalı (redirect gecikmemeli)
- Site Script: Doğru olmalı (tam analiz için)

**Cookie ile Bağla:**
```javascript
// Tracking URL
Set-Cookie: cc_fingerprint=fp_a1b2c3d4e5f6g7h8

// Site Script
const cookieFP = getCookie('cc_fingerprint');
if (cookieFP) {
  // Use server-side FP
  fingerprintId = cookieFP;
} else {
  // Generate client-side FP
  fingerprintId = await getFingerprintJS();
  setCookie('cc_fingerprint', fingerprintId);
}
```

---

### **4. Agresif Engelleme: SADECE Ads Trafiği**

**Kural:**
```
IF is_ad_traffic = TRUE:
  → blocked_ips'e ekle
  → Google Ads API'ye gönder

IF is_ad_traffic = FALSE:
  → Session kaydet (analiz için)
  → ENGELLEME YOK
```

**Örnek:**

**Senaryo 1: Ads'dan geldi**
```
User clicks ad → Tracking URL
→ IP: 1.2.3.4
→ blocked_ips INSERT
→ Google Ads API: Exclude 1.2.3.4
→ Site loads → Session (is_ad_traffic=true)
→ Events tracked
```

**Senaryo 2: Organik geldi**
```
User searches Google → Organic result → Site
→ IP: 1.2.3.4
→ No tracking URL (no ad click)
→ Site loads → Session (is_ad_traffic=false)
→ Events tracked
→ NO BLOCKING!
```

**Senaryo 3: Direkt geldi**
```
User types URL → tesisatcim.com
→ IP: 1.2.3.4
→ No ad click
→ Site loads → Session (is_ad_traffic=false, traffic_source=direct)
→ Events tracked
→ NO BLOCKING!
```

**Neden Sadece Ads:**
- Organik trafik → Ücretsiz, engellemek gereksiz
- Direkt trafik → Marka bilinirliği, iyi şey
- Ads trafik → Para ödüyorsun, botları engelle!

---

### **5. Session Tracking: HERKES (Whitelist Hariç)**

**Kural:**
```
IF NOT in ip_whitelist:
  → Session kaydet
  → Events tracked
  → Analytics'te görünür

Ads mi, organik mi? → Fark etmez, hepsini kaydet
```

**Kullanım:**
```sql
-- Ads trafiği analizi
SELECT * FROM sessions WHERE is_ad_traffic = true;

-- Organik trafik analizi
SELECT * FROM sessions WHERE traffic_source = 'organic';

-- Tüm trafik
SELECT * FROM sessions;

-- Arama yapanlar (acil hizmet için kritik!)
SELECT s.* FROM sessions s
JOIN session_events se ON s.id = se.session_id
WHERE se.event_type = 'call_button_click';
```

---

### **6. 500 IP Limit: Domain Bazlı**

**Mantık:**
```
Domain: tesisatcim.com
Campaigns: K1, K2, K3 (3 kampanya)

blocked_ips:
- UNIQUE(domain_id, ip)  ← Kampanya YOK!
- Her IP sadece 1 kez kaydedilir
- Tüm kampanyalara aynı IP listesi gönderilir

Google Ads:
K1 → Excluded IPs: [1.2.3.4, 5.6.7.8, ...]
K2 → Excluded IPs: [1.2.3.4, 5.6.7.8, ...]  ← AYNI LİSTE
K3 → Excluded IPs: [1.2.3.4, 5.6.7.8, ...]  ← AYNI LİSTE
```

**500 IP Aşıldığında:**
```javascript
// Her domain için
async function syncBlockedIPs(domainId) {
  // 1. En yeni 500 IP'yi al
  const top500 = await db.$queryRaw`
    SELECT ip 
    FROM blocked_ips
    WHERE domain_id = ${domainId}
    ORDER BY blocked_at DESC
    LIMIT 500
  `;

  // 2. 500'den eski olanları sil (opsiyonel, DB temizliği için)
  await db.$executeRaw`
    DELETE FROM blocked_ips
    WHERE domain_id = ${domainId}
    AND id NOT IN (
      SELECT id FROM blocked_ips
      WHERE domain_id = ${domainId}
      ORDER BY blocked_at DESC
      LIMIT 500
    )
  `;

  // 3. Tüm kampanyalara gönder
  const campaigns = await db.ads_campaigns.findMany({
    where: { domain_id: domainId, is_active: true }
  });

  for (const campaign of campaigns) {
    await googleAdsAPI.setCampaignIPExclusions({
      campaignId: campaign.campaign_id,
      ipAddresses: top500.map(r => r.ip)
    });
  }

  // 4. Sync durumunu güncelle
  await db.blocked_ips.updateMany({
    where: { 
      domain_id: domainId,
      ip: { in: top500.map(r => r.ip) }
    },
    data: { 
      synced_to_ads: true,
      synced_at: new Date()
    }
  });
}
```

**Google Ads API Davranışı:**
```javascript
// Aynı IP'yi tekrar gönderirsen
await googleAdsAPI.addIPExclusion({
  campaignId: 'K1',
  ipAddress: '1.2.3.4'
});

// İkinci kez
await googleAdsAPI.addIPExclusion({
  campaignId: 'K1',
  ipAddress: '1.2.3.4'  // AYNI IP
});

// Result: Duplicate ignored, hata vermez
// IP listesinde sadece 1 kez görünür
```

---

### **7. Yeni Kampanya Tespiti**

**Manuel Ekleme (İlk kurulum):**
```javascript
// User adds domain
const campaigns = await googleAdsAPI.listCampaigns({
  customerId: domain.ads_account_id
});

// Her kampanyayı kaydet
for (const campaign of campaigns) {
  await db.ads_campaigns.create({
    data: {
      domain_id: domain.id,
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      added_method: 'manual'  // ← Manuel
    }
  });
}
```

**Otomatik Tespit (Tracking URL):**
```javascript
// Tracking URL'den campaign_id geldi
const campaign = await db.ads_campaigns.findUnique({
  where: {
    domain_id_campaign_id: {
      domain_id: domain.id,
      campaign_id: req.query.campaign_id
    }
  }
});

if (!campaign) {
  // YENİ KAMPANYA!
  await db.ads_campaigns.create({
    data: {
      domain_id: domain.id,
      campaign_id: req.query.campaign_id,
      campaign_name: null,  // Sonra Google Ads API'den çek
      added_method: 'auto_detected'  // ← Otomatik
    }
  });

  // Mevcut tüm blocked_ips'leri bu kampanyaya gönder
  const blockedIPs = await db.blocked_ips.findMany({
    where: { domain_id: domain.id },
    take: 500,
    orderBy: { blocked_at: 'desc' }
  });

  await googleAdsAPI.setCampaignIPExclusions({
    campaignId: req.query.campaign_id,
    ipAddresses: blockedIPs.map(b => b.ip)
  });
}
```

---

### **8. Heartbeat: Session Süresi Takibi**

**Neden Gerekli:**
```
Problem: User tarayıcıyı kapatmadan başka yere gitti
→ beforeunload event tetiklenmedi
→ session.ended_at = null

Çözüm: Heartbeat
→ Her 30 saniyede last_activity_at güncelle
→ Son aktiviteden 5 dakika geçtiyse → Oturum bitti say
```

**İmplementasyon:**

**Client:**
```javascript
setInterval(() => {
  fetch('/api/track/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ session_id })
  });
}, 30000);  // 30 saniye
```

**Server:**
```javascript
// POST /api/track/heartbeat
await db.sessions.update({
  where: { id: session_id },
  data: { last_activity_at: new Date() }
});
```

**Session Duration Hesaplama:**

**Method 1: beforeunload (ideal)**
```javascript
window.addEventListener('beforeunload', () => {
  navigator.sendBeacon('/api/track/end', 
    JSON.stringify({ session_id })
  );
});

// Backend
const duration = now - session.started_at;
await db.sessions.update({
  where: { id: session_id },
  data: { 
    ended_at: new Date(),
    duration_seconds: Math.floor(duration / 1000)
  }
});
```

**Method 2: Heartbeat-based (fallback)**
```javascript
// Background job (her 10 dakika)
const staleSessions = await db.sessions.findMany({
  where: {
    ended_at: null,
    last_activity_at: {
      lt: new Date(Date.now() - 5 * 60 * 1000)  // 5 dakika önce
    }
  }
});

for (const session of staleSessions) {
  const duration = session.last_activity_at - session.started_at;
  await db.sessions.update({
    where: { id: session.id },
    data: {
      ended_at: session.last_activity_at,
      duration_seconds: Math.floor(duration / 1000)
    }
  });
}
```

---

## 📊 Analytics Query Örnekleri

### **1. Engellenen IP İstatistikleri**
```sql
-- Domain başına engellenen IP sayısı
SELECT 
  d.domain,
  COUNT(DISTINCT b.ip) as total_blocked_ips,
  SUM(b.block_count) as total_blocks,
  COUNT(DISTINCT CASE WHEN b.synced_to_ads THEN b.ip END) as synced_ips,
  MAX(b.last_seen_at) as last_block
FROM domains d
LEFT JOIN blocked_ips b ON d.id = b.domain_id
WHERE d.is_active = true
GROUP BY d.id, d.domain;
```

### **2. Kampanya Bazlı Tıklama Analizi**
```sql
-- Her kampanyadan kaç tıklama geldi
SELECT 
  ac.campaign_name,
  COUNT(adc.id) as total_clicks,
  COUNT(DISTINCT adc.ip_info_id) as unique_ips,
  COUNT(CASE WHEN ii.is_vpn THEN 1 END) as vpn_clicks,
  COUNT(CASE WHEN ii.is_hosting THEN 1 END) as hosting_clicks
FROM ads_campaigns ac
LEFT JOIN ad_clicks adc ON ac.campaign_id = adc.campaign_id
LEFT JOIN ip_info ii ON adc.ip_info_id = ii.id
WHERE ac.domain_id = $1
GROUP BY ac.campaign_id, ac.campaign_name
ORDER BY total_clicks DESC;
```

### **3. Arama Yapan Kullanıcılar (Acil Hizmet Metrikleri)**
```sql
-- Hangi kullanıcılar ARA butonuna tıkladı?
SELECT 
  s.id as session_id,
  s.is_ad_traffic,
  s.traffic_source,
  s.started_at,
  s.duration_seconds,
  ii.city,
  ii.is_mobile,
  COUNT(se.id) FILTER (WHERE se.event_type = 'scroll') as scroll_count,
  COUNT(se.id) FILTER (WHERE se.event_type = 'click') as click_count,
  MIN(se.occurred_at) FILTER (WHERE se.event_type = 'call_button_click') as first_call_time
FROM sessions s
JOIN ip_info ii ON s.ip_info_id = ii.id
LEFT JOIN session_events se ON s.id = se.session_id
WHERE EXISTS (
  SELECT 1 FROM session_events
  WHERE session_id = s.id
    AND event_type = 'call_button_click'
)
AND s.domain_id = $1
GROUP BY s.id, ii.city, ii.is_mobile
ORDER BY s.started_at DESC;
```

### **4. Conversion Rate (Ads vs Organic)**
```sql
-- Ads trafik vs Organik trafik conversion oranı
SELECT 
  s.traffic_source,
  COUNT(s.id) as total_sessions,
  COUNT(CASE WHEN EXISTS (
    SELECT 1 FROM session_events se
    WHERE se.session_id = s.id
      AND se.event_type = 'call_button_click'
  ) THEN 1 END) as conversions,
  ROUND(
    COUNT(CASE WHEN EXISTS (
      SELECT 1 FROM session_events se
      WHERE se.session_id = s.id
        AND se.event_type = 'call_button_click'
    ) THEN 1 END)::numeric / NULLIF(COUNT(s.id), 0) * 100,
    2
  ) as conversion_rate
FROM sessions s
WHERE s.domain_id = $1
  AND s.started_at >= NOW() - INTERVAL '30 days'
GROUP BY s.traffic_source
ORDER BY conversion_rate DESC;
```

### **5. Bot Pattern Detection (Gelecek için)**
```sql
-- Şüpheli session'ları tespit et
SELECT 
  s.id,
  s.is_ad_traffic,
  s.duration_seconds,
  ii.ip,
  ii.is_vpn,
  ii.is_hosting,
  COUNT(se.id) FILTER (WHERE se.event_type = 'click') as clicks,
  COUNT(se.id) FILTER (WHERE se.event_type = 'scroll') as scrolls,
  MAX(se.scroll_percent) as max_scroll
FROM sessions s
JOIN ip_info ii ON s.ip_info_id = ii.id
LEFT JOIN session_events se ON s.id = se.session_id
WHERE s.domain_id = $1
  AND s.is_ad_traffic = true
  AND s.started_at >= NOW() - INTERVAL '7 days'
GROUP BY s.id, ii.ip, ii.is_vpn, ii.is_hosting
HAVING 
  -- Şüpheli kriterler
  (s.duration_seconds < 5 AND COUNT(se.id) > 0)  -- Çok kısa ama aktivite var
  OR (COUNT(se.id) FILTER (WHERE se.event_type = 'click') > 5 
      AND COUNT(se.id) FILTER (WHERE se.event_type = 'scroll') = 0)  -- Click var scroll yok
  OR ii.is_hosting = true  -- Hosting IP
ORDER BY s.started_at DESC;
```

---

## 🚀 Deployment Checklist

### **1. Environment Variables**
```bash
# .env.local
DATABASE_URL="postgresql://..."
GOOGLE_ADS_DEVELOPER_TOKEN="..."
GOOGLE_ADS_CLIENT_ID="..."
GOOGLE_ADS_CLIENT_SECRET="..."
GOOGLE_ADS_REFRESH_TOKEN="..."
IP_API_KEY="..."  # Pro plan için
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://tesisatcim.com"
```

### **2. Database Migration**
```bash
# Run schema
psql -h localhost -U postgres -d adsguardspro < schema.sql

# Verify
psql -h localhost -U postgres -d adsguardspro -c "\dt"
```

### **3. Google Ads Setup**
```
1. Google Ads Manager Account (MCC) oluştur
2. Developer Token al
3. OAuth2 credentials oluştur
4. Refresh token al
5. Müşteri hesabını MCC'ye bağla
```

### **4. Tracking URL Template**
```
https://yourdomain.com/api/tracker?id={tracking_id}&campaign_id={campaignid}&gclid={gclid}&keyword={keyword}&device={device}&network={network}&adpos={adposition}&placement={placement}&url={lpurl}
```

### **5. Site Script Integration**
```html
<!-- Müşteri sitesine eklenecek -->
<script>
  window.adsGuardConfig = {
    trackingId: 'abc123xyz',
    apiUrl: 'https://tesisatcim.com'
  };
</script>
<script src="https://cdn.adsguardspro.com/tracker.js"></script>
```

---

## ✅ MVP Özet

**Çalışan Özellikler:**
1. ✅ Tracking URL → Anında IP engelleme
2. ✅ Google Ads API → Real-time sync
3. ✅ Site script → Session tracking
4. ✅ FingerprintJS → Device tracking
5. ✅ IP-API → Geo + threat data
6. ✅ Heartbeat → Accurate session duration
7. ✅ Event tracking → User behavior
8. ✅ 500 IP limit → Domain-based management
9. ✅ Auto campaign detection → New campaigns
10. ✅ Analytics → Ready for dashboard

**Olmayan Özellikler (Gelecek):**
- ❌ Bot scoring (manuel değil, otomatik)
- ❌ Domain rules (agresiflik seviyeleri)
- ❌ Threat levels (safe/low/medium/high/critical)
- ❌ Manual whitelist/blacklist UI
- ❌ Email alerts
- ❌ Slack notifications

Cursor AI için hazır! Kod yazmaya başlayabilirsin. 🚀