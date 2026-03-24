import React, { useState } from 'react';
import { Sale } from '../types';
import { Search, Calendar, Eye, CreditCard, Banknote, Smartphone, ShieldCheck } from 'lucide-react';

interface SalesHistoryProps {
  sales: Sale[];
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Sort sales by date (newest first)
  const sortedSales = [...sales].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredSales = sortedSales.filter(sale => 
    sale.id.includes(searchTerm) || 
    sale.servedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.patientName && sale.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sale.policyNumber && sale.policyNumber.includes(searchTerm))
  );

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getPaymentIcon = (method: string) => {
      switch(method) {
          case 'CARD': return <CreditCard size={16} className="text-purple-600"/>;
          case 'MOBILE_MONEY': return <Smartphone size={16} className="text-orange-600"/>;
          default: return <Banknote size={16} className="text-green-600"/>;
      }
  };

  const getPaymentLabel = (method: string) => {
    switch(method) {
        case 'CARD': return 'Carte Bancaire';
        case 'MOBILE_MONEY': return 'Mobile Money';
        default: return 'Espèces';
    }
};

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Historique des Ventes</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher par ID, Vendeur, Patient ou Matricule..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pharmacy-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center text-gray-500 text-sm italic">
             <Calendar size={16} className="mr-2"/>
             {filteredSales.length} transactions trouvées
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 custom-scrollbar">
          {/* Desktop Table */}
          <table className="min-w-full divide-y divide-gray-200 hidden md:table">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Heure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendeur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(sale.timestamp)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-mono text-gray-400">#{sale.id.slice(-6)}</div>
                      {sale.patientName && (
                          <div className="text-indigo-600 font-medium text-xs mt-1 flex items-center gap-1">
                              <ShieldCheck size={12}/> {sale.patientName}
                          </div>
                      )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{sale.servedBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                          {getPaymentIcon(sale.paymentMethod)}
                          <span>{getPaymentLabel(sale.paymentMethod)}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">{formatCurrency(sale.total)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => setSelectedSale(sale)} className="text-pharmacy-600 hover:text-pharmacy-900 bg-pharmacy-50 p-2 rounded-lg transition">
                        <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredSales.map(sale => (
              <div key={sale.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{formatDate(sale.timestamp)}</p>
                    <div className="font-mono text-[10px] text-gray-400">#{sale.id.slice(-6)}</div>
                  </div>
                  <button onClick={() => setSelectedSale(sale)} className="text-pharmacy-600 bg-pharmacy-50 p-2 rounded-lg transition">
                    <Eye size={18} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-900 font-medium">{sale.servedBy}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-600">
                      {getPaymentIcon(sale.paymentMethod)}
                      <span>{getPaymentLabel(sale.paymentMethod)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(sale.total)}</p>
                    {sale.patientName && (
                      <div className="text-indigo-600 font-medium text-[10px] flex items-center justify-end gap-1">
                        <ShieldCheck size={10}/> {sale.patientName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-0 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">Détails de la vente #{selectedSale.id.slice(-8)}</h3>
                <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-600">Fermer</button>
            </div>
            
            <div className="p-6">
                <div className="flex justify-between mb-6 text-sm text-gray-600">
                    <div>
                        <p>Date: <span className="font-semibold text-gray-800">{formatDate(selectedSale.timestamp)}</span></p>
                        <p>Vendeur: <span className="font-semibold text-gray-800">{selectedSale.servedBy}</span></p>
                    </div>
                    <div className="text-right">
                        <p>Mode de paiement</p>
                        <p className="font-bold text-pharmacy-600 flex items-center justify-end gap-2">
                            {getPaymentLabel(selectedSale.paymentMethod)}
                            {getPaymentIcon(selectedSale.paymentMethod)}
                        </p>
                    </div>
                </div>

                {selectedSale.insuranceName && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-6">
                        <h4 className="font-bold text-indigo-800 text-sm mb-2 flex items-center gap-2">
                            <ShieldCheck size={16} /> Informations Assurance
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 block">Organisme</span>
                                <span className="font-medium text-gray-900">{selectedSale.insuranceName}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Taux Couverture</span>
                                <span className="font-medium text-gray-900">{selectedSale.insuranceCoverageRate}%</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Patient</span>
                                <span className="font-medium text-gray-900">{selectedSale.patientName}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Matricule</span>
                                <span className="font-medium text-gray-900">{selectedSale.policyNumber}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="border rounded-lg overflow-hidden mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qté</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Prix U.</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {selectedSale.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-2 text-sm text-gray-800">{item.name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-600 text-right">{item.quantity}</td>
                                    <td className="px-4 py-2 text-sm text-gray-600 text-right">{formatCurrency(item.price)}</td>
                                    <td className="px-4 py-2 text-sm font-medium text-gray-800 text-right">{formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Sous-total</span>
                        <span>{formatCurrency(selectedSale.total)}</span>
                    </div>
                    {selectedSale.insuranceAmount && selectedSale.insuranceAmount > 0 && (
                         <div className="flex justify-between items-center text-sm text-indigo-600 font-medium">
                            <span>Part Assurance</span>
                            <span>-{formatCurrency(selectedSale.insuranceAmount)}</span>
                        </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-700">Total Payé par Client</span>
                        <span className="text-2xl font-bold text-pharmacy-600">{formatCurrency(selectedSale.patientAmount || selectedSale.total)}</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;