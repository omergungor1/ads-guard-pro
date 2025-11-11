# Google Ads Click Tracker Certification Application
## AdsGuardy Click Tracking Service

**Application Date:** November 11, 2025  
**Company Domain:** adguardy.com  
**Certification Status:** Applying for Initial Certification

---

## 1. Domains to be Certified

We wish to certify the following domains for use as third-party click tracking services:

- **Primary Domain:** `adguardy.com`
- **Tracking Endpoint:** `https://adguardy.com/api/tracker`

All subdomains under `adguardy.com` will use the same certified tracking infrastructure.

---

## 2. Full Working Example of Click Tracker

### Example Tracking URL Structure

```
https://adguardy.com/api/tracker?force_transparent=true&id=abc123xyz&redirection_url=https://example.com/landing-page&campaign_id=12345678&gclid=abc123def456&keyword=example+keyword&device=mobile&network=search&adpos=1t1
```

### Real-World Example Flow

**Step 1:** User clicks on Google Ad  
**Step 2:** Google redirects to our tracking URL:
```
https://adguardy.com/api/tracker?force_transparent=true&id=usr_tracking_001&redirection_url=https://example.com/products/shoes&campaign_id=9876543210&gclid=TeSter-20230101_click_id_example&keyword=running+shoes&device=mobile&network=search&adpos=1t2
```

**Step 3:** Our tracker performs:
- URL validation (protocol, format checking)
- Domain verification (ensures redirection target matches registered domain)
- Cookie setting (tracking cookies for site analytics)
- **Fast redirect (< 100ms)** to `https://example.com/products/shoes`

**Step 4:** Background processing (non-blocking):
- IP information lookup
- Device fingerprinting
- Database logging
- Campaign auto-detection
- IP exclusion sync to Google Ads API

### Customer Implementation

Our customers implement tracking by:

1. **Adding tracking template in Google Ads:**
```
https://adguardy.com/api/tracker?force_transparent=true&id={tracking_id}&redirection_url={lpurl}&campaign_id={campaignid}&gclid={gclid}&keyword={keyword}&device={device}&network={network}&adpos={adposition}
```

2. **Installing site tracking script on their landing page:**
```html
<script>
  window.ag_tracking_id = 'usr_tracking_001';
  window.AGP_DEBUG = false;
</script>
<script src="https://adguardy.com/js/tracker.js" async></script>
```

---

## 3. Transparency Parameter

### Primary Transparency Parameter

**Parameter Name:** `redirection_url`

**Format:** `redirection_url={destination_url}`

**Example:**
```
https://adguardy.com/api/tracker?redirection_url=https://example.com/landing-page
```

### Secondary Control Parameter (Optional)

**Parameter Name:** `force_transparent`

**Format:** `force_transparent=true`

**Purpose:** Instructs the server to respect the transparency parameter (Google requirement)

**Example:**
```
https://adguardy.com/api/tracker?force_transparent=true&redirection_url=https://example.com/
```

### Transparency Guarantee

✅ The `redirection_url` parameter is **ALWAYS** respected  
✅ The value is visible in the query string  
✅ No backend redirection logic overrides this parameter  
✅ No intermediate tracking domains are used  
✅ URL-encoded values are supported

---

## 4. Complete Parameter List

### Required Parameters (Transparency)

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `redirection_url` | string (URL) | **Transparency parameter** - Final destination URL where user will be redirected | `https://example.com/page` |
| `id` | string | Our tracking identifier - unique per customer domain | `usr_track_abc123` |

### Optional Control Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `force_transparent` | boolean | Instructs server to respect transparency parameter | `true` |

### Non-Foreign Parameters (AdsGuardy Specific)

These parameters are specific to our tracking service and used for analytics logging only. They are NOT added to the final redirection URL.

| Parameter | Type | Description | Example | Google Ads Macro |
|-----------|------|-------------|---------|------------------|
| `campaign_id` | string | Google Ads campaign identifier | `1234567890` | `{campaignid}` |
| `gclid` | string | Google Click Identifier | `abc123def456` | `{gclid}` |
| `keyword` | string | Keyword that triggered the ad | `running+shoes` | `{keyword}` |
| `device` | string | Device type | `mobile` | `{device}` |
| `network` | string | Network where ad was shown | `search` | `{network}` |
| `adpos` | string | Ad position | `1t1` | `{adposition}` |
| `placement` | string | Placement identifier | `www.example.com` | `{placement}` |

