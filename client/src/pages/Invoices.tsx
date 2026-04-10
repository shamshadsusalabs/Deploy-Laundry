import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { HiOutlineFilter, HiOutlineDownload, HiOutlinePrinter, HiOutlineEye, HiOutlineX } from 'react-icons/hi';

const Invoices = () => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { currency } = useSettings();
    const [filterStatus, setFilterStatus] = useState('');
    const [viewInvoice, setViewInvoice] = useState<any>(null);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filterStatus) params.paymentStatus = filterStatus;
            const res = await api.get('/invoices', { params });
            setInvoices(res.data.data);
        } catch (err: any) {
            toast.error('Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, [filterStatus]);

    const statusBadge = (s: string) => {
        const map: Record<string, string> = {
            paid: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            partial: 'bg-amber-50 text-amber-600 border-amber-200',
            unpaid: 'bg-red-50 text-red-600 border-red-200',
        };
        return map[s] || '';
    };

    const viewInvoiceDetail = async (id: string) => {
        try {
            const res = await api.get(`/invoices/${id}`);
            setViewInvoice(res.data.data);
        } catch {
            toast.error('Failed to load invoice');
        }
    };

    // Generate professional invoice HTML
    const generateInvoiceHTML = (inv: any, format: 'a4' | 'thermal' = 'a4') => {
        const biz = inv.business || {};
        const customer = inv.customer || inv.order?.customer || {};
        const order = inv.order || {};
        const items = order.items || [];
        const payments = inv.payments || [];

        if (format === 'thermal') {
            return `
                <html><head><title>Receipt - ${inv.invoiceId}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Courier New', monospace; width: 80mm; padding: 8mm; font-size: 12px; color: #000; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .line { border-top: 1px dashed #000; margin: 6px 0; }
                    .row { display: flex; justify-content: space-between; margin: 2px 0; }
                    .item-row { margin: 4px 0; }
                    h1 { font-size: 16px; margin-bottom: 2px; }
                    h2 { font-size: 13px; margin: 4px 0; }
                    .small { font-size: 10px; color: #555; }
                    @media print { body { width: 80mm; } @page { size: 80mm auto; margin: 0; } }
                </style></head><body>
                    <div class="center">
                        <img src="${window.location.origin}/logo.jpeg" style="max-height: 40px; margin-bottom: 6px;" alt="Logo" />
                        <h1>${biz.name || 'Peninsula Laundries'}</h1>
                        <p class="small">${biz.address || ''}</p>
                        <p class="small">${biz.phone || ''} ${biz.email ? '| ' + biz.email : ''}</p>
                        ${biz.taxNumber ? `<p class="small" style="margin-top: 2px;">${biz.taxNumberLabel || 'Tax No'}: ${biz.taxNumber}</p>` : ''}
                    </div>
                    <div class="line"></div>
                    <div class="center"><h2>RECEIPT</h2></div>
                    <div class="row"><span>Invoice:</span><span class="bold">${inv.invoiceId}</span></div>
                    <div class="row"><span>Order:</span><span>${order.orderId || '-'}</span></div>
                    <div class="row"><span>Date:</span><span>${new Date(inv.createdAt).toLocaleDateString()}</span></div>
                    <div class="row"><span>Customer:</span><span>${customer.name || '-'}</span></div>
                    <div class="row"><span>Phone:</span><span>${customer.phone || '-'}</span></div>
                    <div class="line"></div>
                    <div class="center bold" style="margin-bottom: 4px;">ITEMS</div>
                    ${items.map((item: any) => `
                        <div class="item-row">
                            <div>${item.serviceName}</div>
                            <div class="row small"><span>${item.quantity} ${item.unit} × ${currency}${item.pricePerUnit}</span><span>${currency}${item.subtotal}</span></div>
                        </div>
                    `).join('')}
                    <div class="line"></div>
                    <div class="row"><span>Subtotal</span><span>${currency}${inv.subtotal}</span></div>
                    <div class="row"><span>Tax (${inv.taxPercent || 0}%)</span><span>${currency}${inv.taxAmount || 0}</span></div>
                    ${inv.discountAmount > 0 ? `<div class="row"><span>Discount (${inv.discountPercent || 0}%)</span><span>-${currency}${inv.discountAmount}</span></div>` : ''}
                    ${inv.serviceCharge > 0 ? `<div class="row"><span>Service Charge</span><span>${currency}${inv.serviceCharge}</span></div>` : ''}
                    <div class="line"></div>
                    <div class="row bold" style="font-size: 14px;"><span>TOTAL</span><span>${currency}${inv.totalAmount}</span></div>
                    <div class="row"><span>Paid</span><span>${currency}${inv.paidAmount}</span></div>
                    <div class="row bold"><span>Balance</span><span>${currency}${inv.balanceDue}</span></div>
                    <div class="line"></div>
                    ${payments.length > 0 ? `
                        <div class="center bold small" style="margin-bottom: 4px;">PAYMENTS</div>
                        ${payments.map((p: any) => `
                            <div class="row small"><span>${p.paymentMethod} - ${new Date(p.createdAt).toLocaleDateString()}</span><span>${currency}${p.amount}</span></div>
                        `).join('')}
                        <div class="line"></div>
                    ` : ''}
                    <div class="center small" style="margin-top: 8px;">
                        <p>Thank you for choosing us!</p>
                        <p style="margin-top: 4px;">*** ${biz.name || 'Peninsula Laundries'} ***</p>
                    </div>
                </body></html>
            `;
        }

        // A4 Professional Invoice
        return `
            <html><head><title>Invoice - ${inv.invoiceId}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #334155; background: #fff; }
                .invoice-box { max-width: 800px; margin: 0 auto; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                .brand { display: flex; align-items: center; gap: 16px; }
                .brand img { max-height: 50px; border-radius: 8px; }
                .brand-info h1 { font-size: 28px; color: #0891b2; margin-bottom: 4px; }
                .brand-info p { font-size: 12px; color: #94a3b8; }
                .invoice-title { text-align: right; }
                .invoice-title h2 { font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: 2px; }
                .invoice-title .inv-id { font-size: 16px; color: #0891b2; font-weight: 600; margin-top: 4px; }
                .invoice-title .date { font-size: 13px; color: #94a3b8; margin-top: 4px; }
                .meta { display: flex; justify-content: space-between; margin-bottom: 32px; }
                .meta-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 8px; }
                .meta-block p { font-size: 13px; color: #334155; line-height: 1.6; }
                .meta-block .bold { font-weight: 600; color: #0f172a; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                thead th { background: #f1f5f9; padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
                thead th:last-child, thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
                tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
                tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(4) { text-align: right; }
                .service-type { font-size: 11px; color: #94a3b8; text-transform: capitalize; }
                .summary { display: flex; justify-content: flex-end; margin-bottom: 32px; }
                .summary-table { width: 280px; }
                .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
                .summary-row.total { border-top: 2px solid #0891b2; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: 700; color: #0f172a; }
                .summary-row .label { color: #64748b; }
                .summary-row .value { color: #0f172a; font-weight: 500; }
                .status-badge { display: inline-block; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
                .status-paid { background: #ecfdf5; color: #059669; }
                .status-partial { background: #fffbeb; color: #d97706; }
                .status-unpaid { background: #fef2f2; color: #dc2626; }
                .payments { margin-bottom: 32px; }
                .payments h3 { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
                .payment-row { display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 8px; margin-bottom: 4px; font-size: 12px; }
                .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
                .footer p { font-size: 12px; color: #94a3b8; }
                .qr-section { text-align: center; margin-top: 20px; }
                .qr-section img { border-radius: 8px; }
                @media print { body { padding: 20px; } @page { size: A4; margin: 15mm; } }
            </style></head><body>
            <div class="invoice-box">
                <div class="header">
                    <div class="brand">
                        <img src="${window.location.origin}/logo.jpeg" alt="Logo" />
                        <div class="brand-info">
                            <h1>${biz.name || 'Peninsula Laundries'}</h1>
                            <p>${biz.address || ''}</p>
                            <p>${biz.phone || ''} ${biz.email ? '| ' + biz.email : ''}</p>
                            ${biz.taxNumber ? `<p style="font-size: 12px; color: #0891b2; font-weight: 600; margin-top: 4px;">${biz.taxNumberLabel || 'Tax No'}: ${biz.taxNumber}</p>` : ''}
                        </div>
                    </div>
                    <div class="invoice-title">
                        <h2>INVOICE</h2>
                        <div class="inv-id">${inv.invoiceId}</div>
                        <div class="date">${new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                </div>

                <div class="meta">
                    <div class="meta-block">
                        <h3>Bill To</h3>
                        <p class="bold">${customer.name || '-'}</p>
                        <p>${customer.phone || ''}</p>
                        <p>${customer.email || ''}</p>
                        <p>${customer.address || ''}</p>
                        <p style="margin-top: 4px; font-size: 11px; color: #94a3b8;">${customer.customerId || ''} • ${customer.customerType || ''}</p>
                    </div>
                    <div class="meta-block" style="text-align: right;">
                        <h3>Order Details</h3>
                        <p class="bold">${order.orderId || '-'}</p>
                        <p>Status: <span style="text-transform: capitalize;">${order.status || '-'}</span></p>
                        <p>Payment: <span class="status-badge status-${inv.paymentStatus}">${inv.paymentStatus}</span></p>
                    </div>
                </div>

                <table>
                    <thead><tr><th>Service</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
                    <tbody>
                        ${items.map((item: any) => `
                            <tr>
                                <td>${item.serviceName}<br/><span class="service-type">${item.serviceType?.replace('-', ' ') || ''}</span></td>
                                <td>${item.quantity} ${item.unit}</td>
                                <td>${currency}${item.pricePerUnit}</td>
                                <td><strong>${currency}${item.subtotal}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="summary">
                    <div class="summary-table">
                        <div class="summary-row"><span class="label">Subtotal</span><span class="value">${currency}${inv.subtotal}</span></div>
                        <div class="summary-row"><span class="label">Tax (${inv.taxPercent || 0}%)</span><span class="value">+${currency}${inv.taxAmount || 0}</span></div>
                        ${inv.discountAmount > 0 ? `<div class="summary-row"><span class="label">Discount (${inv.discountPercent || 0}%)</span><span class="value" style="color:#059669;">-${currency}${inv.discountAmount}</span></div>` : ''}
                        ${inv.serviceCharge > 0 ? `<div class="summary-row"><span class="label">Service Charge</span><span class="value">${currency}${inv.serviceCharge}</span></div>` : ''}
                        <div class="summary-row total"><span>Total</span><span>${currency}${inv.totalAmount?.toLocaleString()}</span></div>
                        <div class="summary-row"><span class="label">Paid</span><span class="value" style="color:#059669;">${currency}${inv.paidAmount}</span></div>
                        <div class="summary-row"><span class="label">Balance Due</span><span class="value" style="color:${inv.balanceDue > 0 ? '#dc2626' : '#059669'};">${currency}${inv.balanceDue}</span></div>
                    </div>
                </div>

                ${payments.length > 0 ? `
                    <div class="payments">
                        <h3>Payment History</h3>
                        ${payments.map((p: any) => `
                            <div class="payment-row">
                                <span>${p.paymentMethod} ${p.transactionRef ? '(' + p.transactionRef + ')' : ''}</span>
                                <span>${new Date(p.createdAt).toLocaleDateString()}</span>
                                <span style="font-weight: 600;">${currency}${p.amount}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div class="footer">
                    <p><strong>Thank you for your business!</strong></p>
                    <p style="margin-top: 4px;">${biz.name || 'Peninsula Laundries'} ${biz.phone ? '| ' + biz.phone : ''}</p>
                </div>
            </div>
            </body></html>
        `;
    };

    const printInvoice = (inv: any, format: 'a4' | 'thermal' = 'a4') => {
        const printWindow = window.open('', '_blank', format === 'thermal' ? 'width=350,height=600' : 'width=900,height=700');
        if (!printWindow) return;
        printWindow.document.write(generateInvoiceHTML(inv, format));
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 500);
    };

    const downloadPDF = (inv: any) => {
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) return;
        printWindow.document.write(generateInvoiceHTML(inv, 'a4'));
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 500);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
                    <p className="text-sm text-slate-500 mt-1">{invoices.length} invoices</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-3">
                <div className="relative">
                    <HiOutlineFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer min-w-[160px]">
                        <option value="">All Status</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">No invoices found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase border-b border-slate-200">
                                    <th className="px-5 py-3 text-left">Invoice ID</th>
                                    <th className="px-5 py-3 text-left">Order</th>
                                    <th className="px-5 py-3 text-left">Customer</th>
                                    <th className="px-5 py-3 text-right">Total</th>
                                    <th className="px-5 py-3 text-right">Paid</th>
                                    <th className="px-5 py-3 text-right">Due</th>
                                    <th className="px-5 py-3 text-center">Status</th>
                                    <th className="px-5 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv) => (
                                    <tr key={inv._id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3.5"><span className="text-sm font-medium text-cyan-600">{inv.invoiceId}</span></td>
                                        <td className="px-5 py-3.5"><span className="text-sm text-slate-600">{inv.order?.orderId}</span></td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm text-slate-900">{inv.customer?.name}</span>
                                            <p className="text-xs text-slate-500">{inv.customer?.phone}</p>
                                        </td>
                                        <td className="px-5 py-3.5 text-right"><span className="text-sm font-medium text-slate-900">{currency}{inv.totalAmount?.toLocaleString()}</span></td>
                                        <td className="px-5 py-3.5 text-right"><span className="text-sm text-emerald-600">{currency}{inv.paidAmount?.toLocaleString()}</span></td>
                                        <td className="px-5 py-3.5 text-right"><span className={`text-sm font-medium ${inv.balanceDue > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{currency}{inv.balanceDue?.toLocaleString()}</span></td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${statusBadge(inv.paymentStatus)}`}>{inv.paymentStatus}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => viewInvoiceDetail(inv._id)} title="View Invoice"
                                                    className="p-2 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 transition-colors">
                                                    <HiOutlineEye className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => viewInvoiceDetail(inv._id).then(() => { })} title="Download PDF"
                                                    className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    onClickCapture={async () => {
                                                        try {
                                                            const res = await api.get(`/invoices/${inv._id}`);
                                                            downloadPDF(res.data.data);
                                                        } catch { toast.error('Failed'); }
                                                    }}>
                                                    <HiOutlineDownload className="w-4 h-4" />
                                                </button>
                                                <button title="Print Receipt (Thermal)"
                                                    className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                    onClick={async () => {
                                                        try {
                                                            const res = await api.get(`/invoices/${inv._id}`);
                                                            printInvoice(res.data.data, 'thermal');
                                                        } catch { toast.error('Failed'); }
                                                    }}>
                                                    <HiOutlinePrinter className="w-4 h-4" />
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

            {/* Invoice Detail Modal */}
            {viewInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10">
                    <div className="w-full max-w-2xl mx-4 bg-white border border-slate-200 rounded-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">{viewInvoice.invoiceId}</h3>
                                <p className="text-xs text-slate-500">{new Date(viewInvoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => downloadPDF(viewInvoice)} className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50" title="Download PDF">
                                    <HiOutlineDownload className="w-5 h-5" />
                                </button>
                                <button onClick={() => printInvoice(viewInvoice, 'thermal')} className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50" title="Print Thermal Receipt">
                                    <HiOutlinePrinter className="w-5 h-5" />
                                </button>
                                <button onClick={() => setViewInvoice(null)} className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                                    <HiOutlineX className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Business + Customer */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2">From</h4>
                                    <div className="flex items-center gap-3 mb-2">
                                        <img src="/logo.jpeg" alt="Logo" className="w-10 h-10 rounded-lg object-contain border border-slate-200" />
                                        <p className="text-sm font-semibold text-cyan-600">{viewInvoice.business?.name || 'Peninsula Laundries'}</p>
                                    </div>
                                    {viewInvoice.business?.address && <p className="text-xs text-slate-500">{viewInvoice.business.address}</p>}
                                    {viewInvoice.business?.phone && <p className="text-xs text-slate-500 mt-0.5">{viewInvoice.business.phone}</p>}
                                    {viewInvoice.business?.email && <p className="text-xs text-slate-500 mt-0.5">{viewInvoice.business.email}</p>}
                                    {viewInvoice.business?.taxNumber && (
                                        <p className="text-xs font-semibold text-cyan-600 mt-1">
                                            {viewInvoice.business.taxNumberLabel || 'Tax No'}: {viewInvoice.business.taxNumber}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Bill To</h4>
                                    <p className="text-sm font-semibold text-slate-900">{viewInvoice.customer?.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">{viewInvoice.customer?.phone}</p>
                                    <p className="text-xs text-slate-500">{viewInvoice.customer?.email}</p>
                                    <p className="text-xs text-slate-400 mt-1">{viewInvoice.customer?.customerId}</p>
                                </div>
                            </div>

                            {/* Order + Status */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div>
                                    <span className="text-xs text-slate-400">Order</span>
                                    <p className="text-sm font-medium text-slate-900">{viewInvoice.order?.orderId}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-400">Payment Status</span>
                                    <p><span className={`inline-block mt-1 px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${statusBadge(viewInvoice.paymentStatus)}`}>{viewInvoice.paymentStatus}</span></p>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-3">Items</h4>
                                <div className="rounded-xl border border-slate-200 overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                                <th className="px-4 py-2.5 text-left">Service</th>
                                                <th className="px-4 py-2.5 text-center">Qty</th>
                                                <th className="px-4 py-2.5 text-right">Rate</th>
                                                <th className="px-4 py-2.5 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewInvoice.order?.items?.map((item: any, i: number) => (
                                                <tr key={i} className="border-b border-slate-100">
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-sm text-slate-900">{item.serviceName}</span>
                                                        <p className="text-xs text-slate-400 capitalize">{item.serviceType?.replace('-', ' ')}</p>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center text-sm text-slate-600">{item.quantity} {item.unit}</td>
                                                    <td className="px-4 py-2.5 text-right text-sm text-slate-600">{currency}{item.pricePerUnit}</td>
                                                    <td className="px-4 py-2.5 text-right text-sm font-medium text-slate-900">{currency}{item.subtotal}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="flex justify-end">
                                <div className="w-64 space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="text-slate-900">{currency}{viewInvoice.subtotal}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Tax ({viewInvoice.taxPercent || 0}%)</span><span className="text-slate-900">+{currency}{viewInvoice.taxAmount || 0}</span></div>
                                    {viewInvoice.discountAmount > 0 && (
                                        <div className="flex justify-between"><span className="text-slate-500">Discount ({viewInvoice.discountPercent || 0}%)</span><span className="text-emerald-600">-{currency}{viewInvoice.discountAmount}</span></div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-base">
                                        <span className="text-slate-900">Total</span>
                                        <span className="text-cyan-600">{currency}{viewInvoice.totalAmount?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="text-emerald-600">{currency}{viewInvoice.paidAmount}</span></div>
                                    <div className="flex justify-between font-medium"><span className="text-slate-500">Balance</span><span className={viewInvoice.balanceDue > 0 ? 'text-red-500' : 'text-emerald-600'}>{currency}{viewInvoice.balanceDue}</span></div>
                                </div>
                            </div>

                            {/* Payment History */}
                            {viewInvoice.payments?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Payment History</h4>
                                    <div className="space-y-2">
                                        {viewInvoice.payments.map((p: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                                                <div>
                                                    <span className="font-medium text-slate-900 capitalize">{p.paymentMethod}</span>
                                                    {p.transactionRef && <span className="text-slate-400 ml-2">({p.transactionRef})</span>}
                                                    {p.processedBy?.name && <span className="text-slate-400 ml-2">by {p.processedBy.name}</span>}
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-medium text-emerald-600">{currency}{p.amount}</span>
                                                    <p className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;
