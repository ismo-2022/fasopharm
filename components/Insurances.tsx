import React, { useState } from 'react';
import { Insurance } from '../types';
import { Plus, Search, Trash2, Edit2, ShieldCheck, Percent } from 'lucide-react';
import { dbService } from '../services/databaseService';

interface InsurancesProps {
  insurances: Insurance[];
  setInsurances: React.Dispatch<React.SetStateAction<Insurance[]>>;
}

const Insurances: React.FC<InsurancesProps> = ({ insurances, setInsurances }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);
  const [formData, setFormData] = useState<Partial<Insurance>>({
    name: '',
    defaultCoverage: 80
  });

  const handleOpenModal = (insurance?: Insurance) => {
    if (insurance) {
      setEditingInsurance(insurance);
      setFormData(insurance);
    } else {
      setEditingInsurance(null);
      setFormData({ name: '', defaultCoverage: 80 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInsurance) {
        const updated = await dbService.saveInsurance({ ...formData, id: editingInsurance.id });
        setInsurances(insurances.map(i => i.id === editingInsurance.id ? updated : i));
      } else {
        const saved = await dbService.saveInsurance(formData);
        setInsurances([...insurances, saved]);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert("Erreur lors de la sauvegarde de l'assurance.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Supprimer cette assurance ?')) {
      try {
        await dbService.deleteInsurance(id);
        setInsurances(insurances.filter(i => i.id !== id));
      } catch (error) {
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const filteredInsurances = insurances.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Assurances</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-pharmacy-600 hover:bg-pharmacy-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
        >
          <Plus size={20} />
          <span>Ajouter une Assurance</span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="mb-6">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Rechercher une assurance (ex: CNSS, SONAR)..." 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pharmacy-500 bg-white shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInsurances.map(ins => (
                <div key={ins.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                            <ShieldCheck size={24} />
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => handleOpenModal(ins)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(ins.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{ins.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <Percent size={14} />
                        <span>Couverture par défaut : <strong>{ins.defaultCoverage}%</strong></span>
                    </div>
                </div>
            ))}
        </div>
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">{editingInsurance ? 'Modifier' : 'Ajouter'} Assurance</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom de la Compagnie</label>
                <input required type="text" className="mt-1 block w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-pharmacy-500 outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="ex: CNSS" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Taux de couverture par défaut (%)</label>
                <input required type="number" min="0" max="100" className="mt-1 block w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-pharmacy-500 outline-none" 
                  value={formData.defaultCoverage} onChange={e => setFormData({...formData, defaultCoverage: parseInt(e.target.value)})} />
                  <p className="text-xs text-gray-400 mt-1">Ce taux pourra être ajusté lors de la vente.</p>
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

export default Insurances;