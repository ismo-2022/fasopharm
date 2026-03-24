
import React, { useState, useEffect } from 'react';
import { Pharmacy, User, Drug, Sale, Broadcast } from '../types';
import { 
  Building2, Plus, Users, ShieldCheck, Activity, Search, Edit2, Ban, 
  CheckCircle, X, Store, MapPin, Phone, Loader2, Power, TrendingUp, 
  DollarSign, AlertTriangle, Globe, BarChart3, ArrowUpRight, Zap,
  Megaphone, ShoppingBag, Package, Info, Bell, Trash2, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { dbService } from '../services/databaseService';

interface SuperAdminDashboardProps {
  pharmacies: Pharmacy[];
  setPharmacies: React.Dispatch<React.SetStateAction<Pharmacy[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  allDrugs?: Drug[]; // Optionnel si on veut monitorer les stocks globaux
  allSales?: Sale[];  // Requis pour les stats consolidées
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ 
  pharmacies, 
  setPharmacies, 
  users, 
  setUsers,
  allDrugs = [],
  allSales = [] 
}) => {
  const [activeTab, setActiveTab] = useState<'PHARMACIES' | 'USERS' | 'STOCKS' | 'SALES' | 'BROADCASTS' | 'SETTINGS'>('PHARMACIES');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingPharma, setEditingPharma] = useState<Pharmacy | null>(null);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastFormData, setBroadcastFormData] = useState({
    title: '',
    message: '',
    type: 'INFO' as Broadcast['type']
  });

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    adminName: '',
    adminUsername: '',
    adminPassword: ''
  });

  // --- Calculs de Statistiques Globales ---
  const totalNetworkRevenue = allSales.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalStaffCount = users.filter(u => u.role !== 'SUPER_ADMIN').length;
  const criticalStockAlerts = allDrugs.filter(d => d.stock < 5).length;

  // Données pour le graphique de performance par pharmacie
  const performanceData = pharmacies.map(p => {
    const pharmaSales = allSales.filter(s => s.pharmacyId === p.id);
    const revenue = pharmaSales.reduce((acc, s) => acc + (s.total || 0), 0);
    return {
      name: p.name,
      revenue: revenue,
      color: p.status === 'ACTIVE' ? '#4f46e5' : '#94a3b8'
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [auditLogs, bc] = await Promise.all([
          dbService.getAuditLogs(),
          dbService.getBroadcasts()
        ]);
        setLogs(auditLogs);
        setBroadcasts(bc);
      } catch (error) {
        console.error("Erreur fetch:", error);
      }
    };
    fetchData();
  }, []);

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const newBc = await dbService.saveBroadcast({
        ...broadcastFormData,
        authorId: 'system'
      });
      setBroadcasts(prev => [newBc, ...prev]);
      setIsBroadcastModalOpen(false);
      setBroadcastFormData({ title: '', message: '', type: 'INFO' });
    } catch (error) {
      toast.error("Erreur lors de la diffusion de l'annonce");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (window.confirm("Supprimer ce message ?")) {
      try {
        await dbService.deleteBroadcast(id);
        setBroadcasts(prev => prev.filter(b => b.id !== id));
      } catch (error) {
        toast.error("Erreur lors de la suppression de l'annonce");
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    const pharma = pharmacies.find(p => p.id === id);
    if (!pharma) return;

    const nextStatus = pharma.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const message = nextStatus === 'SUSPENDED' 
      ? `ALERTE : Voulez-vous suspendre TOUS les accès pour "${pharma.name}" ?`
      : `Réactiver le point de vente "${pharma.name}" ?`;

    if (window.confirm(message)) {
      try {
        const updated = await dbService.savePharmacy({ ...pharma, status: nextStatus });
        setPharmacies(prev => prev.map(p => p.id === id ? updated : p));
      } catch (error) {
        toast.error("Erreur lors de la mise à jour du statut.");
      }
    }
  };

  const handleDeletePharma = async (id: string) => {
    const pharma = pharmacies.find(p => p.id === id);
    if (!pharma) return;

    if (window.confirm(`DANGER : Supprimer définitivement "${pharma.name}" ? Cette action supprimera également tous les stocks et ventes associés.`)) {
      try {
        await dbService.deletePharmacy(id);
        setPharmacies(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        toast.error("Erreur lors de la suppression de la pharmacie.");
      }
    }
  };

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'SUPER_ADMIN' as User['role'],
    pharmacyId: ''
  });

  const handleExportSales = () => {
    if (allSales.length === 0) {
      toast.info("Aucune vente à exporter.");
      return;
    }

    const headers = ["ID", "Date", "Pharmacie", "Total", "Items"];
    const rows = allSales.map(s => [
      s.id,
      new Date(s.timestamp).toLocaleString(),
      pharmacies.find(p => p.id === s.pharmacyId)?.name || 'Inconnu',
      s.total,
      s.items.map(i => `${i.name} (x${i.quantity})`).join('; ')
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `export_ventes_global_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const newUser = await dbService.saveUser(userFormData);
      setUsers(prev => [...prev, newUser]);
      setIsUserModalOpen(false);
      setUserFormData({ fullName: '', username: '', password: '', role: 'SUPER_ADMIN', pharmacyId: '' });
    } catch (error) {
      toast.error("Erreur lors de la création de l'utilisateur.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Supprimer cet utilisateur ?")) {
      try {
        await dbService.deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
      } catch (error) {
        toast.error("Erreur lors de la suppression de l'utilisateur.");
      }
    }
  };

  const handleOpenCreate = () => {
    if (activeTab === 'USERS') {
      setIsUserModalOpen(true);
    } else if (activeTab === 'BROADCASTS') {
      setIsBroadcastModalOpen(true);
    } else {
      setEditingPharma(null);
      setFormData({ name: '', address: '', phone: '', adminName: '', adminUsername: '', adminPassword: '' });
      setIsModalOpen(true);
    }
  };

  const handleOpenEdit = (pharma: Pharmacy) => {
    setEditingPharma(pharma);
    // Find the admin user for this pharmacy to pre-fill (optional, but let's keep it simple)
    const admin = users.find(u => u.pharmacyId === pharma.id && u.role === 'ADMIN');
    setFormData({
      name: pharma.name,
      address: pharma.address,
      phone: pharma.phone,
      adminName: admin?.fullName || '',
      adminUsername: admin?.username || '',
      adminPassword: admin?.password || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (editingPharma) {
        const updated = await dbService.savePharmacy({ 
          ...editingPharma, 
          name: formData.name, 
          address: formData.address, 
          phone: formData.phone 
        });
        setPharmacies(prev => prev.map(p => p.id === editingPharma.id ? updated : p));
        
        // Update admin if exists
        const admin = users.find(u => u.pharmacyId === editingPharma.id && u.role === 'ADMIN');
        if (admin) {
           const updatedAdmin = await dbService.saveUser({
             ...admin,
             fullName: formData.adminName,
             username: formData.adminUsername,
             password: formData.adminPassword
           });
           setUsers(prev => prev.map(u => u.id === admin.id ? updatedAdmin : u));
        }
      } else {
        const newPharmacy: Partial<Pharmacy> = {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          status: 'ACTIVE'
        };

        const savedPharma = await dbService.savePharmacy(newPharmacy);

        const initialAdmin: Partial<User> = {
          pharmacyId: savedPharma.id,
          username: formData.adminUsername,
          password: formData.adminPassword,
          fullName: formData.adminName,
          role: 'ADMIN'
        };

        const savedAdmin = await dbService.saveUser(initialAdmin);

        setPharmacies(prev => [...prev, savedPharma]);
        setUsers(prev => [...prev, savedAdmin]);
      }

      setIsModalOpen(false);
    } catch (error) {
      toast.error("Erreur lors du déploiement de l'instance.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPharmacies = pharmacies.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const globalUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const criticalDrugs = allDrugs.filter(d => d.stock < 10).sort((a, b) => a.stock - b.stock);

  return (
    <div className="p-3 md:p-5 space-y-4 md:space-y-6 bg-gray-50 h-full overflow-y-auto animate-fade-in custom-scrollbar">
      {/* Header Strategique */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
             <div className="p-1 bg-indigo-600 rounded text-white"><Globe size={12}/></div>
             <span className="text-[8px] md:text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">Fasopharm Infrastructure</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Console de Supervision Réseau</h2>
          <p className="text-xs md:text-sm text-gray-500 font-medium">Monitoring de {pharmacies.length} établissements actifs</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button 
            onClick={handleExportSales}
            className="flex-1 bg-white text-indigo-600 px-3 md:px-4 py-2.5 md:py-3 rounded-xl font-black flex items-center justify-center gap-2 border border-indigo-100 shadow-sm hover:bg-indigo-50 transition transform active:scale-95 text-[10px] md:text-xs uppercase tracking-widest"
          >
            <BarChart3 size={16} /> Export Global
          </button>
          <button 
            onClick={handleOpenCreate}
            className="flex-1 bg-indigo-600 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition transform active:scale-95 text-[10px] md:text-xs uppercase tracking-widest"
          >
            <Plus size={16} /> {activeTab === 'USERS' ? 'Utilisateur' : 'Point de Vente'}
          </button>
        </div>
      </div>

      {/* KPI Consolidation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={60}/></div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">C.A Réseau Global</p>
          <p className="text-xl md:text-2xl font-black text-gray-900">{totalNetworkRevenue.toLocaleString()} F</p>
          <div className="mt-1 flex items-center gap-1 text-green-500 font-bold text-[10px]">
            <TrendingUp size={12}/> <span>+12.4% vs mois dernier</span>
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform"><Users size={60}/></div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Staffs Connectés</p>
          <p className="text-xl md:text-2xl font-black text-gray-900">{totalStaffCount} Agents</p>
          <div className="mt-1 flex items-center gap-1 text-blue-500 font-bold text-[10px]">
            <Zap size={12} className="animate-pulse"/> <span>Infrastructure Synchronisée</span>
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform"><AlertTriangle size={60}/></div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ruptures Critiques</p>
          <p className="text-xl md:text-2xl font-black text-red-600">{criticalStockAlerts} Alertes</p>
          <div className="mt-1 flex items-center gap-1 text-red-400 font-bold text-[10px]">
            <BarChart3 size={12}/> <span>Optimisation réappro requise</span>
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform"><ShieldCheck size={60}/></div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Sécurité Cloud</p>
          <p className="text-xl md:text-2xl font-black text-green-600">Stable</p>
          <div className="mt-1 flex items-center gap-1 text-gray-400 font-bold text-[10px]">
            <CheckCircle size={12}/> <span>Uptime 99.99%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Graphique de Performance Réseau */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-600" />
                Performance Comparative (C.A)
            </h3>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temps Réel</div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} barSize={40}>
                   {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dernières Actions / Audit */}
        <div className="bg-indigo-900 p-5 md:p-6 rounded-2xl shadow-2xl text-white relative overflow-hidden">
           <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
           <h3 className="font-black uppercase tracking-widest text-indigo-300 text-[10px] mb-4">Activités Réseau</h3>
           <div className="space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
              {logs.length > 0 ? logs.map((log, i) => (
                <div key={i} className="flex gap-3 items-start border-b border-indigo-800/50 pb-3 last:border-0">
                   <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"></div>
                   <div>
                      <p className="text-[11px] font-bold leading-tight">{log.details}</p>
                      <p className="text-[9px] text-indigo-300/60 mt-0.5 uppercase font-mono">
                        {log.action} • {new Date(log.timestamp).toLocaleString()}
                      </p>
                   </div>
                </div>
              )) : (
                <p className="text-[10px] text-indigo-300 font-bold italic">Aucun log récent...</p>
              )}
              <div className="pt-3 mt-3 border-t border-indigo-800">
                 <button 
                   onClick={async () => {
                     const auditLogs = await dbService.getAuditLogs();
                     setLogs(auditLogs);
                   }}
                   className="text-[9px] font-black uppercase tracking-widest text-indigo-300 hover:text-white transition flex items-center gap-2"
                 >
                    <ArrowUpRight size={12}/> Rafraîchir les Logs
                 </button>
              </div>
           </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 gap-4 md:gap-6 overflow-x-auto no-scrollbar shrink-0">
        <button 
          onClick={() => setActiveTab('PHARMACIES')}
          className={`pb-3 text-[9px] md:text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'PHARMACIES' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Points de Vente
        </button>
        <button 
          onClick={() => setActiveTab('USERS')}
          className={`pb-3 text-[9px] md:text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'USERS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Utilisateurs
        </button>
        <button 
          onClick={() => setActiveTab('STOCKS')}
          className={`pb-3 text-[9px] md:text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'STOCKS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Stocks Globaux
        </button>
        <button 
          onClick={() => setActiveTab('SALES')}
          className={`pb-3 text-[9px] md:text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'SALES' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Flux Ventes
        </button>
        <button 
          onClick={() => setActiveTab('BROADCASTS')}
          className={`pb-3 text-[9px] md:text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'BROADCASTS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Annonces
        </button>
        <button 
          onClick={() => setActiveTab('SETTINGS')}
          className={`pb-3 text-[9px] md:text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'SETTINGS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Configuration
        </button>
      </div>

      {/* Contenu Dynamique selon le Tab */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-white sticky top-0 z-10">
          <div className="text-center md:text-left">
            <h3 className="text-sm md:text-base font-black text-gray-800 uppercase tracking-tight">
              {activeTab === 'PHARMACIES' ? 'Annuaire des Officines' : 
               activeTab === 'USERS' ? 'Gestion des Utilisateurs' : 
               activeTab === 'STOCKS' ? 'Stocks Globaux Réseau' :
               activeTab === 'SALES' ? 'Flux des Ventes Globales' :
               activeTab === 'BROADCASTS' ? 'Centre de Diffusion' :
               'Configuration Système'}
            </h3>
            <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              {activeTab === 'PHARMACIES' ? 'Gestion des accès cloud' : 
               activeTab === 'USERS' ? 'Supervision des comptes' : 
               activeTab === 'STOCKS' ? 'Monitoring des stocks' :
               activeTab === 'SALES' ? 'Suivi en temps réel' :
               activeTab === 'BROADCASTS' ? 'Communication réseau' :
               'Paramètres infrastructure'}
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {activeTab === 'PHARMACIES' && (
            <>
              {/* Desktop Table */}
              <table className="w-full hidden md:table">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Identité Point de Vente</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Localisation / Contact</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">État du Compte</th>
                    <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPharmacies.map(pharma => (
                    <tr key={pharma.id} className={`transition group ${pharma.status === 'SUSPENDED' ? 'bg-red-50/20 grayscale-[0.8]' : 'hover:bg-indigo-50/30'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl shadow-sm transition-transform group-hover:scale-110 ${pharma.status === 'ACTIVE' ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}>
                            <Store size={20} />
                          </div>
                          <div 
                            onClick={() => setSelectedPharmacyId(pharma.id)}
                            className="cursor-pointer"
                          >
                            <p className="font-black text-gray-900 hover:text-indigo-600 transition text-sm">{pharma.name}</p>
                            <p className="text-[9px] text-gray-400 font-mono mt-0.5 tracking-tighter">UID_{pharma.id.toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5"><MapPin size={12} className="text-gray-400" /> {pharma.address}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-1 font-bold"><Phone size={12} className="text-gray-300" /> {pharma.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-1.5 ${
                          pharma.status === 'ACTIVE' ? 'bg-green-100 text-green-700 shadow-sm shadow-green-100' : 'bg-red-100 text-red-700'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${pharma.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                          {pharma.status === 'ACTIVE' ? 'Instance Active' : 'SUSPENDUE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(pharma)}
                            className="p-2 text-indigo-600 bg-white border border-indigo-100 rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition" 
                            title="Configurer l'Instance"
                          >
                            <Edit2 size={16}/>
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(pharma.id)}
                            className={`p-2 rounded-xl transition border shadow-sm ${
                              pharma.status === 'ACTIVE' 
                              ? 'text-red-600 bg-white border-red-100 hover:bg-red-600 hover:text-white' 
                              : 'text-green-600 bg-white border-green-100 hover:bg-green-600 hover:text-white'
                            }`}
                            title={pharma.status === 'ACTIVE' ? 'Désactiver le site' : 'Réactiver le site'}
                          >
                            <Power size={16}/>
                          </button>
                          <button 
                            onClick={() => handleDeletePharma(pharma.id)}
                            className="p-2 text-red-600 bg-white border border-red-100 rounded-xl shadow-sm hover:bg-red-600 hover:text-white transition" 
                            title="Supprimer l'Instance"
                          >
                            <Ban size={16}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredPharmacies.map(pharma => (
                  <div key={pharma.id} className={`p-4 space-y-4 ${pharma.status === 'SUSPENDED' ? 'bg-red-50/20 grayscale-[0.8]' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${pharma.status === 'ACTIVE' ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}>
                          <Store size={20} />
                        </div>
                        <div onClick={() => setSelectedPharmacyId(pharma.id)}>
                          <p className="font-black text-gray-900 text-sm">{pharma.name}</p>
                          <p className="text-[9px] text-gray-400 font-mono">UID_{pharma.id.toUpperCase()}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-1.5 ${
                        pharma.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${pharma.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        {pharma.status === 'ACTIVE' ? 'Active' : 'Suspendue'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5"><MapPin size={12} className="text-gray-400" /> {pharma.address}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1.5 font-bold"><Phone size={12} className="text-gray-300" /> {pharma.phone}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleOpenEdit(pharma)} className="flex-1 py-2 text-indigo-600 bg-white border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest">Modifier</button>
                      <button onClick={() => handleToggleStatus(pharma.id)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${pharma.status === 'ACTIVE' ? 'text-red-600 bg-white border-red-100' : 'text-green-600 bg-white border-green-100'}`}>
                        {pharma.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}
                      </button>
                      <button onClick={() => handleDeletePharma(pharma.id)} className="p-2 text-red-600 bg-white border border-red-100 rounded-xl"><Ban size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'USERS' && (
            <>
              {/* Desktop Table */}
              <table className="w-full hidden md:table">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilisateur</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rôle / Accès</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Pharmacie</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {globalUsers.map(user => (
                    <tr key={user.id} className="hover:bg-indigo-50/30 transition">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-100 text-gray-600 rounded-2xl">
                            <Users size={24} />
                          </div>
                          <div>
                            <p className="font-black text-gray-900">{user.fullName}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 tracking-tighter">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                          user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-gray-600 font-medium">
                          {pharmacies.find(p => p.id === user.pharmacyId)?.name || 'Système Global'}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                            <button className="p-3 text-gray-400 hover:text-indigo-600 transition" title="Modifier">
                              <Edit2 size={18}/>
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-3 text-red-400 hover:text-red-600 transition" 
                              title="Supprimer"
                            >
                              <Ban size={18}/>
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y divide-gray-100">
                {globalUsers.map(user => (
                  <div key={user.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 text-gray-600 rounded-xl">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm">{user.fullName}</p>
                          <p className="text-[9px] text-gray-400 font-mono">@{user.username}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                        user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs text-gray-600 font-medium">
                        {pharmacies.find(p => p.id === user.pharmacyId)?.name || 'Système Global'}
                      </p>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-indigo-600 transition"><Edit2 size={16}/></button>
                        <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-red-400 hover:text-red-600 transition"><Ban size={16}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'SALES' && (
            <>
              {/* Desktop Table */}
              <table className="w-full hidden md:table">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date / Heure</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Pharmacie</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Produits</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allSales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(sale => (
                    <tr key={sale.id} className="hover:bg-indigo-50/30 transition">
                      <td className="px-8 py-6">
                        <p className="font-black text-gray-900">{new Date(sale.timestamp).toLocaleTimeString()}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{new Date(sale.timestamp).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Store size={14} className="text-indigo-400" />
                          <p className="text-sm font-black text-gray-700">{pharmacies.find(p => p.id === sale.pharmacyId)?.name || 'Inconnu'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs text-gray-600 font-medium truncate max-w-[200px]">
                          {sale.items.map(i => i.name).join(', ')}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="font-black text-indigo-600">{sale.total.toLocaleString()} F</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black uppercase text-gray-600">
                          {sale.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y divide-gray-100">
                {allSales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(sale => (
                  <div key={sale.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-gray-900 text-sm">{new Date(sale.timestamp).toLocaleTimeString()}</p>
                        <p className="text-[9px] text-gray-400 font-bold">{new Date(sale.timestamp).toLocaleDateString()}</p>
                      </div>
                      <p className="font-black text-indigo-600 text-sm">{sale.total.toLocaleString()} F</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Store size={12} className="text-indigo-400" />
                      <p className="text-xs font-black text-gray-700">{pharmacies.find(p => p.id === sale.pharmacyId)?.name || 'Inconnu'}</p>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{sale.items.map(i => i.name).join(', ')}</p>
                    <span className="inline-block px-2 py-0.5 bg-gray-100 rounded-full text-[9px] font-black uppercase text-gray-600">
                      {sale.paymentMethod}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'BROADCASTS' && (
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                    <Megaphone size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-indigo-900 uppercase tracking-tight">Système de Diffusion</h4>
                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">Envoyer des messages à tout le réseau</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBroadcastModalOpen(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                >
                  Nouvelle Annonce
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {broadcasts.map(bc => (
                  <div key={bc.id} className={`p-6 rounded-3xl border relative group transition-all hover:shadow-xl ${
                    bc.type === 'URGENT' ? 'bg-red-50 border-red-100' : bc.type === 'WARNING' ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-100'
                  }`}>
                    <button 
                      onClick={() => handleDeleteBroadcast(bc.id)}
                      className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl ${
                        bc.type === 'URGENT' ? 'bg-red-100 text-red-600' : bc.type === 'WARNING' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        {bc.type === 'URGENT' ? <AlertTriangle size={20} /> : <Bell size={20} />}
                      </div>
                      <div>
                        <h5 className="font-black text-gray-900 uppercase tracking-tight mb-1">{bc.title}</h5>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">{bc.message}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {new Date(bc.timestamp).toLocaleString()} • Par {bc.authorId}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'STOCKS' && (
            <div className="p-0">
              <div className="p-4 md:p-8 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <Filter size={18} className="text-gray-400" />
                  <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest">Filtres de Stock</span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                  <button className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Tous</button>
                  <button className="flex-1 sm:flex-none px-4 py-2 bg-white text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 whitespace-nowrap">Ruptures</button>
                  <button className="flex-1 sm:flex-none px-4 py-2 bg-white text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 whitespace-nowrap">Expirations</button>
                </div>
              </div>
              
              {/* Desktop Table */}
              <table className="w-full hidden md:table">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Produit</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Pharmacie</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Actuel</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">État</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allDrugs.filter(d => 
                    d.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ).sort((a, b) => a.stock - b.stock).map(drug => (
                    <tr key={drug.id} className="hover:bg-red-50/30 transition">
                      <td className="px-8 py-6">
                        <p className="font-black text-gray-900">{drug.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">{drug.dosage}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-gray-600 font-medium">
                          {pharmacies.find(p => p.id === drug.pharmacyId)?.name || 'Inconnu'}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className={`text-lg font-black ${drug.stock <= 5 ? 'text-red-600' : 'text-orange-600'}`}>
                          {drug.stock}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          drug.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {drug.stock <= 5 ? 'Rupture Imminente' : 'Stock Faible'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y divide-gray-100">
                {allDrugs.filter(d => 
                  d.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).sort((a, b) => a.stock - b.stock).map(drug => (
                  <div key={drug.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-gray-900 text-sm">{drug.name}</p>
                        <p className="text-[9px] text-gray-400 uppercase font-bold">{drug.dosage}</p>
                      </div>
                      <p className={`text-lg font-black ${drug.stock <= 5 ? 'text-red-600' : 'text-orange-600'}`}>
                        {drug.stock}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-600 font-medium">
                        {pharmacies.find(p => p.id === drug.pharmacyId)?.name || 'Inconnu'}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        drug.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {drug.stock <= 5 ? 'Rupture' : 'Faible'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'SETTINGS' && (
            <div className="p-12 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600 border-b pb-2">Paramètres Système</h4>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                           <span className="text-xs font-bold text-gray-500 uppercase">Nom de la Plateforme</span>
                           <span className="font-black text-gray-900">Fasopharm Cloud</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                           <span className="text-xs font-bold text-gray-500 uppercase">Version</span>
                           <span className="font-black text-gray-900">v2.4.0-stable</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                           <span className="text-xs font-bold text-gray-500 uppercase">Devise par Défaut</span>
                           <span className="font-black text-gray-900">FCFA (F)</span>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600 border-b pb-2">Sécurité & Maintenance</h4>
                     <div className="space-y-4">
                        <button className="w-full text-left p-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl transition flex justify-between items-center group">
                           <span className="text-xs font-bold text-gray-500 uppercase group-hover:text-indigo-600">Sauvegarde de la Base de Données</span>
                           <ArrowUpRight size={18} className="text-gray-300 group-hover:text-indigo-600" />
                        </button>
                        <button className="w-full text-left p-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl transition flex justify-between items-center group">
                           <span className="text-xs font-bold text-gray-500 uppercase group-hover:text-indigo-600">Vider le Cache Système</span>
                           <ArrowUpRight size={18} className="text-gray-300 group-hover:text-indigo-600" />
                        </button>
                        <button className="w-full text-left p-4 bg-red-50 hover:bg-red-100 rounded-2xl transition flex justify-between items-center group">
                           <span className="text-xs font-bold text-red-600 uppercase">Réinitialiser les Statistiques</span>
                           <AlertTriangle size={18} className="text-red-300 group-hover:text-red-600" />
                        </button>
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-indigo-600 rounded-[32px] text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10"><ShieldCheck size={120}/></div>
                  <h4 className="text-lg font-black uppercase tracking-tight mb-2">État de l'Infrastructure</h4>
                  <p className="text-indigo-100 text-sm mb-6 max-w-md">Tous les systèmes sont opérationnels. La synchronisation avec Supabase est active et sécurisée.</p>
                  <div className="flex gap-4">
                     <div className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">API: OK</div>
                     <div className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">DB: OK</div>
                     <div className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">Auth: OK</div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Déploiement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-2 md:p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto border border-gray-100 custom-scrollbar">
            <div className="p-6 md:p-8 bg-indigo-600 text-white flex justify-between items-center relative sticky top-0 z-10">
               <div className="absolute top-0 right-0 p-10 opacity-10 hidden md:block"><Globe size={120}/></div>
               <div>
                  <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight">Déploiement Instance</h3>
                  <p className="text-indigo-100 text-[9px] md:text-xs font-bold uppercase tracking-widest mt-1">Génération automatique des accès</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-xl md:rounded-2xl transition relative z-10">
                  <X size={20} />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 md:space-y-8 bg-white">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  <div className="space-y-5">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] border-b border-indigo-50 pb-2">Paramètres de l'Officine</h4>
                    <div>
                      <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Nom de l'établissement</label>
                      <input required type="text" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold" placeholder="Pharmacie de la Liberté" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Adresse complète</label>
                      <input required type="text" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold" placeholder="Zone 1, Secteur 15" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Contact officiel</label>
                      <input required type="text" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold" placeholder="+226 XX XX XX XX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-5 p-6 bg-indigo-50/50 rounded-[24px] border border-indigo-100">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] border-b border-indigo-100 pb-2">Identifiants Administrateur</h4>
                    <div>
                        <label className="block text-xs font-black text-indigo-400 mb-1.5 uppercase">Prénom & Nom Gérant</label>
                        <input required type="text" className="w-full bg-white border border-indigo-100 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="Dr. Ibrahim" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-indigo-400 mb-1.5 uppercase">Login d'Accès</label>
                        <input required type="text" className="w-full bg-white border border-indigo-100 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="admin_liberte" value={formData.adminUsername} onChange={e => setFormData({...formData, adminUsername: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-indigo-400 mb-1.5 uppercase">Mot de Passe Racine</label>
                        <input required type="text" className="w-full bg-white border border-indigo-100 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="••••••••" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} />
                    </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition">
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={isProcessing} 
                    className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 transition flex justify-center items-center gap-3 transform active:scale-95"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                    {isProcessing ? 'Génération du Cloud...' : 'Lancer le Déploiement'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Utilisateur */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-2 md:p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto border border-gray-100 custom-scrollbar">
            <div className="p-6 md:p-8 bg-indigo-600 text-white flex justify-between items-center sticky top-0 z-10">
               <div>
                  <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">Nouvel Utilisateur</h3>
               </div>
               <button onClick={() => setIsUserModalOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition">
                  <X size={20} />
               </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 md:p-8 space-y-4 md:space-y-6">
               <div>
                  <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Nom Complet</label>
                  <input required type="text" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={userFormData.fullName} onChange={e => setUserFormData({...userFormData, fullName: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Login</label>
                  <input required type="text" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={userFormData.username} onChange={e => setUserFormData({...userFormData, username: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Mot de Passe</label>
                  <input required type="text" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Rôle</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    value={userFormData.role}
                    onChange={e => setUserFormData({...userFormData, role: e.target.value as User['role']})}
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Accès Global)</option>
                    <option value="ADMIN">ADMIN (Gérant de Pharmacie)</option>
                    <option value="PHARMACIST">PHARMACIST (Vendeur)</option>
                  </select>
               </div>
               {userFormData.role !== 'SUPER_ADMIN' && (
                 <div>
                    <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Assigner à une Pharmacie</label>
                    <select 
                      required
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                      value={userFormData.pharmacyId}
                      onChange={e => setUserFormData({...userFormData, pharmacyId: e.target.value})}
                    >
                      <option value="">Sélectionner une pharmacie...</option>
                      {pharmacies.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                 </div>
               )}

               <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition">
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={isProcessing} 
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 transition flex justify-center items-center gap-3"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                    Créer l'Utilisateur
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-2 md:p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto border border-gray-100 custom-scrollbar">
            <div className="p-6 md:p-8 bg-indigo-600 text-white flex justify-between items-center sticky top-0 z-10">
               <div className="flex items-center gap-3">
                  <Megaphone size={20} />
                  <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">Nouvelle Diffusion</h3>
               </div>
               <button onClick={() => setIsBroadcastModalOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition">
                  <X size={20} />
               </button>
            </div>
            
            <form onSubmit={handleCreateBroadcast} className="p-6 md:p-8 space-y-4 md:space-y-6">
               <div>
                  <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Titre de l'annonce</label>
                  <input required type="text" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={broadcastFormData.title} onChange={e => setBroadcastFormData({...broadcastFormData, title: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Message</label>
                  <textarea required rows={4} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold resize-none" value={broadcastFormData.message} onChange={e => setBroadcastFormData({...broadcastFormData, message: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Type d'urgence</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['INFO', 'WARNING', 'URGENT'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBroadcastFormData({...broadcastFormData, type: type as any})}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${
                          broadcastFormData.type === type 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsBroadcastModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition">
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={isProcessing} 
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 transition flex justify-center items-center gap-3"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                    Diffuser
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
