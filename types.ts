
export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: Date;
}

export interface Drug {
  id: string;
  pharmacyId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  dosage: string;
  expiryDate: string;
  supplierId?: string;
}

export interface Supplier {
  id: string;
  pharmacyId: string;
  name: string;
  contact: string;
  email: string;
  address: string;
}

export interface Insurance {
  id: string;
  pharmacyId: string;
  name: string;
  defaultCoverage: number;
}

export interface CartItem extends Drug {
  quantity: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_MONEY';

export interface Sale {
  id: string;
  pharmacyId: string;
  timestamp: Date;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  servedBy: string;
  insuranceId?: string;
  insuranceName?: string;
  insuranceCoverageRate?: number;
  insuranceAmount?: number;
  patientAmount?: number;
  patientName?: string;
  policyNumber?: string;
  amountReceived?: number;
  changeGiven?: number;
}

export interface PendingOrder {
  id: string;
  pharmacyId: string;
  ticketNumber: string;
  timestamp: Date;
  items: CartItem[];
  total: number;
  preparedBy: string;
  insuranceId?: string;
  patientName?: string;
  policyNumber?: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  POS = 'POS',
  USERS = 'USERS',
  SALES_HISTORY = 'SALES_HISTORY',
  SUPPLIERS = 'SUPPLIERS',
  INSURANCES = 'INSURANCES',
  EXPORTS = 'EXPORTS',
  ORDERS = 'ORDERS',
  SUPER_ADMIN_DASHBOARD = 'SUPER_ADMIN_DASHBOARD',
  PHARMACY_MANAGEMENT = 'PHARMACY_MANAGEMENT',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
  SETTINGS = 'SETTINGS',
  AUDIT_LOGS = 'AUDIT_LOGS',
  BACKUP = 'BACKUP'
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'CASHIER' | 'SELLER';

export interface User {
  id: string;
  pharmacyId?: string; // Optionnel pour le Super Admin
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'URGENT';
  timestamp: Date;
  authorId: string;
}
