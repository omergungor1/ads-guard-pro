// app/domains/new/page.jsx
// Domain ekleme wizard sayfası

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewDomainPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        domain: '',
        adsAccountId: '',
        timezone: 'Europe/Istanbul'
    });
    const [domainId, setDomainId] = useState(null);
    const [trackingCode, setTrackingCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const steps = [
        { number: 1, title: 'Domain Bilgileri', description: 'Domain ve Google Ads ID' },
        { number: 2, title: 'Google Ads Onayı', description: 'Hesap onay talimatları' },
        { number: 3, title: 'Tracking Kurulumu', description: 'Kod kurulum talimatları' },
        { number: 4, title: 'Tamamlandı', description: 'Kurulum başarılı' }
    ];

    // Adım 1: Domain ve Ads ID ekleme
    const handleStep1Submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain: formData.domain,
                    ads_account_id: formData.adsAccountId,
                    timezone: formData.timezone
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Domain eklenemedi');
            }

            setDomainId(data.domain.id);

            // Tracking code'u al
            const trackingResponse = await fetch(`/api/domains/${data.domain.id}/tracking-code`);
            const trackingData = await trackingResponse.json();
            setTrackingCode(trackingData);

            setCurrentStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Kopyalandı!');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 text-gray-600">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Yeni Domain Ekle
                    </h1>
                    <p className="text-gray-600">
                        Domain ekleme ve koruma kurulumu adımlarını takip edin
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, idx) => (
                            <div key={step.number} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                    ${currentStep >= step.number
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-300 text-gray-600'}
                  `}>
                                        {currentStep > step.number ? '✓' : step.number}
                                    </div>
                                    <div className="text-xs mt-2 text-center max-w-[100px]">
                                        <div className="font-medium">{step.title}</div>
                                    </div>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={`
                    h-1 w-16 mx-2
                    ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'}
                  `} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Step Content */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    {/* Adım 1: Domain Bilgileri */}
                    {currentStep === 1 && (
                        <form onSubmit={handleStep1Submit}>
                            <h2 className="text-2xl font-bold mb-6">Domain Bilgileri</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Domain Adı *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="ornek.com"
                                        value={formData.domain}
                                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Korumak istediğiniz domain adını girin (www olmadan)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Google Ads Hesap ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="123-456-7890"
                                        value={formData.adsAccountId}
                                        onChange={(e) => setFormData({ ...formData, adsAccountId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Google Ads hesap ID'nizi girin (sonra da ekleyebilirsiniz)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Zaman Dilimi
                                    </label>
                                    <select
                                        value={formData.timezone}
                                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                                        <option value="UTC">UTC (GMT+0)</option>
                                        <option value="America/New_York">America/New_York (EST)</option>
                                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Kaydediliyor...' : 'Devam Et'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Adım 2: Google Ads Onayı */}
                    {currentStep === 2 && (
                        <GoogleAdsSetupStep
                            domainId={domainId}
                            adsAccountId={formData.adsAccountId}
                            onBack={() => setCurrentStep(1)}
                            onNext={() => setCurrentStep(3)}
                        />
                    )}

                    {/* Adım 3: Tracking Kurulumu */}
                    {currentStep === 3 && trackingCode && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6">Tracking Kurulumu</h2>

                            <div className="space-y-6">
                                {/* Tracking Script */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">1. Tracking Script (Sitenize Ekleyin)</h3>
                                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-3 relative">
                                        <pre className="text-sm overflow-x-auto">{trackingCode.tracking_script}</pre>
                                        <button
                                            onClick={() => copyToClipboard(trackingCode.tracking_script)}
                                            className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                        >
                                            Kopyala
                                        </button>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-900 font-medium mb-2">Kurulum Talimatları:</p>
                                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                            {trackingCode.instructions.tracking_script.steps.map((step, idx) => (
                                                <li key={idx}>{step}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Tracking Template */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">2. Google Ads Tracking Template</h3>
                                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-3 relative">
                                        <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-all">
                                            {trackingCode.tracking_template_url}
                                        </pre>
                                        <button
                                            onClick={() => copyToClipboard(trackingCode.tracking_template_url)}
                                            className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                        >
                                            Kopyala
                                        </button>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-900 font-medium mb-2">Kurulum Talimatları:</p>
                                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                            {trackingCode.instructions.tracking_template.steps.map((step, idx) => (
                                                <li key={idx}>{step}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Geri
                                </button>
                                <button
                                    onClick={() => setCurrentStep(4)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Kurdum, Tamamla
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Adım 4: Tamamlandı */}
                    {currentStep === 4 && (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">🎉</div>
                            <h2 className="text-2xl font-bold mb-4">Tebrikler!</h2>
                            <p className="text-gray-600 mb-4">
                                Domain kurulumu başarıyla tamamlandı!
                            </p>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto text-left">
                                <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                                    <span className="text-2xl mr-2">🛡️</span>
                                    Agresif Engelleme Aktif!
                                </h3>
                                <ul className="text-sm text-green-800 space-y-2">
                                    <li className="flex items-start">
                                        <span className="mr-2">✅</span>
                                        <span>Ads'dan gelen <strong>TÜM IP'ler</strong> anında engellenir</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">✅</span>
                                        <span>Kural yok, threshold yok - <strong>tam koruma</strong></span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">✅</span>
                                        <span>Tüm kampanyalarınız aynı IP listesi ile korunuyor</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">✅</span>
                                        <span>Googlebot ve diğer arama motorları whitelist'te</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Dashboard'a Git
                                </button>
                                <button
                                    onClick={() => router.push('/domains/new')}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Yeni Domain Ekle
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Google Ads Setup Component
function GoogleAdsSetupStep({ domainId, adsAccountId, onBack, onNext }) {
    const [instructions, setInstructions] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (domainId) {
            loadInstructions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [domainId]);

    const loadInstructions = async () => {
        try {
            const response = await fetch(`/api/domains/${domainId}/google-ads-link`);
            const data = await response.json();
            setInstructions(data.instructions);
        } catch (err) {
            console.error('Talimatlar yüklenemedi:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Google Ads Hesap Bağlantısı</h2>

            {/* Important Notes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Önemli Bilgiler</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    {instructions?.important_notes?.map((note, idx) => (
                        <li key={idx}>{note}</li>
                    ))}
                </ul>
            </div>

            {adsAccountId ? (
                <>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-700">
                            <strong>Google Ads Hesap ID:</strong> {adsAccountId}
                        </p>
                    </div>

                    {/* Manuel Setup Steps */}
                    <div className="space-y-4">
                        {instructions?.steps?.map((step) => (
                            <div key={step.step} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                                        {step.step}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-2">
                                            {step.description}
                                        </p>

                                        {step.details && (
                                            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-2">
                                                {step.details.map((detail, idx) => (
                                                    <li key={idx}>{detail}</li>
                                                ))}
                                            </ul>
                                        )}

                                        {step.note && (
                                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                                {step.note}
                                            </div>
                                        )}

                                        {step.url && (
                                            <a
                                                href={step.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                            >
                                                {step.action || 'Aç'}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Alternative Method */}
                    {instructions?.alternative && (
                        <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h3 className="font-semibold text-gray-900 mb-2">
                                {instructions.alternative.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                {instructions.alternative.description}
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                                {instructions.alternative.steps.map((step, idx) => (
                                    <li key={idx}>{step}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                        ⚠️ Google Ads hesap ID'si eklenmemiş. Lütfen bir önceki adıma geri dönün ve hesap ID'nizi ekleyin.
                    </p>
                </div>
            )}

            <div className="mt-6 flex justify-between">
                <button
                    onClick={onBack}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Geri
                </button>
                <button
                    onClick={onNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Bağlantıyı Kurdum, Devam Et
                </button>
            </div>
        </div>
    );
}

