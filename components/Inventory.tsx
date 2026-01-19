
import React, { useState } from 'react';
import { Drug, User } from '../types';
// Fixed: Added 'X' and 'CheckCircle' to imports
import { Plus, Search, Trash2, Edit2, Package, Calendar, ScanLine, Loader2, Camera, Lock, Building2, X, CheckCircle } from 'lucide-react';
import { analyzeMedicineBox } from '../services/geminiService';
import { apiService } from '../services/apiService';

interface InventoryProps {
  drugs: Drug[];
  setDrugs: React.Dispatch<React.SetStateAction<Drug[]>>;
  currentUser: User;
}

const Inventory: React.FC<InventoryProps> = ({ drugs, setDrugs, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const canAdd = currentUser.role === 'ADMIN' || currentUser.role === 'AGENT';
  const canEdit = currentUser.role === 'ADMIN';
  const canDelete = currentUser.role === 'ADMIN';

  const [formData, setFormData] = useState<Partial<Drug>>({
    name: '',
    description: '',
    category: '',
    dosage: '',
    price: 0,
    stock: 0,
    expiryDate: ''
  });

  const handleOpenModal = (drug?: Drug) => {
    if (drug && !canEdit) return;
    if (!drug && !canAdd) return;

    if (drug) {
      setEditingDrug(drug);
      setFormData(drug);
    } else {
      setEditingDrug(null);
      setFormData({ 
        name: '', 
        description: '', 
        category: '', 
        dosage: '', 
        price: 0, 
        stock: 0, 
        expiryDate: '',
        pharmacyId: currentUser.pharmacyId // Pré-remplissage du pharmacyId
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // On s'assure que le produit est lié à la pharmacie de l'utilisateur
    const drugToSave = {
      ...formData,
      pharmacyId: editingDrug ? editingDrug.pharmacyId : currentUser.pharmacyId
    };

    try {
      // Tentative de sauvegarde via l'API Laravel
      const savedDrug = await apiService.saveDrug(drugToSave);
      
      // Mise à jour de l'état local pour un feedback instantané
      if (editingDrug) {
        setDrugs(drugs.map(d => d.id === editingDrug.id ? { ...savedDrug, pharmacyId: drugToSave.pharmacyId } : d));
      } else {
        setDrugs([...drugs, { ...savedDrug, pharmacyId: drugToSave.pharmacyId }]);
      }
      
      setIsModalOpen(false);
      alert(`Produit "${drugToSave.name}" enregistré pour votre établissement.`);
    } catch (error) {
      console.error("Save error:", error);
      // Fallback local si l'API Laravel n'est pas configurée pour le multi-tenant
      const fallbackDrug: Drug = {
        ...(drugToSave as Drug),
        id: editingDrug ? editingDrug.id : `drug_${Date.now()}`,
      };
      
      if (editingDrug) {
        setDrugs(drugs.map(d => d.id === editingDrug.id ? fallbackDrug : d));
      } else {
        setDrugs([...drugs, fallbackDrug]);
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (window.confirm('Voulez-vous vraiment supprimer ce produit de votre inventaire ?')) {
      try {
        await apiService.deleteDrug(id);
        setDrugs(drugs.filter(d => d.id !== id));
      } catch (error) {
        // Fallback local
        setDrugs(drugs.filter(d => d.id !== id));
      }
    }
  };

  const handleScanProduct = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsScanning(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const result = await analyzeMedicineBox(base64String);
        if (result) {
          setFormData(prev => ({
            ...prev,
            name: result.name || prev.name,
            description: result.description || prev.description,
            category: result.category || prev.category,
            dosage: result.dosage || prev.dosage
          }));
        } else {
          alert("L'IA n'a pas pu identifier ce produit.");
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtrage des produits affichés : l'utilisateur ne voit que les produits de SA pharmacie
  const myDrugs = drugs.filter(d => d.pharmacyId === currentUser.pharmacyId);
  
  const filteredDrugs = myDrugs.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Inventaire Local</h2>
          <p className="text-sm text-gray-500">Gérez le catalogue de votre officine</p>
        </div>
        <div className="flex gap-3">
          <label className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition shadow-sm font-bold text-sm">
             {isScanning ? <Loader2 size={18} className="animate-spin" /> : <ScanLine size={18} />}
             <span>Scan IA</span>
             <input type="file" className="hidden" accept="image/*" onChange={handleScanProduct} disabled={isScanning} />
          </label>
          {canAdd && (
            <button onClick={() => handleOpenModal()} className="bg-pharmacy-600 hover:bg-pharmacy-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 transition shadow-lg font-black transform active:scale-95">
              <Plus size={20} /><span>Nouveau Produit</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher dans votre stock..." 
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pharmacy-500 bg-gray-50 transition" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Désignation</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Catégorie</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Prix Unitaire</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredDrugs.map(drug => (
                <tr key={drug.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pharmacy-50 text-pharmacy-600 rounded-lg"><Package size={18} /></div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{drug.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{drug.dosage}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase">{drug.category}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                    {drug.price.toLocaleString()} F
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${drug.stock < 20 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {drug.stock}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    {canEdit && <button onClick={() => handleOpenModal(drug)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Modifier"><Edit2 size={16} /></button>}
                    {canDelete && <button onClick={() => handleDelete(drug.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer"><Trash2 size={16} /></button>}
                  </td>
                </tr>
              ))}
              {filteredDrugs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <Package size={64} className="mb-4" />
                      <p className="text-lg font-black uppercase tracking-widest">Inventaire vide</p>
                      <p className="text-sm">Commencez par ajouter vos produits</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="bg-pharmacy-600 p-6 text-white flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg"><Package size={24} /></div>
                  <h3 className="text-xl font-black">{editingDrug ? 'Modifier Produit' : 'Nouveau Produit'}</h3>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition">
                  <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="flex items-center gap-2 mb-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Building2 size={16} className="text-blue-600" />
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Propriété de : {currentUser.pharmacyId}</span>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Désignation du Médicament</label>
                <input required type="text" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none transition" placeholder="Ex: Paracétamol 500mg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Catégorie</label>
                  <input required type="text" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none transition" placeholder="Ex: Antibiotique" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dosage/Format</label>
                  <input required type="text" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none transition" placeholder="Ex: Boite de 20" value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Prix de Vente (FCFA)</label>
                  <input required type="number" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none transition" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quantité Initial</label>
                  <input required type="number" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none transition" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date d'Expiration</label>
                <input required type="date" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none transition" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">
                  Annuler
                </button>
                <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-pharmacy-600 text-white rounded-xl font-black hover:bg-pharmacy-700 shadow-xl transition flex justify-center items-center gap-2 transform active:scale-95">
                  {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                  {isSaving ? 'Synchronisation...' : 'Valider l\'Entrée'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
