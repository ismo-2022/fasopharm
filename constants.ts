
import { Drug, User, Supplier, Insurance, Pharmacy } from './types';

export const INITIAL_PHARMACIES: Pharmacy[] = [
  {
    id: 'pharma_1',
    name: 'Pharmacie du Centre',
    address: 'Avenue Kwamé Nkrumah, Ouagadougou',
    phone: '+226 25 30 00 01',
    status: 'ACTIVE',
    createdAt: new Date()
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'super_1',
    username: 'superadmin',
    password: 'root',
    fullName: 'Directeur Général',
    role: 'SUPER_ADMIN'
  },
  {
    id: 'admin_1',
    pharmacyId: 'pharma_1',
    username: 'admin',
    password: '123',
    fullName: 'Dr. Sawadogo',
    role: 'ADMIN'
  },
  {
    id: 'vendeur_1',
    pharmacyId: 'pharma_1',
    username: 'vendeur',
    password: '123',
    fullName: 'Aline',
    role: 'SELLER'
  },
  {
    id: 'caisse_1',
    pharmacyId: 'pharma_1',
    username: 'caisse',
    password: '123',
    fullName: 'Thomas',
    role: 'CASHIER'
  }
];

// Added missing initial data exports
export const INITIAL_DRUGS: Drug[] = [
  {
    id: 'd1',
    pharmacyId: 'pharma_1',
    name: 'Paracétamol 500mg',
    description: 'Antalgique et antipyrétique',
    price: 1500,
    stock: 100,
    category: 'Douleur',
    dosage: 'Boîte de 20 comprimés',
    expiryDate: '2025-12-31'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    pharmacyId: 'pharma_1',
    name: 'CAMEG',
    contact: '+226 25 30 00 00',
    email: 'contact@cameg.bf',
    address: 'Ouagadougou'
  }
];

export const INITIAL_INSURANCES: Insurance[] = [
  {
    id: 'i1',
    pharmacyId: 'pharma_1',
    name: 'SONAR',
    defaultCoverage: 80
  }
];
