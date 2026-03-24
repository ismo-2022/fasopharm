
import React, { useState } from 'react';
import { Drug, User } from '../types';
import { Plus, Search, Trash2, Edit2, Package, CheckCircle, Loader2, X, Building2 } from 'lucide-react';
import { dbService } from '../services/databaseService';

interface InventoryProps {
  drugs: Drug[];
  setDrugs: React.Dispatch<React.SetStateAction<Drug[]>>;
  currentUser: User;
}

const Inventory: React.FC<InventoryProps> = ({ drugs, setDrugs, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
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
        pharmacyId: currentUser.pharmacyId
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const drugToSave = {
      ...formData,
      pharmacyId: editingDrug ? editingDrug.pharmacyId : currentUser.pharmacyId
    };

    try {
      const savedDrug = await dbService.saveDrug(drugToSave);
      if (editingDrug) {
        setDrugs(drugs.map(d => d.id === editingDrug.id ? { ...savedDrug, pharmacyId: drugToSave.pharmacyId } : d));
      } else {
        setDrugs([...drugs, { ...savedDrug, pharmacyId: drugToSave.pharmacyId }]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (window.confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      try {
        await dbService.deleteDrug(id);
        setDrugs(drugs.filter(d => d.id !== id));
      } catch (error) {
        setDrugs(drugs.filter(d => d.id !== id));
      }
    }
  };

  const myDrugs = drugs.filter(d => d.pharmacyId === currentUser.pharmacyId);
  const filteredDrugs = myDrugs.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Inventaire</h2>
          <p className="text-sm text-gray-500">Gérez le catalogue de votre officine</p>
        </div>
        <div className="flex gap-3">
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
              placeholder="Rechercher dans le stock..." 
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pharmacy-500 bg-gray-50 transition" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-auto flex-1 custom-scrollbar">
          {/* Desktop Table View */}
          <table className="min-w-full divide-y divide-gray-100 hidden md:table">
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
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredDrugs.map(drug => (
              <div key={drug.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pharmacy-50 text-pharmacy-600 rounded-lg"><Package size={18} /></div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{drug.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{drug.dosage}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {canEdit && <button onClick={() => handleOpenModal(drug)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit2 size={16} /></button>}
                    {canDelete && <button onClick={() => handleDelete(drug.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Catégorie</p>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase">{drug.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prix</p>
                    <p className="text-sm font-bold text-gray-700">{drug.price.toLocaleString()} F</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock</p>
                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${drug.stock < 20 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {drug.stock}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Désignation</label>
                <input required type="text" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Catégorie</label>
                  <input required type="text" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dosage</label>
                  <input required type="text" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none" value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Prix de Vente</label>
                  <input required type="number" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock</label>
                  <input required type="number" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date d'Expiration</label>
                <input required type="date" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold">Annuler</button>
                <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-pharmacy-600 text-white rounded-xl font-black shadow-xl flex justify-center items-center gap-2">
                  {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                  {isSaving ? 'Enregistrement...' : 'Valider'}
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
