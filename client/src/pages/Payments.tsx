import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { HiOutlineFilter, HiOutlinePlusCircle, HiOutlineX } from 'react-icons/hi';

const paymentMethodLabels: Record<string, string> = {
    cash: '💵 Cash',
    card: '💳 Card',
    mobile: '📱 Mobile',
    'bank-transfer': '🏦 Bank',
    'credit-account': '📒 Credit',
};

const Payments = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterMethod, setFilterMethod] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [form, setForm] = useState({ invoice: '', paymentMethod: 'cash', amount: '', note: '' });
    const { currency } = useSettings();

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filterMethod) params.paymentMethod = filterMethod;
            const res = await api.get('/payments', { params });
            setPayments(res.data.data);
        } catch {
            toast.error('Failed to fetch payments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPayments(); }, [filterMethod]);

    const searchInvoices = async () => {
        try {
            const res = await api.get('/invoices', { params: { paymentStatus: 'unpaid' } });
            const partialRes = await api.get('/invoices', { params: { paymentStatus: 'partial' } });
            setInvoices([...res.data.data, ...partialRes.data.data]);
        } catch { /* ignore */ }
    };

    const openPaymentModal = () => {
        searchInvoices();
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/payments', {
                invoice: form.invoice,
                paymentMethod: form.paymentMethod,
                amount: Number(form.amount),
                note: form.note,
            });
            toast.success('Payment recorded');
            setShowModal(false);
            setForm({ invoice: '', paymentMethod: 'cash', amount: '', note: '' });
            fetchPayments();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
                    <p className="text-sm text-slate-500 mt-1">{payments.length} transactions</p>
                </div>
                <button onClick={openPaymentModal} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-md shadow-cyan-500/30">
                    <HiOutlinePlusCircle className="w-5 h-5" /> Record Payment
                </button>
            </div>

            {/* Filter */}
            <div className="flex gap-3">
                <div className="relative">
                    <HiOutlineFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer min-w-[160px]">
                        <option value="">All Methods</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="mobile">Mobile</option>
                        <option value="bank-transfer">Bank Transfer</option>
                        <option value="credit-account">Credit Account</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">No payments found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase border-b border-slate-200">
                                    <th className="px-5 py-3 text-left">Invoice</th>
                                    <th className="px-5 py-3 text-left">Order</th>
                                    <th className="px-5 py-3 text-left">Method</th>
                                    <th className="px-5 py-3 text-right">Amount</th>
                                    <th className="px-5 py-3 text-left">By</th>
                                    <th className="px-5 py-3 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p) => (
                                    <tr key={p._id} className="border-b border-slate-200 hover:bg-white transition-colors">
                                        <td className="px-5 py-3.5"><span className="text-sm text-cyan-600 font-medium">{p.invoice?.invoiceId}</span></td>
                                        <td className="px-5 py-3.5"><span className="text-sm text-slate-600">{p.invoice?.order?.orderId}</span></td>
                                        <td className="px-5 py-3.5"><span className="text-sm text-slate-600">{paymentMethodLabels[p.paymentMethod] || p.paymentMethod}</span></td>
                                        <td className="px-5 py-3.5 text-right"><span className="text-sm font-medium text-emerald-400">{currency}{p.amount?.toLocaleString()}</span></td>
                                        <td className="px-5 py-3.5"><span className="text-sm text-slate-500">{p.processedBy?.name}</span></td>
                                        <td className="px-5 py-3.5"><span className="text-sm text-slate-500">{new Date(p.createdAt).toLocaleString()}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4 bg-white border border-slate-200 rounded-2xl p-6 animate-fadeIn">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-slate-900">Record Payment</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Invoice (Unpaid / Partial)</label>
                                <select required value={form.invoice} onChange={(e) => setForm({ ...form, invoice: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer">
                                    <option value="">Select Invoice</option>
                                    {invoices.map((inv) => (
                                        <option key={inv._id} value={inv._id}>
                                            {inv.invoiceId} — {inv.customer?.name} — Due: {currency}{inv.balanceDue}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Payment Method</label>
                                <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer">
                                    <option value="cash">Cash</option>
                                    <option value="card">Credit/Debit Card</option>
                                    <option value="mobile">Mobile Payment</option>
                                    <option value="bank-transfer">Bank Transfer</option>
                                    <option value="credit-account">Credit Account</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Amount ({currency})</label>
                                <input type="number" required min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Note</label>
                                <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-white">Cancel</button>
                                <button type="submit"
                                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-slate-900 text-sm font-semibold rounded-xl hover:from-emerald-400 hover:to-green-500 transition-all">
                                    Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
