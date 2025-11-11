// middleware.js
// Route protection with Supabase Auth

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // OPTIONS isteklerini (CORS preflight) direkt geç
    if (request.method === 'OPTIONS') {
        return NextResponse.next();
    }

    // Public routes (herkes erişebilir)
    const publicPaths = [
        '/login',
        '/api/auth/session',
        '/api/tracker',
        '/api/track/init',
        '/api/track/event',
        '/api/track/heartbeat',
        '/api/track/end',
        '/js/tracker.js',
        '/_next',
        '/favicon.ico',
    ];

    // Public path kontrolü
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    if (isPublicPath) {
        return NextResponse.next();
    }

    // Ana sayfa için özel kontrol
    if (pathname === '/') {
        const accessToken = request.cookies.get('sb-access-token')?.value;
        if (accessToken) {
            // Giriş yapmışsa dashboard'a yönlendir
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        // Giriş yapmamışsa login'e yönlendir
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Protected routes - Auth kontrolü
    const accessToken = request.cookies.get('sb-access-token')?.value;
    const refreshToken = request.cookies.get('sb-refresh-token')?.value;

    if (!accessToken || !refreshToken) {
        // Token yoksa login'e yönlendir
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Token'ı doğrula
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data: { user }, error } = await supabase.auth.getUser(accessToken);

        if (error || !user) {
            // Token geçersiz, login'e yönlendir
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('sb-access-token');
            response.cookies.delete('sb-refresh-token');
            return response;
        }

        // Token geçerli, devam et
        return NextResponse.next();

    } catch (error) {
        console.error('Middleware auth hatası:', error);
        // Hata durumunda login'e yönlendir
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

// Middleware'in çalışacağı route'lar
export const config = {
    matcher: [
        /*
         * Şu path'ler HARİÇ tüm route'ları kontrol et:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

