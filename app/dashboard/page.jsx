// app/dashboard/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Dashboard() {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [googleOAuthStatus, setGoogleOAuthStatus] = useState(null);
    const [stats, setStats] = useState({
        totalDomains: 0,
        activeDomains: 0,
        totalClicks: 0,
        blockedIPs: 0
    });

    useEffect(() => {
        if (!authLoading && user) {
            checkAuthThenLoad();
        }
    }, [authLoading, user]);

    const checkAuthThenLoad = async () => {
        try {
            // Google OAuth durumunu kontrol et
            const googleResponse = await fetch('/api/auth/google-status');
            const googleData = await googleResponse.json();
            setGoogleOAuthStatus(googleData);

            loadDomains();
        } catch (error) {
            console.error('Auth kontrolü hatası:', error);
            loadDomains();
        }
    };

    const loadDomains = async () => {
        try {
            const response = await fetch('/api/domains');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Domainler yüklenemedi');
            }

            setDomains(data.domains || []);

            // İstatistikleri hesapla
            const activeDomains = data.domains.filter(d => d.is_active).length;
            setStats({
                totalDomains: data.domains.length,
                activeDomains: activeDomains,
                totalClicks: 0, // Bu API'den gelebilir
                blockedIPs: 0   // Bu API'den gelebilir
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // useAuth zaten yönlendiriyor
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                AdGuardy Dashboard
                            </h1>
                            <p className="text-gray-600">
                                Yönetim paneli
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* User Info */}
                            <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg">
                                <span className="text-sm text-gray-600">
                                    👤 {user?.email}
                                </span>
                            </div>

                            {/* Google OAuth Status */}
                            {googleOAuthStatus && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
                                    <div className={`w-2 h-2 rounded-full ${googleOAuthStatus.connected ? 'bg-green-500' : 'bg-yellow-500'
                                        }`}></div>
                                    <span className="text-sm text-gray-600">
                                        Google Ads {googleOAuthStatus.connected ? 'Bağlı' : 'Bağlı Değil'}
                                    </span>
                                </div>
                            )}

                            {/* Logout Button */}
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm"
                            >
                                Çıkış Yap
                            </button>

                            <Link
                                href="/settings"
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                ⚙️ Ayarlar
                            </Link>

                            <Link
                                href="/domains/new"
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
                            >
                                + Yeni Domain Ekle
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        title="Toplam Domain"
                        value={stats.totalDomains}
                        icon="🌐"
                        color="blue"
                    />
                    <StatsCard
                        title="Aktif Domain"
                        value={stats.activeDomains}
                        icon="✅"
                        color="green"
                    />
                    <StatsCard
                        title="Toplam Tıklama"
                        value={stats.totalClicks}
                        icon="👆"
                        color="purple"
                    />
                    <StatsCard
                        title="Engellenen IP"
                        value={stats.blockedIPs}
                        icon="🚫"
                        color="red"
                    />
                </div>

                {/* Google OAuth Warning */}
                {googleOAuthStatus && !googleOAuthStatus.connected && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <h3 className="font-semibold text-yellow-900 mb-1">
                                    Google Ads API Bağlantısı Gerekli
                                </h3>
                                <p className="text-sm text-yellow-800 mb-3">
                                    Google Ads kampanyalarına IP engelleme eklemek için MCC hesabınızla OAuth bağlantısı yapmalısınız.
                                </p>
                                <Link
                                    href="/settings"
                                    className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                                >
                                    Şimdi Bağlan
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Domains List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">
                            Domainler
                        </h2>
                    </div>

                    {domains.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-6xl mb-4">🌐</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Henüz Domain Eklenmemiş
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Bot koruması için ilk domain'inizi ekleyin
                            </p>
                            <Link
                                href="/domains/new"
                                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                İlk Domain'i Ekle
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Domain
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Durum
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Google Ads ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Oluşturulma
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            İşlemler
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {domains.map((domain) => (
                                        <tr key={domain.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {domain.domain}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            ID: {domain.tracking_id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`
                                                    px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                    ${domain.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'}
                                                `}>
                                                    {domain.is_active ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {domain.ads_account_id || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(domain.created_at).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    href={`/domains/${domain.id}`}
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                >
                                                    Yönet
                                                </Link>
                                                <Link
                                                    href={`/domains/${domain.id}?tab=stats`}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    İstatistikler
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <QuickActionCard
                        title="Google Ads Kampanyalar"
                        description="Google Ads kampanyalarınızı yönetin ve IP engellemeleri yapın"
                        icon="📊"
                        href="/ads-campaigns"
                        buttonText="Kampanyalara Git"
                    />
                    <QuickActionCard
                        title="Bot Analizi"
                        description="Tespit edilen botları ve tehdit analizlerini görüntüleyin"
                        icon="🤖"
                        href="/analytics"
                        buttonText="Analiz Et"
                        disabled={true}
                    />
                    <QuickActionCard
                        title="Sistem Ayarları"
                        description="Google Ads API bağlantısı ve sistem konfigürasyonu"
                        icon="⚙️"
                        href="/settings"
                        buttonText="Ayarları Aç"
                        disabled={false}
                    />
                </div>
            </div>
        </div>
    );
}

// Stats Card Component
function StatsCard({ title, value, icon, color }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        red: 'bg-red-50 text-red-600'
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                        {value}
                    </p>
                </div>
                <div className={`text-4xl ${colorClasses[color]} p-3 rounded-lg`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Quick Action Card Component
function QuickActionCard({ title, description, icon, href, buttonText, disabled }) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                {description}
            </p>
            {disabled ? (
                <button
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                >
                    Yakında
                </button>
            ) : (
                <Link
                    href={href}
                    className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {buttonText}
                </Link>
            )}
        </div>
    );
}
