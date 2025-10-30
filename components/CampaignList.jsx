// components/CampaignList.jsx
'use client';

import { useState } from 'react';
import IpBlockForm from './IpBlockForm';
import Toast from './Toast';

export default function CampaignList({ customerId }) {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [showIpForm, setShowIpForm] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchCampaigns = async () => {
        if (!customerId) {
            setError('Lütfen önce bir hesap seçin');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/campaigns?customer_id=${customerId}`
            );
            const data = await response.json();

            if (data.success) {
                setCampaigns(data.campaigns);
            } else {
                setError(data.error || 'Kampanyalar alınamadı');
            }
        } catch (err) {
            setError('Bağlantı hatası: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBlockIps = async (ipAddresses, campaignId) => {
        try {
            const response = await fetch('/api/campaigns/block-ip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    campaign_id: campaignId,
                    ip_addresses: ipAddresses,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setToast({
                    type: 'success',
                    message: `${ipAddresses.length} IP adresi başarıyla engellendi!`,
                });
                setShowIpForm(false);
                setSelectedCampaign(null);
            } else {
                throw new Error(data.error || 'IP engelleme başarısız');
            }
        } catch (err) {
            setToast({
                type: 'error',
                message: err.message,
            });
            throw err;
        }
    };

    const openIpForm = (campaign) => {
        setSelectedCampaign(campaign);
        setShowIpForm(true);
    };

    const closeIpForm = () => {
        setShowIpForm(false);
        setSelectedCampaign(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Kampanyalar</h2>
                <button
                    onClick={fetchCampaigns}
                    disabled={loading || !customerId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Yükleniyor...
                        </span>
                    ) : (
                        'Kampanyaları Getir'
                    )}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-medium">❌ Hata</p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
            )}

            {campaigns.length > 0 && (
                <>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Kampanya Adı
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Durum
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tip
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {campaigns.map((campaign, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {campaign.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                            {campaign.id}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${campaign.status === 2
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                            >
                                                {campaign.status === 2 ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {campaign.type == 2 ? 'Search' : campaign.type}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <button
                                                onClick={() => openIpForm(campaign)}
                                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                            >
                                                🚫 IP Engelle
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Toplam {campaigns.length} kampanya</span>
                        <span>Customer ID: {customerId}</span>
                    </div>
                </>
            )}

            {/* IP Engelleme Modal */}
            {showIpForm && selectedCampaign && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="text-lg font-bold">IP Engelleme</h3>
                            <button
                                onClick={closeIpForm}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            hello there...
                            <IpBlockForm
                                mode="single"
                                campaignId={selectedCampaign.id}
                                campaignName={selectedCampaign.name}
                                onBlock={handleBlockIps}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}