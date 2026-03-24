import React, { useState } from 'react';
import { Supplier, User } from '../types';
import { Plus, Search, Trash2, Edit2, Truck, Phone, Mail, MapPin } from 'lucide-react';
import { dbService } from '../services/databaseService';

interface SuppliersProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  currentUser: User;
}

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, setSuppliers, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    contact: '',
    email: '',
    address: ''
  });

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData(supplier);
    } else {
      setEditingSupplier(null);
      setFormData({ name: '', contact: '', email: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const supplierData = {
        ...formData,
        pharmacyId: currentUser.pharmacyId || ''
      };

      if (editingSupplier) {
        const updated = await dbService.saveSupplier({ ...supplierData, id: editingSupplier.id });
        setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? updated : s));
      } else {
        const saved = await dbService.saveSupplier(supplierData);
        setSuppliers([...suppliers, saved]);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert("Erreur lors de la sauvegarde du fournisseur.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Supprimer ce fournisseur ?')) {
      try {
        await dbService.deleteSupplier(id);
        setSuppliers(suppliers.filter(s => s.id !== id));
      } catch (error) {
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Fournisseurs</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-pharmacy-600 hover:bg-pharmacy-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
        >
          <Plus size={20} />
          <span>Nouveau Fournisseur</span>
        </button>
      </div>

      {/* Grid of Suppliers */}
      <div className="flex-1 overflow-y-auto">
        <div className="mb-6">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Rechercher un fournisseur..." 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pharmacy-500 bg-white shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map(supplier => (
                <div key={supplier.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                            <Truck size={24} />
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => handleOpenModal(supplier)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(supplier.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{supplier.name}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Phone size={14} />
                            {supplier.contact}
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail size={14} />
                            {supplier.email}
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            {supplier.address}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">{editingSupplier ? 'Modifier' : 'Ajouter'} Fournisseur</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom de l'entreprise</label>
                <input required type="text" className="mt-1 block w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-pharmacy-500 outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Téléphonique</label>
                <input required type="text" className="mt-1 block w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-pharmacy-500 outline-none" 
                  value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Professionnel</label>
                <input required type="email" className="mt-1 block w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-pharmacy-500 outline-none" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Adresse Physique</label>
                <textarea className="mt-1 block w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-pharmacy-500 outline-none" rows={3}
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-pharmacy-600 text-white rounded-lg hover:bg-pharmacy-700 shadow-md transition">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;