# Google Click Tracker Certification - Hızlı Referans
## AdsGuardy Click Tracking Service

---

## 🎯 Temel Bilgiler

**Primary Domain:** adguardy.com  
**App Subdomain:** app.adguardy.com (API endpoint)  
**Tracking URL:** `https://app.adguardy.com/api/tracker`  
**Sertifikasyon Durumu:** ✅ Tamamen Uyumlu  
**Ortalama Redirect Süresi:** < 200ms (ideally < 100ms)

---

## 📋 Google Ads'e Eklenecek Tracking Template

```
https://app.adguardy.com/api/tracker?force_transparent=true&id={tracking_id}&redirection_url={lpurl}&campaign_id={campaignid}&gclid={gclid}&keyword={keyword}&device={device}&network={network}&adpos={adposition}
```

### Parametrelerin Değiştirilmesi Gereken Yerler

- `{tracking_id}` → Müşteriye özel tracking ID (örnek: `usr_abc123xyz`)
- Diğer parametreler Google Ads tarafından otomatik doldurulur

---

## 🔑 Parametre Listesi ve Açıklamaları

### 1. Zorunlu Parametreler

| Parametre | Açıklama | Kim Doldurur | Örnek |
|-----------|----------|--------------|-------|
| `force_transparent` | Google'ın şeffaflık kontrolü için | Sabit değer | `true` |
| `id` | Müşteriye özel tracking ID | Müşteri | `usr_abc123` |
| `redirection_url` | **[TRANSPARENCY PARAMETER]** Kullanıcının yönlendirileceği sayfa | Google Ads | `https://example.com/page` |

### 2. İsteğe Bağlı Parametreler (Google Ads Verileri)

| Parametre | Açıklama | Google Macro | Örnek Değer |
|-----------|----------|--------------|-------------|
| `campaign_id` | Kampanya ID'si | `{campaignid}` | `1234567890` |
| `gclid` | Google Click ID | `{gclid}` | `abc123def456` |
| `keyword` | Tıklanan anahtar kelime | `{keyword}` | `running+shoes` |
| `device` | Cihaz tipi | `{device}` | `mobile` / `desktop` |
| `network` | Reklam ağı | `{network}` | `search` / `display` |
| `adpos` | Reklam pozisyonu | `{adposition}` | `1t1` |
| `placement` | Yerleşim | `{placement}` | `www.example.com` |

---

## ✅ Google Guidelines Uyumluluk Kontrol Listesi

### Şeffaflık (Transparency)
- ✅ `redirection_url` parametresi görünür
- ✅ Backend'de farklı bir hedefe yönlendirme yok
- ✅ URL-encoded değerler destekleniyor
- ✅ `force_transparent` parametresi eklendi

### Güvenlik (Security)
- ✅ URL format doğrulaması yapılıyor
- ✅ Protocol kontrolü (sadece HTTP/HTTPS)
- ✅ Domain doğrulaması yapılıyor
- ✅ SSL/TLS aktif (HTTPS zorunlu)

### Performans (Performance)
- ✅ Hızlı yönlendirme (< 100ms)
- ✅ Arka plan işlemleri kullanıcıyı bloklamıyor
- ✅ Non-blocking mimari

### Parametreler (Parameters)
- ✅ Foreign parametre eklenmiyor
- ✅ UTM parametresi eklenmiyor
- ✅ Affiliate ID eklenmiyor
- ✅ Tüm tracking parametreleri internal kullanım için

### Intermediate Domains
- ✅ Ara domain kullanılmıyor
- ✅ Direkt customer domain'ine yönlendirme
- ✅ Nested tracker yok

---

## 🚀 Sistem Mimarisi

### 1. Ana Tracker Endpoint
**URL:** `/api/tracker`  
**Metod:** GET  
**Görev:** Hızlı redirect (< 100ms)

**İşlemler:**
1. URL validasyonu
2. Cookie ayarlama
3. Kullanıcıyı yönlendirme
4. Background worker'a veri gönderme (fire-and-forget)

### 2. Background Processor
**URL:** `/api/tracker/process`  
**Metod:** POST  
**Görev:** Ağır işlemleri arka planda yap

