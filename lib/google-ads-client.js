// lib/google-ads-client.js
import axios from 'axios';

const GOOGLE_ADS_API_VERSION = 'v17';
const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

export class GoogleAdsClient {
    constructor(accessToken, loginCustomerId) {
        this.accessToken = accessToken;
        this.loginCustomerId = loginCustomerId.replace(/-/g, ''); // Tire'leri kaldır
        this.developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    }

    /**
     * Google Ads API'ye istek at
     */
    async request(customerId, endpoint, data = null, method = 'POST') {
        // Customer ID'deki tire'leri kaldır
        const cleanCustomerId = customerId.replace(/-/g, '');
        const url = `${GOOGLE_ADS_API_BASE}/customers/${cleanCustomerId}${endpoint}`;

        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'developer-token': this.developerToken,
            'Content-Type': 'application/json',
        };

        // Login customer ID varsa ekle (MCC hesapları için gerekli)
        if (this.loginCustomerId && this.loginCustomerId !== cleanCustomerId) {
            headers['login-customer-id'] = this.loginCustomerId;
        }

        console.log('API Request:', {
            url,
            method,
            customerId: cleanCustomerId,
            loginCustomerId: this.loginCustomerId,
        });

        try {
            const response = await axios({
                method,
                url,
                headers,
                data,
            });

            return response.data;
        } catch (error) {
            console.error('Google Ads API Error Details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: JSON.stringify(error.response?.data, null, 2),
                url: url,
                headers: headers,
                requestData: data,
            });
            throw error;
        }
    }

    /**
     * GAQL sorgusu çalıştır
     */
    async search(customerId, query) {
        return this.request(customerId, '/googleAds:search', {
            query,
        });
    }

    /**
     * Erişilebilir hesapları listele (MCC altındaki hesaplar)
     */
    async getAccessibleCustomers() {
        try {
            // Eğer login customer ID tanımlıysa, onun altındaki client hesaplarını listele
            // Alternatif: customer_client tablosunu sorgula (MCC hesapları için)
            const query = `
                SELECT 
                    customer_client.client_customer,
                    customer_client.descriptive_name,
                    customer_client.id,
                    customer_client.status
                FROM customer_client
                WHERE customer_client.status = 'ENABLED'
            `;

            try {
                const response = await this.search(this.loginCustomerId, query);

                let customerIds = [];

                if (response.results) {
                    customerIds = response.results.map(row => {
                        const clientCustomer = row.customerClient.clientCustomer;
                        const match = clientCustomer.match(/customers\/(\d+)/);
                        return match ? match[1] : null;
                    }).filter(Boolean);
                } else if (Array.isArray(response)) {
                    customerIds = response.map(item => {
                        const row = item.results?.[0] || item;
                        const clientCustomer = row.customerClient.clientCustomer;
                        const match = clientCustomer.match(/customers\/(\d+)/);
                        return match ? match[1] : null;
                    }).filter(Boolean);
                }

                // Eğer hiç hesap bulunamadıysa, login customer ID'yi kendini döndür
                if (customerIds.length === 0) {
                    customerIds = [this.loginCustomerId];
                }

                return customerIds;
            } catch (error) {
                // Eğer MCC hesabı değilse veya query başarısız olduysa,
                // login customer ID'yi direkt kullan
                console.warn('MCC sorgusu başarısız, login customer ID kullanılıyor:', error.message);
                return [this.loginCustomerId];
            }
        } catch (error) {
            console.error('Accessible customers hatası:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Tüm kampanyaları listele
     */
    async getCampaigns(customerId) {
        const query = `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type
      FROM campaign
      WHERE campaign.status IN ('ENABLED', 'PAUSED')
      ORDER BY campaign.name
    `;

        try {
            const response = await this.search(customerId, query);

            // searchStream response formatı farklı olabilir
            let campaigns = [];

            if (response.results) {
                campaigns = response.results.map(row => ({
                    id: row.campaign.id,
                    name: row.campaign.name,
                    status: row.campaign.status,
                    type: row.campaign.advertisingChannelType,
                }));
            } else if (Array.isArray(response)) {
                // Stream response her satır ayrı object
                campaigns = response.map(item => {
                    const row = item.results?.[0] || item;
                    return {
                        id: row.campaign.id,
                        name: row.campaign.name,
                        status: row.campaign.status,
                        type: row.campaign.advertisingChannelType,
                    };
                });
            }

            return campaigns;
        } catch (error) {
            console.error('getCampaigns hatası:', error);
            throw error;
        }
    }

    /**
     * Kampanyaya IP engelleme ekle
     */
    async addIpExclusions(customerId, campaignId, ipAddresses) {
        const cleanCustomerId = customerId.replace(/-/g, '');

        const operations = ipAddresses.map(ip => ({
            create: {
                campaign: `customers/${cleanCustomerId}/campaigns/${campaignId}`,
                ipBlock: {
                    ipAddress: ip,
                },
                negative: true,
            },
        }));

        return this.request(
            customerId,
            '/campaignCriteria:mutate',
            {
                operations,
                partialFailure: true,
            }
        );
    }

    /**
     * Kampanyadaki mevcut IP engellemelerini getir
     */
    async getIpExclusions(customerId, campaignId) {
        const cleanCustomerId = customerId.replace(/-/g, '');

        const query = `
      SELECT 
        campaign_criterion.criterion_id,
        campaign_criterion.ip_block.ip_address
      FROM campaign_criterion
      WHERE campaign_criterion.campaign = 'customers/${cleanCustomerId}/campaigns/${campaignId}'
      AND campaign_criterion.type = 'IP_BLOCK'
      AND campaign_criterion.negative = TRUE
    `;

        const response = await this.search(customerId, query);

        let ips = [];

        if (response.results) {
            ips = response.results.map(row => ({
                criterionId: row.campaignCriterion.criterionId,
                ipAddress: row.campaignCriterion.ipBlock.ipAddress,
            }));
        } else if (Array.isArray(response)) {
            ips = response.map(item => {
                const row = item.results?.[0] || item;
                return {
                    criterionId: row.campaignCriterion.criterionId,
                    ipAddress: row.campaignCriterion.ipBlock.ipAddress,
                };
            });
        }

        return ips;
    }
}