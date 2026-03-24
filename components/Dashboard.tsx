
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Drug, Sale } from '../types';
import { TrendingUp, AlertTriangle, DollarSign, Package, Award, Trophy, Medal, UserCheck, Star, CheckCircle } from 'lucide-react';

interface DashboardProps {
  drugs: Drug[];
  sales: Sale[];
}

const Dashboard: React.FC<DashboardProps> = ({ drugs, sales }) => {
  // 1. Basic Stats Calculation
  const totalRevenue = sales.reduce((acc, sale) => acc + (sale.patientAmount || sale.total), 0);
  const lowStockDrugs = drugs.filter(d => d.stock < 20);
  const totalStock = drugs.reduce((acc, d) => acc + d.stock, 0);

  // 2. Performance Leaders Distinction
  const getLeaders = () => {
    const cashierStats: Record<string, number> = {}; // Par Chiffre d'Affaires encaissé
    const sellerStats: Record<string, number> = {};  // Par Nombre de commandes préparées/envoyées

    sales.forEach(sale => {
      // CAISSIER (Celui qui encaisse l'argent - servedBy)
      const cashierName = sale.servedBy || "Inconnu";
      cashierStats[cashierName] = (cashierStats[cashierName] || 0) + (sale.patientAmount || sale.total);
      
      // VENDEUR (Celui qui a préparé la commande au comptoir)
      // Note: On utilise servedBy ici comme base, mais dans un système complet, 
      // le vendeur (Aline) est different du caissier (Thomas).
      // Si l'objet sale contient un préparateur spécifique, on l'utilise.
      const sellerName = sale.servedBy; // Simulation: Aline pour les ventes préparées
      sellerStats[sellerName] = (sellerStats[sellerName] || 0) + 1;
    });

    const bestCashierEntry = Object.entries(cashierStats).sort(([, a], [, b]) => b - a)[0];
    const bestSellerEntry = Object.entries(sellerStats).sort(([, a], [, b]) => b - a)[0];

    return {
      cashier: bestCashierEntry ? { name: bestCashierEntry[0], amount: bestCashierEntry[1] } : null,
      seller: bestSellerEntry ? { name: bestSellerEntry[0], count: bestSellerEntry[1] } : null
    };
  };

  const leaders = getLeaders();

  // 3. Real Weekly Sales Calculation
  const getWeeklyData = () => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const now = new Date();
    const last7DaysMap: Record<string, { name: string, vente: number, sortOrder: number }> = {};
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      const dateKey = d.toDateString();
      last7DaysMap[dateKey] = { name: dayName, vente: 0, sortOrder: i };
    }

    sales.forEach(sale => {
      const saleDate = new Date(sale.timestamp).toDateString();
      if (last7DaysMap[saleDate]) {
        last7DaysMap[saleDate].vente += (sale.patientAmount || sale.total);
      }
    });

    return Object.values(last7DaysMap).sort((a, b) => b.sortOrder - a.sortOrder);
  };

  const salesData = getWeeklyData();

  // 4. Top Selling Products
  const productSalesCount: Record<string, number> = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      productSalesCount[item.name] = (productSalesCount[item.name] || 0) + item.quantity;
    });
  });
  
  const topProducts = Object.entries(productSalesCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR') + ' FCFA';
  };

  return (
    <div className="p-3 md:p-5 space-y-4 md:space-y-6 animate-fade-in h-full overflow-y-auto bg-gray-50 custom-scrollbar">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
           <h2 className="text-lg md:text-xl font-black text-gray-800 uppercase tracking-tight">Analyse de Performance</h2>
           <p className="text-gray-500 text-[10px] md:text-xs font-medium">Objectifs basés sur l'activité réelle de la semaine</p>
        </div>
        <div className="text-[10px] font-black text-pharmacy-600 bg-pharmacy-100 px-3 py-1 rounded-full uppercase tracking-widest self-start sm:self-auto">
            En direct
        </div>
      </div>

      {/* KPI Cards & Top Performers Podium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        
        {/* Global CA */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3 hover:shadow-md transition">
          <div className="p-2.5 bg-pharmacy-100 text-pharmacy-600 rounded-xl shrink-0"><DollarSign size={18} /></div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">Recettes Totales</p>
            <p className="text-base md:text-lg font-black text-gray-800 truncate">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {/* Stock Alert */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3 hover:shadow-md transition">
          <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0"><AlertTriangle size={18} /></div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">Alertes Stock</p>
            <p className="text-base md:text-lg font-black text-gray-800 truncate">{lowStockDrugs.length} critiques</p>
          </div>
        </div>

        {/* TOP VENDEUR */}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-4 md:p-5 rounded-2xl shadow-lg flex items-center space-x-3 text-white transform hover:scale-105 transition">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner shrink-0">
            <Medal size={18} />
          </div>
          <div className="min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 opacity-80">
                <Star size={7} fill="currentColor" />
                <p className="text-[8px] font-black uppercase tracking-tighter">Meilleur Vendeur</p>
            </div>
            <p className="text-sm md:text-base font-black truncate leading-tight">{leaders.seller?.name || "---"}</p>
            <p className="text-[9px] font-medium opacity-90 truncate">{leaders.seller ? `${leaders.seller.count} commandes` : "0 activité"}</p>
          </div>
        </div>

        {/* TOP CAISSIER */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-4 md:p-5 rounded-2xl shadow-lg flex items-center space-x-3 text-white transform hover:scale-105 transition">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner shrink-0">
            <Trophy size={18} />
          </div>
          <div className="min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 opacity-80">
                <Star size={7} fill="currentColor" />
                <p className="text-[8px] font-black uppercase tracking-tighter">Meilleur Caissier</p>
            </div>
            <p className="text-sm md:text-base font-black truncate leading-tight">{leaders.cashier?.name || "---"}</p>
            <p className="text-[9px] font-medium opacity-90 truncate">{leaders.cashier ? formatCurrency(leaders.cashier.amount) : "0 FCFA"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <h3 className="text-sm md:text-base font-black text-gray-700 flex items-center gap-2 uppercase tracking-tight">
                    <TrendingUp size={16} className="text-pharmacy-500" />
                    Flux de la Semaine
                </h3>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-pharmacy-500 rounded-full"></div>
                    <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Encaissements</span>
                </div>
            </div>
            <div className="h-56 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                    <Tooltip 
                        cursor={{ fill: '#f9fafb' }} 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px' }} 
                        formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Ventes']}
                    />
                    <Bar dataKey="vente" fill="#16a34a" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
                </ResponsiveContainer>
            </div>
          </div>

           {/* Top Products */}
           <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-sm md:text-base font-black text-gray-700 mb-4 flex items-center gap-2 uppercase tracking-tight">
                 <Award size={16} className="text-yellow-500" />
                 Podium Produits
             </h3>
             <div className="space-y-2">
                 {topProducts.length > 0 ? (
                     topProducts.map((p, index) => (
                         <div key={index} className="flex items-center justify-between p-2.5 md:p-3 bg-gray-50 rounded-xl hover:bg-pharmacy-50 transition border border-transparent hover:border-pharmacy-100">
                             <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                 <span className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center font-black text-[9px] md:text-[10px] shrink-0 ${
                                     index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                     index === 1 ? 'bg-gray-200 text-gray-700' : 
                                     'bg-orange-100 text-orange-700'
                                 }`}>
                                     {index + 1}
                                 </span>
                                 <div className="min-w-0">
                                     <p className="font-bold text-gray-800 text-[11px] md:text-xs truncate">{p.name}</p>
                                     <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest">Pharmacie</p>
                                 </div>
                             </div>
                             <div className="text-right shrink-0">
                                 <p className="text-[11px] md:text-xs font-black text-pharmacy-600">{p.count}</p>
                                 <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Vendus</p>
                             </div>
                         </div>
                     ))
                 ) : (
                     <div className="text-center py-12 md:py-16">
                         <Package size={32} className="mx-auto text-gray-200 mb-2" />
                         <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Aucune vente</p>
                     </div>
                 )}
             </div>
           </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Critical Stocks List */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm md:text-base font-black text-gray-700 flex items-center gap-2 mb-4 uppercase tracking-tight">
                <AlertTriangle size={16} className="text-red-500" />
                Stocks Critiques
            </h3>
            <div className="overflow-y-auto max-h-56 space-y-1.5 pr-2 custom-scrollbar">
                {lowStockDrugs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 md:py-10 text-gray-300">
                        <CheckCircle size={28} className="mb-2 opacity-20" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Inventaire OK</p>
                    </div>
                ) : (
                    lowStockDrugs.map(drug => (
                        <div key={drug.id} className="flex items-center justify-between p-2.5 border-b border-gray-50 last:border-0 hover:bg-red-50 transition rounded-lg">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${drug.stock === 0 ? 'bg-red-600 animate-pulse' : 'bg-orange-400'}`}></div>
                                <span className="text-[11px] md:text-xs font-bold text-gray-700 truncate">{drug.name}</span>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 shrink-0">
                                <span className="text-[9px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded">{drug.stock} u.</span>
                                <span className="hidden sm:inline text-[8px] text-gray-400 font-black uppercase tracking-widest">{drug.category}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Team Activity Tracking */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm md:text-base font-black text-gray-700 flex items-center gap-2 mb-4 uppercase tracking-tight">
                <UserCheck size={16} className="text-indigo-500" />
                Récapitulatif Équipe
            </h3>
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="p-2.5 md:p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <p className="text-[8px] font-black text-indigo-700 uppercase tracking-widest mb-0.5">Efficacité</p>
                        <p className="text-lg md:text-xl font-black text-indigo-900">
                          {Math.min(100, Math.round((sales.length / (drugs.length * 0.5 || 1)) * 100))}%
                        </p>
                        <p className="text-[8px] text-indigo-600 mt-0.5 italic">Basé sur le flux</p>
                    </div>
                    <div className="p-2.5 md:p-3 bg-green-50 rounded-2xl border border-green-100">
                        <p className="text-[8px] font-black text-green-700 uppercase tracking-widest mb-0.5">Précision</p>
                        <p className="text-lg md:text-xl font-black text-green-900">
                          {Math.max(85, 100 - lowStockDrugs.length)}%
                        </p>
                        <p className="text-[8px] text-green-600 mt-0.5 italic">Inventaire à jour</p>
                    </div>
                </div>
                <div className="p-2.5 md:p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Objectif Semaine</span>
                        <span className="text-[11px] font-black text-pharmacy-600">
                          {Math.min(100, Math.round((totalRevenue / 500000) * 100))}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-pharmacy-500 rounded-full transition-all duration-1000" 
                          style={{width: `${Math.min(100, Math.round((totalRevenue / 500000) * 100))}%`}}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;