// app/domains/[id]/page.jsx
// Domain detay ve yönetim sayfası

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DomainDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [domain, setDomain] = useState(null);
    const [rules, setRules] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadDomain();
    }, [params.id]);

    const loadDomain = async () => {
        try {
            const [domainRes, rulesRes] = await Promise.all([
                fetch(`/api/domains/${params.id}`),
                fetch(`/api/domains/${params.id}/rules`)
            ]);

            const domainData = await domainRes.json();
            const rulesData = await rulesRes.json();

            if (!domainRes.ok) {
                throw new Error(domainData.error || 'Domain yüklenemedi');
            }

            setDomain(domainData.domain);
            setRules(rulesData.rules || {
                max_clicks: 3,
                time_window_days: 15,
                time_window_hours: 0,
                time_window_minutes: 0,
                blocking_mode: 'moderate',
                auto_block_enabled: true,
                block_vpn: true,
                block_proxy: true,
                block_hosting: true,
                block_tor: true
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRules = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/domains/${params.id}/rules`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rules)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Kurallar kaydedilemedi');
            }

            alert('Kurallar başarıyla kaydedildi!');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
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
                            { id: 'rules', label: 'Koruma Kuralları' },
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
                        </div>
                    )}

                    {/* Rules Tab */}
                    {activeTab === 'rules' && (
                        <form onSubmit={handleSaveRules}>
                            <h2 className="text-2xl font-bold mb-6">Koruma Kuralları</h2>

                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* Click Limit */}
                                <div className="border-b pb-6">
                                    <h3 className="text-lg font-semibold mb-4">Tıklama Limiti</h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Maksimum Tıklama
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={rules.max_clicks}
                                                onChange={(e) => setRules({ ...rules, max_clicks: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Gün
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={rules.time_window_days}
                                                onChange={(e) => setRules({ ...rules, time_window_days: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Saat
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="23"
                                                value={rules.time_window_hours}
                                                onChange={(e) => setRules({ ...rules, time_window_hours: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Dakika
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={rules.time_window_minutes}
                                                onChange={(e) => setRules({ ...rules, time_window_minutes: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">
                                        <strong>Kural:</strong> {rules.max_clicks} tıklama /
                                        {rules.time_window_days > 0 && ` ${rules.time_window_days} gün`}
                                        {rules.time_window_hours > 0 && ` ${rules.time_window_hours} saat`}
                                        {rules.time_window_minutes > 0 && ` ${rules.time_window_minutes} dakika`}
                                        {rules.time_window_days === 0 && rules.time_window_hours === 0 && rules.time_window_minutes === 0 && ' ∞ (İlk tıklamada engelle)'}
                                    </p>
                                </div>

                                {/* Auto Block */}
                                <div className="border-b pb-6">
                                    <h3 className="text-lg font-semibold mb-4">Otomatik Engelleme</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={rules.auto_block_enabled}
                                                onChange={(e) => setRules({ ...rules, auto_block_enabled: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="ml-2 text-gray-700 font-medium">Otomatik Engelleme Aktif</span>
                                        </label>

                                        {rules.auto_block_enabled && (
                                            <div className="ml-6 space-y-2">
                                                {[
                                                    { key: 'block_vpn', label: 'VPN Kullanıcılarını Engelle' },
                                                    { key: 'block_proxy', label: 'Proxy Kullanıcılarını Engelle' },
                                                    { key: 'block_hosting', label: 'Hosting/Datacenter IP\'lerini Engelle' },
                                                    { key: 'block_tor', label: 'Tor Exit Node\'larını Engelle' }
                                                ].map(({ key, label }) => (
                                                    <label key={key} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={rules[key]}
                                                            onChange={(e) => setRules({ ...rules, [key]: e.target.checked })}
                                                            className="w-4 h-4 text-blue-600 rounded"
                                                        />
                                                        <span className="ml-2 text-gray-700">{label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Session Settings */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Session Ayarları</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Min. Session Süresi (sn)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={rules.min_session_duration_seconds || 5}
                                                onChange={(e) => setRules({ ...rules, min_session_duration_seconds: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Maks. Tıklama/Session
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={rules.max_clicks_per_session || 10}
                                                onChange={(e) => setRules({ ...rules, max_clicks_per_session: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Min. Scroll Derinliği (%)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={rules.min_scroll_depth_percent || 10}
                                                onChange={(e) => setRules({ ...rules, min_scroll_depth_percent: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? 'Kaydediliyor...' : 'Kuralları Kaydet'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Tracking Tab */}
                    {activeTab === 'tracking' && (
                        <TrackingCodesTab domainId={domain.id} />
                    )}

                    {/* Stats Tab */}
                    {activeTab === 'stats' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">İstatistikler</h2>
                            <p className="text-gray-600">
                                İstatistikler yakında eklenecek...
                            </p>
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
            </div>
        </div>
    );
}

