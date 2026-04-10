// ================================
// CLSPBS TypeScript Interfaces
// ================================

// --- USER ---
export interface IUser {
    _id: string;
    name: string;
    username: string;
    email: string;
    phone?: string;
    role: 'admin' | 'manager' | 'cashier' | 'staff';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// --- CUSTOMER ---
export interface ICustomer {
    _id: string;
    customerId: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    customerType: 'walk-in' | 'corporate';
    outstandingBalance: number;
    createdAt: string;
    updatedAt: string;
}

// --- SERVICE ---
export interface IService {
    _id: string;
    name: string;
    serviceType: 'wash-fold' | 'dry-cleaning' | 'ironing' | 'express' | 'bulk-commercial';
    description?: string;
    pricePerUnit: number;
    unit: 'piece' | 'kg' | 'bundle';
    isExpress: boolean;
    expressSurchargePercent: number;
    isActive: boolean;
}

// --- ORDER ITEM ---
export interface IOrderItem {
    _id?: string;
    service?: string;
    serviceName: string;
    serviceType: string;
    itemName?: string;
    quantity: number;
    unit: 'piece' | 'kg' | 'bundle';
    pricePerUnit: number;
    subtotal: number;
}

// --- ORDER STATUS ---
export type OrderStatus =
    | 'received'
    | 'washing'
    | 'packed'
    | 'delivered'
    | 'cancelled';

export interface IStatusHistory {
    status: OrderStatus;
    timestamp: string;
    updatedBy?: string;
    note?: string;
}

// --- ORDER ---
export interface IOrder {
    _id: string;
    orderId: string;
    customer: ICustomer;
    items: IOrderItem[];
    status: OrderStatus;
    statusHistory: IStatusHistory[];
    specialInstructions?: string;
    deliveryDate?: string;
    subtotal: number;
    taxPercent: number;
    taxAmount: number;
    discountPercent: number;
    discountAmount: number;
    serviceCharge: number;
    totalAmount: number;
    assignedStaff?: IUser;
    createdBy?: IUser;
    createdAt: string;
    updatedAt: string;
}

// --- INVOICE ---
export interface IInvoice {
    _id: string;
    invoiceId: string;
    order: IOrder;
    customer: ICustomer;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    serviceCharge: number;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    isFinalized: boolean;
    createdAt: string;
}

// --- PAYMENT ---
export interface IPayment {
    _id: string;
    invoice: IInvoice;
    paymentMethod: 'cash' | 'card' | 'mobile' | 'bank-transfer' | 'credit-account';
    amount: number;
    transactionRef?: string;
    note?: string;
    processedBy?: IUser;
    createdAt: string;
}

// --- API RESPONSE ---
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    count?: number;
}

// --- DASHBOARD STATS ---
export interface IDashboardStats {
    totalOrders: number;
    todayOrders: number;
    todayRevenue: number;
    pendingOrders: number;
    completedOrders: number;
    totalCustomers: number;
    totalRevenue: number;
}
