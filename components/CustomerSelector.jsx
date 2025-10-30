// components/CustomerSelector.jsx
'use client';

import { useState, useEffect } from 'react';

export default function CustomerSelector({ onSelectCustomer }) {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/customers');
            const data = await response.json();

            if (data.success) {
                setCustomers(data.customerIds);

                // İlk hesabı otomatik seç
                if (data.customerIds.length > 0) {
                    const firstCustomer = data.customerIds[0];
                    setSelectedCustomer(firstCustomer);
                    onSelectCustomer(firstCustomer);
                }
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Hesaplar alınamadı');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setSelectedCustomer(value);
        onSelectCustomer(value);
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                Google Ads Hesabı Seçin
            </label>
            <select
                value={selectedCustomer}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                {customers.map((customerId) => (
                    <option key={customerId} value={customerId}>
                        Customer ID: {customerId}
                    </option>
                ))}
            </select>
            <p className="text-xs text-gray-500">
                {customers.length} hesaba erişiminiz var
            </p>
        </div>
    );
}