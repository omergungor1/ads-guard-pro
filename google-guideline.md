Guidelines for third-party click tracking services

Click tracking guidelines
Provide visible query parameter
Click tracking URLs should have a visible query parameter that indicates the next immediate hop in the redirection chain. That parameter must be followed instead of using any other redirection target configured on the backend. The parameter value can be in URL-encoded format. It’s recommended that click-tracking providers work with Google to identify the correct transparency parameters and provide Google with advanced notice before any updates are made to these parameters.

Example
Tracking URL: https://tracker.com/?redirection_url=https://example.org/

If needed, a second parameter may be used to instruct the server to respect the parameter. The secondary parameter should be listed before the transparency parameter to ensure consistent behavior.

Example
Tracking URL: https://tracker.com/?force_transparent=true&redirection_url=https://example.org/

Ensure all expected URL paths are transparent
Transparency parameters must be functional on all paths used in Google Ads URLs. Usage of paths where transparency parameters don't function as required will lead to removal of certification status.

Example
✅ https://tracker.com/click?redirection_url=https://example.org/ (redirects to parameter value)

❌ https://tracker.com/non_transparent_click?redirection_url=https://example.org/ (doesn’t redirect to parameter value)

Perform additional validation
The click tracking service may perform additional server-side validation to block unexpected redirection targets and help mitigate any redirection exploits.

Avoid unspecified intermediate click tracking domains
The next hop redirection shouldn’t proceed through any unspecified intermediate click tracking domains or subdomains, except those that your organization owns and operates.

If an intermediate hop is required to redirect users to internal systems, such as in the case of migration or acquisition, the click tracking provider should own and control the next hop domain. The next hop domain shouldn’t alter the nature of the redirect, and it shouldn’t be controllable by the click tracker's users (advertisers).
Protocol transitions from http to https within the same domain are allowed.
While nesting other click trackers in your parameter is permitted, each nested tracker must also be certified, with the respective vendors responsible for their own application. We recommend encoding the nested values to ensure proper functioning.

Add partial modifications
The click-tracking service may partially modify the redirection target by adding additional, non-foreign parameters or expanding macros in the redirection URL, as long as the added parameters are specific to the click-tracking service and don’t alter the redirection target of nested click-tracking URLs.

What is a non-foreign parameter?
This is a query string parameter that is specific to your service. This could be a "click_id", such as the example below or a "campaign_id" that helps your service appropriately log and sort the tracking event.

What is a foreign parameter?
This is a query string parameter that isn’t specific to your service, such as a UTM parameter or affiliate ID. Foreign parameters are permitted, but they must be present in the URL expressed in your next hop transparency parameter and can't be added to the final URL after it is rendered.

Any scenario where your customer can append arbitrary key/value pairs constitutes a foreign parameter.

Example
Tracking URL: https://tracker.com/?redirection_url=https://example.org/

Actual Redirection Target:

✅ https://example.org/click_id=12345 (assuming click_id is a standard parameter appended for all tracker.com customers)

❌ https://example.org/redirection_target=https://another.com/ (assuming redirection_target is actually the transparency parameter for example.org)

To ensure compliance, please share all non-foreign parameters with Google during your initial click tracker application, and contact us as soon as possible if your service decides to support more.

Configure subdomains
You have the option to configure subdomains on the main domain to be used for click-tracking purposes. You can map them to click-tracking service providers of your choosing. You can also configure click-tracking directly on your landing pages, for instance, as pixels. These use cases are permitted and aren't affected by these guidelines.

Advertiser subdomains with CNAME records pointing to your certified domains don't have to be certified on their own so long as the subdomain is associated with the domain declared in the Final URL of the ad.

Example
Final URL: https://example.org

Tracking URLs:

✅ https://tracker.example.org/?url=https://example.org/

❌ https://exampletracker.com/?url=https://example.org/

Otherwise, your advertiser would have to certify their subdomain individually. If this is the case for you and your partners, we recommend considering hosting the subdomains on your domain instead to minimize the certification overhead.
Example
Final URL: https://example.org

Tracking URL: https://example.tracker.com/?redirection_url=https://example.org/