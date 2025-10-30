// app/settings/page.jsx
// Sistem ayarları ve Google OAuth yönetimi

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

function SettingsPageContent() {
    const searchParams = useSearchParams();
    const { user, loading: authLoading, logout } = useAuth();
    const [googleStatus, setGoogleStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user) {
            loadGoogleStatus();
        }
    }, [authLoading, user]);

    useEffect(() => {
        if (!user || authLoading) return;

        // OAuth success mesajı varsa göster
        if (searchParams.get('oauth_success') === 'true') {
            alert('✅ Google OAuth bağlantısı başarılı!');
            // URL'i temizle
            window.history.replaceState({}, '', '/settings');
        }

        // OAuth error mesajı varsa göster
        if (searchParams.get('error')) {
            alert('❌ Google OAuth bağlantısı başarısız: ' + searchParams.get('error'));
            window.history.replaceState({}, '', '/settings');
        }
    }, [searchParams]);

    const loadGoogleStatus = async () => {
        try {
            const response = await fetch('/api/auth/google-status');
            const data = await response.json();
            setGoogleStatus(data);
        } catch (error) {
            console.error('Google status yükleme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleConnect = () => {
        // OAuth flow başlat
        window.location.href = '/api/auth/login';
    };

    const handleGoogleDisconnect = async () => {
        if (!confirm('Google OAuth bağlantısını kesmek istediğinizden emin misiniz?\n\nBu işlem tüm Google Ads API erişimini devre dışı bırakır.')) {
            return;
        }

        try {
            const response = await fetch('/api/auth/google-disconnect', {
                method: 'POST'
            });

            if (response.ok) {
                alert('✅ Google OAuth bağlantısı kesildi');
                loadGoogleStatus();
            } else {
                alert('❌ Bağlantı kesilemedi');
            }
        } catch (error) {
            console.error('Disconnect hatası:', error);
            alert('❌ Bir hata oluştu');
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
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <Link
                            href="/dashboard"
                            className="text-blue-600 hover:text-blue-700 inline-flex items-center"
                        >
                            ← Dashboard'a Dön
                        </Link>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">👤 {user.email}</span>
                            <button
                                onClick={logout}
                                className="px-3 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 text-sm"
                            >
                                Çıkış
                            </button>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Sistem Ayarları
                    </h1>
                    <p className="text-gray-600">
                        Google Ads API entegrasyonu ve sistem konfigürasyonu
                    </p>
                </div>

                {/* Google OAuth Status */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Google Ads API Bağlantısı
                    </h2>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Kontrol ediliyor...</p>
                        </div>
                    ) : (
                        <>
                            {googleStatus?.connected ? (
                                <div className="space-y-4">
                                    {/* Connected Status */}
                                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-green-900">Bağlantı Aktif</h3>
                                            <p className="text-sm text-green-700">
                                                Google Ads API erişimi yapılandırılmış
                                            </p>
                                        </div>
                                    </div>

                                    {/* Connection Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">Google Hesabı</p>
                                            <p className="font-medium text-gray-900">{googleStatus.email}</p>
                                        </div>

                                        {googleStatus.mcc_customer_id && (
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600 mb-1">MCC Customer ID</p>
                                                <p className="font-medium text-gray-900">{googleStatus.mcc_customer_id}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Disconnect Button */}
                                    <div className="pt-4 border-t">
                                        <button
                                            onClick={handleGoogleDisconnect}
                                            className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            Bağlantıyı Kes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Not Connected */}
                                    <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-yellow-900">Bağlantı Yok</h3>
                                            <p className="text-sm text-yellow-700">
                                                Google Ads API kullanmak için OAuth bağlantısı gereklidir
                                            </p>
                                        </div>
                                    </div>

                                    {/* Setup Instructions */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-gray-900">Kurulum Adımları:</h3>
                                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                                            <li>Aşağıdaki butona tıklayın</li>
                                            <li>Google MCC hesabınızla giriş yapın</li>
                                            <li>İzinleri onaylayın</li>
                                            <li>Otomatik olarak bu sayfaya geri döneceksiniz</li>
                                        </ol>
                                    </div>

                                    {/* Connect Button */}
                                    <div className="pt-4">
                                        <button
                                            onClick={handleGoogleConnect}
                                            className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                                        >
                                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            <span className="text-lg font-semibold text-gray-700">
                                                Google ile Bağlan (MCC Hesabı)
                                            </span>
                                        </button>
                                    </div>

                                    {/* Important Notes */}
                                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h4 className="font-semibold text-blue-900 mb-2">📋 Önemli Notlar</h4>
                                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                            <li>MCC (My Client Center) hesabınızla giriş yapın</li>
                                            <li>Bu bağlantı tüm sistem için geçerlidir</li>
                                            <li>Her kullanıcı ayrı Google OAuth yapmaz</li>
                                            <li>Token'lar güvenli bir şekilde saklanır</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Additional Settings */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Diğer Ayarlar
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Yakında eklenecek...
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        }>
            <SettingsPageContent />
        </Suspense>
    );
}

