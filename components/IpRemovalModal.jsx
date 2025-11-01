// components/IpRemovalModal.jsx
'use client';

import { useState } from 'react';

export default function IpRemovalModal({ campaign, blockedIps, onClose, onRemove }) {
    const [selectedIps, setSelectedIps] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleToggleIp = (ipAddress) => {
        setSelectedIps(prev => {
            if (prev.includes(ipAddress)) {
                return prev.filter(ip => ip !== ipAddress);
            } else {
                return [...prev, ipAddress];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedIps.length === blockedIps.length) {
            setSelectedIps([]);
        } else {
            setSelectedIps(blockedIps.map(ip => ip.ipAddress));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedIps.length === 0) {
            return;
        }

        setLoading(true);
        try {
            await onRemove(selectedIps);
            setSelectedIps([]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-lg font-bold">IP Engelleme Kaldır</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {campaign.name} - Engellenmiş IP'leri kaldır
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {blockedIps.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-lg">
                                Bu kampanyada engellenmiş IP bulunamadı
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    {selectedIps.length} / {blockedIps.length} IP seçildi
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    {selectedIps.length === blockedIps.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                                </button>
                            </div>

                            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                                {blockedIps.map((ip, index) => (
                                    <label
                                        key={index}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIps.includes(ip.ipAddress)}
                                            onChange={() => handleToggleIp(ip.ipAddress)}
                                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                        />
                                        <span className="font-mono text-sm text-gray-700 flex-1">
                                            {ip.ipAddress}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            ID: {ip.criterionId}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            <div className="mt-6 flex items-center justify-between pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || selectedIps.length === 0}
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Kaldırılıyor...
                                        </span>
                                    ) : (
                                        `🗑️ ${selectedIps.length} IP Kaldır`
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}