**İşlemler:**
1. Domain kontrolü
2. IP whitelist kontrolü
3. IP bilgisi lookup (external API)
4. Device kaydı
5. Campaign auto-detection
6. Ad click logging
7. IP engelleme
8. Google Ads API sync

---

## 📊 Non-Foreign Parameters (AdsGuardy Özel)

Bu parametreler **sadece internal logging** için kullanılır ve **final URL'e EKLENMEZ**.

| Parametre | Kullanım Amacı | Nereden Geliyor |
|-----------|----------------|-----------------|
| `id` | Müşteri tracking ID | Müşteri tarafından belirlenir |
| `campaign_id` | Kampanya analizi | Google Ads macro |
| `gclid` | Click tracking | Google Ads macro |
| `keyword` | Keyword analizi | Google Ads macro |
| `device` | Cihaz analizi | Google Ads macro |
| `network` | Network analizi | Google Ads macro |
| `adpos` | Pozisyon analizi | Google Ads macro |
| `placement` | Placement analizi | Google Ads macro |

**ÖNEMLİ:** Bu parametrelerden hiçbiri `redirection_url`'e eklenmez!

---

## 🔒 SSL/TLS Uyumluluğu

- ✅ **Sertifika:** Let's Encrypt / Commercial CA
- ✅ **TLS Versiyon:** TLS 1.2+
- ✅ **HTTPS Zorunlu:** Production'da aktif
- ✅ **HSTS:** Etkinleştirildi
- ✅ **Mixed Content:** Yok

---

## 📝 Domain Bilgileri

**Domain:** adguardy.com  
**Registrar:** [Registrar Name]  
**Registration:** Public (WHOIS mevcut)  
**SSL Status:** ✅ Active  
**DNS:** Configured

---

## 🎯 Örnek Tracking URL'leri

### Örnek 1: Basit
```
https://app.adguardy.com/api/tracker?force_transparent=true&id=test001&redirection_url=https://example.com/
```

### Örnek 2: Tüm Parametrelerle
```
https://app.adguardy.com/api/tracker?force_transparent=true&id=usr_abc123&redirection_url=https://example.com/products/shoes&campaign_id=9876543210&gclid=TeSter-click-id&keyword=running+shoes&device=mobile&network=search&adpos=1t2
```

### Örnek 3: URL-Encoded Redirection
```
https://app.adguardy.com/api/tracker?force_transparent=true&id=test001&redirection_url=https%3A%2F%2Fexample.com%2Fpage%3Futm_source%3Dgoogle
```

---

## 🧪 Test Etme

⚠️ **ÖNEMLİ:** API `https://app.adguardy.com` subdomain'i altında çalışır!

### Manuel Test
```bash
# Basit test (DOĞRU URL!)
curl -I "https://app.adguardy.com/api/tracker?force_transparent=true&id=test&redirection_url=https://google.com"

# Response: 302 Found
# Location: https://google.com (DEĞİŞMEMİŞ!)
```

### Response Time Test
```bash
time curl -I "https://app.adguardy.com/api/tracker?force_transparent=true&id=test&redirection_url=https://google.com"

# Beklenen: < 200ms (ideally < 100ms)
```

---

## 🆘 Sorun Giderme

### Tracker Çalışmıyor
1. `redirection_url` parametresi eklenmiş mi?
2. `id` parametresi doğru mu?
3. SSL sertifikası aktif mi?
4. Domain DNS ayarları doğru mu?

### Yavaş Redirect
1. Background processor çalışıyor mu kontrol edin
2. Database bağlantısı aktif mi?
3. Network gecikmeleri var mı?

### IP Engelleme Çalışmıyor
1. Google Ads OAuth token'ı güncel mi?
2. Campaign ID doğru mu?
3. Background processor error log'larını kontrol edin

---

## 📞 İletişim

**Teknik Destek:** support@adguardy.com  
**Döküman:** https://adguardy.com/docs  
**Status Page:** https://status.adguardy.com

---

## 📅 Güncellemeler

**Son Güncelleme:** 11 Kasım 2025  
**Versiyon:** 2.0  
**Değişiklikler:**
- ✅ Google Guidelines tam uyumlu
- ✅ Hızlı redirect mimarisi (< 100ms)
- ✅ Background processing
- ✅ URL validation ve security
- ✅ Domain verification
- ✅ SSL/TLS enforcement

---

**END OF QUICK REFERENCE**

