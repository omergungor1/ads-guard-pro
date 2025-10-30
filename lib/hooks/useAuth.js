// lib/hooks/useAuth.js
// Supabase Authentication hook

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

export function useAuth(redirectTo = '/login') {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Session kontrolü
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error || !session) {
                    // Session yoksa login'e yönlendir
                    router.push(redirectTo);
                    return;
                }

                setUser(session.user);

                // Session'ı cookie'ye kaydet
                await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        access_token: session.access_token,
                        refresh_token: session.refresh_token,
                    }),
                });

            } catch (error) {
                console.error('Session kontrolü hatası:', error);
                router.push(redirectTo);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Auth state değişikliklerini dinle
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                setUser(null);
                router.push(redirectTo);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                setUser(session.user);

                // Session'ı cookie'ye kaydet
                await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        access_token: session.access_token,
                        refresh_token: session.refresh_token,
                    }),
                });
            }
        });

        return () => subscription.unsubscribe();
    }, [router, redirectTo]);

    const logout = async () => {
        await supabase.auth.signOut();
        await fetch('/api/auth/session', { method: 'DELETE' });
        router.push('/login');
    };

    return { user, loading, logout };
}

