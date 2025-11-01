// public/js/tracker.js
// AdsGuardsPro On-Site Tracking Script - Yeni Yapı
// Tüm ziyaretçileri izler (ads/organik/direkt)

(function () {
    'use strict';

    // Konfigürasyon
    const CONFIG = {
        apiUrl: window.AGP_API_URL || (window.location.protocol + '//' + window.location.host),
        trackingId: window.AGP_TRACKING_ID || null,
        debug: window.AGP_DEBUG || false
    };

    // Debug log
    function log(...args) {
        if (CONFIG.debug) {
            console.log('[AdsGuardsPro]', ...args);
        }
    }

    // Cookie okuma
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    // Session ID localStorage'da sakla
    function getSessionId() {
        return sessionStorage.getItem('agp_session_id');
    }

    function setSessionId(sessionId) {
        sessionStorage.setItem('agp_session_id', sessionId);
    }

    // FingerprintJS CDN'den yükle
    function loadFingerprintJS() {
        return new Promise((resolve, reject) => {
            if (window.FingerprintJS) {
                resolve(window.FingerprintJS);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/dist/fp.min.js';
            script.async = true;
            script.onload = () => resolve(window.FingerprintJS);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Event tracking
    async function trackEvent(sessionId, eventType, eventData = {}) {
        try {
            await fetch(`${CONFIG.apiUrl}/api/track/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    event_type: eventType,
                    ...eventData
                })
            });

            log('Event kaydedildi:', eventType, eventData);
        } catch (error) {
            log('Event kaydetme hatası:', error);
        }
    }

    // Heartbeat (30 saniyede bir)
    function startHeartbeat(sessionId) {
        const heartbeatInterval = setInterval(() => {
            fetch(`${CONFIG.apiUrl}/api/track/heartbeat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ session_id: sessionId })
            }).catch(err => {
                log('Heartbeat hatası:', err);
            });
        }, 30000); // 30 saniye

        // Cleanup
        window.addEventListener('beforeunload', () => {
            clearInterval(heartbeatInterval);
        });

        return heartbeatInterval;
    }

    // Event listener'ları başlat
    function startEventTracking(sessionId) {
        log('Event tracking başlatılıyor...');

        // ═══════════════════════════════════════════════════════════
        // 1. Scroll Tracking
        // ═══════════════════════════════════════════════════════════
        let lastScrollPercent = 0;
        let scrollTimeout;

        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollPercent = Math.round(
                    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
                );

                // Her %25'te bir kaydet
                if (scrollPercent >= lastScrollPercent + 25) {
                    lastScrollPercent = Math.floor(scrollPercent / 25) * 25;
                    trackEvent(sessionId, 'scroll', {
                        scroll_px: window.scrollY,
                        scroll_percent: scrollPercent,
                        page_url: window.location.href
                    });
                }
            }, 150);
        });

        // ═══════════════════════════════════════════════════════════
        // 2. Click Tracking
        // ═══════════════════════════════════════════════════════════
        document.addEventListener('click', (e) => {
            const target = e.target;

            // Call button kontrolü (örnek class'lar)
            const isCallButton = target.matches('.call-btn, .ara-btn, .telefon-btn, [href^="tel:"]') ||
                target.closest('.call-btn, .ara-btn, .telefon-btn, [href^="tel:"]');

            trackEvent(sessionId, isCallButton ? 'call_button_click' : 'click', {
                click_x: e.clientX,
                click_y: e.clientY,
                target_element: target.tagName,
                target_href: target.href || null,
                target_text: target.innerText?.substring(0, 100) || null,
                page_url: window.location.href
            });
        });

        // ═══════════════════════════════════════════════════════════
        // 3. Form Submit Tracking
        // ═══════════════════════════════════════════════════════════
        document.addEventListener('submit', (e) => {
            const form = e.target;
            trackEvent(sessionId, 'form_submit', {
                target_element: form.id || form.className,
                event_data: {
                    form_id: form.id,
                    action: form.action
                },
                page_url: window.location.href
            });
        });

        // ═══════════════════════════════════════════════════════════
        // 4. Visibility Change Tracking
        // ═══════════════════════════════════════════════════════════
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                log('Sayfa gizlendi');
            } else {
                log('Sayfa aktif oldu');
                // Last activity güncelle
                fetch(`${CONFIG.apiUrl}/api/track/heartbeat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId })
                }).catch(() => { });
            }
        });

        // ═══════════════════════════════════════════════════════════
        // 5. Page Unload (Session End)
        // ═══════════════════════════════════════════════════════════
        window.addEventListener('beforeunload', () => {
            // Beacon API kullan (sayfa kapatılsa bile gönderir)
            const data = JSON.stringify({ session_id: sessionId });
            navigator.sendBeacon(`${CONFIG.apiUrl}/api/track/end`, data);
        });

        log('Event tracking başlatıldı');
    }

    // Ana tracking fonksiyonu
    async function initTracking() {
        try {
            log('Tracking başlatılıyor...');

            // Tracking ID kontrolü
            const trackingId = getCookie('cc_tracking_id') ||
                getCookie('agp_tracking_id') ||
                CONFIG.trackingId;

            if (!trackingId) {
                log('Tracking ID bulunamadı, tracking atlanıyor');
                return;
            }

            // Cookie'lerden ad click bilgisi al
            const adClickId = getCookie('cc_ad_click_id') || getCookie('agp_ad_click_id');

            log('Tracking başlatılıyor...', {
                trackingId: trackingId.substring(0, 10) + '...',
                hasAdClick: !!adClickId
            });

            // ═══════════════════════════════════════════════════════════
            // FingerprintJS Yükle ve Fingerprint Oluştur
            // ═══════════════════════════════════════════════════════════
            let fingerprintId = getCookie('cc_fingerprint') || getCookie('agp_fingerprint');
            let fingerprintData = null;

            if (!fingerprintId) {
                try {
                    const FingerprintJS = await loadFingerprintJS();
                    const fp = await FingerprintJS.load();
                    const result = await fp.get();

                    fingerprintId = `fp_${result.visitorId}`;
                    fingerprintData = result.components;

                    log('Client fingerprint oluşturuldu:', fingerprintId.substring(0, 15) + '...');
                } catch (error) {
                    log('FingerprintJS hatası:', error);
                    // Fallback: Basit fingerprint
                    fingerprintId = `fp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                }
            } else {
                log('Cookie\'den fingerprint alındı:', fingerprintId.substring(0, 15) + '...');
            }

            // ═══════════════════════════════════════════════════════════
            // Session Başlat
            // ═══════════════════════════════════════════════════════════
            const response = await fetch(`${CONFIG.apiUrl}/api/track/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tracking_id: trackingId,
                    ad_click_id: adClickId || null,
                    fingerprint_id: fingerprintId,
                    screen_width: window.screen.width,
                    screen_height: window.screen.height,
                    landing_page: window.location.href,
                    referrer: document.referrer,
                    fingerprint_data: fingerprintData
                })
            });

            const data = await response.json();

            if (data.skipped) {
                log('Session atlandı:', data.reason);
                return;
            }

            if (data.success) {
                const sessionId = data.session_id;
                setSessionId(sessionId);

                log('✅ Session oluşturuldu:', {
                    sessionId: sessionId.substring(0, 15) + '...',
                    isAdTraffic: data.is_ad_traffic,
                    trafficSource: data.traffic_source
                });

                // Event tracking'i başlat
                startEventTracking(sessionId);

                // Heartbeat başlat
                startHeartbeat(sessionId);

            } else {
                log('Session oluşturulamadı:', data.error);
            }

        } catch (error) {
            log('Tracking hatası:', error);
        }
    }

    // Sayfa yüklendiğinde tracking'i başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracking);
    } else {
        initTracking();
    }

    log('AdsGuardsPro Tracker yüklendi v2.0');
})();
