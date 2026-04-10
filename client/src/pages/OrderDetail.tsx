import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import type { OrderStatus } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import {
    HiOutlineArrowLeft,
    HiOutlineCheckCircle,
    HiOutlineUser,
    HiOutlineCalendar,
    HiOutlinePrinter,
    HiOutlineX,
} from 'react-icons/hi';
import { HiOutlineCube } from 'react-icons/hi2';

interface InventoryItem {
    _id: string;
    itemName: string;
    category: string;
    quantity: number;
    unit: string;
    isLowStock: boolean;
}

interface InventoryUsageEntry {
    item: string;
    itemName: string;
    quantityUsed: number;
    unit: string;
}

const statusColors: Record<string, string> = {
    received: 'bg-blue-500 text-slate-900',
    washing: 'bg-cyan-500 text-slate-900',
    packed: 'bg-amber-500 text-slate-900',
    delivered: 'bg-emerald-600 text-slate-900',
    cancelled: 'bg-red-500 text-slate-900',
};

const statusSteps: OrderStatus[] = ['received', 'washing', 'packed', 'delivered'];

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { currency } = useSettings();

    // Inventory modal state
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string>('');
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [inventoryUsage, setInventoryUsage] = useState<InventoryUsageEntry[]>([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchOrder = async () => {
        try {
            const res = await api.get(`/orders/${id}`);
            setOrder(res.data.data);
        } catch (err: any) {
            toast.error('Order not found');
            navigate('/orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrder(); }, [id]);

    const fetchInventory = async () => {
        try {
            setLoadingInventory(true);
            const res = await api.get('/inventory', { params: { limit: 200 } });
            setInventoryItems(res.data.data);
        } catch {
            toast.error('Failed to load inventory');
        } finally {
            setLoadingInventory(false);
        }
    };

    const handleStatusClick = (status: string) => {
        if (status === 'washing') {
            // Only show inventory modal for washing
            setPendingStatus(status);
            setInventoryUsage([]);
            fetchInventory();
            setShowInventoryModal(true);
        } else {
            // For packed, delivered — update directly without inventory
            updateStatusDirect(status);
        }
    };

    const updateStatusDirect = async (status: string) => {
        try {
            await api.patch(`/orders/${id}/status`, { status });
            toast.success(`Status updated to ${status}`);
            fetchOrder();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    const addInventoryRow = () => {
        setInventoryUsage([...inventoryUsage, { item: '', itemName: '', quantityUsed: 0, unit: '' }]);
    };

    const removeInventoryRow = (index: number) => {
        setInventoryUsage(inventoryUsage.filter((_, i) => i !== index));
    };

    const updateInventoryRow = (index: number, field: string, value: any) => {
        const updated = [...inventoryUsage];
        if (field === 'item') {
            const selected = inventoryItems.find(i => i._id === value);
            updated[index] = {
                ...updated[index],
                item: value,
                itemName: selected?.itemName || '',
                unit: selected?.unit || '',
            };
        } else {
            (updated[index] as any)[field] = value;
        }
        setInventoryUsage(updated);
    };

    const submitStatusUpdate = async () => {
        try {
            setSubmitting(true);
            // Filter out rows with no item selected or zero quantity
            const validUsage = inventoryUsage.filter(u => u.item && u.quantityUsed > 0);
            await api.patch(`/orders/${id}/status`, {
                status: pendingStatus,
                inventoryUsage: validUsage,
            });
            toast.success(`Status updated to ${pendingStatus}`);
            setShowInventoryModal(false);
            setInventoryUsage([]);
            fetchOrder();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        } finally {
            setSubmitting(false);
        }
    };

    const getOrderUrl = () => `${window.location.origin}/orders/${id}`;

    const printQRLabel = () => {
        const printWindow = window.open('', '_blank', 'width=400,height=500');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
            <head>
                <title>QR Label - ${order?.orderId}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; text-align: center; padding: 20px; margin: 0; }
                    .label { border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; max-width: 280px; margin: 0 auto; }
                    .brand { font-size: 18px; font-weight: 700; color: #0891b2; margin-bottom: 4px; }
                    .subtitle { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; }
                    .qr-container { margin: 16px auto; }
                    .order-id { font-size: 22px; font-weight: 800; color: #0f172a; margin: 12px 0 4px; letter-spacing: 1px; }
                    .customer { font-size: 13px; color: #64748b; margin-bottom: 4px; }
                    .date { font-size: 11px; color: #94a3b8; }
                    .footer { font-size: 9px; color: #cbd5e1; margin-top: 16px; }
                    @media print { body { padding: 0; } .label { border: 2px dashed #000; } }
                </style>
            </head>
            <body>
                <div class="label">
                    <div class="brand">Peninsula Laundries</div>
                    <div class="subtitle">Laundry POS</div>
                    <div class="qr-container">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getOrderUrl())}" width="180" height="180" />
                    </div>
                    <div class="order-id">${order?.orderId}</div>
                    <div class="customer">${order?.customer?.name || ''}</div>
                    <div class="date">${new Date(order?.createdAt).toLocaleDateString()}</div>
                    <div class="footer">Scan to view order details</div>
                </div>
                <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!order) return null;

    const currentStepIndex = statusSteps.indexOf(order.status);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/orders')} className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-colors">
                    <HiOutlineArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900">{order.orderId}</h1>
                    <p className="text-sm text-slate-500">Created {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={printQRLabel} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-cyan-600 hover:border-cyan-200 hover:bg-cyan-50 transition-all" title="Print QR Label">
                    <HiOutlinePrinter className="w-5 h-5" />
                </button>
                <span className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize ${statusColors[order.status] || 'bg-slate-600 text-slate-900'}`}>
                    {order.status}
                </span>
            </div>

            {/* Status Timeline */}
            {order.status !== 'cancelled' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="text-base font-semibold text-slate-900 mb-4">Order Progress</h2>
                    <div className="flex items-center justify-between overflow-x-auto pb-2">
                        {statusSteps.map((step, i) => (
                            <div key={step} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentStepIndex ? 'bg-cyan-500 text-slate-900' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {i <= currentStepIndex ? <HiOutlineCheckCircle className="w-5 h-5" /> : i + 1}
                                    </div>
                                    <span className={`text-[10px] mt-1 capitalize whitespace-nowrap ${i <= currentStepIndex ? 'text-cyan-600' : 'text-slate-500'
                                        }`}>{step}</span>
                                </div>
                                {i < statusSteps.length - 1 && (
                                    <div className={`w-8 sm:w-16 h-0.5 mx-1 ${i < currentStepIndex ? 'bg-cyan-500' : 'bg-slate-100'
                                        }`}></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Quick status buttons */}
                    {order.status !== 'delivered' && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {statusSteps.filter((_, i) => i > currentStepIndex).slice(0, 2).map((s) => (
                                <button key={s} onClick={() => handleStatusClick(s)}
                                    className="px-4 py-2 text-sm rounded-xl border border-cyan-200 text-cyan-600 hover:bg-cyan-50 transition-colors capitalize">
                                    Mark as {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer & Order Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-200">
                            <h2 className="text-base font-semibold text-slate-900">Order Items</h2>
                        </div>
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase border-b border-slate-200">
                                    <th className="px-5 py-3 text-left">Service</th>
                                    <th className="px-5 py-3 text-center">Qty</th>
                                    <th className="px-5 py-3 text-right">Rate</th>
                                    <th className="px-5 py-3 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items?.map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-200">
                                        <td className="px-5 py-3">
                                            <span className="text-sm text-slate-900">{item.serviceName}</span>
                                            <p className="text-xs text-slate-500 capitalize">{item.serviceType?.replace('-', ' ')}</p>
                                        </td>
                                        <td className="px-5 py-3 text-center text-sm text-slate-600">{item.quantity} {item.unit}</td>
                                        <td className="px-5 py-3 text-right text-sm text-slate-600">{currency}{item.pricePerUnit}</td>
                                        <td className="px-5 py-3 text-right text-sm text-slate-900 font-medium">{currency}{item.subtotal}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Status History */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h2 className="text-base font-semibold text-slate-900 mb-4">Status History</h2>
                        <div className="space-y-4">
                            {order.statusHistory?.map((h: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-slate-900 capitalize font-medium">{h.status}</span>
                                            <span className="text-slate-500">•</span>
                                            <span className="text-slate-500">{new Date(h.timestamp).toLocaleString()}</span>
                                            {h.updatedBy?.name && <span className="text-slate-500">by {h.updatedBy.name}</span>}
                                        </div>
                                        {/* Show inventory usage for this status change */}
                                        {h.inventoryUsage && h.inventoryUsage.length > 0 && (
                                            <div className="mt-2 ml-1 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                                                    <HiOutlineCube className="w-3.5 h-3.5" /> Inventory Used:
                                                </p>
                                                <div className="space-y-1">
                                                    {h.inventoryUsage.map((u: any, j: number) => (
                                                        <div key={j} className="flex justify-between text-xs">
                                                            <span className="text-slate-600">{u.itemName}</span>
                                                            <span className="text-slate-900 font-medium">{u.quantityUsed} {u.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-4">
                    {/* Customer */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2"><HiOutlineUser className="w-4 h-4" /> Customer</h3>
                        <p className="text-slate-900 font-medium">{order.customer?.name}</p>
                        <p className="text-sm text-slate-500">{order.customer?.phone}</p>
                        <p className="text-xs text-slate-500 mt-1">{order.customer?.customerId} • {order.customer?.customerType}</p>
                    </div>

                    {/* Pricing */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Pricing</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="text-slate-900">{currency}{order.subtotal}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Tax ({order.taxPercent}%)</span><span className="text-slate-900">+{currency}{order.taxAmount}</span></div>
                            {order.discountAmount > 0 && (
                                <div className="flex justify-between"><span className="text-slate-500">Discount ({order.discountPercent}%)</span><span className="text-emerald-400">-{currency}{order.discountAmount}</span></div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-base">
                                <span className="text-slate-900">Total</span>
                                <span className="text-cyan-600">{currency}{order.totalAmount?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Invoice / Payment */}
                    {order.invoice && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Invoice</h3>
                            <p className="text-cyan-600 font-medium">{order.invoice.invoiceId}</p>
                            <div className="mt-2 space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="text-emerald-400">{currency}{order.invoice.paidAmount}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Due</span><span className="text-red-400">{currency}{order.invoice.balanceDue}</span></div>
                            </div>
                            <span className={`inline-block mt-2 px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${order.invoice.paymentStatus === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : order.invoice.paymentStatus === 'partial'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                    : 'bg-red-500/15 text-red-400 border border-red-500/20'
                                }`}>{order.invoice.paymentStatus}</span>
                        </div>
                    )}

                    {/* Delivery */}
                    {order.deliveryDate && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2"><HiOutlineCalendar className="w-4 h-4" /> Delivery Date</h3>
                            <p className="text-slate-900">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                        </div>
                    )}

                    {order.specialInstructions && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">Special Instructions</h3>
                            <p className="text-sm text-slate-500">{order.specialInstructions}</p>
                        </div>
                    )}

                    {/* QR Code */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm0 4h-2v4h4v-2h-2v-2zm-4-4h2v4h-2v-4zm0 6h2v2h-2v-2zm4 2h2v2h-2v-2z" /></svg>
                            QR Code
                        </h3>
                        <div className="flex flex-col items-center">
                            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <QRCodeSVG
                                    value={getOrderUrl()}
                                    size={140}
                                    bgColor="#ffffff"
                                    fgColor="#0f172a"
                                    level="M"
                                    includeMargin={false}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Scan to view order</p>
                            <p className="text-sm font-bold text-slate-900 mt-1">{order.orderId}</p>
                            <button
                                onClick={printQRLabel}
                                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-xl border border-cyan-200 text-cyan-600 hover:bg-cyan-50 transition-colors"
                            >
                                <HiOutlinePrinter className="w-4 h-4" /> Print QR Label
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Usage Modal */}
            {showInventoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 capitalize">
                                    Mark as {pendingStatus}
                                </h3>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    Select inventory items used (optional)
                                </p>
                            </div>
                            <button onClick={() => setShowInventoryModal(false)} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            {loadingInventory ? (
                                <div className="flex items-center justify-center py-10">
                                    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <>
                                    {/* Inventory usage rows */}
                                    {inventoryUsage.map((row, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex-1 space-y-2">
                                                <select
                                                    value={row.item}
                                                    onChange={(e) => updateInventoryRow(index, 'item', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-cyan-500"
                                                >
                                                    <option value="">Select Item</option>
                                                    {inventoryItems.map((item) => (
                                                        <option key={item._id} value={item._id}>
                                                            {item.itemName} — {item.quantity} {item.unit} available
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Qty used"
                                                        min="0"
                                                        step="0.1"
                                                        value={row.quantityUsed || ''}
                                                        onChange={(e) => updateInventoryRow(index, 'quantityUsed', parseFloat(e.target.value) || 0)}
                                                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-cyan-500"
                                                    />
                                                    {row.unit && (
                                                        <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded-lg">{row.unit}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={() => removeInventoryRow(index)} className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors mt-1">
                                                <HiOutlineX className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Add item button */}
                                    <button
                                        onClick={addInventoryRow}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:text-cyan-600 hover:border-cyan-300 transition-colors"
                                    >
                                        <HiOutlineCube className="w-4 h-4" />
                                        Add Inventory Item
                                    </button>

                                    {inventoryUsage.length === 0 && (
                                        <p className="text-xs text-slate-400 text-center">
                                            No inventory items selected. You can update the status without adding items.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowInventoryModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitStatusUpdate}
                                disabled={submitting}
                                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50"
                            >
                                {submitting ? 'Updating...' : `Update to ${pendingStatus}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetail;
