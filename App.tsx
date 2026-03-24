
import React, { useState, useEffect } from 'react';
import { ViewState, Drug, Sale, User, UserRole, Supplier, Insurance, PendingOrder, Pharmacy } from './types';
import { INITIAL_USERS, INITIAL_PHARMACIES } from './constants';
import { dbService } from './services/databaseService';
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
  LayoutDashboard, Package, ShoppingCart, Activity, LogOut, Users, 
  History, Truck, Database, ShoppingBag, Wallet,
  Building2, Globe, Loader2, BrainCircuit, ScanLine, Server, ShieldCheck
} from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCashClosing, setShowCashClosing] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [p, u] = await Promise.all([
          dbService.getPharmacies(),
          dbService.getUsers()
        ]);
        setPharmacies(p);
        setUsers(u);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const loadAppData = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const phId = currentUser.role === 'SUPER_ADMIN' ? undefined : currentUser.pharmacyId;
        const [d, s] = await Promise.all([
          dbService.getDrugs(phId),
          dbService.getSales(phId)
        ]);
        
        if (currentUser.pharmacyId) {
          const [sup, ins] = await Promise.all([
            dbService.getSuppliers(currentUser.pharmacyId),
            dbService.getInsurances(currentUser.pharmacyId)
          ]);
          setSuppliers(sup);
          setInsurances(ins);
        }

        setDrugs(d);
        setSales(s);
      } catch (err) {
        console.error('Failed to load app data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAppData();
  }, [currentUser]);

  const handleSaleComplete = async (sale: Sale) => {
    if (!currentUser) return;
    const completedSale = await dbService.createSale(sale, currentUser.id);
    setSales(prev => [completedSale, ...prev]);
    // Refresh stock
    const updatedDrugs = await dbService.getDrugs(currentUser.role === 'SUPER_ADMIN' ? undefined : currentUser.pharmacyId);
    setDrugs(updatedDrugs);
  };

  if (isLoading && currentUser) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-pharmacy-600">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-black uppercase tracking-widest text-[10px]">Chargement des données Cloud...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login users={users} pharmacies={pharmacies} onLogin={setCurrentUser} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case ViewState.SUPER_ADMIN_DASHBOARD:
        return <SuperAdminDashboard pharmacies={pharmacies} setPharmacies={setPharmacies} users={users} setUsers={setUsers} allDrugs={drugs} allSales={sales} />;
      case ViewState.DASHBOARD:
        return <Dashboard drugs={drugs} sales={sales} />;
      case ViewState.INVENTORY:
        return <Inventory drugs={drugs} setDrugs={setDrugs} currentUser={currentUser} />;
      case ViewState.POS:
        return <POS drugs={drugs} setDrugs={setDrugs} insurances={insurances} onSaleComplete={handleSaleComplete} currentUser={currentUser} pendingOrders={pendingOrders} setPendingOrders={setPendingOrders} pharmacies={pharmacies} />;
      case ViewState.ASSISTANT:
        return <AIAssistant drugs={drugs} sales={sales} suppliers={suppliers} insurances={insurances} onAddToCart={(d) => setCurrentView(ViewState.POS)} />;
      case ViewState.SCANNER:
        return <PrescriptionScanner />;
      case ViewState.USERS:
        return <UserManagement users={users} setUsers={setUsers} currentUser={currentUser} pharmacies={pharmacies} />;
      case ViewState.SALES_HISTORY:
        return <SalesHistory sales={sales} />;
      case ViewState.SUPPLIERS:
        return <Suppliers suppliers={suppliers} setSuppliers={setSuppliers} />;
      case ViewState.INSURANCES:
        return <Insurances insurances={insurances} setInsurances={setInsurances} />;
      case ViewState.EXPORTS:
        return <DataExport drugs={drugs} sales={sales} users={users} suppliers={suppliers} insurances={insurances} pharmacies={pharmacies} />;
      case ViewState.ORDERS:
        return <Orders drugs={drugs} suppliers={suppliers} />;
      default:
        return null;
    }
  };

  const NavItem = ({ view, icon: Icon, label, allowedRoles }: { view: ViewState, icon: any, label: string, allowedRoles: UserRole[] }) => {
    if (!allowedRoles.includes(currentUser.role)) return null;
    const isActive = currentView === view;
    return (
      <button onClick={() => setCurrentView(view)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${isActive ? 'bg-pharmacy-600 text-white shadow-lg' : 'text-gray-500 hover:bg-pharmacy-50 hover:text-pharmacy-700'}`}>
        <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
        <span className="font-bold text-xs uppercase tracking-tight">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {showCashClosing && <CashClosing sales={sales} currentUser={currentUser} onClose={() => setShowCashClosing(false)} pharmacies={pharmacies} />}
      
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 flex items-center space-x-3 border-b border-gray-100 bg-pharmacy-600 text-white">
          <div className="bg-white/20 p-2 rounded-lg"><Activity size={24} /></div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase">Fasopharm</h1>
            <p className="text-[10px] text-pharmacy-100 font-black uppercase tracking-widest">Core Backend v2</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {currentUser.role === 'SUPER_ADMIN' ? (
            <div className="space-y-1">
              <NavItem view={ViewState.SUPER_ADMIN_DASHBOARD} icon={Globe} label="Réseau Global" allowedRoles={['SUPER_ADMIN']} />
              <NavItem view={ViewState.USERS} icon={Users} label="Utilisateurs" allowedRoles={['SUPER_ADMIN']} />
              <NavItem view={ViewState.EXPORTS} icon={Database} label="Logs & Rapports" allowedRoles={['SUPER_ADMIN']} />
            </div>
          ) : (
            <>
              <div className="pb-4 border-b border-gray-100">
                <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilotage</p>
                <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label="Dashboard" allowedRoles={['ADMIN']} />
                <NavItem view={ViewState.POS} icon={ShoppingCart} label="Caisse" allowedRoles={['ADMIN', 'CASHIER', 'SELLER']} />
              </div>
              
              <div className="py-4 border-b border-gray-100">
                <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gestion</p>
                <NavItem view={ViewState.INVENTORY} icon={Package} label="Stocks" allowedRoles={['ADMIN', 'AGENT', 'SELLER']} />
                <NavItem view={ViewState.ORDERS} icon={ShoppingBag} label="Commandes" allowedRoles={['ADMIN', 'AGENT']} />
                <NavItem view={ViewState.SALES_HISTORY} icon={History} label="Historique" allowedRoles={['ADMIN']} />
              </div>

              <div className="py-4">
                <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Intelligence</p>
                <NavItem view={ViewState.ASSISTANT} icon={BrainCircuit} label="IA Expert" allowedRoles={['ADMIN', 'AGENT', 'SELLER', 'CASHIER']} />
                <NavItem view={ViewState.SCANNER} icon={ScanLine} label="Scan Ord." allowedRoles={['ADMIN', 'AGENT', 'SELLER']} />
              </div>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-4 p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
             <div className="w-8 h-8 bg-pharmacy-100 text-pharmacy-600 rounded-lg flex items-center justify-center font-black text-xs">
                {currentUser.fullName.charAt(0)}
             </div>
             <div className="overflow-hidden">
                <p className="text-[10px] font-black text-gray-800 truncate">{currentUser.fullName}</p>
                <p className="text-[9px] font-medium text-gray-400 truncate">{pharmacies.find(p => p.id === currentUser.pharmacyId)?.name || 'Central'}</p>
             </div>
          </div>
          <button onClick={() => setCurrentUser(null)} className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-xl transition text-[10px] font-black uppercase tracking-widest">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
             <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">{currentView.replace('_', ' ')}</h2>
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                <Server size={12} className="text-green-600" />
                <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Database Linked</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
            {['ADMIN', 'CASHIER'].includes(currentUser.role) && (
               <button onClick={() => setShowCashClosing(true)} className="flex items-center gap-2 px-4 py-2 bg-pharmacy-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-pharmacy-700 transition shadow-lg shadow-pharmacy-600/20">
                   <Wallet size={14} /><span>Clôture</span>
               </button>
            )}
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-2 text-gray-400">
               <ShieldCheck size={16} />
               <span className="text-[10px] font-black uppercase tracking-widest">Secured</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-gray-50/50">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
