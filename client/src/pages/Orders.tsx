import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import type { IOrder, OrderStatus } from '../types';
import {
    HiOutlineSearch,
    HiOutlinePlusCircle,
    HiOutlineEye,
    HiOutlineFilter,
    HiOutlineCalendar,
    HiOutlineX,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineCurrencyDollar,
} from 'react-icons/hi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
    received: 'bg-blue-50 text-blue-600 border-blue-200',
    washing: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    packed: 'bg-amber-50 text-amber-600 border-amber-200',
    delivered: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const allStatuses: OrderStatus[] = ['received', 'washing', 'packed', 'delivered', 'cancelled'];

type DatePreset = 'today' | 'yesterday' | 'tomorrow' | 'last7' | '';

function toLocalISO(date: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getPresetRange(preset: DatePreset): { from: string; to: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (preset === 'today') {
        return { from: toLocalISO(today), to: toLocalISO(today) };
    }
    if (preset === 'yesterday') {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        return { from: toLocalISO(y), to: toLocalISO(y) };
    }
    if (preset === 'tomorrow') {
        const t = new Date(today);
        t.setDate(t.getDate() + 1);
        return { from: toLocalISO(t), to: toLocalISO(t) };
    }
    if (preset === 'last7') {
        const w = new Date(today);
        w.setDate(w.getDate() - 6);
        return { from: toLocalISO(w), to: toLocalISO(today) };
    }
    return { from: '', to: '' };
}

// ─── Component ────────────────────────────────────────────────────────────────

const Orders = () => {
    const [allOrders, setAllOrders] = useState<IOrder[]>([]);   // raw from API
    const [orders, setOrders] = useState<IOrder[]>([]);          // after client filter
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { currency } = useSettings();

    // Basic filters (sent to server)
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Date filters (client-side)
    const [datePreset, setDatePreset] = useState<DatePreset>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Amount filters (client-side)
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');

    // Advanced panel
    const [showAdvanced, setShowAdvanced] = useState(false);

    // ── Derived active filter count ──────────────────────────────────────────
    const activeFiltersCount = [
        statusFilter,
        datePreset || dateFrom || dateTo,
        amountMin,
        amountMax,
    ].filter(Boolean).length;

    // ── Fetch from server (only search + status — server does not support date/amount) ──
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;

            const res = await api.get('/orders', { params });
            setAllOrders(res.data.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    // ── Client-side filter (date + amount) applied on top of server results ──
    useEffect(() => {
        let result = [...allOrders];

        // Resolve date range
        let resolvedFrom = dateFrom;
        let resolvedTo = dateTo;
        if (datePreset) {
            const range = getPresetRange(datePreset);
            resolvedFrom = range.from;
            resolvedTo = range.to;
        }

        if (resolvedFrom) {
            const from = new Date(resolvedFrom);
            from.setHours(0, 0, 0, 0);
            result = result.filter((o) => new Date(o.createdAt) >= from);
        }
        if (resolvedTo) {
            const to = new Date(resolvedTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter((o) => new Date(o.createdAt) <= to);
        }
        if (amountMin !== '') {
            result = result.filter((o) => o.totalAmount >= Number(amountMin));
        }
        if (amountMax !== '') {
            result = result.filter((o) => o.totalAmount <= Number(amountMax));
        }

        setOrders(result);
    }, [allOrders, datePreset, dateFrom, dateTo, amountMin, amountMax]);

    // Debounced search → refetch server
    useEffect(() => {
        const t = setTimeout(() => fetchOrders(), 400);
        return () => clearTimeout(t);
    }, [search]);

    // Instant refetch on status change
    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handlePreset = (preset: DatePreset) => {
        // Toggle off if same preset clicked
        if (datePreset === preset) {
            setDatePreset('');
        } else {
            setDatePreset(preset);
            // Clear manual date when preset chosen
            setDateFrom('');
            setDateTo('');
        }
    };

    const handleManualDate = (field: 'from' | 'to', val: string) => {
        setDatePreset(''); // clear preset when manual chosen
        if (field === 'from') setDateFrom(val);
        else setDateTo(val);
    };

    const clearAll = () => {
        setSearch('');
        setStatusFilter('');
        setDatePreset('');
        setDateFrom('');
        setDateTo('');
        setAmountMin('');
        setAmountMax('');
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Status updated to ${newStatus.replace('-', ' ')}`);
            fetchOrders();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    // ── Active filter badge labels ────────────────────────────────────────────
    const filterBadges: { label: string; onRemove: () => void }[] = [];
    if (statusFilter) filterBadges.push({ label: statusFilter.replace(/\b\w/g, l => l.toUpperCase()), onRemove: () => setStatusFilter('') });
    if (datePreset === 'today') filterBadges.push({ label: 'Today', onRemove: () => setDatePreset('') });
    if (datePreset === 'yesterday') filterBadges.push({ label: 'Yesterday', onRemove: () => setDatePreset('') });
    if (datePreset === 'tomorrow') filterBadges.push({ label: 'Tomorrow', onRemove: () => setDatePreset('') });
    if (datePreset === 'last7') filterBadges.push({ label: 'Last 7 Days', onRemove: () => setDatePreset('') });
    if (!datePreset && dateFrom) filterBadges.push({ label: `From: ${dateFrom}`, onRemove: () => setDateFrom('') });
    if (!datePreset && dateTo) filterBadges.push({ label: `To: ${dateTo}`, onRemove: () => setDateTo('') });
    if (amountMin) filterBadges.push({ label: `Min: ${currency}${amountMin}`, onRemove: () => setAmountMin('') });
    if (amountMax) filterBadges.push({ label: `Max: ${currency}${amountMax}`, onRemove: () => setAmountMax('') });

    // ── JSX ──────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 animate-fadeIn">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
                    <p className="text-sm text-slate-500 mt-1">{orders.length} orders found</p>
                </div>
                <button
                    onClick={() => navigate('/orders/new')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/30"
                >
                    <HiOutlinePlusCircle className="w-5 h-5" /> New Order
                </button>
            </div>

            {/* ── Search + Status + Advanced toggle ── */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Order ID or customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <HiOutlineX className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Status filter */}
                <div className="relative">
                    <HiOutlineFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer min-w-[160px]"
                    >
                        <option value="">All Status</option>
                        {allStatuses.map((s) => (
                            <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                        ))}
                    </select>
                </div>

                {/* Advanced toggle button */}
                <button
                    onClick={() => setShowAdvanced(v => !v)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showAdvanced ? 'bg-cyan-50 border-cyan-400 text-cyan-700' : 'bg-white border-slate-200 text-slate-600 hover:border-cyan-400 hover:text-cyan-600'}`}
                >
                    <HiOutlineCalendar className="w-4 h-4" />
                    Advanced
                    {activeFiltersCount > 0 && (
                        <span className="ml-1 bg-cyan-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                            {activeFiltersCount}
                        </span>
                    )}
                    {showAdvanced ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
                </button>
            </div>

            {/* ── Quick date chips ── */}
            <div className="flex flex-wrap items-center gap-2">
                {(['today', 'yesterday', 'tomorrow', 'last7'] as DatePreset[]).map((preset) => {
                    const labels: Record<string, string> = { today: 'Today', yesterday: 'Yesterday', tomorrow: 'Tomorrow', last7: 'Last 7 Days' };
                    const active = datePreset === preset;
                    return (
                        <button
                            key={preset}
                            onClick={() => handlePreset(preset)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active
                                ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-400 hover:text-cyan-600'
                                }`}
                        >
                            {labels[preset!]}
                        </button>
                    );
                })}

                {/* Active filter badges */}
                {filterBadges.map((b) => (
                    <span key={b.label} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-lg text-xs font-medium">
                        {b.label}
                        <button onClick={b.onRemove} className="ml-0.5 hover:text-red-500 transition-colors">
                            <HiOutlineX className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {/* Clear all */}
                {(activeFiltersCount > 0 || search) && (
                    <button
                        onClick={clearAll}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* ── Advanced filter panel ── */}
            {showAdvanced && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm animate-fadeIn">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Advanced Filters</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date From */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                <HiOutlineCalendar className="w-3.5 h-3.5" /> Date From
                            </label>
                            <input
                                type="date"
                                value={datePreset ? getPresetRange(datePreset).from : dateFrom}
                                onChange={(e) => handleManualDate('from', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>

                        {/* Date To */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                <HiOutlineCalendar className="w-3.5 h-3.5" /> Date To
                            </label>
                            <input
                                type="date"
                                value={datePreset ? getPresetRange(datePreset).to : dateTo}
                                onChange={(e) => handleManualDate('to', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>

                        {/* Min Amount */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                <HiOutlineCurrencyDollar className="w-3.5 h-3.5" /> Min Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{currency}</span>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={amountMin}
                                    onChange={(e) => setAmountMin(e.target.value)}
                                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Max Amount */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                <HiOutlineCurrencyDollar className="w-3.5 h-3.5" /> Max Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{currency}</span>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="∞"
                                    value={amountMax}
                                    onChange={(e) => setAmountMax(e.target.value)}
                                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={clearAll}
                            className="px-4 py-2 text-xs font-semibold text-red-500 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 transition-all"
                        >
                            Reset all filters
                        </button>
                    </div>
                </div>
            )}

            {/* ── Table ── */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-sm">No orders found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <th className="px-5 py-3 text-left">Order ID</th>
                                    <th className="px-5 py-3 text-left">Customer</th>
                                    <th className="px-5 py-3 text-left">Items</th>
                                    <th className="px-5 py-3 text-right">Amount</th>
                                    <th className="px-5 py-3 text-center">Status</th>
                                    <th className="px-5 py-3 text-left">Date</th>
                                    <th className="px-5 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o) => (
                                    <tr key={o._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm font-medium text-cyan-600">{o.orderId}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm text-slate-900">{o.customer?.name}</span>
                                            <p className="text-xs text-slate-400">{o.customer?.customerId}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm text-slate-600">{o.items?.length || 0} items</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className="text-sm font-semibold text-slate-900">{currency}{o.totalAmount?.toLocaleString()}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <select
                                                value={o.status}
                                                onChange={(e) => updateStatus(o._id, e.target.value)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border capitalize cursor-pointer focus:outline-none bg-transparent ${statusColors[o.status] || ''}`}
                                            >
                                                {allStatuses.map((s) => (
                                                    <option key={s} value={s} className="bg-white text-slate-900">
                                                        {s.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <button
                                                onClick={() => navigate(`/orders/${o._id}`)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                                            >
                                                <HiOutlineEye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