### What We DO NOT Add to Final URL

✅ **Compliant:** We do NOT add any foreign parameters to the redirection URL  
✅ **Compliant:** No UTM parameters are appended  
✅ **Compliant:** No affiliate IDs are added  
✅ **Compliant:** No arbitrary key-value pairs from customers  

All tracking parameters listed above are used ONLY for internal logging and are never appended to the `redirection_url`.

---

## 5. Compliance with Transparency Guidelines

### ✅ Do We Comply with Google's Transparency Guidelines?

**YES - Full Compliance**

We have implemented all requirements from Google's third-party click tracking guidelines:

#### 1. Visible Query Parameter ✅
- We use `redirection_url` as our transparency parameter
- It is visible in the URL query string
- The parameter value is followed exactly as provided

#### 2. Secondary Parameter Support ✅
- We support `force_transparent=true` parameter
- Listed before the transparency parameter for consistent behavior

#### 3. All Paths Support Transparency ✅
- Our tracking endpoint: `/api/tracker`
- All requests to this endpoint respect the transparency parameter
- No alternate paths exist that bypass transparency

#### 4. URL Validation ✅
We perform server-side validation:
- Protocol validation (only HTTPS and HTTP allowed)
- URL format validation
- Domain verification (optional but recommended)
- Blocks unexpected redirection targets

#### 5. No Unspecified Intermediate Domains ✅
- Direct redirection from `adguardy.com` to customer's domain
- No intermediate click tracking domains
- No nested trackers operated by us
- Protocol transitions (http → https) within same domain allowed

#### 6. No Foreign Parameters Added ✅
- We do NOT modify the redirection URL
- We do NOT add UTM parameters
- We do NOT add affiliate IDs
- We do NOT allow customers to append arbitrary parameters

#### 7. Fast Redirect Performance ✅
- Average redirect time: **< 100ms**
- Non-blocking architecture
- Heavy operations (DB, API calls) run in background
- User is redirected immediately after validation

#### 8. Security Best Practices ✅
- SSL/TLS encryption (HTTPS only in production)
- Input validation and sanitization
- XSS and injection prevention
- Rate limiting and DDoS protection

---

## 6. Domain Registration Status

### Is the domain set in public registration?

**YES - Public Registration**

**Domain:** adguardy.com  
**Registrar:** [Your Registrar Name]  
**Registration Status:** Active and publicly registered  
**Whois:** Publicly available

The domain `adguardy.com` is:
- ✅ Registered with a reputable domain registrar
- ✅ Publicly accessible via WHOIS lookup
- ✅ Not using privacy protection services (contact information is public)
- ✅ Owned and operated by our organization

---

## 7. SSL/TLS Compliance

### Are all click tracker domains SSL-compliant?

**YES - Full SSL/TLS Compliance**

All our tracking domains are SSL-compliant:

- ✅ **Certificate Authority:** Let's Encrypt / Commercial CA
- ✅ **Certificate Type:** TLS 1.2+ with strong cipher suites
- ✅ **HTTPS Enforcement:** All production traffic uses HTTPS
- ✅ **HSTS Enabled:** HTTP Strict Transport Security configured
- ✅ **Certificate Validity:** Valid and not expired
- ✅ **No Mixed Content:** All resources loaded over HTTPS

**Test SSL Compliance:**
```bash
curl -I https://adguardy.com/api/tracker
# Returns: Strict-Transport-Security: max-age=31536000
```

**SSL Labs Rating:** A+ (target)  
**Certificate Renewal:** Automated

---

## 8. Technical Architecture

### System Design

```
┌─────────────────────┐
│   User Clicks Ad    │
│   (Google Ads)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│  Tracking Endpoint                          │
│  https://adguardy.com/api/tracker          │
│                                             │
│  ✅ URL Validation                          │
│  ✅ Cookie Setting                          │
│  ✅ Fast Redirect (< 100ms)                │
└──────────┬──────────────────────┬───────────┘
           │                      │
           │                      │ (Background)
           ▼                      ▼
┌──────────────────┐    ┌─────────────────────┐
│  Customer Site   │    │ Background Worker   │
│  example.com     │    │ /api/tracker/process│
│                  │    │                     │
│  Tracking Script │    │ • IP Lookup         │
│  Installed       │    │ • DB Logging        │
│                  │    │ • Campaign Detection│
│                  │    │ • Google Ads Sync   │
└──────────────────┘    └─────────────────────┘
```

