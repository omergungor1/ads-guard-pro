-- ============================================
-- ClickCease Clone - Complete Database Schema
-- PostgreSQL + Supabase Compatible
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- ENUMS
-- ============================================

-- Event types for session tracking
CREATE TYPE event_type AS ENUM (
  'page_view',
  'click',
  'scroll',
  'conversion',
  'visibility_change',
  'rage_click',
  'mouse_move',
  'form_submit'
);

-- Threat levels for IP classification
CREATE TYPE threat_level AS ENUM (
  'safe',
  'low',
  'medium',
  'high',
  'critical'
);

-- Blocking modes for domain rules
CREATE TYPE blocking_mode AS ENUM (
  'passive',      -- Sadece izle, blokla değil
  'moderate',     -- Orta seviye blok
  'aggressive'    -- Agresif blok (1 click = block)
);

-- Location rule types
CREATE TYPE location_rule_type AS ENUM (
  'allow',
  'block'
);

-- Google Ads sync status
CREATE TYPE sync_status AS ENUM (
  'pending',
  'syncing',
  'synced',
  'failed'
);

-- ============================================
-- USER & PROFILE MANAGEMENT
-- ============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  company_name TEXT,
  max_domains INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_active ON profiles(is_active) WHERE is_active = TRUE;

-- ============================================
-- DOMAIN MANAGEMENT
-- ============================================

-- Domains (websites being tracked)
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  tracking_id VARCHAR(32) UNIQUE NOT NULL,
  ads_account_id TEXT,
  
  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  max_blocked_ips INT DEFAULT 500,
  timezone TEXT DEFAULT 'UTC',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_domain CHECK (domain ~* '^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$')
);

-- Domains indexes
CREATE INDEX idx_domains_profile ON domains(profile_id);
CREATE INDEX idx_domains_tracking ON domains(tracking_id);
CREATE INDEX idx_domains_active ON domains(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_domains_ads_account ON domains(ads_account_id) WHERE ads_account_id IS NOT NULL;

-- ============================================
-- DOMAIN RULES & LOCATION RULES
-- ============================================

-- Click blocking rules per domain
CREATE TABLE domain_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  
  -- Time-based limits
  time_window_days INT DEFAULT 0,
  time_window_hours INT DEFAULT 0,
  time_window_minutes INT DEFAULT 0,
  max_clicks INT NOT NULL DEFAULT 1,
  
  -- Blocking configuration
  blocking_mode blocking_mode DEFAULT 'moderate',
  
  -- Bot detection thresholds
  min_session_duration_seconds INT DEFAULT 5,
  max_clicks_per_session INT DEFAULT 10,
  min_scroll_depth_percent INT DEFAULT 10,
  
  -- Auto-blocking settings
  auto_block_enabled BOOLEAN DEFAULT TRUE,
  block_vpn BOOLEAN DEFAULT TRUE,
  block_proxy BOOLEAN DEFAULT TRUE,
  block_hosting BOOLEAN DEFAULT TRUE,
  block_tor BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(domain_id)
);

-- Domain rules indexes
CREATE INDEX idx_domain_rules_domain ON domain_rules(domain_id);

-- Location-based rules
-- CREATE TABLE domain_location_rules (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  
--   rule_type location_rule_type NOT NULL,
--   country_code CHAR(2),
--   region TEXT,
--   city TEXT,
  
--   priority INT DEFAULT 0,
--   is_active BOOLEAN DEFAULT TRUE,
  
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- Location rules indexes
-- CREATE INDEX idx_domain_location_rules_domain ON domain_location_rules(domain_id);
-- CREATE INDEX idx_domain_location_rules_country ON domain_location_rules(country_code);
-- CREATE INDEX idx_domain_location_rules_active ON domain_location_rules(is_active) WHERE is_active = TRUE;

-- ============================================
-- IP MANAGEMENT
-- ============================================

-- IP location data cache
CREATE TABLE ip_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip INET UNIQUE NOT NULL,
  
  -- Location data
  country_code CHAR(2),
  country_name TEXT,
  region TEXT,
  city TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  timezone TEXT,
  postal_code TEXT,
  
  -- ISP & Network info
  isp TEXT,
  organization TEXT,
  asn TEXT,
  
  -- Threat indicators
  is_vpn BOOLEAN DEFAULT FALSE,
  is_proxy BOOLEAN DEFAULT FALSE,
  is_tor BOOLEAN DEFAULT FALSE,
  is_hosting BOOLEAN DEFAULT FALSE,
  is_datacenter BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IP locations indexes
CREATE INDEX idx_ip_locations_ip ON ip_locations USING hash(ip);
CREATE INDEX idx_ip_locations_country ON ip_locations(country_code);
CREATE INDEX idx_ip_locations_threat ON ip_locations(is_vpn, is_proxy, is_tor, is_hosting) 
  WHERE is_vpn = TRUE OR is_proxy = TRUE OR is_tor = TRUE OR is_hosting = TRUE;
CREATE INDEX idx_ip_locations_updated ON ip_locations(updated_at);

-- IP threat scores per domain
CREATE TABLE ip_threat_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  ip INET NOT NULL,
  
  -- Threat assessment
  threat_level threat_level DEFAULT 'safe',
  score INT DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  
  -- Statistics
  click_count INT DEFAULT 0,
  session_count INT DEFAULT 0,
  total_duration_seconds INT DEFAULT 0,
  bounce_count INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  
  -- Violation tracking
  violation_reasons JSONB DEFAULT '[]'::jsonb,
  violation_count INT DEFAULT 0,
  
  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_click_at TIMESTAMPTZ,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(domain_id, ip)
);

