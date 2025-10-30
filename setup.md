Googel ads api ile bazı test ve denemeler yaptık. Artık google oauth ile oturum açmayı yapabiliyoruz. CC Ads manager hesap altındaki hesapları çekip listeleyebiliyoruz. Hesapların kampanyalarını listeleyebiliyoruz. Girdiğimiz ip leri seçilen hesabın tüm kampanyalarından engelleyebiliyoruz. Bu denemelerden sonra artık bu projenin gerçek amacına hizmet etmesini sağlayalım.

Bizim sistemimizde supabase kullanacağız. supabase auth ve psql kullanılacaktır. Sunucu olarak Vercel kullanacağız. Bir kullanıcı bir veya birden fazla siteyi korumak için bizim adsGuardPro servisimizi kullanabilir. Bazı kullanıcılar sadece kendi sitelerini ekler, bazıları ajans gibi birden fazla siteyi korumak isteyebilir. Bunun için Bir kullanıcı bir veya daha fazla domain ekleyebilir. Her domain için bir kurulum yapmak gerekmektedir. Domain, Google ads ID si, domain koruma kurallarını ekler. Bu domain için ads api ile girilen ads hesabına bir davet kodu gider. Kullanıcı bu daveti onaylamalıdır. Ardından verdiğimiz tracking kodunu sitesine ekler. Bu kodu siteye eklemese bile trackingUrl sayesinde temel korumayı sağlayabiliriz. (giren kullanıcının ip, fingerprint idsini, user-agent vs. gibi gerekli bilgileri alır ve gerçek siteye yönlendiririz. Bu sayede sadece tracking URL ile bile bot korumasını yapabilmeliyiz. Ancak tracking scripti ile session takibi, kullanıcı ne yapmış vs. daha doğru bir analiz de yapabilmeliyiz.)

Siteye girenle birkaç yol ile girebilir. Google ads de reklama tıklamış olabilir, organik olarak google dan bulmuş ve girmiş olabilir, yada bir bot örn: google botu index için siteye gelmiş olabilir. Google botları gibi botları session takip etmeyeceğiz. Boşuna db şişirmeyelim. ip_whitelist bize engellenmeyecek ve takip edilmeyecek ip leri verecek.Bu bilinen zararsız botlara izin vermeliyiz. Ancak session kaydını vs de tutmayacağız ki google sürekli index için sitelere giriyor, db şişirmeyelim boş yere. En önemli olan ads den giren kullanıcılara dikkat etmeli ve zararlı ip leri googel ads api ile iplerini engellemeliyiz.

db.sql dosyasını incele. Bizim tablo yapımız orada gösteriliyor. Buna göre çalışmalıyız. Bir hata, eksiklik bulursan tablolarda güncelleyebiliriz. 


Bu proje clikCease benzeri bir bot engelleme servisi olacak. Google ads de reklamlara tıklayan bot ve rakipelrin tıklamalarını yakalayıp engellenmesini sağlamalıyız. Ancak bot ve rakip cihazların ip leri belli aralıklarla değişebildiği için bu bot sınıflandırma ve düzenli olarak güncel tehdit oluşturan ip yi ilgili domaine ait tüm kampanyadan engellemek gerekmektedir. Googel ads api ile ip engellemek için kampanya bazlı engelleme yapmamız gerekiyor. Tehdit oluşturan bir ip o google ads hesabındaki tüm kampanyalardan engellenmelidir. 


ClickCease çalışması için iki adet kurulum gerekmektedir. 

Tracking Installation
In order to start tracking clicks, we need to install a tracking code on your site.
ClickCease offers 2 methods to monitor your ad clicks. We advise applying both methods.

