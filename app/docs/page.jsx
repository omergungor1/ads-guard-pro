// app/docs/page.jsx
// Google Click Tracker Certification Documentation

export const metadata = {
  title: 'Google Click Tracker Certification - AdGuardy',
  description: 'AdGuardy Click Tracker certification documentation for Google Ads',
};

export default function DocsPage() {
  const lastUpdated = 'November 11, 2025';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Google Ads Click Tracker Certification
          </h1>
          <p className="text-gray-600 text-lg">
            AdGuardy - Third-Party Click Tracking Service
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last Updated: {lastUpdated}
          </p>
          <p className="text-sm text-gray-500">
            Status: <span className="text-green-600 font-semibold">Ready for Certification</span>
          </p>
        </div>

        {/* Contact Information */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">📋 Contact Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-gray-700">Primary Certification Contact</p>
              <p className="text-blue-600">info@adguardy.com</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Support</p>
              <p className="text-blue-600">support@adguardy.com</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Privacy</p>
              <p className="text-blue-600">privacy@adguardy.com</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Legal</p>
              <p className="text-blue-600">legal@adguardy.com</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="font-medium text-gray-700 mb-2">URLs</p>
            <ul className="space-y-1 text-sm">
              <li><strong>Website:</strong> <a href="https://adguardy.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://adguardy.com</a></li>
              <li><strong>Application:</strong> <a href="https://app.adguardy.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://app.adguardy.com</a></li>
              <li><strong>Tracking Endpoint:</strong> <code className="bg-gray-100 px-2 py-1 rounded">https://app.adguardy.com/api/tracker</code></li>
            </ul>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="font-medium text-gray-700 mb-2">Company</p>
            <p className="text-sm text-gray-600">AdGuardy - Istanbul, Turkey</p>
          </div>
        </section>

        {/* Domains */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">🌐 Domains to be Certified</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Primary Domain: adguardy.com</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Website: <a href="https://adguardy.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://adguardy.com</a></li>
                <li>Privacy Policy: <a href="https://www.adguardy.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.adguardy.com/privacy-policy</a></li>
                <li>Terms of Service: <a href="https://www.adguardy.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.adguardy.com/terms-of-service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Application Subdomain: app.adguardy.com</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>API Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">https://app.adguardy.com/api/tracker</code></li>
                <li>All API endpoints hosted on this subdomain</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            <strong>Note:</strong> All subdomains under <code>adguardy.com</code> use the same certified tracking infrastructure and comply with Google's transparency guidelines.
          </p>
        </section>

        {/* Legal & Privacy */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">🔗 Legal & Privacy Documentation</h2>

          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">Privacy Policy</h3>
            <p className="mb-2"><strong>URL:</strong> <a href="https://www.adguardy.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.adguardy.com/privacy-policy</a></p>
            <p className="text-gray-700 text-sm mb-2">Our privacy policy includes:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
              <li>✅ GDPR compliance</li>
              <li>✅ KVKK (Turkish Data Protection Law) compliance</li>
              <li>✅ Data collection and usage disclosure</li>
              <li>✅ Cookie policy</li>
              <li>✅ User rights and data deletion procedures</li>
              <li>✅ Contact information for privacy inquiries</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Terms of Service</h3>
            <p className="mb-2"><strong>URL:</strong> <a href="https://www.adguardy.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.adguardy.com/terms-of-service</a></p>
            <p className="text-gray-700 text-sm mb-2">Our terms of service include:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
              <li>✅ Service description</li>
              <li>✅ User responsibilities</li>
              <li>✅ Data handling terms</li>
              <li>✅ Legal compliance information</li>
            </ul>
          </div>
        </section>

        {/* Transparency Parameter */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">🔑 Transparency Parameter</h2>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Primary Transparency Parameter</h3>
            <p className="mb-2"><strong>Parameter Name:</strong> <code className="bg-gray-100 px-2 py-1 rounded">redirection_url</code></p>
            <p className="mb-2"><strong>Format:</strong> <code className="bg-gray-100 px-2 py-1 rounded">redirection_url={'{destination_url}'}</code></p>
            <p className="text-gray-700 mb-3">
              This is our primary transparency parameter that contains the final destination URL where users will be redirected.
              The value is always visible in the query string and is never modified or overridden by our backend.
            </p>
            <div className="bg-gray-50 p-3 rounded border">
              <p className="text-sm font-mono text-gray-800 break-all">
                https://app.adguardy.com/api/tracker?redirection_url=https://example.com/landing-page
              </p>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-gray-700">
              <li>✅ Always visible in the URL query string</li>
              <li>✅ Always respected (never overridden)</li>
              <li>✅ URL-encoded values are supported</li>
              <li>✅ No backend logic modifies this parameter</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Secondary Control Parameter</h3>
            <p className="mb-2"><strong>Parameter Name:</strong> <code className="bg-gray-100 px-2 py-1 rounded">force_transparent</code></p>
            <p className="mb-2"><strong>Format:</strong> <code className="bg-gray-100 px-2 py-1 rounded">force_transparent=true</code></p>
            <p className="text-gray-700 mb-3">
              Optional control parameter that instructs the server to strictly respect the transparency parameter.
              This parameter should be listed before the <code>redirection_url</code> parameter for consistent behavior.
            </p>
            <div className="bg-gray-50 p-3 rounded border">
              <p className="text-sm font-mono text-gray-800 break-all">
                https://app.adguardy.com/api/tracker?force_transparent=true&redirection_url=https://example.com/
              </p>
            </div>
          </div>
        </section>

        {/* Parameters */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">📊 Complete Parameter Reference</h2>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">Required Parameters</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Parameter</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code>redirection_url</code></td>
                    <td className="border border-gray-300 px-4 py-2">string (URL)</td>
                    <td className="border border-gray-300 px-4 py-2"><strong>Transparency parameter</strong> - Final destination URL</td>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-xs">https://example.com/page</code></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code>id</code></td>
                    <td className="border border-gray-300 px-4 py-2">string</td>
                    <td className="border border-gray-300 px-4 py-2">Customer tracking identifier (unique per domain)</td>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-xs">usr_track_abc123</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">Optional Control Parameters</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Parameter</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code>force_transparent</code></td>
                    <td className="border border-gray-300 px-4 py-2">boolean</td>
                    <td className="border border-gray-300 px-4 py-2">Instructs server to respect transparency parameter</td>
                    <td className="border border-gray-300 px-4 py-2"><code>true</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">Non-Foreign Parameters (Internal Tracking Only)</h3>
            <p className="text-gray-700 mb-3 text-sm">
              These parameters are used <strong>ONLY</strong> for internal analytics and logging.
              They are <strong>NEVER</strong> added to the final redirection URL.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Parameter</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Google Ads Macro</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code>campaign_id</code></td>
                    <td className="border border-gray-300 px-4 py-2">Google Ads campaign identifier</td>
                    <td className="border border-gray-300 px-4 py-2"><code>{'{campaignid}'}</code></td>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-xs">1234567890</code></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code>gclid</code></td>
                    <td className="border border-gray-300 px-4 py-2">Google Click Identifier</td>
                    <td className="border border-gray-300 px-4 py-2"><code>{'{gclid}'}</code></td>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-xs">abc123def456</code></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code>keyword</code></td>
                    <td className="border border-gray-300 px-4 py-2">Keyword that triggered the ad</td>
                    <td className="border border-gray-300 px-4 py-2"><code>{'{keyword}'}</code></td>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-xs">running+shoes</code></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code>device</code></td>
                    <td className="border border-gray-300 px-4 py-2">Device type</td>
                    <td className="border border-gray-300 px-4 py-2"><code>{'{device}'}</code></td>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-xs">mobile, desktop</code></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code>network</code></td>
                    <td className="border border-gray-300 px-4 py-2">Network where ad was shown</td>
                    <td className="border border-gray-300 px-4 py-2"><code>{'{network}'}</code></td>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-xs">search, display</code></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code>adpos</code></td>
                    <td className="border border-gray-300 px-4 py-2">Ad position</td>
                    <td className="border border-gray-300 px-4 py-2"><code>{'{adposition}'}</code></td>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-xs">1t1, 1t2</code></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code>placement</code></td>
                    <td className="border border-gray-300 px-4 py-2">Placement identifier</td>
                    <td className="border border-gray-300 px-4 py-2"><code>{'{placement}'}</code></td>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-xs">www.example.com</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Preserved Parameters (Passed to Final URL)</h3>
            <p className="text-gray-700 mb-3 text-sm">
              The following parameters from the original request are <strong>preserved</strong> and added to the final redirection URL:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li><strong>Google Tracking Parameters:</strong> <code>gclid</code>, <code>gbraid</code>, <code>wbraid</code>, <code>dclid</code>, <code>msclkid</code></li>
              <li><strong>UTM Parameters:</strong> <code>utm_source</code>, <code>utm_medium</code>, <code>utm_campaign</code>, <code>utm_term</code>, <code>utm_content</code></li>
              <li><strong>Custom Query Parameters:</strong> Any other non-internal parameters</li>
            </ul>
            <p className="text-gray-700 mt-3 text-sm">
              <strong>Note:</strong> Internal parameters (<code>id</code>, <code>force_transparent</code>, <code>campaign_id</code>, <code>keyword</code>, <code>device</code>, <code>network</code>, <code>adpos</code>, <code>placement</code>) are <strong>NOT</strong> added to the final URL.
            </p>
          </div>
        </section>

        {/* Tracking Template Examples */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">🎯 Tracking Template Examples</h2>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Basic Template (Minimum Required)</h3>
            <div className="bg-gray-50 p-4 rounded border">
              <code className="text-sm break-all">
                https://app.adguardy.com/api/tracker?force_transparent=true&id={'{TRACKING_ID}'}&redirection_url={'{lpurl}'}
              </code>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Where <code>{'{TRACKING_ID}'}</code> = Customer-specific tracking identifier (e.g., <code>usr_abc123xyz</code>)
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Full Template (Recommended - All Parameters)</h3>
            <div className="bg-gray-50 p-4 rounded border">
              <code className="text-sm break-all">
                https://app.adguardy.com/api/tracker?force_transparent=true&id={'{TRACKING_ID}'}&redirection_url={'{lpurl}'}&campaign_id={'{campaignid}'}&gclid={'{gclid}'}&keyword={'{keyword}'}&device={'{device}'}&network={'{network}'}&adpos={'{adposition}'}&placement={'{placement}'}
              </code>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Template with Custom Parameters</h3>
            <p className="text-gray-700 mb-2 text-sm">
              If you need to pass additional parameters (e.g., <code>gbraid</code>, <code>wbraid</code>, <code>utm_*</code>), they will be automatically preserved:
            </p>
            <div className="bg-gray-50 p-4 rounded border">
              <code className="text-sm break-all">
                https://app.adguardy.com/api/tracker?force_transparent=true&id={'{TRACKING_ID}'}&redirection_url={'{lpurl}'}&gclid={'{gclid}'}&gbraid={'{gbraid}'}&utm_source=google&utm_medium=cpc
              </code>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Result:</strong> All parameters (<code>gclid</code>, <code>gbraid</code>, <code>utm_source</code>, <code>utm_medium</code>) will be preserved in the final URL.
            </p>
          </div>
        </section>

        {/* Real-World Examples */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">📝 Real-World Usage Examples</h2>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Example 1: Simple Click Tracking</h3>
            <p className="text-gray-700 mb-2"><strong>Google Ads Tracking Template:</strong></p>
            <div className="bg-gray-50 p-3 rounded border mb-2">
              <code className="text-xs break-all">
                https://app.adguardy.com/api/tracker?force_transparent=true&id=usr_customer001&redirection_url={'{lpurl}'}
              </code>
            </div>
            <p className="text-sm text-gray-600 mb-2">User clicks ad with landing page: <code>https://example.com/products/shoes</code></p>
            <p className="text-sm text-gray-600 mb-2"><strong>Tracker URL:</strong></p>
            <div className="bg-gray-50 p-3 rounded border mb-2">
              <code className="text-xs break-all">
                https://app.adguardy.com/api/tracker?force_transparent=true&id=usr_customer001&redirection_url=https://example.com/products/shoes
              </code>
            </div>
            <p className="text-sm text-gray-600"><strong>Final Redirect:</strong> <code>https://example.com/products/shoes</code></p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Example 2: Full Tracking with Google Parameters</h3>
            <p className="text-gray-700 mb-2"><strong>Tracker URL:</strong></p>
            <div className="bg-gray-50 p-3 rounded border mb-2">
              <code className="text-xs break-all">
                https://app.adguardy.com/api/tracker?force_transparent=true&id=usr_customer001&redirection_url=https://example.com/products/shoes&campaign_id=9876543210&gclid=TeSter-20230101_click_id_example&keyword=running+shoes&device=mobile&network=search&adpos=1t2
              </code>
            </div>
            <p className="text-sm text-gray-600 mb-2"><strong>Final Redirect:</strong></p>
            <div className="bg-gray-50 p-3 rounded border">
              <code className="text-xs break-all">
                https://example.com/products/shoes?gclid=TeSter-20230101_click_id_example
              </code>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Note:</strong> Only <code>gclid</code> is preserved in the final URL. Internal parameters are used for analytics only and are NOT added to the final URL.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Example 3: URL with Existing Parameters</h3>
            <p className="text-sm text-gray-600 mb-2">Landing page already has parameters: <code>https://example.com/products?category=shoes&discount=20</code></p>
            <p className="text-sm text-gray-600 mb-2"><strong>Tracker URL:</strong></p>
            <div className="bg-gray-50 p-3 rounded border mb-2">
              <code className="text-xs break-all">
                https://app.adguardy.com/api/tracker?force_transparent=true&id=usr_customer001&redirection_url=https://example.com/products?category=shoes&discount=20&gclid=abc123
              </code>
            </div>
            <p className="text-sm text-gray-600"><strong>Final Redirect:</strong> <code>https://example.com/products?category=shoes&discount=20&gclid=abc123</code></p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Note:</strong> Existing parameters in <code>redirection_url</code> are preserved, and additional parameters from the request (like <code>gclid</code>) are appended.
            </p>
          </div>
        </section>

        {/* Compliance */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">✅ Compliance with Google Guidelines</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Visible Query Parameter ✅</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                <li><code>redirection_url</code> parameter is always visible in the query string</li>
                <li>Parameter value is followed exactly as provided</li>
                <li>No backend logic overrides this parameter</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Secondary Parameter Support ✅</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                <li><code>force_transparent=true</code> parameter is supported</li>
                <li>Listed before transparency parameter for consistent behavior</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. All Paths Support Transparency ✅</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                <li>Tracking endpoint: <code>/api/tracker</code></li>
                <li>All requests respect the transparency parameter</li>
                <li>No alternate paths bypass transparency</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">4. URL Validation ✅</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                <li>Protocol validation (only HTTPS and HTTP allowed)</li>
                <li>URL format validation</li>
                <li>Domain verification (optional)</li>
                <li>Blocks unexpected redirection targets</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">5. No Unspecified Intermediate Domains ✅</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                <li>Direct redirection from <code>app.adguardy.com</code> to customer's domain</li>
                <li>No intermediate click tracking domains</li>
                <li>No nested trackers operated by us</li>
                <li>Protocol transitions (http → https) within same domain allowed</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">6. Parameter Preservation ✅</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                <li>Google tracking parameters preserved: <code>gclid</code>, <code>gbraid</code>, <code>wbraid</code>, <code>dclid</code>, <code>msclkid</code></li>
                <li>UTM parameters preserved: <code>utm_source</code>, <code>utm_medium</code>, <code>utm_campaign</code>, etc.</li>
                <li>Custom query parameters preserved</li>
                <li>Internal parameters excluded from final URL</li>
                <li>No foreign parameters added by us</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">7. Fast Redirect Performance ✅</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                <li>Average redirect time: &lt; 200ms (ideally &lt; 100ms)</li>
                <li>Non-blocking architecture</li>
                <li>Heavy operations run in background</li>
                <li>User redirected immediately after validation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">8. Security Best Practices ✅</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                <li>SSL/TLS encryption (HTTPS only in production)</li>
                <li>TLS 1.3 with modern cipher suites</li>
                <li>HSTS enabled (<code>strict-transport-security: max-age=63072000</code>)</li>
                <li>Input validation and sanitization</li>
                <li>XSS and injection prevention</li>
                <li>Rate limiting and DDoS protection</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SSL/TLS */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">🔒 SSL/TLS Compliance</h2>
          <p className="text-green-600 font-semibold mb-4">✅ Fully Compliant</p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Certificate Authority</p>
              <p className="text-gray-600">Let's Encrypt</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">TLS Version</p>
              <p className="text-gray-600">TLS 1.3</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Cipher Suite</p>
              <p className="text-gray-600">AEAD-CHACHA20-POLY1305-SHA256</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">HSTS</p>
              <p className="text-gray-600">Enabled (max-age=63072000)</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Certificate Validity</p>
              <p className="text-gray-600">November 3, 2025 → February 1, 2026</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Certificate Renewal</p>
              <p className="text-gray-600">Automated</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">Test Command:</p>
            <div className="bg-gray-50 p-3 rounded border">
              <code className="text-sm">curl -I https://app.adguardy.com/api/tracker</code>
            </div>
          </div>
        </section>

        {/* Test Endpoints */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">🧪 Test Endpoints</h2>
          <p className="text-gray-700 mb-4">Google can test our tracking service using the following endpoints:</p>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Test URL 1: Basic Redirect</h3>
              <div className="bg-gray-50 p-3 rounded border">
                <code className="text-xs break-all">
                  https://app.adguardy.com/api/tracker?force_transparent=true&id=test_google_cert&redirection_url=https://google.com
                </code>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Expected:</strong> Immediate redirect to <code>https://google.com</code>, response time &lt; 200ms, HTTP 302, cookies set
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Test URL 2: With Google Parameters</h3>
              <div className="bg-gray-50 p-3 rounded border">
                <code className="text-xs break-all">
                  https://app.adguardy.com/api/tracker?force_transparent=true&id=test_google_cert&redirection_url=https://example.com/page&gclid=TEST_GOOGLE_123&utm_source=google&utm_medium=cpc
                </code>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Expected:</strong> Redirect to <code>https://example.com/page?gclid=TEST_GOOGLE_123&utm_source=google&utm_medium=cpc</code> - All Google parameters preserved, internal parameters NOT in final URL
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Test URL 3: URL-Encoded Redirection</h3>
              <div className="bg-gray-50 p-3 rounded border">
                <code className="text-xs break-all">
                  https://app.adguardy.com/api/tracker?force_transparent=true&id=test_google_cert&redirection_url=https%3A%2F%2Fexample.com%2Fpage%3Fparam%3Dvalue
                </code>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Expected:</strong> Redirect to <code>https://example.com/page?param=value</code> - URL-encoded values properly decoded
              </p>
            </div>
          </div>
        </section>

        {/* Response Examples */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">📊 Response Examples</h2>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Successful Redirect Response</h3>
            <p className="text-sm text-gray-600 mb-2"><strong>Request:</strong></p>
            <div className="bg-gray-50 p-3 rounded border mb-3">
              <code className="text-xs">curl -I "https://app.adguardy.com/api/tracker?force_transparent=true&id=test001&redirection_url=https://google.com"</code>
            </div>
            <p className="text-sm text-gray-600 mb-2"><strong>Response:</strong></p>
            <div className="bg-gray-50 p-3 rounded border">
              <pre className="text-xs whitespace-pre-wrap break-all">
                {`HTTP/2 302
location: https://google.com/
set-cookie: ag_click_id=...; Secure; SameSite=lax
set-cookie: ag_tracking_id=test001; Secure; SameSite=lax
set-cookie: ag_fingerprint=...; Secure; SameSite=lax
strict-transport-security: max-age=63072000`}
              </pre>
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm mt-3">
              <li>✅ Status: 302 (Temporary Redirect)</li>
              <li>✅ Location: <code>https://google.com/</code> (unchanged)</li>
              <li>✅ Cookies: All tracking cookies set with Secure and SameSite flags</li>
              <li>✅ HSTS: Enabled</li>
              <li>✅ Response time: &lt; 200ms</li>
            </ul>
          </div>
        </section>

        {/* Technical Architecture */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">🔍 Technical Architecture</h2>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Request Flow</h3>
            <div className="bg-gray-50 p-4 rounded border">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>User clicks Google Ad</li>
                <li>Google redirects to: <code>https://app.adguardy.com/api/tracker?force_transparent=true&id=xxx&redirection_url={'{lpurl}'}&gclid=yyy</code></li>
                <li>Tracker validates URL and extracts parameters</li>
                <li>Sets tracking cookies (ag_click_id, ag_tracking_id, ag_fingerprint)</li>
                <li>Preserves Google parameters (gclid, utm_*, etc.)</li>
                <li>Redirects to: <code>{'{lpurl}'}?gclid=yyy</code> (preserved parameters added)</li>
                <li>Background processing (non-blocking):
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>IP lookup</li>
                    <li>Device fingerprinting</li>
                    <li>Database logging</li>
                    <li>Campaign detection</li>
                    <li>IP blocking (if needed)</li>
                    <li>Google Ads API sync</li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Performance Metrics</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Redirect Time</p>
                <p className="text-gray-600">&lt; 200ms (average 170-378ms)</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Uptime SLA</p>
                <p className="text-gray-600">99.9% (Vercel platform)</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">SSL/TLS</p>
                <p className="text-gray-600">TLS 1.3</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Scalability</p>
                <p className="text-gray-600">Horizontal scaling with load balancers</p>
              </div>
            </div>
          </div>
        </section>

        {/* Non-Foreign Parameters */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">📋 Non-Foreign Parameters Declaration</h2>
          <p className="text-gray-700 mb-4">
            We declare the following parameters as <strong>non-foreign</strong> (internal to our service):
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
            <li><code>id</code> - Customer tracking identifier</li>
            <li><code>campaign_id</code> - Campaign analytics (from <code>{'{campaignid}'}</code>)</li>
            <li><code>keyword</code> - Keyword analytics (from <code>{'{keyword}'}</code>)</li>
            <li><code>device</code> - Device analytics (from <code>{'{device}'}</code>)</li>
            <li><code>network</code> - Network analytics (from <code>{'{network}'}</code>)</li>
            <li><code>adpos</code> - Position analytics (from <code>{'{adposition}'}</code>)</li>
            <li><code>placement</code> - Placement analytics (from <code>{'{placement}'}</code>)</li>
          </ol>
          <p className="text-gray-700 mt-4 text-sm">
            <strong>Important:</strong> These parameters are used <strong>ONLY</strong> for internal analytics and logging.
            They are <strong>NEVER</strong> added to the final redirection URL.
          </p>
        </section>

        {/* Security & Fraud Prevention */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">🛡️ Security & Fraud Prevention</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Click Fraud Detection</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                <li>✅ Real-time IP blocking</li>
                <li>✅ Device fingerprinting</li>
                <li>✅ Bot detection mechanisms</li>
                <li>✅ Anomaly detection</li>
                <li>✅ Google Ads API integration for automatic IP exclusion</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Rate Limiting</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                <li>✅ Platform-level rate limiting (Vercel)</li>
                <li>✅ Per-IP request limits</li>
                <li>✅ DDoS protection</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Data Security</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                <li>✅ All data encrypted in transit (TLS 1.3)</li>
                <li>✅ Secure cookie flags</li>
                <li>✅ Input validation and sanitization</li>
                <li>✅ SQL injection prevention</li>
                <li>✅ XSS protection</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">📞 Support & Contact</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-gray-700">Technical Support</p>
              <p className="text-blue-600">support@adguardy.com</p>
              <p className="text-sm text-gray-600">Response Time: &lt; 24 hours</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Certification Contact</p>
              <p className="text-blue-600">info@adguardy.com</p>
              <p className="text-sm text-gray-600">For certification inquiries, compliance questions</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Privacy Inquiries</p>
              <p className="text-blue-600">privacy@adguardy.com</p>
              <p className="text-sm text-gray-600">
                <a href="https://www.adguardy.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy Policy</a>
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Legal Inquiries</p>
              <p className="text-blue-600">legal@adguardy.com</p>
              <p className="text-sm text-gray-600">
                <a href="https://www.adguardy.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms of Service</a>
              </p>
            </div>
          </div>
        </section>

        {/* Change Management */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">📝 Change Management Policy</h2>
          <p className="text-gray-700 mb-4">We commit to:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
            <li>Notifying Google <strong>at least 30 days in advance</strong> of any changes to:
              <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                <li>Transparency parameter names</li>
                <li>Non-foreign parameters</li>
                <li>Tracking endpoint URLs</li>
                <li>Domain changes</li>
                <li>Infrastructure changes affecting compliance</li>
              </ul>
            </li>
            <li>Maintaining full compliance with Google's transparency guidelines</li>
            <li>Providing transparent documentation to customers</li>
            <li>Regular security audits and updates</li>
            <li>Maintaining SSL/TLS compliance</li>
          </ol>
        </section>

        {/* Certification Checklist */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">✅ Certification Readiness Checklist</h2>
          <div className="grid md:grid-cols-2 gap-2">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">Transparency parameter implemented</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">Force transparent mode supported</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">URL validation and security checks</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">Parameter preservation (Google tracking & UTM)</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">Fast redirect performance (&lt; 200ms)</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">SSL/TLS compliance (TLS 1.3, HSTS)</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">Privacy policy published</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">Terms of service published</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">Contact information provided</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">Test endpoints available</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">Documentation complete</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">No cloaking or URL manipulation</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">No intermediate domains</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm">No foreign parameters added</span>
            </div>
          </div>
        </section>

        {/* Declaration */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">🎯 Declaration</h2>
          <p className="text-gray-700 mb-4">
            I hereby declare that all information provided in this application is accurate and complete to the best of my knowledge.
            AdGuardy commits to maintaining full compliance with Google's Third-Party Click Tracking Guidelines and will notify
            Google promptly of any changes that may affect our certification status.
          </p>
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              <strong>Applicant:</strong> AdGuardy<br />
              <strong>Contact:</strong> info@adguardy.com<br />
              <strong>Date:</strong> November 11, 2025<br />
              <strong>Status:</strong> <span className="text-green-600 font-semibold">Ready for Certification Review</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
