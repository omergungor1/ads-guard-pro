// app/api/tracker/process/route.js
// Background Click Processor - Handles all heavy operations
// This runs asynchronously without blocking user redirects
// ✅ IP blocking
// ✅ Database logging
// ✅ Google Ads API sync
// ✅ Campaign auto-detection

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';
import {
    checkIPWhitelist,
    createIPInfo,
    upsertDevice,
    parseUserAgent
} from '@/lib/helpers';
import { GoogleAdsClientOfficial } from '@/lib/google-ads-client-official';

export async function POST(request) {
    const startTime = Date.now();

    try {
        const payload = await request.json();

        const {
            tracking_id,
            click_id,
            fingerprint_id,
            ip,
            user_agent,
            accept_language,
            redirection_url,
            campaign_id,
            gclid,
            keyword,
            device,
            network,
            ad_position,
            placement,
            timestamp,
            all_params
        } = payload;

        console.log('🔄 Background processor started:', {
            tracking_id: tracking_id?.substring(0, 10) + '...',
            ip
        });

        // ═══════════════════════════════════════════════════════════
        // STEP 1: Domain Lookup
        // ═══════════════════════════════════════════════════════════
        const { data: domain, error: domainError } = await supabaseAdmin
            .from('domains')
            .select('id, domain, is_active, ads_account_id')
            .eq('tracking_id', tracking_id)
            .eq('is_active', true)
            .single();

        if (domainError || !domain) {
            console.error('❌ Domain not found:', tracking_id);
            return NextResponse.json({
                success: false,
                error: 'Domain not found'
            }, { status: 404 });
        }

        console.log('✅ Domain found:', domain.domain);

        // ═══════════════════════════════════════════════════════════
        // STEP 2: Domain Verification (Google Security Requirement)
        // ═══════════════════════════════════════════════════════════
        try {
            const targetUrl = new URL(redirection_url);
            const targetDomain = targetUrl.hostname.replace(/^www\./, '');
            const registeredDomain = domain.domain.replace(/^www\./, '');

            if (targetDomain !== registeredDomain && !targetDomain.endsWith('.' + registeredDomain)) {
                console.warn('⚠️ Domain mismatch:', {
                    registered: registeredDomain,
                    target: targetDomain
                });
            } else {
                console.log('✅ Domain verified');
            }
        } catch (error) {
            console.error('⚠️ Domain verification failed:', error.message);
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 3: IP Whitelist Check
        // ═══════════════════════════════════════════════════════════
        const isWhitelisted = await checkIPWhitelist(ip);

        if (isWhitelisted) {
            console.log('🤖 Whitelisted IP (Googlebot etc.), skipping blocking:', ip);
            return NextResponse.json({
                success: true,
                skipped: true,
                reason: 'IP whitelisted'
            });
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 4: IP Info Lookup (External API call)
        // ═══════════════════════════════════════════════════════════
        const ipInfo = await createIPInfo(ip, user_agent);

        if (!ipInfo) {
            console.warn('⚠️ IP info creation failed, continuing...');
        } else {
            console.log('✅ IP info created:', {
                id: ipInfo.id,
                city: ipInfo.city,
                isp: ipInfo.isp,
                isHosting: ipInfo.is_hosting
            });
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 5: Device Record
        // ═══════════════════════════════════════════════════════════
        const device_record = await upsertDevice(fingerprint_id, user_agent);

        if (!device_record) {
            console.warn('⚠️ Device record creation failed');
        } else {
            console.log('✅ Device recorded:', device_record.id);
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 6: Campaign Auto-Detection
        // ═══════════════════════════════════════════════════════════
        let campaign = null;

        if (campaign_id) {
            const { data: existingCampaign } = await supabaseAdmin
                .from('ads_campaigns')
                .select('*')
                .eq('domain_id', domain.id)
                .eq('campaign_id', campaign_id)
                .single();

            if (existingCampaign) {
                campaign = existingCampaign;
                console.log('✅ Campaign exists:', campaign.campaign_name || campaign_id);
            } else {
                // New campaign detected - auto-add
                const { data: newCampaign, error: campaignError } = await supabaseAdmin
                    .from('ads_campaigns')
                    .insert({
                        domain_id: domain.id,
                        campaign_id: campaign_id,
                        campaign_name: null, // Will be fetched from Google Ads API later
                        added_method: 'auto_detected',
                        is_active: true
                    })
                    .select()
                    .single();

                if (!campaignError && newCampaign) {
                    campaign = newCampaign;
                    console.log('🆕 NEW CAMPAIGN DETECTED:', campaign_id);
                } else {
                    console.error('⚠️ Campaign creation failed:', campaignError);
                }
            }
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 7: Log Ad Click
        // ═══════════════════════════════════════════════════════════
        const { data: adClick, error: clickError } = await supabaseAdmin
            .from('ad_clicks')
            .insert({
                domain_id: domain.id,
                campaign_id: campaign_id,
                ip_info_id: ipInfo?.id || null,
                device_id: device_record?.id || null,
                gclid: gclid,
                keyword: keyword,
                ad_position: ad_position,
                device_type: device,
                network: network,
                placement: placement,
                raw_params: all_params
            })
            .select()
            .single();

        if (clickError) {
            console.error('❌ Ad click logging failed:', clickError);
        } else {
            console.log('✅ Ad click logged:', adClick.id);
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 8: Block IP (Add to blocked_ips table)
        // ═══════════════════════════════════════════════════════════
        const { data: blockedIp, error: blockError } = await supabaseAdmin
            .from('blocked_ips')
            .upsert(
                {
                    domain_id: domain.id,
                    ip: ip,
                    ip_info_id: ipInfo?.id || null,
                    device_id: device_record?.id || null,
                    block_count: 1,
                    synced_to_ads: false,
                    last_seen_at: timestamp || new Date().toISOString()
                },
                {
                    onConflict: 'domain_id,ip',
                    ignoreDuplicates: false
                }
            )
            .select()
            .single();

        if (blockError) {
            console.error('❌ IP blocking failed:', blockError);
        } else {
            // Update block count if IP was already blocked
            if (blockedIp && blockedIp.block_count > 1) {
                await supabaseAdmin
                    .from('blocked_ips')
                    .update({
                        block_count: blockedIp.block_count + 1,
                        last_seen_at: timestamp || new Date().toISOString()
                    })
                    .eq('id', blockedIp.id);
            }
            console.log('🚫 IP blocked:', ip);
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 9: Sync to Google Ads API (All Active Campaigns)
        // ═══════════════════════════════════════════════════════════
        if (domain.ads_account_id && blockedIp) {
            try {
                // Get Google Ads account credentials
                const { data: adsAccount } = await supabaseAdmin
                    .from('google_oauth_tokens')
                    .select('*')
                    .eq('is_active', true)
                    .single();

                if (adsAccount) {
                    // Get all active campaigns for this domain
                    const { data: allCampaigns } = await supabaseAdmin
                        .from('ads_campaigns')
                        .select('campaign_id')
                        .eq('domain_id', domain.id)
                        .eq('is_active', true);

                    if (allCampaigns && allCampaigns.length > 0) {
                        console.log('🔑 MCC Customer ID:', adsAccount.mcc_customer_id);
                        console.log('🔑 Target Customer ID:', domain.ads_account_id);

                        const googleAdsClient = new GoogleAdsClientOfficial(
                            adsAccount.access_token,
                            adsAccount.refresh_token,
                            adsAccount.mcc_customer_id || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
                        );

                        console.log(`📤 Syncing IP exclusion to ${allCampaigns.length} campaigns...`);

                        // Add IP exclusion to each campaign
                        let successCount = 0;
                        let errorMessages = [];

                        for (const camp of allCampaigns) {
                            try {
                                await googleAdsClient.addIpExclusions(
                                    domain.ads_account_id,
                                    camp.campaign_id,
                                    [ip]
                                );
                                successCount++;
                            } catch (error) {
                                console.error(`❌ Campaign ${camp.campaign_id} sync failed:`, error.message);
                                errorMessages.push(`${camp.campaign_id}: ${error.message}`);
                            }
                        }

                        if (successCount > 0) {
                            // Update sync status
                            await supabaseAdmin
                                .from('blocked_ips')
                                .update({
                                    synced_to_ads: successCount === allCampaigns.length,
                                    synced_at: new Date().toISOString(),
                                    sync_error: errorMessages.length > 0 ? errorMessages.join('; ') : null
                                })
                                .eq('id', blockedIp.id);

                            // Update campaign sync timestamp
                            await supabaseAdmin
                                .from('ads_campaigns')
                                .update({ last_sync_at: new Date().toISOString() })
                                .eq('domain_id', domain.id)
                                .in('campaign_id', allCampaigns.map(c => c.campaign_id));

                            console.log(`✅ IP synced to ${successCount}/${allCampaigns.length} campaigns`);
                        } else {
                            throw new Error('Failed to sync IP to any campaign');
                        }
                    } else {
                        console.warn('⚠️ No active campaigns found');
                    }
                } else {
                    console.warn('⚠️ Google Ads account not found');
                }
            } catch (error) {
                console.error('❌ Google Ads API error:', error);

                // Log sync error
                if (blockedIp) {
                    await supabaseAdmin
                        .from('blocked_ips')
                        .update({
                            sync_error: error.message
                        })
                        .eq('id', blockedIp.id);
                }
            }
        }

        const processingTime = Date.now() - startTime;
        console.log(`✅ Background processing completed (${processingTime}ms):`, {
            domain: domain.domain,
            ip,
            blocked: !!blockedIp,
            adClickLogged: !!adClick
        });

        return NextResponse.json({
            success: true,
            processing_time_ms: processingTime,
            domain: domain.domain,
            ip_blocked: !!blockedIp,
            click_logged: !!adClick
        });

    } catch (error) {
        console.error('❌ Background processor error:', error);

        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

