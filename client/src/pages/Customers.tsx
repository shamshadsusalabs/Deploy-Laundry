import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import type { ICustomer } from '../types';
import {
    HiOutlineSearch,
    HiOutlinePlusCircle,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlinePhone,
    HiOutlineMail,
    HiOutlineX,
} from 'react-icons/hi';

const Customers = () => {
    const [customers, setCustomers] = useState<ICustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null);
    const { currency } = useSettings();
    const [form, setForm] = useState({
        name: '', phone: '', email: '', address: '', customerType: 'walk-in',
    });

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (search) params.search = search;
            if (filterType) params.customerType = filterType;
            const res = await api.get('/customers', { params });
            setCustomers(res.data.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [filterType]);

    useEffect(() => {
        const t = setTimeout(() => fetchCustomers(), 400);
        return () => clearTimeout(t);
    }, [search]);

    const openCreate = () => {
        setEditingCustomer(null);
        setForm({ name: '', phone: '', email: '', address: '', customerType: 'walk-in' });
        setShowModal(true);
    };

    const openEdit = (c: ICustomer) => {
        setEditingCustomer(c);
        setForm({ name: c.name, phone: c.phone, email: c.email || '', address: c.address || '', customerType: c.customerType });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await api.put(`/customers/${editingCustomer._id}`, form);
                toast.success('Customer updated');
            } else {
                await api.post('/customers', form);
                toast.success('Customer created');
            }
            setShowModal(false);
            fetchCustomers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this customer?')) return;
        try {
            await api.delete(`/customers/${id}`);
            toast.success('Customer deleted');
            fetchCustomers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
                    <p className="text-sm text-slate-500 mt-1">{customers.length} total customers</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-md shadow-cyan-500/30">
                    <HiOutlinePlusCircle className="w-5 h-5" /> Add Customer
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, email, ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                >
                    <option value="">All Types</option>
                    <option value="walk-in">Walk-in</option>
                    <option value="corporate">Corporate</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">No customers found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase border-b border-slate-200">
                                    <th className="px-5 py-3 text-left">ID</th>
                                    <th className="px-5 py-3 text-left">Name</th>
                                    <th className="px-5 py-3 text-left">Contact</th>
                                    <th className="px-5 py-3 text-left">Type</th>
                                    <th className="px-5 py-3 text-right">Balance</th>
                                    <th className="px-5 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((c) => (
                                    <tr key={c._id} className="border-b border-slate-200 hover:bg-white transition-colors">
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm font-medium text-cyan-600">{c.customerId}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm text-slate-900 font-medium">{c.name}</span>
                                            {c.address && <p className="text-xs text-slate-500 mt-0.5">{c.address}</p>}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1 text-sm text-slate-600">
                                                <HiOutlinePhone className="w-3.5 h-3.5" /> {c.phone}
                                            </div>
                                            {c.email && (
                                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                    <HiOutlineMail className="w-3 h-3" /> {c.email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${c.customerType === 'corporate'
                                                ? 'bg-purple-50 text-purple-600 border-purple-200'
                                                : 'bg-white0/15 text-slate-500 border-slate-500/20'
                                                }`}>
                                                {c.customerType}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className={`text-sm font-medium ${c.outstandingBalance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {currency}{c.outstandingBalance?.toLocaleString() || '0'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-white transition-colors">
                                                    <HiOutlinePencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(c._id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white transition-colors">
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4 bg-white border border-slate-200 rounded-2xl p-6 animate-fadeIn">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-slate-900">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Name *</label>
                                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Phone *</label>
                                <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Email</label>
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Address</label>
                                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Type</label>
                                <select value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer">
                                    <option value="walk-in">Walk-in</option>
                                    <option value="corporate">Corporate</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-white transition-colors">Cancel</button>
                                <button type="submit"
                                    className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all">
                                    {editingCustomer ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
