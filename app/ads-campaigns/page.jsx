// app/ads-campaigns/page.jsx
// Google Ads Kampanya Yönetimi Sayfası

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerSelector from '@/components/CustomerSelector';
import CampaignList from '@/components/CampaignList';
import IpBlockForm from '@/components/IpBlockForm';
import Toast from '@/components/Toast';

export default function AdsCampaignsPage() {
    const router = useRouter();
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [showBulkIpForm, setShowBulkIpForm] = useState(false);
    const [toast, setToast] = useState(null);

    const handleBulkBlockIps = async (ipAddresses) => {
        try {
            const response = await fetch('/api/campaigns/block-ip-bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer_id: selectedCustomerId,
                    ip_addresses: ipAddresses,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setToast({
                    type: 'success',
                    message: `${ipAddresses.length} IP adresi ${data.affected_campaigns} kampanyaya başarıyla engellendi!`,
                });
                setShowBulkIpForm(false);
            } else {
                throw new Error(data.error || 'Toplu IP engelleme başarısız');
            }
        } catch (err) {
            setToast({
                type: 'error',
                message: err.message,
            });
            throw err;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/dashboard"
                        className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center"
                    >
                        ← Dashboard'a Dön
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
                        Google Ads Kampanya Yönetimi
                    </h1>
                    <p className="text-gray-600">
                        Kampanyalarınıza manuel IP engellemeleri ekleyin
                    </p>
                </div>

                {/* Success Alert */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h2 className="text-lg font-semibold text-green-900 mb-1">
                        ✅ OAuth Başarılı!
                    </h2>
                    <p className="text-sm text-green-700">
                        Hesaplarınızı seçip kampanyalarınızı görüntüleyebilirsiniz.
                    </p>
                </div>

                {/* Customer Selector */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex items-center justify-between">
                    <CustomerSelector onSelectCustomer={setSelectedCustomerId} />

                    {/* Toplu IP Engelleme Butonu */}
                    {selectedCustomerId && (
                        <button
                            onClick={() => setShowBulkIpForm(true)}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg"
                        >
                            Toplu IP Engelle
                        </button>
                    )}
                </div>

                {/* Campaign List */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <CampaignList customerId={selectedCustomerId} />
                </div>

                {/* Toplu IP Engelleme Modal */}
                {showBulkIpForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="text-lg font-bold">Toplu IP Engelleme</h3>
                                <button
                                    onClick={() => setShowBulkIpForm(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-6">
                                <IpBlockForm
                                    mode="bulk"
                                    onBlock={handleBulkBlockIps}
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
        </div>
    );
}

