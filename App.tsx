
import React, { useState, useEffect } from 'react';
import { ViewState, Drug, Sale, User, UserRole, Supplier, Insurance, PendingOrder, Pharmacy } from './types';
import { INITIAL_DRUGS, INITIAL_USERS, INITIAL_SUPPLIERS, INITIAL_INSURANCES, INITIAL_PHARMACIES } from './constants';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import AIAssistant from './components/AIAssistant';
import PrescriptionScanner from './components/PrescriptionScanner';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import SalesHistory from './components/SalesHistory';
import Suppliers from './components/Suppliers';
import Insurances from './components/Insurances';
import DataExport from './components/DataExport';
import Orders from './components/Orders';
import CashClosing from './components/CashClosing';
import SuperAdminDashboard from './components/SuperAdminDashboard';

import { 
  LayoutDashboard, Package, ShoppingCart, Bot, ScanLine, Activity, LogOut, Users, Bell, 
  History, Truck, ShieldCheck, Database, ShoppingBag, Wallet,
  ChevronDown, ChevronRight, Layers, FileText, BrainCircuit, Building2, Globe
} from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(INITIAL_PHARMACIES);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  const [drugs, setDrugs] = useState<Drug[]>(INITIAL_DRUGS);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [insurances, setInsurances] = useState<Insurance[]>(INITIAL_INSURANCES);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  
  const [showCashClosing, setShowCashClosing] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'SUPER_ADMIN' && currentUser.pharmacyId) {
      const myPharma = pharmacies.find(p => p.id === currentUser.pharmacyId);
      if (myPharma && myPharma.status === 'SUSPENDED') {
        alert("Votre établissement a été suspendu par l'administration centrale.");
        setCurrentUser(null);
      }
    }
  }, [pharmacies, currentUser]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'SUPER_ADMIN') setCurrentView(ViewState.SUPER_ADMIN_DASHBOARD);
      else if (currentUser.role === 'CASHIER') setCurrentView(ViewState.POS);
      else if (currentUser.role === 'AGENT') setCurrentView(ViewState.INVENTORY);
      else if (currentUser.role === 'SELLER') setCurrentView(ViewState.POS);
      else setCurrentView(ViewState.DASHBOARD);
    }
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login users={users} pharmacies={pharmacies} onLogin={setCurrentUser} />;
  }

  const currentPharmacyId = currentUser.pharmacyId;
  const filteredDrugs = currentUser.role === 'SUPER_ADMIN' ? drugs : drugs.filter(d => d.pharmacyId === currentPharmacyId);
  const filteredSales = currentUser.role === 'SUPER_ADMIN' ? sales : sales.filter(s => s.pharmacyId === currentPharmacyId);
  const filteredSuppliers = currentUser.role === 'SUPER_ADMIN' ? suppliers : suppliers.filter(s => s.pharmacyId === currentPharmacyId);
  const filteredInsurances = currentUser.role === 'SUPER_ADMIN' ? insurances : insurances.filter(i => i.pharmacyId === currentPharmacyId);

  const renderContent = () => {
    switch (currentView) {
      case ViewState.SUPER_ADMIN_DASHBOARD:
        return (
          <SuperAdminDashboard 
            pharmacies={pharmacies} 
            setPharmacies={setPharmacies} 
            users={users} 
            setUsers={setUsers}
            allDrugs={drugs}
            allSales={sales}
          />
        );
      case ViewState.DASHBOARD:
        return <Dashboard drugs={filteredDrugs} sales={filteredSales} />;
      case ViewState.INVENTORY:
        return <Inventory drugs={filteredDrugs} setDrugs={setDrugs} currentUser={currentUser} />;
      case ViewState.POS:
        return (
          <POS 
            drugs={filteredDrugs} setDrugs={setDrugs} insurances={filteredInsurances} 
            onSaleComplete={(s) => setSales([...sales, {...s, pharmacyId: currentPharmacyId || ''}])} 
            currentUser={currentUser} pendingOrders={pendingOrders} setPendingOrders={setPendingOrders}
            pharmacies={pharmacies}
          />
        );
      case ViewState.ASSISTANT:
        return <AIAssistant drugs={filteredDrugs} sales={filteredSales} suppliers={filteredSuppliers} insurances={filteredInsurances} />;
      case ViewState.SCANNER:
        return <PrescriptionScanner />;
      case ViewState.USERS:
        return <UserManagement users={users} setUsers={setUsers} currentUser={currentUser} pharmacies={pharmacies} />;
      case ViewState.SALES_HISTORY:
        return <SalesHistory sales={filteredSales} />;
      case ViewState.SUPPLIERS:
        return <Suppliers suppliers={filteredSuppliers} setSuppliers={setSuppliers} />;
      case ViewState.INSURANCES:
        return <Insurances insurances={filteredInsurances} setInsurances={setInsurances} />;
      case ViewState.EXPORTS:
        return <DataExport drugs={filteredDrugs} sales={filteredSales} users={users} suppliers={filteredSuppliers} insurances={filteredInsurances} pharmacies={pharmacies} />;
      case ViewState.ORDERS:
        return <Orders drugs={filteredDrugs} suppliers={filteredSuppliers} />;
      default:
        return null;
    }
  };

  const NavItem = ({ view, icon: Icon, label, allowedRoles }: { view: ViewState, icon: any, label: string, allowedRoles: UserRole[] }) => {
    if (!allowedRoles.includes(currentUser.role)) return null;
    const isActive = currentView === view;
    return (
      <button
        onClick={() => setCurrentView(view)}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${
          isActive 
          ? 'bg-pharmacy-600 text-white shadow-md' 
          : 'text-gray-600 hover:bg-pharmacy-50 hover:text-pharmacy-700'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500'} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden text-sm md:text-base">
      {showCashClosing && <CashClosing sales={filteredSales} currentUser={currentUser} onClose={() => setShowCashClosing(false)} pharmacies={pharmacies} />}
      
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="p-6 flex items-center space-x-3 border-b border-gray-100">
          <div className="bg-pharmacy-600 p-2 rounded-lg text-white shadow-md"><Activity size={24} /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Fasopharm</h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{currentUser.role}</p>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {currentUser.role === 'SUPER_ADMIN' ? (
            <>
              <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Master Control</div>
              <NavItem view={ViewState.SUPER_ADMIN_DASHBOARD} icon={Globe} label="Réseau Global" allowedRoles={['SUPER_ADMIN']} />
              <NavItem view={ViewState.USERS} icon={Users} label="Tous les Staffs" allowedRoles={['SUPER_ADMIN']} />
              <NavItem view={ViewState.EXPORTS} icon={Database} label="Archives Cloud" allowedRoles={['SUPER_ADMIN']} />
            </>
          ) : (
            <>
              <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {pharmacies.find(p => p.id === currentPharmacyId)?.name || 'Espace Pharmacie'}
              </div>
              <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label="Tableau de Bord" allowedRoles={['ADMIN']} />
              <NavItem view={ViewState.POS} icon={ShoppingCart} label={currentUser.role === 'SELLER' ? "Préparation" : "Caisse"} allowedRoles={['ADMIN', 'CASHIER', 'SELLER']} />
              
              <div className="px-4 py-2 mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Logistique</div>
              <NavItem view={ViewState.INVENTORY} icon={Package} label="Stocks" allowedRoles={['ADMIN', 'AGENT']} />
              <NavItem view={ViewState.ORDERS} icon={ShoppingBag} label="Réappro" allowedRoles={['ADMIN', 'AGENT']} />
              
              <div className="px-4 py-2 mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Intelligence</div>
              <NavItem view={ViewState.ASSISTANT} icon={BrainCircuit} label="Assistant IA" allowedRoles={['ADMIN', 'AGENT', 'SELLER', 'CASHIER']} />
              <NavItem view={ViewState.SCANNER} icon={ScanLine} label="Scan Ordonnance" allowedRoles={['ADMIN', 'AGENT', 'SELLER']} />
              
              {currentUser.role === 'ADMIN' && (
                <>
                  <div className="px-4 py-2 mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gestion Locale</div>
                  <NavItem view={ViewState.SALES_HISTORY} icon={History} label="Historique Ventes" allowedRoles={['ADMIN']} />
                  <NavItem view={ViewState.USERS} icon={Users} label="Mon Personnel" allowedRoles={['ADMIN']} />
                </>
              )}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="mb-4 px-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Utilisateur</p>
            <p className="font-bold text-gray-700 truncate">{currentUser.fullName}</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-bold">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-20">
          <h2 className="text-xl font-bold text-gray-800">{currentView}</h2>
          <div className="flex items-center gap-4">
            {['ADMIN', 'CASHIER'].includes(currentUser.role) && (
               <button onClick={() => setShowCashClosing(true)} className="flex items-center gap-2 px-4 py-2 bg-pharmacy-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-pharmacy-600/20 hover:bg-pharmacy-700 transition transform active:scale-95">
                   <Wallet size={16} /><span>Fin de Journée</span>
               </button>
            )}
            {currentUser.role !== 'SUPER_ADMIN' && (
              <div className="flex items-center gap-2 text-pharmacy-600 bg-pharmacy-50 px-3 py-1.5 rounded-full border border-pharmacy-100">
                <Building2 size={16} />
                <span className="text-xs font-black uppercase tracking-tight">{pharmacies.find(p => p.id === currentPharmacyId)?.name}</span>
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-gray-50 relative">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
