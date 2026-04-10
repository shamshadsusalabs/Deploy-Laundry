import { useState, useEffect } from 'react';
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
} from 'react-icons/hi';

const statusColors: Record<string, string> = {
    received: 'bg-blue-50 text-blue-600 border-blue-200',
    washing: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    packed: 'bg-amber-50 text-amber-600 border-amber-200',
    delivered: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const allStatuses: OrderStatus[] = ['received', 'washing', 'packed', 'delivered', 'cancelled'];

const Orders = () => {
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const navigate = useNavigate();
    const { currency } = useSettings();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/orders', { params });
            setOrders(res.data.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, [statusFilter]);
    useEffect(() => {
        const t = setTimeout(() => fetchOrders(), 400);
        return () => clearTimeout(t);
    }, [search]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Status updated to ${newStatus.replace('-', ' ')}`);
            fetchOrders();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
                    <p className="text-sm text-slate-500 mt-1">{orders.length} orders found</p>
                </div>
                <button onClick={() => navigate('/orders/new')} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-md shadow-cyan-500/30">
                    <HiOutlinePlusCircle className="w-5 h-5" /> New Order
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" placeholder="Search by Order ID..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                </div>
                <div className="relative">
                    <HiOutlineFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer min-w-[160px]">
                        <option value="">All Status</option>
                        {allStatuses.map((s) => (
                            <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">No orders found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase border-b border-slate-200">
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
                                    <tr key={o._id} className="border-b border-slate-200 hover:bg-white transition-colors">
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm font-medium text-cyan-600">{o.orderId}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm text-slate-900">{o.customer?.name}</span>
                                            <p className="text-xs text-slate-500">{o.customer?.customerId}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm text-slate-600">{o.items?.length || 0} items</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className="text-sm font-medium text-slate-900">{currency}{o.totalAmount?.toLocaleString()}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <select
                                                value={o.status}
                                                onChange={(e) => updateStatus(o._id, e.target.value)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border capitalize cursor-pointer ${statusColors[o.status] || ''} bg-transparent focus:outline-none`}
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
                                            <button onClick={() => navigate(`/orders/${o._id}`)}
                                                className="p-2 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-white transition-colors">
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
