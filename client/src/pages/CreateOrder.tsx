import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import type { ICustomer, IService, IOrderItem } from '../types';
import {
    HiOutlineSearch,
    HiOutlinePlusCircle,
    HiOutlineTrash,

} from 'react-icons/hi';
import { HiMinus, HiPlus } from 'react-icons/hi2';

const serviceTypeLabels: Record<string, string> = {
    'wash-fold': '🧺 Wash & Fold',
    'dry-cleaning': '👔 Dry Cleaning',
    'ironing': '🔥 Ironing',
    'express': '⚡ Express',
    'bulk-commercial': '🏭 Bulk/Commercial',
};

const CreateOrder = () => {
    const navigate = useNavigate();
    const { currency } = useSettings();
    const [customers, setCustomers] = useState<ICustomer[]>([]);
    const [services, setServices] = useState<IService[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [items, setItems] = useState<IOrderItem[]>([]);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const taxPercent = 5;
    const [discountPercent, setDiscountPercent] = useState(0);

    // Quick-add customer modal
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', customerType: 'walk-in' });

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await api.get('/services');
                setServices(res.data.data);
            } catch {
                toast.error('Failed to load services');
            }
        };
        fetchServices();
    }, []);

    const searchCustomers = async (q: string) => {
        setCustomerSearch(q);
        if (q.length >= 2) {
            try {
                const res = await api.get('/customers', { params: { search: q } });
                setCustomers(res.data.data);
                setShowCustomerDropdown(true);
            } catch { /* ignore */ }
        } else {
            setCustomers([]);
            setShowCustomerDropdown(false);
        }
    };

    const selectCustomer = (c: ICustomer) => {
        setSelectedCustomer(c);
        setCustomerSearch(c.name);
        setShowCustomerDropdown(false);
    };

    const addService = (service: IService) => {
        const exists = items.find((i) => i.service === service._id);
        if (exists) {
            setItems(items.map((i) =>
                i.service === service._id
                    ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.pricePerUnit }
                    : i
            ));
        } else {
            setItems([...items, {
                service: service._id,
                serviceName: service.name,
                serviceType: service.serviceType,
                quantity: 1,
                unit: service.unit,
                pricePerUnit: service.pricePerUnit,
                subtotal: service.pricePerUnit,
            }]);
        }
    };

    const updateQty = (index: number, delta: number) => {
        setItems(items.map((item, i) => {
            if (i !== index) return item;
            const newQty = Math.max(1, item.quantity + delta);
            return { ...item, quantity: newQty, subtotal: newQty * item.pricePerUnit };
        }));
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const taxAmount = (subtotal * taxPercent) / 100;
    const discountAmount = (subtotal * discountPercent) / 100;
    const total = subtotal + taxAmount - discountAmount;

    const handleQuickAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/customers', newCustomer);
            setSelectedCustomer(res.data.data);
            setCustomerSearch(res.data.data.name);
            setShowAddCustomer(false);
            toast.success('Customer created');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const handleSubmit = async () => {
        if (!selectedCustomer) { toast.error('Please select a customer'); return; }
        if (items.length === 0) { toast.error('Please add at least one item'); return; }

        setLoading(true);
        try {
            await api.post('/orders', {
                customer: selectedCustomer._id,
                items,
                specialInstructions,
                deliveryDate: deliveryDate || undefined,
                taxPercent,
                discountPercent,
            });
            toast.success('Order created successfully!');
            navigate('/orders');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-bold text-slate-900">Create New Order</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left — Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Selection */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h2 className="text-base font-semibold text-slate-900 mb-4">Customer</h2>
                        <div className="relative">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search customer by name or phone..."
                                value={customerSearch}
                                onChange={(e) => searchCustomers(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
                            />
                            {showCustomerDropdown && customers.length > 0 && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                    {customers.map((c) => (
                                        <button key={c._id} onClick={() => selectCustomer(c)}
                                            className="w-full px-4 py-2.5 text-left hover:bg-white flex justify-between items-center">
                                            <div>
                                                <span className="text-sm text-slate-900">{c.name}</span>
                                                <span className="text-xs text-slate-500 ml-2">{c.phone}</span>
                                            </div>
                                            <span className="text-xs text-cyan-600">{c.customerId}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedCustomer && (
                            <div className="mt-3 flex items-center gap-3 px-3 py-2 bg-cyan-50 border border-cyan-200 rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-600 text-xs font-bold">
                                    {selectedCustomer.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-900 font-medium">{selectedCustomer.name}</p>
                                    <p className="text-xs text-slate-500">{selectedCustomer.phone} • {selectedCustomer.customerId}</p>
                                </div>
                            </div>
                        )}
                        <button onClick={() => setShowAddCustomer(true)}
                            className="mt-3 text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                            <HiOutlinePlusCircle className="w-4 h-4" /> Quick Add New Customer
                        </button>
                    </div>

                    {/* Services */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h2 className="text-base font-semibold text-slate-900 mb-4">Select Services</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {services.map((s) => (
                                <button key={s._id} onClick={() => addService(s)}
                                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-left group">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 group-hover:text-cyan-700 transition-colors">
                                            {serviceTypeLabels[s.serviceType]?.split(' ')[0]} {s.name}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">{currency}{s.pricePerUnit}/{s.unit}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <HiOutlinePlusCircle className="w-5 h-5" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Special Instructions */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h2 className="text-base font-semibold text-slate-900 mb-3">Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Delivery Date</label>
                                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Discount %</label>
                                <input type="number" min={0} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm text-slate-600 mb-1">Special Instructions</label>
                            <textarea rows={3} value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)}
                                placeholder="Any special handling, stains, etc."
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 resize-none" />
                        </div>
                    </div>
                </div>

                {/* Right — Cart summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5">
                        <h2 className="text-base font-semibold text-slate-900 mb-4">Order Summary</h2>

                        {items.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">No items added yet</p>
                        ) : (
                            <div className="space-y-3 mb-5">
                                {items.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-900 font-medium truncate">{item.serviceName}</p>
                                            <p className="text-xs text-slate-500">{currency}{item.pricePerUnit}/{item.unit}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => updateQty(i, -1)}
                                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-white/20">
                                                <HiMinus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm text-slate-900 w-6 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQty(i, 1)}
                                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-white/20">
                                                <HiPlus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="text-sm text-slate-900 font-medium w-16 text-right">{currency}{item.subtotal}</span>
                                        <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300">
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Totals */}
                        <div className="border-t border-slate-200 pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Subtotal</span>
                                <span className="text-slate-900">{currency}{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Tax ({taxPercent}%)</span>
                                <span className="text-slate-900">+{currency}{taxAmount.toLocaleString()}</span>
                            </div>
                            {discountPercent > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Discount ({discountPercent}%)</span>
                                    <span className="text-emerald-400">-{currency}{discountAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                                <span className="text-slate-900">Total</span>
                                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{currency}{total.toLocaleString()}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !selectedCustomer || items.length === 0}
                            className="w-full mt-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-md shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Order'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Add Customer Modal */}
            {showAddCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4 bg-white border border-slate-200 rounded-2xl p-6 animate-fadeIn">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Add Customer</h3>
                        <form onSubmit={handleQuickAddCustomer} className="space-y-4">
                            <input type="text" required placeholder="Customer Name" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
                            <input type="tel" required placeholder="Phone Number" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowAddCustomer(false)}
                                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-white">Cancel</button>
                                <button type="submit"
                                    className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500">Create & Select</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateOrder;
