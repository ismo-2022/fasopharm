
import React, { useState } from 'react';
import { Pharmacy, User, Drug, Sale } from '../types';
import { 
  Building2, Plus, Users, ShieldCheck, Activity, Search, Edit2, Ban, 
  CheckCircle, X, Store, MapPin, Phone, Loader2, Power, TrendingUp, 
  DollarSign, AlertTriangle, Globe, BarChart3, ArrowUpRight, Zap
} from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingPharma, setEditingPharma] = useState<Pharmacy | null>(null);

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
        alert("Erreur lors de la mise à jour du statut.");
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingPharma(null);
    setFormData({ name: '', address: '', phone: '', adminName: '', adminUsername: '', adminPassword: '' });
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
      alert("Erreur lors du déploiement de l'instance.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPharmacies = pharmacies.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-gray-50 h-full overflow-y-auto animate-fade-in custom-scrollbar">
      {/* Header Strategique */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="p-1 bg-indigo-600 rounded text-white"><Globe size={16}/></div>
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Fasopharm Infrastructure</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Console de Supervision Réseau</h2>
          <p className="text-gray-500 font-medium">Monitoring en temps réel de {pharmacies.length} établissements actifs</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition transform active:scale-95 text-sm uppercase tracking-widest"
        >
          <Plus size={20} /> Nouveau Point de Vente
        </button>
      </div>

      {/* KPI Consolidation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={80}/></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">C.A Réseau Global</p>
          <p className="text-2xl font-black text-gray-900">{totalNetworkRevenue.toLocaleString()} F</p>
          <div className="mt-2 flex items-center gap-1 text-green-500 font-bold text-xs">
            <TrendingUp size={14}/> <span>+12.4% vs mois dernier</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Users size={80}/></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Staffs Connectés</p>
          <p className="text-2xl font-black text-gray-900">{totalStaffCount} Agents</p>
          <div className="mt-2 flex items-center gap-1 text-blue-500 font-bold text-xs">
            <Zap size={14} className="animate-pulse"/> <span>Infrastructure Synchronisée</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><AlertTriangle size={80}/></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ruptures Critiques</p>
          <p className="text-2xl font-black text-red-600">{criticalStockAlerts} Alertes</p>
          <div className="mt-2 flex items-center gap-1 text-red-400 font-bold text-xs">
            <BarChart3 size={14}/> <span>Optimisation réappro requise</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><ShieldCheck size={80}/></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sécurité Cloud</p>
          <p className="text-2xl font-black text-green-600">Stable</p>
          <div className="mt-2 flex items-center gap-1 text-gray-400 font-bold text-xs">
            <CheckCircle size={14}/> <span>Uptime 99.99%</span>
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
        <div className="bg-indigo-900 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden">
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
           <h3 className="font-black uppercase tracking-widest text-indigo-300 text-xs mb-6">Activités de Déploiement</h3>
           <div className="space-y-6">
              {pharmacies.slice(0, 5).map((p, i) => (
                <div key={i} className="flex gap-4 items-start">
                   <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"></div>
                   <div>
                      <p className="text-xs font-bold leading-tight">Instance "{p.name}" opérationnelle</p>
                      <p className="text-[10px] text-indigo-300/60 mt-1 uppercase font-mono">ID: {p.id} • {new Date(p.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-indigo-800">
                 <button className="text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:text-white transition flex items-center gap-2">
                    <ArrowUpRight size={14}/> Voir les Logs Complets
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Liste des Établissements */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white sticky top-0 z-10">
          <div>
            <h3 className="font-black text-gray-800 uppercase tracking-tight">Annuaire des Officines</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Gestion des accès cloud</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher une instance..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Identité Point de Vente</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Localisation / Contact</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">État du Compte</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPharmacies.map(pharma => (
                <tr key={pharma.id} className={`transition group ${pharma.status === 'SUSPENDED' ? 'bg-red-50/20 grayscale-[0.8]' : 'hover:bg-indigo-50/30'}`}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl shadow-sm transition-transform group-hover:scale-110 ${pharma.status === 'ACTIVE' ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}>
                        <Store size={24} />
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{pharma.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 tracking-tighter">UID_{pharma.id.toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-gray-600 font-medium flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" /> {pharma.address}</p>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-1.5 font-bold"><Phone size={13} className="text-gray-300" /> {pharma.phone}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-2 ${
                      pharma.status === 'ACTIVE' ? 'bg-green-100 text-green-700 shadow-sm shadow-green-100' : 'bg-red-100 text-red-700'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${pharma.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      {pharma.status === 'ACTIVE' ? 'Instance Active' : 'SUSPENDUE'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                        className="p-3 text-indigo-600 bg-white border border-indigo-100 rounded-2xl shadow-sm hover:bg-indigo-600 hover:text-white transition" 
                        title="Configurer l'Instance"
                      >
                        <Edit2 size={18}/>
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(pharma.id)}
                        className={`p-3 rounded-2xl transition border shadow-sm ${
                          pharma.status === 'ACTIVE' 
                          ? 'text-red-600 bg-white border-red-100 hover:bg-red-600 hover:text-white' 
                          : 'text-green-600 bg-white border-green-100 hover:bg-green-600 hover:text-white'
                        }`}
                        title={pharma.status === 'ACTIVE' ? 'Désactiver le site' : 'Réactiver le site'}
                      >
                        <Power size={18}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Déploiement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center relative">
               <div className="absolute top-0 right-0 p-10 opacity-10"><Globe size={120}/></div>
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Déploiement Nouvelle Instance</h3>
                  <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">Génération automatique des accès cloud</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition relative z-10">
                  <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
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
    </div>
  );
};

export default SuperAdminDashboard;
