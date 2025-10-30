// public/js/tracker.js
// AdsGuardPro On-Site Tracking Script

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
            console.log('[AGP Tracker]', ...args);
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
        return localStorage.getItem('agp_session_id');
    }

    function setSessionId(sessionId) {
        localStorage.setItem('agp_session_id', sessionId);
    }

    // Ana tracking fonksiyonu
    async function initTracking() {
        try {
            // Cookie'lerden click_id ve tracking_id al
            const clickId = getCookie('agp_click_id');
            const trackingId = getCookie('agp_tracking_id') || CONFIG.trackingId;

            if (!trackingId) {
                log('Tracking ID bulunamadı, tracking atlanıyor');
                return;
            }

            log('Tracking başlatılıyor...', { clickId, trackingId });

            // FingerprintJS yükle ve fingerprint oluştur
            const FingerprintJS = await loadFingerprintJS();
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            const fingerprintId = result.visitorId;

            log('Fingerprint ID:', fingerprintId);

            // Session başlat
            const response = await fetch(`${CONFIG.apiUrl}/api/track/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
                    components: result.components
                })
            });

            const data = await response.json();

            if (data.success) {
                const sessionId = data.session_id;
                setSessionId(sessionId);

                log('Session oluşturuldu:', sessionId, 'Ad Traffic:', data.is_ad_traffic);

                // Event tracking'i başlat
                startEventTracking(sessionId);

                // İlk page view event'ini kaydet
                trackEvent(sessionId, 'page_view', {
                    page_url: window.location.href
                });
            } else {
                log('Session oluşturulamadı:', data.error);
            }

        } catch (error) {
            log('Tracking hatası:', error);
        }
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
    async function trackEvent(sessionId, eventType, eventData) {
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

    // Event listener'ları başlat
    function startEventTracking(sessionId) {
        // Scroll tracking
        let lastScrollPercent = 0;
        let scrollTimeout;

        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollPercent = Math.round(
                    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
                );

                // Her %10'da bir kaydet
                if (scrollPercent > lastScrollPercent && scrollPercent % 10 === 0) {
                    lastScrollPercent = scrollPercent;
                    trackEvent(sessionId, 'scroll', {
                        scroll_px: window.scrollY,
                        scroll_percent: scrollPercent,
                        page_url: window.location.href
                    });
                }
            }, 150);
        });

        // Click tracking
        document.addEventListener('click', (e) => {
            const target = e.target;
            trackEvent(sessionId, 'click', {
                click_x: e.clientX,
                click_y: e.clientY,
                target_element: target.tagName,
                target_href: target.href || null,
                target_text: target.innerText?.substring(0, 100) || null,
                page_url: window.location.href
            });
        });

        // Visibility change tracking
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                trackEvent(sessionId, 'visibility_change', {
                    visibility_percentage: 0,
                    page_url: window.location.href
                });
            } else {
                trackEvent(sessionId, 'visibility_change', {
                    visibility_percentage: 100,
                    page_url: window.location.href
                });
            }
        });

        // Page unload (session end)
        window.addEventListener('beforeunload', () => {
            // Session duration hesapla ve kaydet
            const sessionStart = performance.timing.navigationStart;
            const durationSeconds = Math.round((Date.now() - sessionStart) / 1000);

            // Beacon API kullanarak (page kapatılsa bile gönderir)
            navigator.sendBeacon(
                `${CONFIG.apiUrl}/api/track/event`,
                JSON.stringify({
                    session_id: sessionId,
                    event_type: 'page_view',
                    event_data: {
                        duration_seconds: durationSeconds,
                        final_url: window.location.href
                    }
                })
            );
        });

        log('Event tracking başlatıldı');
    }

    // Sayfa yüklendiğinde tracking'i başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracking);
    } else {
        initTracking();
    }

    log('AdsGuardPro Tracker yüklendi');
})();

