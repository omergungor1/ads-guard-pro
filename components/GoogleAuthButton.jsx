// components/GoogleAuthButton.jsx
// Google OAuth giriş butonu

'use client';

import { useState, useEffect } from 'react';

export default function GoogleAuthButton({ variant = 'default' }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();

            setIsAuthenticated(data.authenticated);
            setUserInfo(data.user);
        } catch (error) {
            console.error('Auth status kontrolü hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        // Mevcut URL'i kaydet (geri dönmek için)
        const returnUrl = window.location.pathname;
        sessionStorage.setItem('auth_return_url', returnUrl);

        // OAuth login'e yönlendir
        window.location.href = '/api/auth/login';
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setIsAuthenticated(false);
            setUserInfo(null);
            window.location.href = '/';
        } catch (error) {
            console.error('Logout hatası:', error);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-48"></div>
        );
    }

    if (isAuthenticated && userInfo) {
        if (variant === 'compact') {
            return (
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">{userInfo.email}</span>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-red-600 hover:text-red-700"
                    >
                        Çıkış
                    </button>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {userInfo.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                            {userInfo.name || userInfo.email}
                        </span>
                        <span className="text-xs text-gray-500">Google hesabı bağlı</span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="ml-auto px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                    Çıkış
                </button>
            </div>
        );
    }

    // Giriş yapmamış
    if (variant === 'compact') {
        return (
            <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-medium">Google ile Giriş</span>
            </button>
        );
    }

    return (
        <div className="text-center">
            <button
                onClick={handleLogin}
                className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
            >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-lg font-semibold text-gray-700">
                    Google ile Giriş Yap
                </span>
            </button>

            <p className="mt-3 text-sm text-gray-500">
                Google Ads API erişimi için giriş gereklidir
            </p>
        </div>
    );
}