1. Tracking Code
This is your tracking code for all domains in your account. It goes right after the opening <body> tag.

      <!--  ClickCease.com tracking-->
      <script type='text/javascript'>var script = document.createElement('script');
      script.async = true; script.type = 'text/javascript';
      var target = 'https://www.clickcease.com/monitor/stat.js';
      script.src = target;var elem = document.head;elem.appendChild(script);
      </script>
      <noscript>
      <a href='https://www.clickcease.com' rel='nofollow'><img src='https://monitor.clickcease.com' alt='ClickCease'/></a>
      </noscript>
      <!--  ClickCease.com tracking-->


2. Tracking Template 
Watch the video to learn more
The tracking template is automatically installed on the Account Level of your Google Ads account after accepting the managerial request from ClickCease. Follow the below instructions if there is already a pre-existing code on your Google Ads account.

https://monitor.clickcease.com/tracker/?id=Cf53kZfIyzSOvI&adpos={adposition}&locphisical={loc_physical_ms}&locinterest={loc_interest_ms}&adgrp={adgroupid}&kw={keyword}&nw={network}&url={lpurl}&cpn={campaignid}&device={device}&ccpturl=bicilingir.com&pl={placement}



Bu setup mantığının aynısını bizde bu projede yapmalıyız. iki adet kurulum dosyamız olması gerekiyor. Biri Google ads de eklenecek olan trackingUrl, diğeri tüm sitelere eklenecek olan js dosyasıdır. 



🎯 ClickCease'in İki Aşamalı Tracking Sistemi
1. Tracking Template (Google Ads URL)

https://monitor.clickcease.com/tracker/?id=Cf53kZfIyzSOvI
&adpos={adposition}&locphisical={loc_physical_ms}...&url={lpurl}
```

**Ne İşe Yarar:**
- Kullanıcı Google Ads'a tıkladığında **İLK** ClickCease'in sunucusuna gelir
- Google Ads parametrelerini (gclid, campaign_id, keyword, etc.) yakallar
- Sunucu tarafında bir **click_id** oluşturur
- Cookie/localStorage'a bu click_id'yi kaydeder
- Ardından kullanıcıyı gerçek siteye (`{lpurl}`) redirect eder

**Akış:**
```
User clicks Ad → ClickCease Server → (saves click data + sets cookie) → Your Site


2. On-Site JavaScript (Site içindeki script)
<script src='https://www.clickcease.com/monitor/stat.js'></script>
```

**Ne İşe Yarar:**
- Site yüklendikinde çalışır
- Cookie'den click_id'yi okur (eğer Ads'dan geldiyse)
- FingerprintJS ile cihaz parmak izi toplar
- Kullanıcı davranışlarını izler (scroll, click, time on site)
- Bu verileri ClickCease'e gönderir
- **Bot skorunu hesaplamak için gerekli davranış verilerini toplar**

## 🔄 Bizim Sistemimizde Nasıl Çalışacak?

### **Senaryo 1: Google Ads'dan Gelen Trafik**
```
1. User clicks Ad
   ↓
2. Google Ads Tracking Template redirects to:
   https://yourdomain.com/tracker?id={tracking_id}&gclid={gclid}&cpn={campaignid}...
   ↓
3. Your Server:
   - Creates ad_click record
   - Generates unique click_id
   - Sets cookie: cc_click_id=abc123
   - Redirects to actual landing page
   ↓
4. Landing page loads with tracking script
   ↓
5. Tracking script:
   - Reads cc_click_id cookie
   - Collects fingerprint
   - Links session to ad_click
   - Starts behavior tracking
```

### **Senaryo 2: Organik/Direct Trafik**
```
1. User visits site directly
   ↓
2. No tracking template involved
   ↓
3. Landing page loads with tracking script
   ↓
4. Tracking script:
   - No cc_click_id cookie found
   - Still collects fingerprint
   - Creates session but NOT linked to ad_click
   - Behavior tracked but NOT counted for ad blocking
```

### **Senaryo 3: Search Engine Bots**
```
1. Googlebot visits site
   ↓
2. IP check: Is in ip_whitelist?
   ↓
