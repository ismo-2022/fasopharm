
import React, { useState } from 'react';
import { User, UserRole, Pharmacy } from '../types';
import { UserPlus, Trash2, User as UserIcon, Edit2, X, ShieldCheck, Building2, Search, CheckCircle } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  pharmacies?: Pharmacy[]; // Optionnel, requis pour le Super Admin
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, currentUser, pharmacies = [] }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'SELLER' as UserRole,
    pharmacyId: currentUser.pharmacyId || ''
  });

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Filtrage des utilisateurs affichés
  const displayUsers = users.filter(u => {
    const belongsToMe = isSuperAdmin ? true : u.pharmacyId === currentUser.pharmacyId;
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.username.toLowerCase().includes(searchTerm.toLowerCase());
    return belongsToMe && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      setUsers(users.map(u => u.id === editingId ? { ...u, ...formData } : u));
      alert(`Compte de ${formData.fullName} mis à jour.`);
      resetForm();
    } else {
      const newUser: User = {
        id: `user_${Date.now()}`,
        pharmacyId: isSuperAdmin ? formData.pharmacyId : currentUser.pharmacyId,
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role
      };
      setUsers(prev => [...prev, newUser]);
      alert(`Nouveau compte créé pour ${newUser.fullName}.`);
      resetForm();
    }
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      pharmacyId: user.pharmacyId || ''
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      username: '', 
      password: '', 
      fullName: '', 
      role: 'SELLER',
      pharmacyId: currentUser.pharmacyId || (pharmacies.length > 0 ? pharmacies[0].id : '')
    });
  };

  const getPharmacyName = (id?: string) => {
    if (!id) return "Système (Global)";
    return pharmacies.find(p => p.id === id)?.name || id;
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase">Admin</span>;
      case 'AGENT': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">Stock</span>;
      case 'SELLER': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-black uppercase">Vendeur</span>;
      case 'CASHIER': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Caisse</span>;
      case 'SUPER_ADMIN': return <span className="px-2 py-1 bg-black text-white rounded-full text-[10px] font-black uppercase">Super Admin</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6 bg-gray-50 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Gestion du Personnel</h2>
          <p className="text-sm text-gray-500">
            {isSuperAdmin ? "Contrôle global des accès du réseau" : "Gérez l'équipe de votre officine"}
          </p>
        </div>
        {!isSuperAdmin && currentUser.pharmacyId && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <Building2 size={16} className="text-pharmacy-600" />
                <span className="text-xs font-bold text-gray-600">Pharma: {getPharmacyName(currentUser.pharmacyId)}</span>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Panel */}
        <div className="lg:col-span-1">
          <div className={`p-6 rounded-2xl shadow-sm border transition-all duration-300 ${editingId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-lg font-black mb-6 flex items-center gap-2 ${editingId ? 'text-indigo-800' : 'text-gray-800'}`}>
              {editingId ? <Edit2 size={20} /> : <UserPlus size={20} className="text-pharmacy-600" />}
              {editingId ? 'Modifier Profil' : 'Recruter un Agent'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSuperAdmin && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Assigner à la Pharmacie</label>
                  <select 
                    required
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition"
                    value={formData.pharmacyId} 
                    onChange={e => setFormData({ ...formData, pharmacyId: e.target.value })}
                  >
                    <option value="">-- Sélectionner l'établissement --</option>
                    {pharmacies.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nom Complet</label>
                <input required type="text" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none bg-white transition"
                  placeholder="ex: Jean Dupont"
                  value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Identifiant</label>
                  <input required type="text" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none bg-white transition"
                    placeholder="j.dupont"
                    value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mot de passe</label>
                  <input required type="text" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none bg-white transition"
                    placeholder="••••••••"
                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rôle Système</label>
                <select className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none bg-white transition appearance-none"
                  value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}>
                  <option value="SELLER">Vendeur / Préparateur</option>
                  <option value="CASHIER">Caissier principal</option>
                  <option value="AGENT">Gestionnaire de Stock</option>
                  <option value="ADMIN">Administrateur de Pharmacie</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Administrateur</option>}
                </select>
              </div>

              <div className="pt-4 flex gap-2">
                <button type="submit" className={`flex-1 py-4 rounded-xl text-white font-black shadow-lg transition transform active:scale-95 ${editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-pharmacy-600 hover:bg-pharmacy-700'}`}>
                  {editingId ? 'Valider Modifs' : 'Créer le Compte'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="px-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 transition">
                    <X size={20} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
               <h3 className="font-black text-gray-800 uppercase tracking-tight text-sm">Répertoire des Staffs ({displayUsers.length})</h3>
               <div className="relative w-full md:w-64">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input 
                  type="text" 
                  placeholder="Chercher un nom..." 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-pharmacy-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                 />
               </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-gray-50">
                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilisateur</th>
                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rôle</th>
                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pharmacie</th>
                     <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {displayUsers.map(user => (
                     <tr key={user.id} className={`${editingId === user.id ? 'bg-indigo-50' : 'hover:bg-gray-50'} transition`}>
                       <td className="px-6 py-4">
                         <div className="flex items-center">
                           <div className={`h-10 w-10 rounded-xl flex items-center justify-center mr-3 shadow-inner ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                             <UserIcon size={20} />
                           </div>
                           <div>
                             <p className="text-sm font-bold text-gray-900">{user.fullName}</p>
                             <p className="text-[10px] text-gray-400 font-mono">{user.username}</p>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         {getRoleBadge(user.role)}
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                            <Building2 size={14} className="text-gray-400" />
                            {getPharmacyName(user.pharmacyId)}
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                           <button onClick={() => startEdit(user)} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"><Edit2 size={16} /></button>
                           {user.id !== currentUser.id && (
                             <button 
                               onClick={() => {
                                 if (window.confirm("Supprimer ce compte ?")) setUsers(prev => prev.filter(u => u.id !== user.id));
                               }} 
                               className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                             >
                               <Trash2 size={16} />
                             </button>
                           )}
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
