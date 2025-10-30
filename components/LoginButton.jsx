// components/LoginButton.jsx
'use client';

export default function LoginButton() {
    const handleLogin = () => {
        window.location.href = '/api/auth/login';
    };

    return (
        <button
            onClick={handleLogin}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg"
        >
            Google Ads ile Giriş Yap
        </button>
    );
}