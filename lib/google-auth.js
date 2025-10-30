// lib/google-auth.js
import { OAuth2Client } from 'google-auth-library';

const SCOPES = [
    'https://www.googleapis.com/auth/adwords',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];

export function getOAuth2Client() {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`;

    return new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );
}

export function getAuthUrl(returnUrl = '/dashboard') {
    const oauth2Client = getOAuth2Client();

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent', // Her zaman refresh token almak için
        state: returnUrl, // Geri dönüş URL'i
    });
}

export async function getTokensFromCode(code) {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

export async function refreshAccessToken(refreshToken) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
}