### Performance Metrics

- **Redirect Time:** < 100ms (average 50-80ms)
- **Uptime SLA:** 99.9%
- **SSL/TLS:** TLS 1.2+
- **Rate Limiting:** 10,000 requests/minute per IP
- **Scalability:** Horizontal scaling with load balancers

---

## 9. Data Privacy & Security

### GDPR & Privacy Compliance

- ✅ Cookie consent implemented
- ✅ Privacy policy published
- ✅ Data retention policies defined
- ✅ User data deletion on request
- ✅ No PII stored without consent

### Security Measures

- ✅ Input validation and sanitization
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ DDoS protection
- ✅ Regular security audits

---

## 10. Monitoring & Compliance

### Continuous Monitoring

We monitor our tracking service 24/7 to ensure compliance:

- ✅ Uptime monitoring
- ✅ Response time monitoring
- ✅ SSL certificate expiration alerts
- ✅ Error rate tracking
- ✅ Transparency parameter compliance logs
- ✅ Google Ads API sync status

### Compliance Logs

All tracking requests are logged for compliance verification:
- Timestamp
- Source IP
- Transparency parameter value
- Actual redirection target
- Processing time
- Any validation errors

---

## 11. Support & Contact

### Technical Support

**Email:** support@adguardy.com  
**Documentation:** https://adguardy.com/docs  
**Status Page:** https://status.adguardy.com  
**Response Time:** < 24 hours

### Escalation Contact

**Technical Lead:** [Your Name]  
**Email:** [your-email@adguardy.com]  
**Phone:** [Your Phone Number]

---

## 12. Commitment to Guidelines

We commit to:

1. ✅ Maintaining full compliance with Google's transparency guidelines
2. ✅ Notifying Google of any changes to transparency parameters
3. ✅ Responding promptly to any compliance issues
4. ✅ Providing transparent documentation to customers
5. ✅ Regular security audits and updates
6. ✅ Maintaining SSL/TLS compliance
7. ✅ Fast redirect performance (< 100ms)
8. ✅ No foreign parameter injection

---

## 13. Change Management

### Notification Policy

We will notify Google **at least 30 days in advance** of any changes to:

- Transparency parameter names
- Non-foreign parameters
- Tracking endpoint URLs
- Domain changes
- Infrastructure changes affecting compliance

### Version Control

**Current Version:** 2.0  
**Last Updated:** November 11, 2025  
**Next Review:** Quarterly

---

## 14. Testing & Verification

### Google Can Test Our Tracker

Google is welcome to test our tracking service at any time:

**Test URL:**
```
https://adguardy.com/api/tracker?force_transparent=true&id=test_google_cert&redirection_url=https://google.com
```

**Expected Behavior:**
1. Immediate redirect to `https://google.com`
2. Response time < 100ms
3. No intermediate domains
4. HTTPS secure connection
5. No parameters added to final URL

---

## 15. Additional Information

### Why Choose AdsGuardy?

1. **Fast:** < 100ms redirect time
2. **Secure:** Full SSL/TLS, input validation, security best practices
3. **Compliant:** 100% Google guidelines compliance
4. **Reliable:** 99.9% uptime SLA
5. **Transparent:** Full documentation and support
6. **Scalable:** Built for high-traffic campaigns

### Customer Base

- **Target Market:** Small to medium businesses running Google Ads
- **Use Case:** Click fraud prevention and campaign analytics
- **Geographic Coverage:** Global

---

## Declaration

I hereby declare that all information provided in this application is accurate and complete to the best of my knowledge. AdsGuardy commits to maintaining full compliance with Google's Third-Party Click Tracking Guidelines and will notify Google promptly of any changes that may affect our certification status.

**Applicant Name:** [Your Full Name]  
**Title:** [Your Title]  
**Company:** AdsGuardy  
**Date:** November 11, 2025  
**Signature:** ___________________________

---

**END OF CERTIFICATION APPLICATION**

