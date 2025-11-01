-- ============================================
-- AdsGuardsPro MVP - Database Schema
-- Ultra Aggressive IP Blocking System
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE event_type AS ENUM (
  'page_view',
  'click',
  'scroll',
  'conversion',
  'form_submit',
  'button_click',
  'call_button_click'
);

CREATE TYPE traffic_source AS ENUM (
  'google_ads',
  'organic',
  'direct',
  'referral',
  'social'
);

CREATE TYPE campaign_added_method AS ENUM (
  'manual',           -- Manuel olarak eklendi
  'auto_detected',    -- Tracking URL'den otomatik tespit edildi
  'sync'              -- Senkronizasyon butonu ile çekildi
);

-- ============================================
-- 1. USER PROFILES
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  max_domains INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_active ON profiles(is_active) WHERE is_active = TRUE;

-- ============================================
-- 2. DOMAINS
-- ============================================

CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  tracking_id VARCHAR(32) UNIQUE NOT NULL,
  ads_account_id TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  timezone TEXT DEFAULT 'UTC',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_domains_profile ON domains(profile_id);
CREATE INDEX idx_domains_tracking ON domains(tracking_id);
CREATE INDEX idx_domains_active ON domains(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_domains_ads_account ON domains(ads_account_id) WHERE ads_account_id IS NOT NULL;

-- ============================================
-- 3. DEVICES
-- ============================================

CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_id TEXT UNIQUE NOT NULL,
  
  device_type TEXT,
  os TEXT,
  browser TEXT,
  screen_width INT,
  screen_height INT,
  
  fingerprint_data JSONB,
  
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_devices_fingerprint ON devices(fingerprint_id);
CREATE INDEX idx_devices_last_seen ON devices(last_seen_at DESC);

-- ============================================
-- 4. IP INFO (Her gelen IP kaydedilir)
-- ============================================

CREATE TABLE ip_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip INET NOT NULL,  -- UNIQUE DEĞİL, her request yeni kayıt
  
  -- IP-API response fields
  country_code CHAR(2),
  city TEXT,
  district TEXT,
  zip TEXT,
  lat NUMERIC(10, 7),
  lon NUMERIC(10, 7),
  isp TEXT,
  
  -- Threat indicators
  is_mobile BOOLEAN DEFAULT FALSE,
  is_vpn BOOLEAN DEFAULT FALSE,
  is_proxy BOOLEAN DEFAULT FALSE,
  is_hosting BOOLEAN DEFAULT FALSE,
  
  -- Browser & User Agent (her request farklı olabilir)
  browser TEXT,
  user_agent TEXT,
  
  -- API error handling
  api_error BOOLEAN DEFAULT FALSE,
  api_error_code TEXT,
  api_error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ip_info_ip ON ip_info(ip);
CREATE INDEX idx_ip_info_created ON ip_info(created_at DESC);
CREATE INDEX idx_ip_info_error ON ip_info(api_error) WHERE api_error = TRUE;
CREATE INDEX idx_ip_info_country ON ip_info(country_code);

-- ============================================
-- 5. IP WHITELIST (Global)
-- ============================================

CREATE TABLE ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip INET NOT NULL,
  ip_range CIDR,
  source TEXT,
  note TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(ip)
);

CREATE INDEX idx_ip_whitelist_ip ON ip_whitelist USING hash(ip);
CREATE INDEX idx_ip_whitelist_range ON ip_whitelist USING gist(ip_range inet_ops) 
  WHERE ip_range IS NOT NULL;
CREATE INDEX idx_ip_whitelist_active ON ip_whitelist(is_active) WHERE is_active = TRUE;

-- ============================================
-- 6. ADS CAMPAIGNS
-- ============================================

CREATE TABLE ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  
  -- Nasıl eklendi?
  added_method campaign_added_method NOT NULL,
  
  -- Sync durumu
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(domain_id, campaign_id)
);

CREATE INDEX idx_ads_campaigns_domain ON ads_campaigns(domain_id);
CREATE INDEX idx_ads_campaigns_method ON ads_campaigns(added_method);
CREATE INDEX idx_ads_campaigns_active ON ads_campaigns(is_active) WHERE is_active = TRUE;

-- ============================================
-- 7. AD CLICKS (Tracking URL parametreleri)
-- ============================================

