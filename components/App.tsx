
import React, { useState, useEffect } from 'react';
import { ViewState, Drug, Sale, User, UserRole, Supplier, Insurance, PendingOrder, Pharmacy } from '../types';
import { INITIAL_DRUGS, INITIAL_USERS, INITIAL_SUPPLIERS, INITIAL_INSURANCES, INITIAL_PHARMACIES } from './constants';
import Dashboard from './Dashboard';
import Inventory from './Inventory';
import POS from './POS';
import AIAssistant from './AIAssistant';
import PrescriptionScanner from './PrescriptionScanner';
import Login from './Login';
import UserManagement from './UserManagement';
import SalesHistory from './SalesHistory';
import Suppliers from './Suppliers';
import Insurances from './Insurances';
import DataExport from './DataExport';
import Orders from './Orders';
import CashClosing from './CashClosing';
import { apiService } from '../services/apiService';

import { 
  LayoutDashboard, Package, ShoppingCart, Bot, ScanLine, Activity, LogOut, Users, Bell, 
  AlertTriangle, Clock, History, Truck, ShieldCheck, Database, ShoppingBag, Wallet,
  ChevronDown, ChevronRight, Layers, FileText, BrainCircuit, Loader2
} from 'lucide-react';

const App: React.FC = () => {
  // Global State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(INITIAL_PHARMACIES);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // App Data
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCashClosing, setShowCashClosing] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  // Fetch data from Laravel
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [drugsData, salesData, suppliersData, insurancesData] = await Promise.all([
        apiService.getDrugs().catch(() => INITIAL_DRUGS), // Fallback to mock for dev
        apiService.getSales().catch(() => []),
        apiService.getSuppliers().catch(() => INITIAL_SUPPLIERS),
        apiService.getInsurances().catch(() => INITIAL_INSURANCES)
      ]);
      setDrugs(drugsData);
      setSales(salesData);
      setSuppliers(suppliersData);
      setInsurances(insurancesData);
    } catch (error) {
      console.error("Failed to load data from Laravel", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Derived state for notifications
  const lowStockItems = drugs.filter(d => d.stock < 20 && !dismissedNotifications.includes(`stock-${d.id}`));
  const expiringItems = drugs.filter(d => {
    if (!d.expiryDate) return false;
    if (dismissedNotifications.includes(`expiry-${d.id}`)) return false;
    const today = new Date();
    const exp = new Date(d.expiryDate);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90;
  });

  const totalNotifications = lowStockItems.length + expiringItems.length;

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'CASHIER') setCurrentView(ViewState.POS);
      else if (currentUser.role === 'AGENT') setCurrentView(ViewState.INVENTORY);
      else if (currentUser.role === 'SELLER') setCurrentView(ViewState.POS);
      else setCurrentView(ViewState.DASHBOARD);
    }
  }, [currentUser]);

  const handleSaleComplete = async (sale: Sale) => {
    try {
      const savedSale = await apiService.createSale(sale);
      setSales(prev => [...prev, savedSale]);
      // Refresh drugs to get updated stocks from Laravel
      const updatedDrugs = await apiService.getDrugs();
      setDrugs(updatedDrugs);
    } catch (error) {
      alert("Erreur lors de l'enregistrement de la vente.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowNotifications(false);
    setDismissedNotifications([]);
  };

  if (!currentUser) {
    return <Login users={users} pharmacies={pharmacies} onLogin={setCurrentUser} />;
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-pharmacy-600">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-medium">Synchronisation avec Laravel...</p>
        </div>
      );
    }

    switch (currentView) {
      case ViewState.DASHBOARD:
        return currentUser.role === 'ADMIN' ? <Dashboard drugs={drugs} sales={sales} /> : null;
      case ViewState.INVENTORY:
        return ['ADMIN', 'AGENT', 'SELLER'].includes(currentUser.role) ? <Inventory drugs={drugs} setDrugs={setDrugs} currentUser={currentUser} /> : null;
      case ViewState.POS:
        return ['ADMIN', 'CASHIER', 'SELLER'].includes(currentUser.role) ? 
          <POS 
            drugs={drugs} 
            setDrugs={setDrugs} 
            insurances={insurances} 
            onSaleComplete={handleSaleComplete} 
            currentUser={currentUser}
            pendingOrders={pendingOrders}
            setPendingOrders={setPendingOrders}
            pharmacies={pharmacies} // Added pharmacies prop to fix missing property error
          /> : null;
      case ViewState.SALES_HISTORY:
        return ['ADMIN', 'AGENT'].includes(currentUser.role) ? <SalesHistory sales={sales} /> : null;
      case ViewState.SUPPLIERS:
        return ['ADMIN', 'AGENT'].includes(currentUser.role) ? <Suppliers suppliers={suppliers} setSuppliers={setSuppliers} /> : null;
      case ViewState.INSURANCES:
        return ['ADMIN', 'AGENT'].includes(currentUser.role) ? <Insurances insurances={insurances} setInsurances={setInsurances} /> : null;
      case ViewState.ASSISTANT:
        return ['ADMIN', 'AGENT', 'SELLER'].includes(currentUser.role) ? 
          <AIAssistant 
            drugs={drugs} 
            sales={sales} 
            suppliers={suppliers} 
            insurances={insurances} 
          /> : null;
      case ViewState.SCANNER:
        return ['ADMIN', 'AGENT', 'SELLER'].includes(currentUser.role) ? <PrescriptionScanner /> : null;
      case ViewState.USERS:
        return currentUser.role === 'ADMIN' ? <UserManagement users={users} setUsers={setUsers} currentUser={currentUser} pharmacies={pharmacies} /> : null; // Added currentUser and pharmacies props to fix missing property errors
      case ViewState.EXPORTS:
        return currentUser.role === 'ADMIN' ? <DataExport drugs={drugs} sales={sales} users={users} suppliers={suppliers} insurances={insurances} pharmacies={pharmacies} /> : null; // Added pharmacies prop to fix missing property error
      case ViewState.ORDERS:
        return ['ADMIN', 'AGENT'].includes(currentUser.role) ? <Orders drugs={drugs} suppliers={suppliers} /> : null;
      default:
        return <div>Accès non autorisé</div>;
    }
  };

  const NavItem = ({ view, icon: Icon, label, allowedRoles, isSubItem = false }: { view: ViewState, icon: any, label: string, allowedRoles: UserRole[], isSubItem?: boolean }) => {
    if (!allowedRoles.includes(currentUser.role)) return null;
    return (
      <button
        onClick={() => setCurrentView(view)}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${
          currentView === view 
          ? 'bg-pharmacy-600 text-white shadow-md shadow-pharmacy-200' 
          : 'text-gray-600 hover:bg-pharmacy-50 hover:text-pharmacy-700'
        } ${isSubItem ? 'pl-11 text-sm' : ''}`}
      >
        <Icon size={isSubItem ? 18 : 20} className={currentView === view ? 'text-white' : isSubItem ? 'text-gray-400' : 'text-gray-500'} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  const NavGroup = ({ label, icon: Icon, children, allowedRoles }: { label: string, icon: any, children?: React.ReactNode, allowedRoles: UserRole[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!allowedRoles.includes(currentUser.role)) return null;
    return (
      <div className="mb-2">
        <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-200 hover:bg-gray-50 ${isOpen ? 'text-pharmacy-800 bg-gray-50' : 'text-gray-700'}`}>
          <div className="flex items-center space-x-3">
             <Icon size={20} className="text-gray-500" />
             <span className="font-bold text-sm uppercase tracking-wide">{label}</span>
          </div>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
           {children}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {showCashClosing && <CashClosing sales={sales} currentUser={currentUser} onClose={() => setShowCashClosing(false)} pharmacies={pharmacies} />} {/* Added pharmacies prop to fix missing property error */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="p-6 flex items-center space-x-3 border-b border-gray-100">
          <div className="bg-pharmacy-600 p-2 rounded-lg text-white"><Activity size={24} /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Fasopharm</h1>
            <p className="text-xs text-gray-400 font-medium">{currentUser.role}</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label="Tableau de Bord" allowedRoles={['ADMIN']} />
          <NavItem view={ViewState.POS} icon={ShoppingCart} label={currentUser.role === 'SELLER' ? "Préparation" : "Caisse"} allowedRoles={['ADMIN', 'CASHIER', 'SELLER']} />
          <NavGroup label="Logistique" icon={Truck} allowedRoles={['ADMIN', 'AGENT', 'SELLER']}>
             <NavItem view={ViewState.INVENTORY} icon={Package} label="Stocks" allowedRoles={['ADMIN', 'AGENT', 'SELLER']} isSubItem />
             <NavItem view={ViewState.ORDERS} icon={ShoppingBag} label="Réappro" allowedRoles={['ADMIN', 'AGENT']} isSubItem />
             <NavItem view={ViewState.SUPPLIERS} icon={Layers} label="Fournisseurs" allowedRoles={['ADMIN', 'AGENT']} isSubItem />
          </NavGroup>
          <NavGroup label="Gestion" icon={FileText} allowedRoles={['ADMIN', 'AGENT']}>
             <NavItem view={ViewState.SALES_HISTORY} icon={History} label="Historique" allowedRoles={['ADMIN', 'AGENT']} isSubItem />
             <NavItem view={ViewState.INSURANCES} icon={ShieldCheck} label="Assurances" allowedRoles={['ADMIN', 'AGENT']} isSubItem />
             <NavItem view={ViewState.EXPORTS} icon={Database} label="Exports" allowedRoles={['ADMIN']} isSubItem />
             <NavItem view={ViewState.USERS} icon={Users} label="Utilisateurs" allowedRoles={['ADMIN']} isSubItem />
          </NavGroup>
          <NavGroup label="IA" icon={BrainCircuit} allowedRoles={['ADMIN', 'AGENT', 'SELLER']}>
             <NavItem view={ViewState.ASSISTANT} icon={Bot} label="Assistant" allowedRoles={['ADMIN', 'AGENT', 'SELLER']} isSubItem />
             <NavItem view={ViewState.SCANNER} icon={ScanLine} label="Scan" allowedRoles={['ADMIN', 'AGENT', 'SELLER']} isSubItem />
          </NavGroup>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut size={18} /><span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800">{currentView}</h2>
          <div className="flex items-center space-x-4">
             {['ADMIN', 'CASHIER'].includes(currentUser.role) && (
               <button onClick={() => setShowCashClosing(true)} className="flex items-center gap-2 px-3 py-1.5 bg-pharmacy-100 text-pharmacy-700 rounded-lg text-sm font-bold hover:bg-pharmacy-200 transition">
                   <Wallet size={16} /><span>Caisse</span>
               </button>
             )}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
                <Bell size={20} />
                {totalNotifications > 0 && <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">{totalNotifications}</span>}
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden relative">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
