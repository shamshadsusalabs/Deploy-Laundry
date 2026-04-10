import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import {
    HiOutlineCog,
    HiOutlineCurrencyRupee,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlinePlusCircle,
} from 'react-icons/hi';

type Tab = 'business' | 'billing' | 'services';

const serviceTypes = ['wash-fold', 'dry-cleaning', 'ironing', 'express', 'bulk-commercial'];
const units = ['kg', 'piece', 'pair', 'set', 'load'];

const Settings = () => {
    const [activeTab, setActiveTab] = useState<Tab>('business');
    const [settings, setSettings] = useState<any>({});
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { currency, refreshSettings: refreshGlobalSettings } = useSettings();

    // Service modal
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [editService, setEditService] = useState<any>(null);
    const [serviceForm, setServiceForm] = useState({
        name: '', serviceType: 'wash-fold', pricePerUnit: 0, unit: 'kg', description: '', isActive: true,
        isExpress: false, expressSurchargePercent: 50,
    });

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/settings');
            setSettings(res.data.data);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/settings/services');
            setServices(res.data.data);
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchSettings();
        fetchServices();
    }, []);

    const saveSettings = async () => {
        try {
            setSaving(true);
            await api.put('/settings', settings);
            toast.success('Settings saved!');
            refreshGlobalSettings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const openServiceCreate = () => {
        setEditService(null);
        setServiceForm({ name: '', serviceType: 'wash-fold', pricePerUnit: 0, unit: 'kg', description: '', isActive: true, isExpress: false, expressSurchargePercent: 50 });
        setShowServiceModal(true);
    };

    const openServiceEdit = (s: any) => {
        setEditService(s);
        setServiceForm({
            name: s.name, serviceType: s.serviceType, pricePerUnit: s.pricePerUnit, unit: s.unit,
            description: s.description || '', isActive: s.isActive, isExpress: s.isExpress || false,
            expressSurchargePercent: s.expressSurchargePercent || 50,
        });
        setShowServiceModal(true);
    };

    const handleServiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editService) {
                await api.put(`/settings/services/${editService._id}`, serviceForm);
                toast.success('Service updated');
            } else {
                await api.post('/settings/services', serviceForm);
                toast.success('Service created');
            }
            setShowServiceModal(false);
            fetchServices();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const deleteService = async (id: string) => {
        if (!confirm('Delete this service?')) return;
        try {
            await api.delete(`/settings/services/${id}`);
            toast.success('Service deleted');
            fetchServices();
        } catch { toast.error('Failed'); }
    };

    const inputClass = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <HiOutlineCog className="w-6 h-6 text-cyan-600" /> Settings
            </h1>

            {/* Tabs */}
            <div className="flex gap-2">
                {([
                    { key: 'business' as Tab, label: '🏢 Business Profile' },
                    { key: 'billing' as Tab, label: '💰 Tax & Billing' },
                    { key: 'services' as Tab, label: '🧺 Services & Pricing' },
                ]).map(({ key, label }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === key
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                            : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                            }`}>{label}</button>
                ))}
            </div>

            {/* Business Profile Tab */}
            {activeTab === 'business' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
                    <h2 className="text-base font-semibold text-slate-900">Business Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Business Name</label>
                            <input type="text" value={settings.businessName || ''} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Phone</label>
                            <input type="tel" value={settings.businessPhone || ''} onChange={(e) => setSettings({ ...settings, businessPhone: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Email</label>
                            <input type="email" value={settings.businessEmail || ''} onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Currency</label>
                            <select value={settings.currency || '₹'} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className={inputClass}>
                                <option value="₹">₹ — Indian Rupee (INR)</option>
                                <option value="$">$ — US Dollar (USD)</option>
                                <option value="€">€ — Euro (EUR)</option>
                                <option value="£">£ — British Pound (GBP)</option>
                                <option value="¥">¥ — Japanese Yen (JPY)</option>
                                <option value="¥">¥ — Chinese Yuan (CNY)</option>
                                <option value="₩">₩ — South Korean Won (KRW)</option>
                                <option value="د.إ">د.إ — UAE Dirham (AED)</option>
                                <option value="﷼">﷼ — Saudi Riyal (SAR)</option>
                                <option value="د.ك">د.ك — Kuwaiti Dinar (KWD)</option>
                                <option value="د.ب">د.ب — Bahraini Dinar (BHD)</option>
                                <option value="ر.ع">ر.ع — Omani Rial (OMR)</option>
                                <option value="ر.ق">ر.ق — Qatari Riyal (QAR)</option>
                                <option value="C$">C$ — Canadian Dollar (CAD)</option>
                                <option value="A$">A$ — Australian Dollar (AUD)</option>
                                <option value="NZ$">NZ$ — New Zealand Dollar (NZD)</option>
                                <option value="S$">S$ — Singapore Dollar (SGD)</option>
                                <option value="HK$">HK$ — Hong Kong Dollar (HKD)</option>
                                <option value="CHF">CHF — Swiss Franc (CHF)</option>
                                <option value="R">R — South African Rand (ZAR)</option>
                                <option value="R$">R$ — Brazilian Real (BRL)</option>
                                <option value="₱">₱ — Philippine Peso (PHP)</option>
                                <option value="฿">฿ — Thai Baht (THB)</option>
                                <option value="₫">₫ — Vietnamese Dong (VND)</option>
                                <option value="Rp">Rp — Indonesian Rupiah (IDR)</option>
                                <option value="RM">RM — Malaysian Ringgit (MYR)</option>
                                <option value="₦">₦ — Nigerian Naira (NGN)</option>
                                <option value="KSh">KSh — Kenyan Shilling (KES)</option>
                                <option value="E£">E£ — Egyptian Pound (EGP)</option>
                                <option value="₺">₺ — Turkish Lira (TRY)</option>
                                <option value="zł">zł — Polish Zloty (PLN)</option>
                                <option value="Kč">Kč — Czech Koruna (CZK)</option>
                                <option value="kr">kr — Swedish Krona (SEK)</option>
                                <option value="₽">₽ — Russian Ruble (RUB)</option>
                                <option value="₸">₸ — Kazakhstani Tenge (KZT)</option>
                                <option value="৳">৳ — Bangladeshi Taka (BDT)</option>
                                <option value="රු">රු — Sri Lankan Rupee (LKR)</option>
                                <option value="Rs">Rs — Pakistani Rupee (PKR)</option>
                                <option value="Rs">Rs — Nepalese Rupee (NPR)</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs text-slate-500 mb-1">Address</label>
                            <textarea rows={2} value={settings.businessAddress || ''} onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
                                className={`${inputClass} resize-none`} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Tax Number Type</label>
                            <select value={settings.taxNumberLabel || 'GST Number'} onChange={(e) => setSettings({ ...settings, taxNumberLabel: e.target.value })} className={inputClass}>
                                <option value="GST Number">GST Number (India)</option>
                                <option value="ABN">ABN (Australia)</option>
                                <option value="EIN">EIN (USA)</option>
                                <option value="VAT Number">VAT Number (EU/UK)</option>
                                <option value="TIN">TIN (Tax ID Number)</option>
                                <option value="TRN">TRN (UAE)</option>
                                <option value="CR Number">CR Number (Saudi)</option>
                                <option value="Tax Number">Tax Number (Other)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">{settings.taxNumberLabel || 'GST Number'}</label>
                            <input type="text" value={settings.taxNumber || ''} onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                                placeholder={`Enter your ${settings.taxNumberLabel || 'GST Number'}`} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Working Hours</label>
                            <input type="text" value={settings.workingHours || ''} onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Working Days</label>
                            <input type="text" value={settings.workingDays || ''} onChange={(e) => setSettings({ ...settings, workingDays: e.target.value })} className={inputClass} />
                        </div>
                    </div>
                    <button onClick={saveSettings} disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-md shadow-cyan-500/30">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}

            {/* Tax & Billing Tab */}
            {activeTab === 'billing' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
                    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <HiOutlineCurrencyRupee className="w-5 h-5 text-emerald-400" /> Tax & Billing Configuration
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Default Tax %</label>
                            <input type="number" min={0} max={100} value={settings.taxPercent ?? 5}
                                onChange={(e) => setSettings({ ...settings, taxPercent: Number(e.target.value) })} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Default Discount %</label>
                            <input type="number" min={0} max={100} value={settings.defaultDiscountPercent ?? 0}
                                onChange={(e) => setSettings({ ...settings, defaultDiscountPercent: Number(e.target.value) })} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Service Charge ({currency})</label>
                            <input type="number" min={0} value={settings.defaultServiceCharge ?? 0}
                                onChange={(e) => setSettings({ ...settings, defaultServiceCharge: Number(e.target.value) })} className={inputClass} />
                        </div>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 pt-4">Invoice Settings</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Invoice Prefix</label>
                            <input type="text" value={settings.invoicePrefix || ''} onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Order Prefix</label>
                            <input type="text" value={settings.orderPrefix || ''} onChange={(e) => setSettings({ ...settings, orderPrefix: e.target.value })} className={inputClass} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs text-slate-500 mb-1">Invoice Footer Text</label>
                            <textarea rows={2} value={settings.invoiceFooter || ''}
                                onChange={(e) => setSettings({ ...settings, invoiceFooter: e.target.value })}
                                className={`${inputClass} resize-none`} />
                        </div>
                    </div>
                    <button onClick={saveSettings} disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-md shadow-cyan-500/30">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}

            {/* Services & Pricing Tab */}
            {activeTab === 'services' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-slate-900">Service Types & Pricing</h2>
                        <button onClick={openServiceCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-md shadow-cyan-500/30">
                            <HiOutlinePlusCircle className="w-4 h-4" /> Add Service
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {services.map((s: any) => (
                            <div key={s._id} className={`rounded-2xl border p-4 transition-colors ${s.isActive ? 'border-slate-200 bg-white' : 'border-red-500/20 bg-red-500/5 opacity-60'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-slate-900">{s.name}</h3>
                                    <div className="flex gap-1">
                                        <button onClick={() => openServiceEdit(s)} className="p-1.5 text-slate-500 hover:text-cyan-600">
                                            <HiOutlinePencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteService(s._id)} className="p-1.5 text-slate-500 hover:text-red-400">
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 capitalize mb-2">{s.serviceType.replace('-', ' ')}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-cyan-600">{currency}{s.pricePerUnit}</span>
                                    <span className="text-xs text-slate-500">/{s.unit}</span>
                                </div>
                                {s.isExpress && (
                                    <span className="inline-block mt-2 px-2 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-medium">
                                        ⚡ Express +{s.expressSurchargePercent}%
                                    </span>
                                )}
                                {!s.isActive && (
                                    <span className="inline-block mt-2 px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-medium">
                                        Inactive
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Service Modal */}
            {showServiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4 bg-white border border-slate-200 rounded-2xl p-6 animate-fadeIn">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">{editService ? 'Edit Service' : 'Add Service'}</h3>
                        <form onSubmit={handleServiceSubmit} className="space-y-4">
                            <input type="text" required placeholder="Service Name" value={serviceForm.name}
                                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} className={inputClass} />
                            <div className="grid grid-cols-2 gap-3">
                                <select value={serviceForm.serviceType} onChange={(e) => setServiceForm({ ...serviceForm, serviceType: e.target.value })}
                                    className={inputClass}>
                                    {serviceTypes.map((t) => <option key={t} value={t}>{t.replace('-', ' ')}</option>)}
                                </select>
                                <select value={serviceForm.unit} onChange={(e) => setServiceForm({ ...serviceForm, unit: e.target.value })}
                                    className={inputClass}>
                                    {units.map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Price per Unit ({currency})</label>
                                    <input type="number" required min={0} value={serviceForm.pricePerUnit}
                                        onChange={(e) => setServiceForm({ ...serviceForm, pricePerUnit: Number(e.target.value) })} className={inputClass} />
                                </div>
                                <div className="flex items-end gap-3 pb-1">
                                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                        <input type="checkbox" checked={serviceForm.isActive}
                                            onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                                            className="w-4 h-4 rounded accent-cyan-500" /> Active
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                        <input type="checkbox" checked={serviceForm.isExpress}
                                            onChange={(e) => setServiceForm({ ...serviceForm, isExpress: e.target.checked })}
                                            className="w-4 h-4 rounded accent-amber-500" /> Express
                                    </label>
                                </div>
                            </div>
                            {serviceForm.isExpress && (
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Express Surcharge %</label>
                                    <input type="number" min={0} value={serviceForm.expressSurchargePercent}
                                        onChange={(e) => setServiceForm({ ...serviceForm, expressSurchargePercent: Number(e.target.value) })} className={inputClass} />
                                </div>
                            )}
                            <textarea rows={2} placeholder="Description (optional)" value={serviceForm.description}
                                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                className={`${inputClass} resize-none`} />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowServiceModal(false)}
                                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-white">Cancel</button>
                                <button type="submit"
                                    className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500">
                                    {editService ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
