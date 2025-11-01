// app/domains/[id]/page.jsx
// Domain detay ve yönetim sayfası - Agresif Engelleme Sistemi

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function DomainDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [domain, setDomain] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [blockedIps, setBlockedIps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [syncingCampaigns, setSyncingCampaigns] = useState(false);
    const [syncMessage, setSyncMessage] = useState(null);

    useEffect(() => {
        loadDomain();
        loadCampaigns();
        loadBlockedIps();
    }, [params.id]);

    const loadDomain = async () => {
        try {
            const response = await fetch(`/api/domains/${params.id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Domain yüklenemedi');
            }

            setDomain(data.domain);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadCampaigns = async () => {
        try {
            const response = await fetch(`/api/domains/${params.id}/campaigns`);
            if (response.ok) {
                const data = await response.json();
                setCampaigns(data.campaigns || []);
            }
        } catch (err) {
            console.error('Kampanyalar yüklenemedi:', err);
        }
    };

    const loadBlockedIps = async () => {
        try {
            const response = await fetch(`/api/campaigns/blocked-ips?domain_id=${params.id}`);
            if (response.ok) {
                const data = await response.json();
                setBlockedIps(data.blocked_ips || []);
            }
        } catch (err) {
            console.error('Engellenen IP\'ler yüklenemedi:', err);
        }
    };

    const handleDeleteDomain = async () => {
        if (!confirm('Bu domain\'i silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
            return;
        }

        try {
            const response = await fetch(`/api/domains/${params.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Domain silinemedi');
            }

            alert('Domain başarıyla silindi');
            router.push('/dashboard');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSyncCampaigns = async () => {
        setSyncingCampaigns(true);
        setSyncMessage(null);

        try {
            const response = await fetch(`/api/domains/${params.id}/campaigns`, {
                method: 'POST'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Kampanyalar senkronize edilemedi');
            }

            // Başarılı - kampanya listesini güncelle
            setCampaigns(data.campaigns || []);

            // Başarı mesajı göster
            const { stats } = data;
            const messages = [];
            if (stats.added > 0) messages.push(`${stats.added} yeni kampanya eklendi`);
            if (stats.updated > 0) messages.push(`${stats.updated} kampanya güncellendi`);
            if (stats.deactivated > 0) messages.push(`${stats.deactivated} kampanya deaktif edildi`);

            const successMessage = messages.length > 0
                ? messages.join(', ')
                : 'Kampanyalar güncel, değişiklik yok';

            setSyncMessage({
                type: 'success',
                text: `✅ ${successMessage}`
            });

            // 5 saniye sonra mesajı temizle
            setTimeout(() => setSyncMessage(null), 5000);

        } catch (err) {
            setSyncMessage({
                type: 'error',
                text: `❌ ${err.message}`
            });
            // Hata mesajını 8 saniye göster
            setTimeout(() => setSyncMessage(null), 8000);
        } finally {
            setSyncingCampaigns(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !domain) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Domain bulunamadı'}</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Dashboard'a Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 text-gray-600">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
                    >
                        ← Geri
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {domain.domain}
                            </h1>
                            <p className="text-gray-600">
                                Tracking ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{domain.tracking_id}</code>
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${domain.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                {domain.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                            <button
                                onClick={handleDeleteDomain}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <div className="flex space-x-8">
                        {[
                            { id: 'overview', label: 'Genel Bakış' },
                            { id: 'protection', label: 'Koruma Sistemi' },
                            { id: 'campaigns', label: 'Kampanyalar' },
                            { id: 'tracking', label: 'Tracking Kodları' },
                            { id: 'stats', label: 'İstatistikler' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold mb-4">Genel Bilgiler</h2>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Domain
                                    </label>
                                    <p className="text-lg">{domain.domain}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Google Ads Hesap ID
                                    </label>
                                    <p className="text-lg">{domain.ads_account_id || 'Henüz eklenmedi'}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Zaman Dilimi
                                    </label>
                                    <p className="text-lg">{domain.timezone}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Oluşturulma Tarihi
                                    </label>
                                    <p className="text-lg">
                                        {new Date(domain.created_at).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-4 mt-8">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="text-sm text-blue-600 mb-1">Kampanyalar</div>
                                    <div className="text-2xl font-bold text-blue-900">{campaigns.length}</div>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="text-sm text-red-600 mb-1">Engellenen IP</div>
                                    <div className="text-2xl font-bold text-red-900">{blockedIps.length}</div>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="text-sm text-green-600 mb-1">Durum</div>
                                    <div className="text-lg font-bold text-green-900">
                                        {domain.is_active ? '🛡️ Korunuyor' : '⚠️ Pasif'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Protection System Tab */}
                    {activeTab === 'protection' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold mb-4">Agresif Engelleme Sistemi</h2>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                <div className="flex items-start">
                                    <div className="text-4xl mr-4">🛡️</div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-green-900 mb-2">
                                            Agresif Koruma Aktif
                                        </h3>
                                        <p className="text-green-800 mb-3">
                                            Domain'iniz maksimum koruma seviyesinde. Ads'dan gelen tüm IP'ler anında engelleniyor.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Koruma Özellikleri</h3>

                                <div className="space-y-3">
                                    <div className="flex items-start border-b pb-3">
                                        <span className="text-green-600 mr-3 text-xl">✅</span>
                                        <div>
                                            <div className="font-medium">Anında Engelleme</div>
                                            <div className="text-sm text-gray-600">
                                                Ads'dan gelen HER IP anında engellenir, kural ve threshold yok
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start border-b pb-3">
                                        <span className="text-green-600 mr-3 text-xl">✅</span>
                                        <div>
                                            <div className="font-medium">Domain Bazlı Koruma</div>
                                            <div className="text-sm text-gray-600">
                                                Bir IP engellendi mi? Tüm kampanyalarınızdan otomatik engellenir
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start border-b pb-3">
                                        <span className="text-green-600 mr-3 text-xl">✅</span>
                                        <div>
                                            <div className="font-medium">Whitelist Koruması</div>
                                            <div className="text-sm text-gray-600">
                                                Googlebot, Bingbot ve diğer arama motorları otomatik whitelist'te
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start border-b pb-3">
                                        <span className="text-green-600 mr-3 text-xl">✅</span>
                                        <div>
                                            <div className="font-medium">IP-API Entegrasyonu</div>
                                            <div className="text-sm text-gray-600">
                                                Her IP için konum, ISP ve tehdit bilgisi otomatik toplanır
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start pb-3">
                                        <span className="text-green-600 mr-3 text-xl">✅</span>
                                        <div>
                                            <div className="font-medium">Otomatik Kampanya Tespiti</div>
                                            <div className="text-sm text-gray-600">
                                                Yeni kampanyalar otomatik tespit edilip koruma altına alınır
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                                <h4 className="font-semibold text-blue-900 mb-2">📊 İstatistikler</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-blue-700">Engellenen IP:</span>
                                        <span className="font-bold ml-2">{blockedIps.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-blue-700">Korunan Kampanya:</span>
                                        <span className="font-bold ml-2">{campaigns.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Campaigns Tab */}
                    {activeTab === 'campaigns' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold">Kampanyalar</h2>
                                <button
                                    onClick={handleSyncCampaigns}
                                    disabled={syncingCampaigns}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {syncingCampaigns ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Senkronize ediliyor...
                                        </>
                                    ) : (
                                        <>
                                            🔄 Kampanyaları Güncelle
                                        </>
                                    )}
                                </button>
                            </div>

                            {syncMessage && (
                                <div className={`mb-4 p-4 rounded-lg border ${syncMessage.type === 'success'
                                    ? 'bg-green-50 border-green-200 text-green-800'
                                    : 'bg-red-50 border-red-200 text-red-800'
                                    }`}>
                                    {syncMessage.text}
                                </div>
                            )}

                            {campaigns.length === 0 ? (
                                <div className="text-center py-8 text-gray-600">
                                    <p>Henüz kampanya eklenmedi.</p>
                                    <p className="text-sm mt-2">
                                        Kampanyalar otomatik olarak tracking URL'den tespit edilir.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {campaigns.map((campaign) => (
                                        <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {campaign.campaign_name || campaign.campaign_id}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        ID: {campaign.campaign_id}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Eklenme: {campaign.added_method === 'manual' ? 'Manuel' : 'Otomatik'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${campaign.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {campaign.is_active ? 'Aktif' : 'Pasif'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tracking Tab */}
                    {activeTab === 'tracking' && (
                        <TrackingCodesTab domainId={domain.id} />
                    )}

                    {/* Stats Tab */}
                    {activeTab === 'stats' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">İstatistikler</h2>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold mb-4">Engellenen IP'ler</h3>
                                    <div className="text-3xl font-bold text-red-600">{blockedIps.length}</div>
                                    <p className="text-sm text-gray-600 mt-2">Toplam engelleme</p>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold mb-4">Kampanyalar</h3>
                                    <div className="text-3xl font-bold text-blue-600">{campaigns.length}</div>
                                    <p className="text-sm text-gray-600 mt-2">Korunan kampanya</p>
                                </div>
                            </div>

                            {blockedIps.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Son Engellenen IP'ler</h3>
                                    <div className="space-y-2">
                                        {blockedIps.slice(0, 10).map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center border-b pb-2">
                                                <div>
                                                    <span className="font-mono">{item.ip}</span>
                                                    {item.ip_info && (
                                                        <span className="text-sm text-gray-600 ml-2">
                                                            ({item.ip_info.city}, {item.ip_info.country_code})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(item.blocked_at).toLocaleString('tr-TR')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Tracking Codes Component
function TrackingCodesTab({ domainId }) {
    const [trackingCode, setTrackingCode] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/domains/${domainId}/tracking-code`)
            .then(res => res.json())
            .then(data => {
                setTrackingCode(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Tracking code yüklenemedi:', err);
                setLoading(false);
            });
    }, [domainId]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Kopyalandı!');
    };

    if (loading) {
        return <div className="text-center py-8">Yükleniyor...</div>;
    }

    if (!trackingCode) {
        return <div className="text-center py-8 text-red-600">Tracking kodları yüklenemedi</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Tracking Kodları</h2>

            {/* Tracking Script */}
            <div>
                <h3 className="text-lg font-semibold mb-3">1. Tracking Script (Sitenize Ekleyin)</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-3 relative">
                    <pre className="text-sm overflow-x-auto">{trackingCode.tracking_script}</pre>
                    <button
                        onClick={() => copyToClipboard(trackingCode.tracking_script)}
                        className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                        Kopyala
                    </button>
                </div>
                <p className="text-sm text-gray-600">
                    Bu kodu sitenizin &lt;head&gt; bölümüne ekleyin.
                </p>
            </div>

            {/* Tracking Template */}
            <div>
                <h3 className="text-lg font-semibold mb-3">2. Google Ads Tracking Template</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-3 relative">
                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-all">
                        {trackingCode.tracking_template_url}
                    </pre>
                    <button
                        onClick={() => copyToClipboard(trackingCode.tracking_template_url)}
                        className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                        Kopyala
                    </button>
                </div>
                <p className="text-sm text-gray-600">
                    Bu URL'i Google Ads hesabınızda Account Settings → Tracking → Tracking template alanına ekleyin.
                </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Önemli</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Tracking Template mutlaka Google Ads hesabınızda ayarlanmalıdır</li>
                    <li>Site tracking scripti opsiyonel ama önerilir (daha iyi analiz)</li>
                    <li>Değişiklikler 24 saat içinde etkili olur</li>
                </ul>
            </div>
        </div>
    );
}