-- IP threat scores indexes
CREATE INDEX idx_ip_threat_domain ON ip_threat_scores(domain_id);
CREATE INDEX idx_ip_threat_domain_score ON ip_threat_scores(domain_id, score DESC);
CREATE INDEX idx_ip_threat_level ON ip_threat_scores(domain_id, threat_level);
CREATE INDEX idx_ip_threat_ip ON ip_threat_scores(ip);
CREATE INDEX idx_ip_threat_last_click ON ip_threat_scores(domain_id, last_click_at DESC);

-- IP whitelist (global)
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

-- IP whitelist indexes
CREATE INDEX idx_ip_whitelist_ip ON ip_whitelist USING hash(ip);
CREATE INDEX idx_ip_whitelist_range ON ip_whitelist USING gist(ip_range inet_ops) WHERE ip_range IS NOT NULL;
CREATE INDEX idx_ip_whitelist_active ON ip_whitelist(is_active) WHERE is_active = TRUE;

-- IP blocklist per domain
CREATE TABLE ip_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  ip INET NOT NULL,
  
  -- Threat info
  threat_level threat_level NOT NULL,
  block_reason JSONB,
  
  -- Blocking metadata
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT FALSE,
  
  -- Google Ads sync tracking
  synced_to_ads BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMPTZ,
  sync_error TEXT,
  
  -- Statistics
  total_violations INT DEFAULT 0,
  
  UNIQUE(domain_id, ip)
);

-- IP blocklist indexes
CREATE INDEX idx_ip_blocklist_domain ON ip_blocklist(domain_id);
CREATE INDEX idx_ip_blocklist_ip ON ip_blocklist(ip);
CREATE INDEX idx_ip_blocklist_threat ON ip_blocklist(domain_id, threat_level);
CREATE INDEX idx_ip_blocklist_sync_pending ON ip_blocklist(domain_id, synced_to_ads) 
  WHERE synced_to_ads = FALSE;
CREATE INDEX idx_ip_blocklist_expires ON ip_blocklist(expires_at) 
  WHERE expires_at IS NOT NULL AND expires_at > NOW();

-- ============================================
-- DEVICE TRACKING
-- ============================================

-- Devices (tracked by fingerprint)
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_id TEXT UNIQUE NOT NULL,
  
  -- Device info
  device_type TEXT,
  os TEXT,
  os_version TEXT,
  browser TEXT,
  browser_version TEXT,
  
  -- Screen info
  screen_width INT,
  screen_height INT,
  screen_pixel_ratio NUMERIC(3, 2),
  
  -- Additional fingerprint data
  fingerprint_data JSONB,
  
  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices indexes
CREATE INDEX idx_devices_fingerprint ON devices(fingerprint_id);
CREATE INDEX idx_devices_last_seen ON devices(last_seen_at DESC);

-- Device-IP relationship
CREATE TABLE device_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  ip INET NOT NULL,
  
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  occurrence_count INT DEFAULT 1,
  
  UNIQUE(device_id, ip)
);

-- Device IPs indexes
CREATE INDEX idx_device_ips_device ON device_ips(device_id);
CREATE INDEX idx_device_ips_ip ON device_ips(ip);
CREATE INDEX idx_device_ips_last_seen ON device_ips(device_id, last_seen_at DESC);

