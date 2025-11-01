// lib/google-ads-client-official.js
// Resmi Google Ads API kütüphanesi kullanımı

import { GoogleAdsApi } from 'google-ads-api';

export class GoogleAdsClientOfficial {
    constructor(accessToken, refreshToken, loginCustomerId = null) {
        this.client = new GoogleAdsApi({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        });

        // OAuth credentials
        this.credentials = {
            access_token: accessToken,
            refresh_token: refreshToken,
        };

        this.loginCustomerId = loginCustomerId ? loginCustomerId.replace(/-/g, '') : null;
    }

    /**
     * Müşteri objesi oluştur
     */
    getCustomer(customerId) {
        const cleanCustomerId = customerId.replace(/-/g, '');

        const customerOptions = {
            customer_id: cleanCustomerId,
            refresh_token: this.credentials.refresh_token,
        };

        // MCC hesabı varsa login_customer_id ekle
        if (this.loginCustomerId && this.loginCustomerId !== cleanCustomerId) {
            customerOptions.login_customer_id = this.loginCustomerId;
        }

        return this.client.Customer(customerOptions);
    }

    /**
     * Erişilebilir hesapları listele
     */
    async getAccessibleCustomers() {
        try {
            // MCC hesabından alt hesapları çek
            if (!this.loginCustomerId) {
                throw new Error('Login Customer ID gerekli');
            }

            console.log('🔍 MCC Hesabından client hesaplar aranıyor:', this.loginCustomerId);

            const customer = this.getCustomer(this.loginCustomerId);

            const query = `
                SELECT 
                    customer_client.client_customer,
                    customer_client.descriptive_name,
                    customer_client.id,
                    customer_client.status,
                    customer_client.manager
                FROM customer_client
                WHERE customer_client.status = 'ENABLED'
                AND customer_client.manager = FALSE
            `;

            try {
                const result = await customer.query(query);

                console.log('📊 Query sonucu:', JSON.stringify(result, null, 2));

                const customerIds = result.map(row => {
                    const clientCustomer = row.customer_client.client_customer;
                    console.log('👤 Client customer bulundu:', {
                        name: row.customer_client.descriptive_name,
                        customer: clientCustomer,
                        id: row.customer_client.id,
                        isManager: row.customer_client.manager
                    });
                    const match = clientCustomer.match(/customers\/(\d+)/);
                    return match ? match[1] : null;
                }).filter(Boolean);

                console.log('✅ Toplam client hesap sayısı:', customerIds.length);
                console.log('📋 Client hesap ID\'leri:', customerIds);

                // Hiç hesap bulunamadıysa login customer ID'yi döndür (MCC değil demektir)
                if (customerIds.length === 0) {
                    console.warn('⚠️ Hiç client hesap bulunamadı, MCC ID kullanılıyor');
                    return [this.loginCustomerId];
                }

                return customerIds;
            } catch (error) {
                // MCC değilse veya hata oluştuysa, login customer ID'yi döndür
                console.error('❌ MCC sorgusu başarısız:', error.message);
                console.log('🔄 Direkt customer ID kullanılıyor:', this.loginCustomerId);
                return [this.loginCustomerId];
            }
        } catch (error) {
            console.error('getAccessibleCustomers hatası:', error);
            throw error;
        }
    }

    /**
     * Kampanyaları listele
     */
    async getCampaigns(customerId) {
        const customer = this.getCustomer(customerId);

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
            const result = await customer.query(query);

            const campaigns = result.map(row => ({
                id: row.campaign.id.toString(),
                name: row.campaign.name,
                status: row.campaign.status,
                type: row.campaign.advertising_channel_type,
            }));

            return campaigns;
        } catch (error) {
            console.error('getCampaigns hatası:', error);
            throw error;
        }
    }

    /**
     * IP engelleme ekle
     */
    async addIpExclusions(customerId, campaignId, ipAddresses) {
        const customer = this.getCustomer(customerId);
        const cleanCustomerId = customerId.replace(/-/g, '');

        console.log('cleanCustomerId:', cleanCustomerId);
        console.log('campaignId:', campaignId);
        console.log('ipAddresses:', ipAddresses);

        const operations = ipAddresses.map(ip => ({
            campaign: `customers/${cleanCustomerId}/campaigns/${campaignId}`,
            type: 'IP_BLOCK',
            ip_block: {
                ip_address: ip,
            },
            negative: true,
        }));

        console.log('operations:', JSON.stringify(operations, null, 2));

        try {
            const result = await customer.campaignCriteria.create(operations);
            console.log('IP engelleme başarılı:', result);
            return result;
        } catch (error) {
            console.error('addIpExclusions hatası:', error);
            throw error;
        }
    }

    /**
     * Mevcut IP engellemelerini getir
     */
    async getIpExclusions(customerId, campaignId) {
        const customer = this.getCustomer(customerId);
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

        try {
            const result = await customer.query(query);

            const ips = result.map(row => ({
                criterionId: row.campaign_criterion.criterion_id.toString(),
                ipAddress: row.campaign_criterion.ip_block.ip_address,
            }));

            return ips;
        } catch (error) {
            console.error('getIpExclusions hatası:', error);
            throw error;
        }
    }

    /**
     * IP engellemelerini kaldır
     */
    async removeIpExclusions(customerId, campaignId, ipAddresses) {
        const customer = this.getCustomer(customerId);
        const cleanCustomerId = customerId.replace(/-/g, '');

        console.log('🗑️ IP engelleme kaldırma işlemi başlatıldı');
        console.log('customerId:', customerId);
        console.log('campaignId:', campaignId);
        console.log('ipAddresses:', ipAddresses);

        try {
            // Önce mevcut IP engellemelerini al
            const existingIps = await this.getIpExclusions(customerId, campaignId);
            console.log('📋 Mevcut IP engelleme sayısı:', existingIps.length);

            // Kaldırılacak IP'lerin criterion_id'lerini bul
            const criterionIdsToRemove = existingIps
                .filter(ip => ipAddresses.includes(ip.ipAddress))
                .map(ip => ip.criterionId);

            if (criterionIdsToRemove.length === 0) {
                console.log('⚠️ Kaldırılacak IP bulunamadı');
                return {
                    success: true,
                    removedCount: 0,
                    message: 'Belirtilen IP adresleri bulunamadı',
                };
            }

            console.log('🗑️ Kaldırılacak criterion ID\'ler:', criterionIdsToRemove);

            // Campaign criterion'ları sil
            const removeOperations = criterionIdsToRemove.map(criterionId =>
                `customers/${cleanCustomerId}/campaignCriteria/${campaignId}~${criterionId}`
            );

            const result = await customer.campaignCriteria.remove(removeOperations);

            console.log('✅ IP engelleme kaldırma başarılı!');
            console.log('📊 Kaldırılan IP sayısı:', criterionIdsToRemove.length);

            return {
                success: true,
                removedCount: criterionIdsToRemove.length,
                results: result,
            };
        } catch (error) {
            console.error('❌ IP engelleme kaldırma hatası:', error);
            throw error;
        }
    }
}

