'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase-client';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Zaten giriş yapmışsa dashboard'a yönlendir
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push('/dashboard');
            } else {
                setLoading(false);
            }
        };

        checkUser();

        // Auth state değişikliklerini dinle
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // Session cookie'ye kaydet
                await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        access_token: session.access_token,
                        refresh_token: session.refresh_token,
                    }),
                });

                router.push('/dashboard');
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        🛡️ AdsGuard Pro
                    </h1>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                        Admin Girişi
                    </h2>
                    <p className="text-gray-600">
                        Google Ads kampanyalarınızı koruyun
                    </p>
                </div>

                {/* Auth UI */}
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <Auth
                        supabaseClient={supabase}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: '#2563eb',
                                        brandAccent: '#1d4ed8',
                                    },
                                },
                            },
                            className: {
                                container: 'w-full',
                                button: 'w-full px-4 py-2 font-medium rounded-lg',
                                input: 'w-full px-4 py-2 border rounded-lg',
                            },
                        }}
                        providers={[]}
                        view="sign_in"
                        showLinks={false}
                        localization={{
                            variables: {
                                sign_in: {
                                    email_label: 'E-posta',
                                    password_label: 'Şifre',
                                    button_label: 'Giriş Yap',
                                    loading_button_label: 'Giriş yapılıyor...',
                                    email_input_placeholder: 'admin@example.com',
                                    password_input_placeholder: '••••••••',
                                },
                            },
                        }}
                    />

                    {/* Info Box */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>ℹ️ Not:</strong> Sadece admin tarafından eklenmiş kullanıcılar giriş yapabilir.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500">
                    <p>AdsGuard Pro - Google Ads Koruma Sistemi</p>
                </div>
            </div>
        </div>
    );
}