3. If YES: Skip all tracking/blocking
   ↓
4. If NO: Track but mark as "bot" in user-agent check




Example API Endpoints
1. Tracker Redirect Endpoint /api/tracker
// pages/api/tracker.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    id: trackingId,
    gclid,
    cpn: campaignId,
    adgrp: adGroupId,
    kw: keyword,
    nw: network,
    adpos: adPosition,
    device,
    pl: placement,
    locphisical: locPhysical,
    locinterest: locInterest,
    url: finalUrl
  } = req.query;

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  // 1. Find domain by tracking_id
  const domain = await supabase
    .from('domains')
    .select('id')
    .eq('tracking_id', trackingId)
    .single();

  if (!domain.data) {
    return res.redirect(finalUrl as string);
  }

  // 2. Check IP whitelist (Googlebot, etc.)
  const isWhitelisted = await checkIPWhitelist(ip);
  if (isWhitelisted) {
    return res.redirect(finalUrl as string);
  }

  // 3. Generate unique click_id
  const clickId = nanoid(32);

  // 4. Create ad_click record
  await supabase.from('ad_clicks').insert({
    domain_id: domain.data.id,
    ip,
    click_id: clickId,
    gclid,
    campaign_id: campaignId,
    ad_group_id: adGroupId,
    keyword,
    network,
    ad_position: adPosition,
    device_type: device,
    placement,
    loc_physical: locPhysical,
    loc_interest: locInterest,
    final_url: finalUrl,
    user_agent: userAgent,
    is_bot_user_agent: detectBotUserAgent(userAgent),
    referrer: req.headers.referer
  });

  // 5. Set cookie for on-site tracking to link session
  res.setHeader('Set-Cookie', [
    `cc_click_id=${clickId}; Path=/; Max-Age=86400; SameSite=Lax`,
    `cc_tracking_id=${trackingId}; Path=/; Max-Age=86400; SameSite=Lax`
  ]);

  // 6. Redirect to actual landing page
  res.redirect(307, finalUrl as string);
}

2. On-Site Tracking Script /api/track/init
// public/js/tracker.js
(function() {
  'use strict';
  
  // Read cookies
  const clickId = getCookie('cc_click_id');
  const trackingId = getCookie('cc_tracking_id');
  
  // Initialize FingerprintJS
  const fpPromise = FingerprintJS.load();
  
  fpPromise.then(fp => fp.get()).then(result => {
    const fingerprintId = result.visitorId;
    
    // Initialize session
    fetch('/api/track/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        click_id: clickId,
        tracking_id: trackingId,
        fingerprint_id: fingerprintId,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        device_pixel_ratio: window.devicePixelRatio,
        landing_page: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        // Components from FingerprintJS
        components: result.components
      })
    }).then(res => res.json()).then(data => {
      const sessionId = data.session_id;
      
      // Start behavior tracking
      trackBehavior(sessionId, trackingId);
    });
  });
  
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
})();