-- ============================================
-- SESSION TRACKING
-- ============================================

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  ip INET NOT NULL,
  
  -- Session timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INT,
  
  -- Session metrics
  page_views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  scrolls INT DEFAULT 0,
  max_scroll_depth INT DEFAULT 0,
  conversions INT DEFAULT 0,
  
  -- Bot detection
  bot_score SMALLINT DEFAULT 0 CHECK (bot_score BETWEEN 0 AND 100),
  bot_indicators JSONB DEFAULT '{}'::jsonb,
  is_bot BOOLEAN DEFAULT FALSE,
  is_bounce BOOLEAN DEFAULT FALSE,
  
  -- Referrer data
  referrer TEXT,
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  gclid TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions indexes
CREATE INDEX idx_sessions_domain ON sessions(domain_id);
CREATE INDEX idx_sessions_device ON sessions(device_id);
CREATE INDEX idx_sessions_ip ON sessions(ip);
CREATE INDEX idx_sessions_domain_time ON sessions(domain_id, started_at DESC);
CREATE INDEX idx_sessions_bot_score ON sessions(domain_id, bot_score DESC) 
  WHERE bot_score > 50;
CREATE INDEX idx_sessions_gclid ON sessions(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX idx_sessions_active ON sessions(domain_id, last_activity_at DESC) 
  WHERE ended_at IS NULL;

-- Session events
CREATE TABLE session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  event_type event_type NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  second_offset INT,
  
  -- Event specific data
  page_url TEXT,
  scroll_px INT,
  scroll_percent INT,
  click_x INT,
  click_y INT,
  target_element TEXT,
  target_href TEXT,
  target_text TEXT,
  visibility_percentage INT,
  
  -- Custom event data
  event_data JSONB
);

-- Session events indexes
CREATE INDEX idx_session_events_session ON session_events(session_id);
CREATE INDEX idx_session_events_type ON session_events(session_id, event_type);
CREATE INDEX idx_session_events_time ON session_events(occurred_at DESC);

-- Partition session_events by month for better performance
-- Note: You need to create partitions manually each month
-- Example:
-- CREATE TABLE session_events_2025_01 PARTITION OF session_events
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- ============================================
-- AD CLICK TRACKING
-- ============================================

-- Ad clicks (separate from regular sessions for better analytics)
CREATE TABLE ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  
  -- Click info
  ip INET NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- CRITICAL: Unique click identifier for linking tracker redirect to on-site tracking
  click_id VARCHAR(64) UNIQUE NOT NULL,
  
  -- Session linked flag
  session_linked BOOLEAN DEFAULT FALSE,
  session_linked_at TIMESTAMPTZ,
  
  -- Google Ads data
  gclid TEXT,
  campaign_id TEXT,
  ad_group_id TEXT,
  keyword TEXT,
  ad_position TEXT,
  network TEXT,
  device_type TEXT,
  placement TEXT,
  
  -- Location from Ads parameters
  loc_physical TEXT,
  loc_interest TEXT,
  
  -- UTM parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  
  -- Page info
  referrer TEXT,
  landing_page TEXT,
  final_url TEXT,
  
  -- Blocking info
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  blocked_at TIMESTAMPTZ,
  
  -- Bot detection from initial click
  user_agent TEXT,
  is_bot_user_agent BOOLEAN DEFAULT FALSE,
  
  -- Cost tracking (optional for future)
  estimated_cost NUMERIC(10, 2)
);

-- Ad clicks indexes
CREATE INDEX idx_ad_clicks_domain ON ad_clicks(domain_id);
CREATE INDEX idx_ad_clicks_session ON ad_clicks(session_id);
CREATE INDEX idx_ad_clicks_ip ON ad_clicks(ip);
CREATE INDEX idx_ad_clicks_domain_time ON ad_clicks(domain_id, clicked_at DESC);
CREATE INDEX idx_ad_clicks_ip_domain_time ON ad_clicks(ip, domain_id, clicked_at DESC);
CREATE INDEX idx_ad_clicks_gclid ON ad_clicks(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX idx_ad_clicks_blocked ON ad_clicks(domain_id, is_blocked) 
  WHERE is_blocked = TRUE;
CREATE INDEX idx_ad_clicks_campaign ON ad_clicks(domain_id, campaign_id) 
  WHERE campaign_id IS NOT NULL;

-- ============================================
-- GOOGLE ADS INTEGRATION
-- ============================================

-- Google Ads campaigns
CREATE TABLE ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  
  -- Google Ads identifiers
  ads_account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  
  -- Current blocked IPs (JSON array of IPs)
  blocked_ips JSONB DEFAULT '[]'::jsonb,
  blocked_ips_count INT DEFAULT 0,
  
  -- Sync status
  sync_status sync_status DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  sync_attempts INT DEFAULT 0,
  
  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  auto_sync_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(ads_account_id, campaign_id)
);

