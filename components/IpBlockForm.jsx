// components/IpBlockForm.jsx
'use client';

import { useState } from 'react';

export default function IpBlockForm({ onBlock, mode = 'single', campaignId = null, campaignName = null }) {
    const [ipList, setIpList] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);

    // IP validasyonu (IPv4 ve IPv6 destekli, CIDR notasyonu da destekli)
    const validateIp = (ip) => {
        // IPv4 (CIDR ile veya normal)
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
        // IPv6 (basit validasyon)
        const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(\/\d{1,3})?$/;

        if (ipv4Regex.test(ip)) {
            // IPv4 oktet kontrolü (0-255 arası)
            const parts = ip.split('/')[0].split('.');
            return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
        }

        return ipv6Regex.test(ip);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setValidationErrors([]);

        // IP'leri satır satır ayır ve temizle
        const ips = ipList
            .split('\n')
            .map(ip => ip.trim())
            .filter(ip => ip.length > 0);

        if (ips.length === 0) {
            setError('Lütfen en az bir IP adresi girin');
            return;
        }

        // Validasyon kontrolü
        const errors = [];
        const validIps = [];

        ips.forEach((ip, index) => {
            if (validateIp(ip)) {
                validIps.push(ip);
            } else {
                errors.push(`Satır ${index + 1}: "${ip}" geçerli bir IP adresi değil`);
            }
        });

        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        setLoading(true);

        try {
            await onBlock(validIps, campaignId);
            // Başarılı olursa formu temizle
            setIpList('');
        } catch (err) {
            setError(err.message || 'IP engelleme sırasında hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {mode === 'bulk' ? '🚫 Toplu IP Engelleme' : `🚫 IP Engelleme: ${campaignName}`}
                </h3>
                <p className="text-sm text-gray-600">
                    {mode === 'bulk'
                        ? 'Aşağıdaki IP adreslerini TÜM kampanyalara engelleyeceksiniz'
                        : 'Aşağıdaki IP adreslerini bu kampanyaya engelleyeceksiniz'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        IP Adresleri (her satıra bir tane)
                    </label>
                    <textarea
                        value={ipList}
                        onChange={(e) => setIpList(e.target.value)}
                        placeholder="Örnek:&#10;192.168.1.100&#10;10.0.0.0/24&#10;2001:0db8:85a3::8a2e:0370:7334"
                        rows={8}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        disabled={loading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        IPv4, IPv6 ve CIDR notasyonları desteklenir (örn: 192.168.1.0/24)
                    </p>
                </div>

                {validationErrors.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm font-medium text-yellow-900 mb-2">
                            ⚠️ Validasyon Hataları:
                        </p>
                        <ul className="list-disc list-inside text-xs text-yellow-800 space-y-1">
                            {validationErrors.map((err, idx) => (
                                <li key={idx}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-900">❌ Hata</p>
                        <p className="text-xs text-red-700 mt-1">{error}</p>
                    </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600">
                        {ipList.split('\n').filter(ip => ip.trim().length > 0).length} IP adresi
                    </div>
                    <button
                        type="submit"
                        disabled={loading || ipList.trim().length === 0}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                İşleniyor...
                            </span>
                        ) : (
                            mode === 'bulk' ? '🚫 Tüm Kampanyalara Engelle' : '🚫 Engelle'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