3. Session Init Endpoint /api/track/init
// pages/api/track/init.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    click_id,
    tracking_id,
    fingerprint_id,
    screen_width,
    screen_height,
    device_pixel_ratio,
    landing_page,
    referrer,
    user_agent,
    components
  } = req.body;

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // 1. Get domain
  const domain = await supabase
    .from('domains')
    .select('id')
    .eq('tracking_id', tracking_id)
    .single();

  // 2. Get or create device
  let device = await supabase
    .from('devices')
    .select('id')
    .eq('fingerprint_id', fingerprint_id)
    .single();

  if (!device.data) {
    const deviceData = parseUserAgent(user_agent);
    device = await supabase.from('devices').insert({
      fingerprint_id,
      device_type: deviceData.type,
      os: deviceData.os,
      browser: deviceData.browser,
      screen_width,
      screen_height,
      screen_pixel_ratio,
      fingerprint_data: components
    }).select().single();
  }

  // 3. Get ad_click if exists
  let adClickId = null;
  let isAdTraffic = false;
  
  if (click_id) {
    const adClick = await supabase
      .from('ad_clicks')
      .select('id')
      .eq('click_id', click_id)
      .single();
    
    if (adClick.data) {
      adClickId = adClick.data.id;
      isAdTraffic = true;
      
      // Update ad_click with device_id
      await supabase
        .from('ad_clicks')
        .update({ 
          device_id: device.data.id,
          session_linked: true,
          session_linked_at: new Date().toISOString()
        })
        .eq('id', adClickId);
    }
  }

  // 4. Create session
  const session = await supabase.from('sessions').insert({
    domain_id: domain.data.id,
    device_id: device.data.id,
    ip,
    ad_click_id: adClickId,
    is_ad_traffic: isAdTraffic,
    landing_page,
    referrer,
    gclid: extractGclid(landing_page)
  }).select().single();

  // 5. Update or create device_ip relationship
  await supabase.from('device_ips').upsert({
    device_id: device.data.id,
    ip,
    last_seen_at: new Date().toISOString()
  }, {
    onConflict: 'device_id,ip',
    ignoreDuplicates: false
  });

  // 6. Get or enrich IP location
  await enrichIPLocation(ip);

  res.json({ session_id: session.data.id, is_ad_traffic: isAdTraffic });
}
```

## 🎯 Google Ads Tracking Template Formatı
```
https://yourdomain.com/api/tracker?id={tracking_id}&gclid={gclid}&cpn={campaignid}&adgrp={adgroupid}&kw={keyword}&nw={network}&adpos={adposition}&device={device}&pl={placement}&locphisical={loc_physical_ms}&locinterest={loc_interest_ms}&url={lpurl}




🚫 Blocking Logic
SADECE is_ad_traffic = TRUE olan session'lar için:

-- Bot skorunu hesapla
UPDATE ip_threat_scores 
SET score = calculate_bot_score(session_data)
WHERE domain_id = $1 AND ip = $2;

-- Eğer threshold aşıldıysa blocklist'e ekle
INSERT INTO ip_blocklist (domain_id, ip, threat_level)
SELECT domain_id, ip, 'high'
FROM ip_threat_scores
WHERE domain_id = $1 
  AND ip = $2
  AND score > 70
  AND EXISTS (
    SELECT 1 FROM sessions 
    WHERE ip = $2 
      AND domain_id = $1 
      AND is_ad_traffic = TRUE  -- KRITIK!
  );




Bu örnekleri de göz önünde bulundurarak AdsGuardPro projemizi kodlayama başlayalım. Bir kullanıcı giriş ekranı yapabiliriz. Giren kullanıcı domainlerini listeleyebilir. Domain ekleyebilir. Eklediği domain ayarlarını görebilir ve güncelleyebilmelidir. Domain eklerken şu basamaklar olmalıdır: 
- Submit Google Ads ID, Approve Google Ads ID (Sadece talimatlar yaza -> ads hesabına gir, güvenlik altında -> Yömnetici sekmesi -> Onayla), Tracking Installation (Tracking code ve Google ads trackin Url installation talimatları ve gerekli kod ve url-> Kopyala butonu ile kopyalanabilir), Set Domain Rules (Kullanıcı istediği kadar domain rule ekleyebilir) Done

Örnek domain kuralları: 
Allow up to 1 ad click within (1 varsa gün saat dakika girmeye gerek yok. Bir defa girince ip engellenir.)
Allow up to 3 ad clicks within 15 days
Allow up to 2 ad clicks within 5 days
Allow up to 4 ad clicks within 100 days


Gerekli tracking code ve trackingUrl (https://monitor.clickcease.com/tracker/?id=Cf53kZfIyzSOvI) için gerekli endpointleri hazırla.
Kullanıcı login olabilmeli, gerekli ayarları yapabilmelidir. 