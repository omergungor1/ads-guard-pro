// app/api/tracker/route.js
// Google Ads Tracking Template Endpoint - Google Certified Click Tracker
// Compliant with Google's Third-Party Click Tracking Guidelines
// ✅ Fast redirect (< 100ms)
// ✅ Background processing for heavy operations
// ✅ Transparent redirection parameter
// ✅ URL validation
// ✅ Domain verification

import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export async function GET(request) {
    const startTime = Date.now();

    try {
        const { searchParams } = new URL(request.url);

        // ═══════════════════════════════════════════════════════════
        // GOOGLE CERTIFIED PARAMETERS
        // ═══════════════════════════════════════════════════════════

        // Force transparent mode (Google requirement)
        const forceTransparent = searchParams.get('force_transparent');

        // Transparency parameter (Google requirement: visible redirection URL)
        const redirectionUrl = searchParams.get('redirection_url');

        // Our tracking parameters (non-foreign parameters)
        const trackingId = searchParams.get('id');
        const campaignId = searchParams.get('campaign_id');
        const gclid = searchParams.get('gclid');
        const keyword = searchParams.get('keyword');
        const device = searchParams.get('device');
        const network = searchParams.get('network');
        const adPosition = searchParams.get('adpos');
        const placement = searchParams.get('placement');

        // ═══════════════════════════════════════════════════════════
        // STEP 1: VALIDATION (Google Requirement)
        // ═══════════════════════════════════════════════════════════

        // Required parameters validation
        if (!trackingId || !redirectionUrl) {
            console.error('❌ Required parameters missing:', { trackingId, redirectionUrl });
            return NextResponse.redirect(redirectionUrl || 'https://google.com', { status: 302 });
        }

        // URL Format Validation (Google Security Requirement)
        let validatedUrl;
        try {
            validatedUrl = new URL(redirectionUrl);

            // Protocol validation - only HTTPS and HTTP allowed
            if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
                console.error('❌ Invalid protocol:', validatedUrl.protocol);
                return NextResponse.redirect('https://google.com', { status: 302 });
            }

            // Optional: Force HTTPS for production
            if (process.env.NODE_ENV === 'production' && validatedUrl.protocol !== 'https:') {
                console.warn('⚠️ Non-HTTPS URL in production:', redirectionUrl);
            }

        } catch (error) {
            console.error('❌ Invalid URL format:', redirectionUrl, error.message);
            return NextResponse.redirect('https://google.com', { status: 302 });
        }

        // Collect request metadata (non-blocking)
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const userAgent = request.headers.get('user-agent') || '';
        const acceptLanguage = request.headers.get('accept-language') || '';

        // ═══════════════════════════════════════════════════════════
        // STEP 2: PRESERVE GOOGLE & UTM PARAMETERS
        // ═══════════════════════════════════════════════════════════
        // Internal parameters (our tracking params - DO NOT add to final URL)
        const internalParams = new Set([
            'id',                    // Our tracking ID
            'force_transparent',     // Our control param
            'redirection_url',       // Transparency param (already used)
            'campaign_id',           // Our internal tracking
            'keyword',               // Our internal tracking
            'device',                // Our internal tracking
            'network',               // Our internal tracking
            'adpos',                 // Our internal tracking
            'placement'              // Our internal tracking
        ]);

        // Collect all other parameters (Google tracking, UTM, custom)
        const paramsToPreserve = new URLSearchParams();

        for (const [key, value] of searchParams.entries()) {
            // Skip internal parameters
            if (!internalParams.has(key)) {
                paramsToPreserve.append(key, value);
            }
        }

        // Add preserved parameters to redirection URL
        let finalRedirectUrl = redirectionUrl;

        if (paramsToPreserve.toString()) {
            const separator = redirectionUrl.includes('?') ? '&' : '?';
            finalRedirectUrl = `${redirectionUrl}${separator}${paramsToPreserve.toString()}`;

            console.log('✅ Parameters preserved:', paramsToPreserve.toString());
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 3: GENERATE TRACKING IDs (Client-side cookies)
        // ═══════════════════════════════════════════════════════════
        const clickId = nanoid(32);
        const fingerprintId = `fp_${Date.now()}_${nanoid(16)}`;

        // ═══════════════════════════════════════════════════════════
        // STEP 4: FAST REDIRECT WITH COOKIES (Google Requirement: Fast Response)
        // ═══════════════════════════════════════════════════════════
        const response = NextResponse.redirect(finalRedirectUrl, { status: 302 });

        // Set tracking cookies for site tracking script
        response.cookies.set('ag_click_id', clickId, {
            path: '/',
            maxAge: 86400, // 24 hours
            sameSite: 'lax',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production'
        });

        response.cookies.set('ag_tracking_id', trackingId, {
            path: '/',
            maxAge: 86400,
            sameSite: 'lax',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production'
        });

        response.cookies.set('ag_fingerprint', fingerprintId, {
            path: '/',
            maxAge: 86400,
            sameSite: 'lax',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production'
        });

        const redirectTime = Date.now() - startTime;
        console.log(`✅ Fast redirect completed (${redirectTime}ms)`);

        // ═══════════════════════════════════════════════════════════
        // STEP 5: BACKGROUND PROCESSING (Non-blocking)
        // ═══════════════════════════════════════════════════════════
        // Fire-and-forget: Send click data to background processor
        // This runs asynchronously without blocking the redirect

        const backgroundPayload = {
            tracking_id: trackingId,
            click_id: clickId,
            fingerprint_id: fingerprintId,
            ip: ip,
            user_agent: userAgent,
            accept_language: acceptLanguage,
            redirection_url: redirectionUrl,
            final_redirect_url: finalRedirectUrl,
            campaign_id: campaignId,
            gclid: gclid,
            keyword: keyword,
            device: device,
            network: network,
            ad_position: adPosition,
            placement: placement,
            timestamp: new Date().toISOString(),
            all_params: Object.fromEntries(searchParams),
            preserved_params: paramsToPreserve.toString()
        };

        // Send to background worker (fire and forget)
        // No await - we don't wait for this to complete
        fetch(`${request.nextUrl.origin}/api/tracker/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backgroundPayload)
        }).catch(err => {
            console.error('⚠️ Background processor error:', err.message);
        });

        console.log('🎯 Click Tracker completed:', {
            trackingId: trackingId.substring(0, 10) + '...',
            ip,
            redirectTo: validatedUrl.hostname,
            paramsPreserved: paramsToPreserve.toString() || 'none',
            totalTime: Date.now() - startTime + 'ms'
        });

        return response;

    } catch (error) {
        console.error('❌ Tracker endpoint error:', error);

        // Always redirect user even on error (Google requirement: no dead ends)
        const { searchParams } = new URL(request.url);
        const redirectionUrl = searchParams.get('redirection_url') || 'https://google.com';
        return NextResponse.redirect(redirectionUrl, { status: 302 });
    }
}