CREATE TABLE ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  campaign_id TEXT,
  ip_info_id UUID REFERENCES ip_info(id) ON DELETE SET NULL,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  
  -- Google Ads parametreleri
  gclid TEXT,
  keyword TEXT,
  ad_position TEXT,
  device_type TEXT,
  network TEXT,
  placement TEXT,
  
  -- RAW tüm parametreler (JSON)
  raw_params JSONB,
  
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_clicks_domain ON ad_clicks(domain_id);
CREATE INDEX idx_ad_clicks_campaign ON ad_clicks(campaign_id);
CREATE INDEX idx_ad_clicks_ip_info ON ad_clicks(ip_info_id);
CREATE INDEX idx_ad_clicks_device ON ad_clicks(device_id);
CREATE INDEX idx_ad_clicks_time ON ad_clicks(clicked_at DESC);
CREATE INDEX idx_ad_clicks_gclid ON ad_clicks(gclid) WHERE gclid IS NOT NULL;

-- ============================================
-- 8. BLOCKED IPS (Domain bazlı, tüm kampanyalara uygulanır)
-- ============================================

CREATE TABLE blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  ip INET NOT NULL,
  ip_info_id UUID REFERENCES ip_info(id) ON DELETE SET NULL,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  
  -- Google Ads sync durumu
  synced_to_ads BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMPTZ,
  sync_error TEXT,
  
  -- İstatistik
  block_count INT DEFAULT 1,
  
  -- Timestamp
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Domain bazlı unique (tüm kampanyalarda aynı IP engellenir)
  UNIQUE(domain_id, ip)
);

CREATE INDEX idx_blocked_ips_domain ON blocked_ips(domain_id);
CREATE INDEX idx_blocked_ips_ip ON blocked_ips(ip);
CREATE INDEX idx_blocked_ips_sync_pending ON blocked_ips(domain_id, synced_to_ads) 
  WHERE synced_to_ads = FALSE;
CREATE INDEX idx_blocked_ips_blocked_at ON blocked_ips(domain_id, blocked_at DESC);
CREATE INDEX idx_blocked_ips_last_seen ON blocked_ips(last_seen_at DESC);

-- ============================================
-- 9. SESSIONS
-- ============================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  ip_info_id UUID REFERENCES ip_info(id) ON DELETE SET NULL,
  ad_click_id UUID REFERENCES ad_clicks(id) ON DELETE SET NULL,
  
  -- Trafik bilgisi
  is_ad_traffic BOOLEAN DEFAULT FALSE,
  traffic_source traffic_source,
  
  -- Session timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  
  -- Browser bilgisi
  browser TEXT,
  user_agent TEXT,
  
  -- Referrer bilgisi
  referrer TEXT,
  landing_page TEXT,
  gclid TEXT
);

CREATE INDEX idx_sessions_domain ON sessions(domain_id);
CREATE INDEX idx_sessions_device ON sessions(device_id);
CREATE INDEX idx_sessions_ip_info ON sessions(ip_info_id);
CREATE INDEX idx_sessions_ad_click ON sessions(ad_click_id) WHERE ad_click_id IS NOT NULL;
CREATE INDEX idx_sessions_ad_traffic ON sessions(domain_id, is_ad_traffic);
CREATE INDEX idx_sessions_traffic_source ON sessions(domain_id, traffic_source);
CREATE INDEX idx_sessions_started ON sessions(domain_id, started_at DESC);
CREATE INDEX idx_sessions_active ON sessions(domain_id, last_activity_at DESC) 
  WHERE ended_at IS NULL;

-- ============================================
-- 10. SESSION EVENTS
-- ============================================

CREATE TABLE session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  event_type event_type NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Event data
  page_url TEXT,
  scroll_px INT,
  scroll_percent INT,
  click_x INT,
  click_y INT,
  target_element TEXT,
  target_text TEXT,
  target_href TEXT,
  
  -- Custom event data
  event_data JSONB
);

