
import React from 'react';
import { Sale, User, Pharmacy } from '../types';
import { X, Printer, CheckCircle, TrendingUp, Smartphone, CreditCard, Banknote, Store, MapPin, Phone } from 'lucide-react';

interface CashClosingProps {
  sales: Sale[];
  currentUser: User;
  onClose: () => void;
  pharmacies: Pharmacy[];
}

const CashClosing: React.FC<CashClosingProps> = ({ sales, currentUser, onClose, pharmacies }) => {
  const currentPharmacy = pharmacies.find(p => p.id === currentUser.pharmacyId) || pharmacies[0];
  
  const today = new Date().toDateString();
  const todaysSales = sales.filter(s => 
    new Date(s.timestamp).toDateString() === today && 
    (currentUser.role === 'ADMIN' || s.servedBy === currentUser.fullName)
  );

  const totalRevenue = todaysSales.reduce((acc, sale) => acc + (sale.patientAmount || sale.total), 0);
  const totalTransactions = todaysSales.length;

  const cashTotal = todaysSales.filter(s => s.paymentMethod === 'CASH').reduce((acc, s) => acc + (s.patientAmount || s.total), 0);
  const mobileTotal = todaysSales.filter(s => s.paymentMethod === 'MOBILE_MONEY').reduce((acc, s) => acc + (s.patientAmount || s.total), 0);
  const cardTotal = todaysSales.filter(s => s.paymentMethod === 'CARD').reduce((acc, s) => acc + (s.patientAmount || s.total), 0);
  
  const insurancePartTotal = todaysSales.reduce((acc, s) => acc + (s.insuranceAmount || 0), 0);

  const formatCurrency = (value: number) => value.toLocaleString('fr-FR') + ' FCFA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-xl max-h-[95vh] overflow-y-auto custom-scrollbar animate-fade-in border border-gray-200">
        <div className="bg-gray-900 text-white p-6 md:p-8 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white p-2 hover:bg-white/10 rounded-full transition">
                <X size={20} className="md:w-6 md:h-6" />
            </button>
            <div className="flex flex-col items-center text-center">
                <div className="p-2 md:p-3 bg-pharmacy-600 rounded-2xl mb-3 md:mb-4 shadow-lg shadow-pharmacy-600/30">
                    <Store size={24} className="md:w-8 md:h-8" />
                </div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">{currentPharmacy.name}</h2>
                <p className="text-pharmacy-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Clôture de Caisse Journalière</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3 md:gap-4 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                    <span className="flex items-center gap-1"><MapPin size={10}/> {currentPharmacy.address}</span>
                    <span className="flex items-center gap-1"><Phone size={10}/> {currentPharmacy.phone}</span>
                </div>
            </div>
        </div>

        <div className="p-4 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
                <div className="p-4 md:p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Responsable</p>
                    <p className="text-base md:text-lg font-black text-gray-800">{currentUser.fullName}</p>
                    <p className="text-[10px] text-pharmacy-600 font-bold uppercase mt-1">Session Active</p>
                </div>
                <div className="p-4 md:p-6 bg-pharmacy-50 rounded-2xl border border-pharmacy-100 text-left sm:text-right">
                    <p className="text-[10px] font-black text-pharmacy-600 uppercase tracking-widest mb-1">Recette Nette</p>
                    <p className="text-2xl md:text-3xl font-black text-pharmacy-700">{formatCurrency(totalRevenue)}</p>
                </div>
            </div>

            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Répartition par Mode</h3>
                
                <div className="flex items-center justify-between p-4 md:p-5 bg-white rounded-2xl border-2 border-gray-50 shadow-sm">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-green-100 text-green-700 rounded-xl"><Banknote size={20} className="md:w-6 md:h-6" /></div>
                        <div>
                            <p className="text-xs md:text-sm font-black text-gray-800">Espèces Physiques</p>
                            <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">Caisse comptoir</p>
                        </div>
                    </div>
                    <span className="text-base md:text-lg font-black text-gray-900">{formatCurrency(cashTotal)}</span>
                </div>

                <div className="flex items-center justify-between p-4 md:p-5 bg-white rounded-2xl border-2 border-gray-50 shadow-sm">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-orange-100 text-orange-700 rounded-xl"><Smartphone size={20} className="md:w-6 md:h-6" /></div>
                        <div>
                            <p className="text-xs md:text-sm font-black text-gray-800">Mobile Money</p>
                            <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">Orange/Mobicash</p>
                        </div>
                    </div>
                    <span className="text-base md:text-lg font-black text-gray-900">{formatCurrency(mobileTotal)}</span>
                </div>

                <div className="flex items-center justify-between p-4 md:p-5 bg-white rounded-2xl border-2 border-gray-50 shadow-sm">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-purple-100 text-purple-700 rounded-xl"><CreditCard size={20} className="md:w-6 md:h-6" /></div>
                        <div>
                            <p className="text-xs md:text-sm font-black text-gray-800">Carte Bancaire</p>
                            <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">Transactions TPE</p>
                        </div>
                    </div>
                    <span className="text-base md:text-lg font-black text-gray-900">{formatCurrency(cardTotal)}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="p-4 md:p-5 bg-gray-50 rounded-2xl text-center border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ventes Totales</p>
                    <p className="text-xl md:text-2xl font-black text-gray-800">{totalTransactions}</p>
                </div>
                <div className="p-4 md:p-5 bg-indigo-50 rounded-2xl text-center border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Créances Assurance</p>
                    <p className="text-xl md:text-2xl font-black text-indigo-700">{formatCurrency(insurancePartTotal)}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <button onClick={() => window.print()} className="flex-1 py-3 md:py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition flex items-center justify-center gap-2">
                    <Printer size={16} className="md:w-4.5 md:h-4.5" /> Imprimer Rapport Z
                </button>
                <button onClick={onClose} className="flex-[2] py-3 md:py-4 bg-pharmacy-600 hover:bg-pharmacy-700 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-xl shadow-pharmacy-600/30 transform active:scale-95">
                    <CheckCircle size={16} className="md:w-4.5 md:h-4.5" /> Confirmer & Clôturer
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CashClosing;