-- Ads campaigns indexes
CREATE INDEX idx_ads_campaigns_domain ON ads_campaigns(domain_id);
CREATE INDEX idx_ads_campaigns_sync_pending ON ads_campaigns(sync_status) 
  WHERE sync_status = 'pending';
CREATE INDEX idx_ads_campaigns_active ON ads_campaigns(domain_id, is_active) 
  WHERE is_active = TRUE;
CREATE INDEX idx_ads_campaigns_last_sync ON ads_campaigns(last_sync_at);

-- Campaign sync history (for debugging and audit)
-- CREATE TABLE ads_sync_history (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   campaign_id UUID NOT NULL REFERENCES ads_campaigns(id) ON DELETE CASCADE,
  
--   sync_started_at TIMESTAMPTZ DEFAULT NOW(),
--   sync_completed_at TIMESTAMPTZ,
--   sync_status sync_status NOT NULL,
  
--   -- What changed
--   ips_added JSONB,
--   ips_removed JSONB,
--   total_blocked INT,
  
--   -- Error tracking
--   error_message TEXT,
--   error_code TEXT,
  
--   -- API response
--   api_response JSONB
-- );

-- -- Sync history indexes
-- CREATE INDEX idx_ads_sync_history_campaign ON ads_sync_history(campaign_id);
-- CREATE INDEX idx_ads_sync_history_time ON ads_sync_history(sync_started_at DESC);
-- CREATE INDEX idx_ads_sync_history_status ON ads_sync_history(sync_status);

-- ============================================
-- ANALYTICS & REPORTING
-- ============================================

-- Daily aggregated stats per domain
-- CREATE TABLE daily_stats (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
--   date DATE NOT NULL,
  
--   -- Traffic stats
--   total_sessions INT DEFAULT 0,
--   total_clicks INT DEFAULT 0,
--   total_conversions INT DEFAULT 0,
--   unique_ips INT DEFAULT 0,
--   unique_devices INT DEFAULT 0,
  
--   -- Bot stats
--   bot_sessions INT DEFAULT 0,
--   blocked_ips INT DEFAULT 0,
--   blocked_clicks INT DEFAULT 0,
  
--   -- Engagement stats
--   avg_session_duration NUMERIC(10, 2),
--   avg_scroll_depth NUMERIC(5, 2),
--   bounce_rate NUMERIC(5, 2),
  
--   -- Cost savings (estimated)
--   estimated_saved_cost NUMERIC(10, 2),
  
--   created_at TIMESTAMPTZ DEFAULT NOW(),
  
--   UNIQUE(domain_id, date)
-- );

-- -- Daily stats indexes
-- CREATE INDEX idx_daily_stats_domain_date ON daily_stats(domain_id, date DESC);
-- CREATE INDEX idx_daily_stats_date ON daily_stats(date DESC);

-- ============================================
-- SYSTEM TABLES
-- ============================================