CREATE INDEX idx_session_events_session ON session_events(session_id);
CREATE INDEX idx_session_events_type ON session_events(session_id, event_type);
CREATE INDEX idx_session_events_time ON session_events(occurred_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_campaigns_updated_at BEFORE UPDATE ON ads_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update device last_seen_at
CREATE OR REPLACE FUNCTION update_device_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE devices 
  SET last_seen_at = NOW() 
  WHERE id = NEW.device_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_device_on_session AFTER INSERT ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_device_last_seen();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Google/Bing bot whitelist
INSERT INTO ip_whitelist (ip, source, note, ip_range) VALUES
  ('66.249.64.0'::inet, 'google', 'Googlebot', '66.249.64.0/19'::cidr),
  ('66.102.0.0'::inet, 'google', 'Googlebot', '66.102.0.0/20'::cidr),
  ('40.77.167.0'::inet, 'bing', 'Bingbot', '40.77.167.0/24'::cidr),
  ('207.46.13.0'::inet, 'bing', 'Bingbot', '207.46.13.0/24'::cidr);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- IP Whitelist kontrolü (INET/CIDR ile)
CREATE OR REPLACE FUNCTION check_ip_whitelist(check_ip TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM ip_whitelist
    WHERE is_active = TRUE
      AND (
        ip = check_ip::inet
        OR (ip_range IS NOT NULL AND check_ip::inet <<= ip_range)
      )
  );
END;
$$ LANGUAGE plpgsql;

-- 500 IP Limit: Domain bazlı en son 500 IP'yi al
CREATE OR REPLACE FUNCTION get_top_500_ips_for_domain(p_domain_id UUID)
RETURNS TABLE (ip INET) AS $$
BEGIN
  RETURN QUERY
  SELECT b.ip
  FROM blocked_ips b
  WHERE b.domain_id = p_domain_id
  ORDER BY b.blocked_at DESC
  LIMIT 500;
END;
$$ LANGUAGE plpgsql;

-- Eski IP'leri temizle (500'den fazla ise)
CREATE OR REPLACE FUNCTION cleanup_old_blocked_ips(p_domain_id UUID)
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  WITH ranked_ips AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY blocked_at DESC) as rn
    FROM blocked_ips
    WHERE domain_id = p_domain_id
  )
  DELETE FROM blocked_ips
  WHERE id IN (
    SELECT id FROM ranked_ips WHERE rn > 500
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

-- Domain başına engellenen IP istatistikleri
CREATE VIEW domain_blocked_stats AS
SELECT 
  d.id as domain_id,
  d.domain,
  COUNT(DISTINCT b.ip) as total_blocked_ips,
  COUNT(DISTINCT CASE WHEN b.synced_to_ads THEN b.ip END) as synced_ips,
  COUNT(DISTINCT CASE WHEN NOT b.synced_to_ads THEN b.ip END) as pending_ips,
  SUM(b.block_count) as total_blocks,
  MAX(b.last_seen_at) as last_block_at
FROM domains d
LEFT JOIN blocked_ips b ON d.id = b.domain_id
WHERE d.is_active = TRUE
GROUP BY d.id, d.domain;

-- Kampanya başına tıklama istatistikleri
CREATE VIEW campaign_click_stats AS
SELECT 
  d.id as domain_id,
  d.domain,
  ac.campaign_id,
  ac.campaign_name,
  ac.added_method,
  COUNT(adc.id) as total_clicks,
  COUNT(DISTINCT adc.ip_info_id) as unique_ips,
  MAX(adc.clicked_at) as last_click_at
FROM domains d
JOIN ads_campaigns ac ON d.id = ac.domain_id
LEFT JOIN ad_clicks adc ON ac.domain_id = adc.domain_id 
  AND ac.campaign_id = adc.campaign_id
WHERE d.is_active = TRUE
  AND ac.is_active = TRUE
GROUP BY d.id, d.domain, ac.campaign_id, ac.campaign_name, ac.added_method;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE profiles IS 'User accounts';
COMMENT ON TABLE domains IS 'Customer websites/domains';
COMMENT ON TABLE devices IS 'Tracked devices via FingerprintJS';
COMMENT ON TABLE ip_info IS 'IP information cache from IP-API (every request creates new record)';
COMMENT ON TABLE ip_whitelist IS 'Global IP whitelist (search bots, etc)';
COMMENT ON TABLE ads_campaigns IS 'Google Ads campaigns (manual import or auto-detected)';
COMMENT ON TABLE ad_clicks IS 'Ad clicks from tracking URL with full parameters';
COMMENT ON TABLE blocked_ips IS 'Blocked IPs per domain (applies to ALL campaigns in domain)';
COMMENT ON TABLE sessions IS 'User sessions (both ad traffic and organic)';
COMMENT ON TABLE session_events IS 'Session behavior events';

COMMENT ON COLUMN ip_info.ip IS 'NOT UNIQUE - every request creates new record for tracking IP changes';
COMMENT ON COLUMN ip_info.api_error IS 'TRUE if IP-API call failed';
COMMENT ON COLUMN blocked_ips.domain_id IS '500 IP limit is per domain, applies to ALL campaigns';
COMMENT ON COLUMN blocked_ips.synced_to_ads IS 'FALSE if not yet synced to Google Ads API';
COMMENT ON COLUMN ads_campaigns.added_method IS 'manual=fetched via API, auto_detected=from tracking URL';
COMMENT ON COLUMN sessions.is_ad_traffic IS 'TRUE if came from Google Ads (has ad_click_id)';

-- ============================================
-- END OF SCHEMA
-- ============================================


CREATE TABLE google_oauth_tokens (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
access_token TEXT NOT NULL,
refresh_token TEXT NOT NULL,
token_expiry TIMESTAMPTZ NOT NULL,
mcc_customer_id TEXT NOT NULL,
authorized_email TEXT NOT NULL,
scopes TEXT[] NOT NULL,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);