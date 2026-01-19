
import React from 'react';
import { Drug, Sale, User, Supplier, Insurance, Pharmacy } from '../types';
import { Download, FileSpreadsheet, Database, Shield, AlertTriangle } from 'lucide-react';

interface DataExportProps {
  drugs: Drug[];
  sales: Sale[];
  users: User[];
  suppliers: Supplier[];
  insurances: Insurance[];
  pharmacies: Pharmacy[];
}

const DataExport: React.FC<DataExportProps> = ({ drugs, sales, users, suppliers, insurances, pharmacies }) => {

  const getPharmacyName = (id?: string) => {
    if (!id) return "N/A";
    return pharmacies.find(p => p.id === id)?.name || id;
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const headers = Object.keys(data[0]);
    const BOM = '\uFEFF';
    const csvContent = [
      headers.join(';'),
      ...data.map(row => headers.map(fieldName => {
        let val = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
        if (typeof val === 'string') {
          val = val.replace(/"/g, '""').replace(/;/g, ',');
          return `"${val}"`;
        }
        return val;
      }).join(';'))
    ].join('\r\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportInventory = () => {
    const data = drugs.map(d => ({
      "Pharmacie": getPharmacyName(d.pharmacyId),
      "ID Produit": d.id,
      "Désignation": d.name,
      "Catégorie": d.category,
      "Dosage": d.dosage,
      "Quantité en Stock": d.stock,
      "Prix Unitaire (FCFA)": d.price,
      "Date d'Expiration": d.expiryDate
    }));
    downloadCSV(data, 'Inventaire_Global');
  };

  const handleExportSales = () => {
    const data = sales.map(s => ({
      "Pharmacie": getPharmacyName(s.pharmacyId),
      "N° Vente": s.id,
      "Date": new Date(s.timestamp).toLocaleString('fr-FR'),
      "Vendeur": s.servedBy,
      "Total": s.total,
      "Mode": s.paymentMethod,
      "Assurance": s.insuranceName || 'Comptant',
      "Part Patient": s.patientAmount || s.total,
      "Part Assurance": s.insuranceAmount || 0,
      "Patient": s.patientName || '',
      "Matricule": s.policyNumber || ''
    }));
    downloadCSV(data, 'Journal_Ventes');
  };

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in overflow-y-auto bg-gray-50">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
            <Database className="text-pharmacy-600" />
            Centre de Rapports Cloud
        </h2>
        <p className="text-gray-500 mt-2 font-medium">Extractions de données structurées avec en-têtes d'établissements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-green-100 text-green-700 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <FileSpreadsheet size={32} />
                </div>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{drugs.length} Articles</span>
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Inventaire Détaillé</h3>
            <p className="text-sm text-gray-500 mb-8 font-medium">Liste exhaustive des stocks avec identification par pharmacie.</p>
            <button onClick={handleExportInventory} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 flex items-center justify-center gap-3 transition shadow-lg transform active:scale-95">
                <Download size={18} /> Télécharger Inventaire
            </button>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-blue-100 text-blue-700 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Database size={32} />
                </div>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{sales.length} Transactions</span>
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Journal des Ventes</h3>
            <p className="text-sm text-gray-500 mb-8 font-medium">Rapport complet des transactions incluant les données Tiers-Payant.</p>
            <button onClick={handleExportSales} className="w-full py-4 bg-pharmacy-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-pharmacy-700 flex items-center justify-center gap-3 transition shadow-lg transform active:scale-95 shadow-pharmacy-600/20">
                <Download size={18} /> Télécharger Rapports Ventes
            </button>
        </div>
      </div>
    </div>
  );
};

export default DataExport;