-- API keys for tracking scripts
-- CREATE TABLE api_keys (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
--   key_hash TEXT UNIQUE NOT NULL,
--   key_prefix TEXT NOT NULL,
--   name TEXT,
  
--   -- Permissions
--   scopes TEXT[] DEFAULT ARRAY['tracking']::TEXT[],
  
--   -- Rate limiting
--   rate_limit_per_hour INT DEFAULT 10000,
  
--   -- Status
--   is_active BOOLEAN DEFAULT TRUE,
--   last_used_at TIMESTAMPTZ,
--   expires_at TIMESTAMPTZ,
  
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- API keys indexes
-- CREATE INDEX idx_api_keys_profile ON api_keys(profile_id);
-- CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
-- CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;

-- -- System configuration
-- CREATE TABLE system_config (
--   key TEXT PRIMARY KEY,
--   value JSONB NOT NULL,
--   description TEXT,
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Google OAuth tokens (System-wide, for MCC account)
CREATE TABLE google_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  mcc_customer_id TEXT,
  authorized_email TEXT,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active OAuth token should exist
CREATE UNIQUE INDEX idx_google_oauth_active ON google_oauth_tokens(is_active) WHERE is_active = TRUE;

-- -- Background job queue
-- CREATE TABLE job_queue (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   job_type TEXT NOT NULL,
--   payload JSONB NOT NULL,
  
--   status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
--   priority INT DEFAULT 0,
  
--   attempts INT DEFAULT 0,
--   max_attempts INT DEFAULT 3,
--   error TEXT,
  
--   scheduled_at TIMESTAMPTZ DEFAULT NOW(),
--   started_at TIMESTAMPTZ,
--   completed_at TIMESTAMPTZ,
  
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- Job queue indexes
-- CREATE INDEX idx_job_queue_status ON job_queue(status, priority DESC, scheduled_at) 
--   WHERE status = 'pending';
-- CREATE INDEX idx_job_queue_type ON job_queue(job_type);
-- CREATE INDEX idx_job_queue_created ON job_queue(created_at DESC);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert common IP whitelist entries (Google, Bing bots, etc.)
INSERT INTO ip_whitelist (ip, source, note, ip_range) VALUES
  ('66.249.64.0'::inet, 'google', 'Googlebot', '66.249.64.0/19'::cidr),
  ('66.102.0.0'::inet, 'google', 'Googlebot', '66.102.0.0/20'::cidr),
  ('40.77.167.0'::inet, 'bing', 'Bingbot', '40.77.167.0/24'::cidr),
  ('207.46.13.0'::inet, 'bing', 'Bingbot', '207.46.13.0/24'::cidr);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- -- Active threats view
-- CREATE VIEW active_threats AS
-- SELECT 
--   d.domain,
--   its.ip,
--   its.threat_level,
--   its.score,
--   its.click_count,
--   its.violation_count,
--   its.last_click_at,
--   il.country_code,
--   il.city,
--   il.is_vpn,
--   il.is_proxy,
--   ib.synced_to_ads
-- FROM ip_threat_scores its
-- JOIN domains d ON its.domain_id = d.id
-- LEFT JOIN ip_locations il ON its.ip = il.ip
-- LEFT JOIN ip_blocklist ib ON its.domain_id = ib.domain_id AND its.ip = ib.ip
-- WHERE its.threat_level IN ('high', 'critical')
--   AND d.is_active = TRUE;

-- -- Campaign sync status view
-- CREATE VIEW campaign_sync_status AS
-- SELECT 
--   d.domain,
--   ac.campaign_name,
--   ac.blocked_ips_count,
--   ac.sync_status,
--   ac.last_sync_at,
--   ac.sync_error,
--   COUNT(ib.id) as pending_blocks
-- FROM ads_campaigns ac
-- JOIN domains d ON ac.domain_id = d.id
-- LEFT JOIN ip_blocklist ib ON ac.domain_id = ib.domain_id 
--   AND ib.synced_to_ads = FALSE
-- WHERE ac.is_active = TRUE
-- GROUP BY d.domain, ac.campaign_name, ac.blocked_ips_count, 
--   ac.sync_status, ac.last_sync_at, ac.sync_error;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domain_rules_updated_at BEFORE UPDATE ON domain_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_campaigns_updated_at BEFORE UPDATE ON ads_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update device last_seen_at
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
-- COMMENTS
-- ============================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth';
COMMENT ON TABLE domains IS 'Tracked websites/domains';
COMMENT ON TABLE domain_rules IS 'Click blocking rules per domain';
COMMENT ON TABLE domain_location_rules IS 'Geographic blocking/allowing rules';
COMMENT ON TABLE ip_locations IS 'IP geolocation cache';
COMMENT ON TABLE ip_threat_scores IS 'IP threat assessment per domain';
COMMENT ON TABLE ip_whitelist IS 'Global IP whitelist (bots, etc)';
COMMENT ON TABLE ip_blocklist IS 'Blocked IPs per domain';
COMMENT ON TABLE devices IS 'Tracked devices by fingerprint';
COMMENT ON TABLE device_ips IS 'Device-IP relationship tracking';
COMMENT ON TABLE sessions IS 'User sessions';
COMMENT ON TABLE session_events IS 'Events within sessions';
COMMENT ON TABLE ad_clicks IS 'Google Ads click tracking';
COMMENT ON TABLE ads_campaigns IS 'Google Ads campaigns';
COMMENT ON TABLE ads_sync_history IS 'Campaign sync audit log';
COMMENT ON TABLE daily_stats IS 'Daily aggregated statistics';
COMMENT ON TABLE job_queue IS 'Background job queue';

-- ============================================
-- END OF SCHEMA
-- ============================================