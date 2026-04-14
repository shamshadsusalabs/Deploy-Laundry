import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import {
    HiOutlineFilter,
    HiOutlineDownload,
    HiOutlinePrinter,
    HiOutlineEye,
    HiOutlineX,
    HiOutlineDocumentText,
    HiOutlineSearch,
    HiOutlineCalendar,
    HiOutlineChevronDown,
} from 'react-icons/hi';

const Invoices = () => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { currency } = useSettings();
    const [viewInvoice, setViewInvoice] = useState<any>(null);

    // ── Filters ──
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterOrderId, setFilterOrderId] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await api.get('/invoices');
            setInvoices(res.data.data);
        } catch (err: any) {
            toast.error('Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);

    // ── Client-side filtering ──
    const filteredInvoices = useMemo(() => {
        return invoices.filter((inv) => {
            if (filterStatus && inv.paymentStatus !== filterStatus) return false;
            if (filterCustomer) {
                const q = filterCustomer.toLowerCase();
                const name = (inv.customer?.name || '').toLowerCase();
                const phone = (inv.customer?.phone || '').toLowerCase();
                if (!name.includes(q) && !phone.includes(q)) return false;
            }
            if (filterOrderId) {
                const q = filterOrderId.toLowerCase();
                if (!(inv.order?.orderId || '').toLowerCase().includes(q) &&
                    !(inv.invoiceId || '').toLowerCase().includes(q)) return false;
            }
            if (filterDateFrom) {
                const invDate = new Date(inv.createdAt);
                const from = new Date(filterDateFrom);
                from.setHours(0, 0, 0, 0);
                if (invDate < from) return false;
            }
            if (filterDateTo) {
                const invDate = new Date(inv.createdAt);
                const to = new Date(filterDateTo);
                to.setHours(23, 59, 59, 999);
                if (invDate > to) return false;
            }
            return true;
        });
    }, [invoices, filterStatus, filterCustomer, filterOrderId, filterDateFrom, filterDateTo]);

    const activeFilterCount = [filterStatus, filterCustomer, filterOrderId, filterDateFrom, filterDateTo].filter(Boolean).length;

    const clearFilters = () => {
        setFilterStatus('');
        setFilterCustomer('');
        setFilterOrderId('');
        setFilterDateFrom('');
        setFilterDateTo('');
    };

    const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
        paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        partial: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
        unpaid: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    };

    const viewInvoiceDetail = async (id: string) => {
        try {
            const res = await api.get(`/invoices/${id}`);
            setViewInvoice(res.data.data);
        } catch {
            toast.error('Failed to load invoice');
        }
    };

    /* ─────────────────────────────────────────────
       Generate printable HTML
    ───────────────────────────────────────────── */
    const generateInvoiceHTML = (inv: any, format: 'a4' | 'thermal' = 'a4') => {
        const biz = inv.business || {};
        const customer = inv.customer || inv.order?.customer || {};
        const order = inv.order || {};
        const items = order.items || [];
        const payments = inv.payments || [];

        /* ── THERMAL ── */
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

        /* ── A4 Professional Invoice ── */
        const invoiceDate = new Date(inv.createdAt);
        const dueDateStr = inv.dueDate
            ? new Date(inv.dueDate).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
            : new Date(invoiceDate.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
        const invoiceDateStr = invoiceDate.toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(',', '.');

        const groupedItems: any[] = items.map((item: any) => ({
            deliveryDate: item.deliveryDate || item.shipDate || '',
            name: item.serviceName || item.name || '',
            quantity: item.quantity || 0,
            rate: item.pricePerUnit || item.rate || 0,
            total: item.subtotal || item.total || 0,
        }));

        const creditedItems: any[] = (inv.creditedItems || []).map((item: any) => ({
            name: item.serviceName || item.name || '',
            quantity: item.quantity || 0,
            rate: item.pricePerUnit || item.rate || 0,
            total: item.subtotal || item.total || 0,
        }));

        const subtotal = inv.subtotal || 0;
        const taxAmount = inv.taxAmount || 0;
        const totalAmount = inv.totalAmount || 0;
        const invoiceNumber = inv.invoiceNumber || inv.invoiceId || '';
        const paymentAccountName = biz.bankAccountName || 'JSP CORPORATION PTY LTD';
        const paymentBank = biz.bankName || 'ANZ';
        const paymentBSB = biz.bankBSB || '012787';
        const paymentAccountNo = biz.bankAccountNo || '';
        const abn = biz.taxNumber || biz.abn || '31647801045';
        const terms = inv.terms || 'NET 14';

        return `
            <html><head><title>Tax Invoice - ${invoiceNumber}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #1a1a2e; font-size: 12px; }
                .page { max-width: 820px; margin: 0 auto; padding: 30px 36px; }
                .top-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 1.5px solid #ccc; }
                .logo-block img { max-height: 64px; max-width: 160px; object-fit: contain; }
                .logo-block .tagline { font-size: 9px; letter-spacing: 3px; color: #888; margin-top: 4px; text-transform: uppercase; text-align: center; }
                .contact-block { text-align: center; font-size: 11px; color: #333; line-height: 1.7; }
                .contact-block .icon-line { display: flex; align-items: center; justify-content: center; gap: 5px; }
                .contact-block .ic { width: 14px; height: 14px; }
                .tax-strip { display: flex; justify-content: space-between; align-items: center; margin: 18px 0 14px; }
                .tax-invoice-btn { background: #1c2a5e; color: #fff; font-size: 13px; font-weight: bold; padding: 8px 22px; border-radius: 4px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }
                .tax-invoice-btn .plus { font-size: 18px; font-weight: 300; }
                .abn-right { font-size: 18px; font-weight: 900; color: #1a1a2e; letter-spacing: 2px; }
                .bill-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
                .bill-to .cust-name { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
                .bill-to .address-icon { display: flex; align-items: flex-start; gap: 5px; }
                .bill-to .address-icon .ic { margin-top: 2px; min-width: 14px; }
                .meta-numbers { display: flex; gap: 0; border: 1px solid #ccc; margin-bottom: 14px; }
                .meta-cell { flex: 1; padding: 6px 10px; border-right: 1px solid #ccc; }
                .meta-cell:last-child { border-right: none; }
                .meta-cell .mc-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 2px; }
                .meta-cell .mc-value { font-size: 12px; font-weight: 700; color: #1a1a2e; }
                .meta-cell .mc-value.due { color: #cc0000; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
                .items-table thead tr { background: #1c2a5e; color: #fff; }
                .items-table thead th { padding: 8px; font-size: 11px; font-weight: 700; text-align: left; letter-spacing: 0.5px; }
                .items-table thead th.right { text-align: right; }
                .items-table tbody tr { border-bottom: 1px solid #e0e0e0; }
                .items-table tbody tr:nth-child(even) { background: #f9f9f9; }
                .items-table tbody td { padding: 6px 8px; font-size: 11px; color: #1a1a2e; border-bottom: 1px solid #e8e8e8; vertical-align: top; }
                .items-table tbody td.right { text-align: right; }
                .items-table tbody td.bold { font-weight: 700; }
                .credited-label { font-size: 11px; font-weight: 700; color: #1a1a2e; padding: 6px 8px; background: #f3f3f3; border-top: 1.5px solid #ccc; }
                .credited-row td { color: #cc0000; }
                .bottom-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; }
                .note { font-size: 10px; color: #0047cc; font-style: italic; }
                .amount-due-btn { background: #1c2a5e; color: #fff; font-size: 14px; font-weight: 700; padding: 9px 28px; border-radius: 4px; display: inline-block; margin-bottom: 8px; letter-spacing: 1px; }
                .summary-lines { font-size: 12px; color: #1a1a2e; line-height: 1.8; text-align: right; }
                .summary-lines .s-row { display: flex; justify-content: space-between; gap: 40px; }
                .summary-lines .s-total { font-size: 14px; font-weight: 900; background: #1c2a5e; color: #fff; padding: 6px 12px; border-radius: 3px; margin-top: 4px; }
                .payment-section { margin-top: 18px; border-top: 1.5px solid #ccc; padding-top: 14px; display: flex; gap: 30px; align-items: flex-start; }
                .payment-block { font-size: 11px; color: #1a1a2e; line-height: 1.7; }
                .payment-block .pay-title { font-size: 12px; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
                .disclaimer-block { font-size: 10px; color: #555; line-height: 1.6; flex: 1; }
                .disclaimer-block .disc-label { font-weight: 700; color: #0047cc; font-size: 11px; margin-bottom: 2px; }
                @media print {
                    body { font-size: 11px; }
                    .page { padding: 15px 20px; }
                    @page { size: A4; margin: 10mm; }
                }
            </style></head><body>
            <div class="page">
                <!-- TOP HEADER -->
                <div class="top-header">
                    <div class="logo-block">
                        <img src="${window.location.origin}/logo.jpeg" alt="Peninsula Laundries Logo" />
                        <div class="tagline">L A U N D R I E S</div>
                    </div>
                    <div class="contact-block">
                        <div class="icon-line">
                            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="#1c2a5e" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span>${biz.companyName || 'JSP Corporation Pty Ltd T/A Peninsula'}<br/>Laundries<br/>${biz.address || '13 Redcliffe Gardens Drive'}<br/>${biz.suburb || 'Clontarf'}, ${biz.state || 'Queensland'}, ${biz.postcode || '4019'}, Australia</span>
                        </div>
                        <div class="icon-line" style="margin-top:6px;">
                            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="#1c2a5e" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.33 12a19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                            ${biz.phone || '61475902921'}
                        </div>
                        <div class="icon-line" style="margin-top:4px;">
                            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="#1c2a5e" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                            ${biz.website || 'peninsulalaundries.com.au'}
                        </div>
                        <div class="icon-line" style="margin-top:4px;">
                            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="#1c2a5e" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            ${biz.email || 'orders@peninsulalaundries.com.au'}
                        </div>
                    </div>
                    <div style="text-align:right; font-size:18px; font-weight:900; color:#1a1a2e; letter-spacing:2px;">
                        A.B.N.<br/>${abn}
                    </div>
                </div>

                <!-- TAX INVOICE STRIP -->
                <div class="tax-strip">
                    <div class="tax-invoice-btn">
                        <span class="plus">+</span> Tax Invoice
                    </div>
                    <div style="font-size:11px; color:#555; text-align:right;">
                        <strong>Invoice #:</strong> ${invoiceNumber}
                    </div>
                </div>

                <!-- BILL TO -->
                <div class="bill-meta">
                    <div class="bill-to">
                        <div class="cust-name">${customer.name || '-'}</div>
                        <div class="address-icon">
                            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="#1c2a5e" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span>${customer.address || ''}<br/>${customer.suburb || customer.city || ''}, ${customer.postcode || ''}, ${customer.state || 'Australia'}</span>
                        </div>
                        ${customer.email ? `<div style="margin-top:3px; font-size:11px; color:#555;">${customer.email}</div>` : ''}
                    </div>
                </div>

                <!-- META NUMBERS BAR -->
                <div class="meta-numbers">
                    <div class="meta-cell"><div class="mc-label">Invoice#</div><div class="mc-value">${invoiceNumber}</div></div>
                    <div class="meta-cell"><div class="mc-label">Invoice Date</div><div class="mc-value">${invoiceDateStr}</div></div>
                    <div class="meta-cell"><div class="mc-label">Due Date</div><div class="mc-value due">${dueDateStr}</div></div>
                    <div class="meta-cell"><div class="mc-label">Total</div><div class="mc-value">${currency}${Number(totalAmount).toFixed(2)}</div></div>
                    <div class="meta-cell"><div class="mc-label">Terms</div><div class="mc-value">${terms}</div></div>
                </div>

                <!-- ITEMS TABLE -->
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Delivery Date</th>
                            <th>Item Name</th><th class="right">Quantity</th><th class="right">Rate</th><th class="right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${groupedItems.map((item: any, idx: number) => {
                            const prevItem = idx > 0 ? groupedItems[idx - 1] : null;
                            const showDate = !prevItem || prevItem.deliveryDate !== item.deliveryDate;
                            return `<tr>
                                <td class="bold">${showDate && item.deliveryDate ? item.deliveryDate : (item.deliveryDate ? '...' : '')}</td>
                                <td>${item.name}</td>
                                <td class="right">${item.quantity}</td>
                                <td class="right">${currency}${Number(item.rate).toFixed(2)}</td>
                                <td class="right">${currency}${Number(item.total).toFixed(2)}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>

                ${creditedItems.length > 0 ? `
                    <div class="credited-label">CREDITED ITEMS</div>
                    <table class="items-table">
                        <tbody>
                            ${creditedItems.map((item: any) => `
                                <tr class="credited-row">
                                    <td>${item.name}:</td>
                                    <td class="right">${item.quantity}</td>
                                    <td class="right">${currency}${Number(item.rate).toFixed(2)}</td>
                                    <td class="right">(${currency}${Math.abs(Number(item.total)).toFixed(2)})</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}

                <!-- BOTTOM SECTION -->
                <div class="bottom-section">
                    <div class="note">Items marked with * are rental carts.</div>
                    <div style="text-align:right;">
                        <div class="amount-due-btn">AMOUNT DUE</div>
                        <div class="summary-lines">
                            <div class="s-row"><span>Sub Total:</span><span>${currency}${Number(subtotal).toFixed(2)}</span></div>
                            <div class="s-row"><span>Sales Tax:</span><span>${currency}${Number(taxAmount).toFixed(2)}</span></div>
                            <div class="s-row s-total"><span>TOTAL</span><span>${currency}${Number(totalAmount).toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>

                <!-- PAYMENT + DISCLAIMER -->
                <div class="payment-section">
                    <div class="payment-block">
                        <div class="pay-title">🏦 PAYMENT</div>
                        <div><strong>Direct Deposit:</strong></div>
                        <div>Account Name: ${paymentAccountName}</div>
                        <div>Bank: ${paymentBank} &nbsp; BSB: ${paymentBSB}</div>
                        <div>Account NO: ${paymentAccountNo}</div>
                    </div>
                    <div class="disclaimer-block">
                        <div class="disc-label">Disclaimer:</div>
                        <div>${biz.name || 'JSP Corporation Pty Ltd T/as Peninsula Laundries'} reserves the right to claim ownership of any linen that has not been returned. We also reserve the right to seek legal advice and pursue recovery of replacement costs for any unreturned or missing items.</div>
                    </div>
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

    /* ─────────────────────────────────────────────
       STATUS BADGE
    ───────────────────────────────────────────── */
    const StatusBadge = ({ status }: { status: string }) => {
        const c = statusColors[status] || { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
    };

    /* ─────────────────────────────────────────────
       RENDER
    ───────────────────────────────────────────── */
    return (
        <div className="space-y-6 animate-fadeIn">

            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                        <HiOutlineDocumentText className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {filteredInvoices.length} of {invoices.length} invoices
                            {activeFilterCount > 0 && <span className="ml-1 text-cyan-500">(filtered)</span>}
                        </p>
                    </div>
                </div>

                {/* Filter toggle button */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium shadow-sm transition-all ${
                        showFilters || activeFilterCount > 0
                            ? 'bg-cyan-500 text-white border-cyan-500 shadow-cyan-100'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'
                    }`}
                >
                    <HiOutlineFilter className="w-4 h-4" />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="ml-0.5 w-5 h-5 rounded-full bg-white text-cyan-600 text-xs font-bold flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                    <HiOutlineChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* ── ADVANCED FILTER PANEL ── */}
            {showFilters && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">

                        {/* Customer Search */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Customer</label>
                            <div className="relative">
                                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Name or phone…"
                                    value={filterCustomer}
                                    onChange={(e) => setFilterCustomer(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {/* Order / Invoice ID */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Order / Invoice ID</label>
                            <div className="relative">
                                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="ORD-001 or INV-001…"
                                    value={filterOrderId}
                                    onChange={(e) => setFilterOrderId(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {/* Date From */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Date From</label>
                            <div className="relative">
                                <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Date To */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Date To</label>
                            <div className="relative">
                                <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Status</label>
                            <div className="relative">
                                <HiOutlineFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent appearance-none cursor-pointer"
                                >
                                    <option value="">All Status</option>
                                    <option value="unpaid">Unpaid</option>
                                    <option value="partial">Partial</option>
                                    <option value="paid">Paid</option>
                                </select>
                                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Clear filters */}
                    {activeFilterCount > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-xs text-slate-400">
                                Showing <span className="font-semibold text-slate-700">{filteredInvoices.length}</span> of {invoices.length} invoices
                            </p>
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                            >
                                <HiOutlineX className="w-3.5 h-3.5" />
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── TABLE CARD ── */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-10 h-10 border-[3px] border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-400">Loading invoices…</p>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                        <HiOutlineDocumentText className="w-12 h-12 opacity-30" />
                        <p className="text-sm font-medium">No invoices match your filters</p>
                        <button onClick={clearFilters} className="text-xs text-cyan-500 hover:text-cyan-700 font-medium underline underline-offset-2">
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid</th>
                                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Due</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredInvoices.map((inv) => (
                                    <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-5 py-4">
                                            <span className="font-semibold text-cyan-600 group-hover:text-cyan-700 transition-colors">
                                                {inv.invoiceId}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 font-mono text-xs">
                                            {inv.order?.orderId || '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-slate-800">{inv.customer?.name || '—'}</div>
                                            {inv.customer?.phone && (
                                                <div className="text-xs text-slate-400 mt-0.5">{inv.customer.phone}</div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                                            {inv.createdAt
                                                ? new Date(inv.createdAt).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                                : '—'}
                                        </td>
                                        <td className="px-5 py-4 text-right font-semibold text-slate-800">
                                            {currency}{inv.totalAmount?.toLocaleString()}
                                        </td>
                                        <td className="px-5 py-4 text-right font-medium text-emerald-600">
                                            {currency}{inv.paidAmount?.toLocaleString()}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className={`font-semibold ${inv.balanceDue > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                {currency}{inv.balanceDue?.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <StatusBadge status={inv.paymentStatus} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => viewInvoiceDetail(inv._id)}
                                                    title="View Invoice"
                                                    className="p-2 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all"
                                                >
                                                    <HiOutlineEye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    title="Download PDF"
                                                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                    onClick={async () => {
                                                        try {
                                                            const res = await api.get(`/invoices/${inv._id}`);
                                                            downloadPDF(res.data.data);
                                                        } catch { toast.error('Failed to download'); }
                                                    }}
                                                >
                                                    <HiOutlineDownload className="w-4 h-4" />
                                                </button>
                                                <button
                                                    title="Print Thermal Receipt"
                                                    className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                                                    onClick={async () => {
                                                        try {
                                                            const res = await api.get(`/invoices/${inv._id}`);
                                                            printInvoice(res.data.data, 'thermal');
                                                        } catch { toast.error('Failed to print'); }
                                                    }}
                                                >
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

            {/* ── INVOICE DETAIL MODAL ── */}
            {viewInvoice && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setViewInvoice(null); }}
                >
                    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh] animate-fadeIn">

                        {/* ── TOOLBAR ── */}
                        <div className="flex-shrink-0 bg-[#1c2a5e] px-5 py-3 rounded-t-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src="/logo.jpeg" alt="Logo" className="h-8 w-auto object-contain rounded opacity-90" />
                                <div>
                                    <p className="text-white font-bold text-sm leading-tight">Peninsula Laundries</p>
                                    <p className="text-blue-300 text-xs font-mono">{viewInvoice.invoiceId}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => downloadPDF(viewInvoice)}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-all font-medium"
                                >
                                    <HiOutlineDownload className="w-3.5 h-3.5" /> PDF
                                </button>
                                <button
                                    onClick={() => printInvoice(viewInvoice, 'thermal')}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-all font-medium"
                                >
                                    <HiOutlinePrinter className="w-3.5 h-3.5" /> Thermal
                                </button>
                                <button
                                    onClick={() => setViewInvoice(null)}
                                    className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/60 text-white transition-all"
                                    title="Close"
                                >
                                    <HiOutlineX className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* ── SCROLLABLE BODY ── */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-4">

                            {/* ── BUSINESS HEADER: Logo | Contact | ABN ── */}
                            <div className="grid grid-cols-3 items-start gap-4 pb-4 border-b border-slate-200">

                                {/* LEFT: Logo */}
                                <div className="flex flex-col items-start gap-1">
                                    <img src="/logo.jpeg" alt="Peninsula Laundries" className="max-h-16 max-w-[130px] object-contain" />
                                    <span className="text-[8px] tracking-[3px] text-slate-400 uppercase font-semibold">L A U N D R I E S</span>
                                </div>

                                {/* CENTER: Business Contact */}
                                <div className="text-center text-xs text-slate-600 space-y-1.5">
                                    <div className="flex items-start justify-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 mt-0.5 text-[#1c2a5e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                        <span className="leading-relaxed text-left">
                                            <strong>{viewInvoice.business?.companyName || 'JSP Corporation Pty Ltd T/A Peninsula Laundries'}</strong><br />
                                            {viewInvoice.business?.address || '13 Redcliffe Gardens Drive'}<br />
                                            {viewInvoice.business?.suburb || 'Clontarf'}, {viewInvoice.business?.state || 'Queensland'} {viewInvoice.business?.postcode || '4019'}, Australia
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-[#1c2a5e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.33 12a19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                                        {viewInvoice.business?.phone || '61475902921'}
                                    </div>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-[#1c2a5e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                                        {viewInvoice.business?.website || 'peninsulalaundries.com.au'}
                                    </div>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-[#1c2a5e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                        {viewInvoice.business?.email || 'orders@peninsulalaundries.com.au'}
                                    </div>
                                </div>

                                {/* RIGHT: ABN */}
                                <div className="text-right">
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">A.B.N.</div>
                                    <div className="text-base font-black text-[#1a1a2e] tracking-widest">
                                        {viewInvoice.business?.taxNumber || viewInvoice.business?.abn || '31647801045'}
                                    </div>
                                </div>
                            </div>

                            {/* ── TAX INVOICE STRIP + BILL TO (side by side) ── */}
                            <div className="grid grid-cols-2 gap-6 items-start">

                                {/* Bill To — Customer */}
                                <div>
                                    <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Bill To</div>
                                    <div className="font-bold text-[#1a1a2e] text-sm mb-1">{viewInvoice.customer?.name || '—'}</div>
                                    {(viewInvoice.customer?.address || viewInvoice.customer?.suburb) && (
                                        <div className="flex items-start gap-1.5 text-slate-500 text-xs mb-0.5">
                                            <svg className="w-3.5 h-3.5 mt-0.5 text-[#1c2a5e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                            <span className="leading-relaxed">
                                                {viewInvoice.customer?.address && <>{viewInvoice.customer.address}<br /></>}
                                                {[viewInvoice.customer?.suburb || viewInvoice.customer?.city, viewInvoice.customer?.state, viewInvoice.customer?.postcode, 'Australia'].filter(Boolean).join(', ')}
                                            </span>
                                        </div>
                                    )}
                                    {viewInvoice.customer?.phone && (
                                        <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-0.5">
                                            <svg className="w-3.5 h-3.5 text-[#1c2a5e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.33 12a19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                                            {viewInvoice.customer.phone}
                                        </div>
                                    )}
                                    {viewInvoice.customer?.email && (
                                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                            <svg className="w-3.5 h-3.5 text-[#1c2a5e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                            {viewInvoice.customer.email}
                                        </div>
                                    )}
                                </div>

                                {/* Tax Invoice badge + Invoice # */}
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 bg-[#1c2a5e] text-white text-sm font-bold px-5 py-2 rounded-lg tracking-wide">
                                        <span className="text-xl font-light leading-none">+</span> Tax Invoice
                                    </div>
                                    <div className="text-xs text-slate-500 text-right">
                                        <span className="font-semibold text-slate-700">Invoice #: </span>
                                        {viewInvoice.invoiceNumber || viewInvoice.invoiceId}
                                    </div>
                                </div>
                            </div>

                            {/* Meta Numbers Bar */}
                            <div className="grid grid-cols-5 border border-slate-200 rounded-xl overflow-hidden text-xs">
                                {[
                                    { label: 'INVOICE #', value: viewInvoice.invoiceNumber || viewInvoice.invoiceId, cls: '' },
                                    { label: 'DATE', value: new Date(viewInvoice.createdAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(), cls: '' },
                                    { label: 'DUE DATE', value: viewInvoice.dueDate ? new Date(viewInvoice.dueDate).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'NET 14', cls: 'text-red-600' },
                                    { label: 'TOTAL', value: `${currency}${Number(viewInvoice.totalAmount || 0).toFixed(2)}`, cls: 'text-[#1c2a5e]' },
                                    { label: 'TERMS', value: viewInvoice.terms || 'NET 14', cls: '' },
                                ].map((cell, i, arr) => (
                                    <div key={i} className={`px-3 py-2.5 ${i < arr.length - 1 ? 'border-r border-slate-200' : ''} ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                                        <div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">{cell.label}</div>
                                        <div className={`font-bold text-[#1a1a2e] truncate ${cell.cls}`}>{cell.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Items Table */}
                            <div className="rounded-xl overflow-hidden border border-slate-200">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-[#1c2a5e] text-white">
                                            <th className="px-3 py-2.5 text-left font-semibold tracking-wide">Delivery Date</th>
                                            <th className="px-3 py-2.5 text-left font-semibold tracking-wide">Item Name</th>
                                            <th className="px-3 py-2.5 text-right font-semibold tracking-wide">Qty</th>
                                            <th className="px-3 py-2.5 text-right font-semibold tracking-wide">Rate</th>
                                            <th className="px-3 py-2.5 text-right font-semibold tracking-wide">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(viewInvoice.order?.items || []).length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">No items</td>
                                            </tr>
                                        ) : (viewInvoice.order?.items || []).map((item: any, i: number, arr: any[]) => {
                                            const prev = i > 0 ? arr[i - 1] : null;
                                            const delivDate = item.deliveryDate || item.shipDate || '';
                                            const prevDelivDate = prev ? (prev.deliveryDate || prev.shipDate || '') : null;
                                            const showDate = !prevDelivDate || prevDelivDate !== delivDate;
                                            return (
                                                <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} hover:bg-cyan-50/30 transition-colors`}>
                                                    <td className="px-3 py-2 font-semibold text-[#1a1a2e]">{showDate && delivDate ? delivDate : (delivDate ? '•••' : '')}</td>
                                                    <td className="px-3 py-2 text-slate-800">{item.serviceName || item.name}</td>
                                                    <td className="px-3 py-2 text-right text-slate-700">{item.quantity}</td>
                                                    <td className="px-3 py-2 text-right text-slate-700">{currency}{Number(item.pricePerUnit || item.rate || 0).toFixed(2)}</td>
                                                    <td className="px-3 py-2 text-right font-semibold text-[#1a1a2e]">{currency}{Number(item.subtotal || item.total || 0).toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Credited Items */}
                            {viewInvoice.creditedItems?.length > 0 && (
                                <div className="rounded-xl overflow-hidden border border-red-100">
                                    <div className="bg-red-50 border-b border-red-100 px-3 py-2 text-xs font-bold text-red-700 uppercase tracking-wide">
                                        Credited Items
                                    </div>
                                    <table className="w-full text-xs">
                                        <tbody>
                                            {viewInvoice.creditedItems.map((item: any, i: number) => (
                                                <tr key={i} className="border-t border-red-50">
                                                    <td className="px-3 py-2 text-red-600">{item.serviceName || item.name}:</td>
                                                    <td className="px-3 py-2 text-right text-red-600">{item.quantity}</td>
                                                    <td className="px-3 py-2 text-right text-red-600">{currency}{Number(item.pricePerUnit || item.rate || 0).toFixed(2)}</td>
                                                    <td className="px-3 py-2 text-right text-red-600 font-semibold">({currency}{Math.abs(Number(item.subtotal || item.total || 0)).toFixed(2)})</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Amount Due + Summary */}
                            <div className="flex justify-between items-end pt-1">
                                <p className="text-[10px] text-blue-500 italic">* Items marked with * are rental carts.</p>
                                <div className="text-right min-w-[200px]">
                                    <div className="bg-[#1c2a5e] text-white text-sm font-bold px-6 py-2 rounded-lg inline-block mb-3 tracking-widest">
                                        AMOUNT DUE
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between gap-12 text-slate-600">
                                            <span>Sub Total</span>
                                            <span className="font-medium text-slate-800">{currency}{Number(viewInvoice.subtotal || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between gap-12 text-slate-600">
                                            <span>Sales Tax</span>
                                            <span className="font-medium text-slate-800">{currency}{Number(viewInvoice.taxAmount || 0).toFixed(2)}</span>
                                        </div>
                                        {(viewInvoice.discountAmount || 0) > 0 && (
                                            <div className="flex justify-between gap-12 text-emerald-600">
                                                <span>Discount</span>
                                                <span className="font-medium">-{currency}{Number(viewInvoice.discountAmount).toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between gap-12 bg-[#1c2a5e] text-white font-black text-sm px-4 py-2 rounded-lg mt-2">
                                            <span>TOTAL</span>
                                            <span>{currency}{Number(viewInvoice.totalAmount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between gap-12 text-slate-500 text-[11px] px-1">
                                            <span>Paid</span>
                                            <span className="text-emerald-600 font-semibold">{currency}{Number(viewInvoice.paidAmount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between gap-12 text-slate-500 text-[11px] px-1">
                                            <span>Balance Due</span>
                                            <span className={`font-bold ${(viewInvoice.balanceDue || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {currency}{Number(viewInvoice.balanceDue || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment + Disclaimer */}
                            <div className="flex gap-5 pt-4 border-t border-slate-200">
                                <div className="bg-slate-50 rounded-xl p-4 min-w-[220px]">
                                    <div className="flex items-center gap-1.5 font-bold text-[#1a1a2e] text-sm mb-2">
                                        <span>🏦</span> PAYMENT
                                    </div>
                                    <div className="text-xs text-slate-700 font-semibold mb-1">Direct Deposit:</div>
                                    <div className="text-xs text-slate-600 space-y-0.5 leading-relaxed">
                                        <div><span className="text-slate-500">Account Name:</span> {viewInvoice.business?.bankAccountName || 'JSP CORPORATION PTY LTD'}</div>
                                        <div><span className="text-slate-500">Bank:</span> {viewInvoice.business?.bankName || 'ANZ'} &nbsp; <span className="text-slate-500">BSB:</span> {viewInvoice.business?.bankBSB || '012787'}</div>
                                        <div><span className="text-slate-500">Account NO:</span> {viewInvoice.business?.bankAccountNo || '—'}</div>
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-500 leading-relaxed flex-1 pt-1">
                                    <div className="font-bold text-blue-600 text-xs mb-1.5">Disclaimer:</div>
                                    {viewInvoice.business?.name || 'JSP Corporation Pty Ltd T/as Peninsula Laundries'} reserves the right to claim ownership of any linen that has not been returned. We also reserve the right to seek legal advice and pursue recovery of replacement costs for any unreturned or missing items.
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;
