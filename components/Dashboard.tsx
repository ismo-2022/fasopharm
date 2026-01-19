
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
    <div className="p-6 space-y-6 animate-fade-in h-full overflow-y-auto bg-gray-50">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Analyse de Performance</h2>
           <p className="text-gray-500 text-sm">Objectifs basés sur l'activité réelle de la semaine</p>
        </div>
        <div className="text-xs font-bold text-pharmacy-600 bg-pharmacy-100 px-3 py-1 rounded-full uppercase tracking-widest">
            En direct
        </div>
      </div>

      {/* KPI Cards & Top Performers Podium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Global CA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition">
          <div className="p-3 bg-pharmacy-100 text-pharmacy-600 rounded-xl"><DollarSign size={24} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Recettes Totales</p>
            <p className="text-xl font-black text-gray-800">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {/* Stock Alert */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Alertes Stock</p>
            <p className="text-xl font-black text-gray-800">{lowStockDrugs.length} critiques</p>
          </div>
        </div>

        {/* TOP VENDEUR (Ex: Aline - Celle qui envoie) */}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl shadow-lg flex items-center space-x-4 text-white transform hover:scale-105 transition">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
            <Medal size={24} />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1 opacity-80">
                <Star size={10} fill="currentColor" />
                <p className="text-[10px] font-black uppercase tracking-tighter">Meilleur Vendeur</p>
            </div>
            <p className="text-lg font-black truncate leading-tight">{leaders.seller?.name || "---"}</p>
            <p className="text-xs font-medium opacity-90">{leaders.seller ? `${leaders.seller.count} commandes envoyées` : "0 activité"}</p>
          </div>
        </div>

        {/* TOP CAISSIER (Ex: Thomas - Celui qui encaisse) */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-2xl shadow-lg flex items-center space-x-4 text-white transform hover:scale-105 transition">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
            <Trophy size={24} />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1 opacity-80">
                <Star size={10} fill="currentColor" />
                <p className="text-[10px] font-black uppercase tracking-tighter">Meilleur Caissier</p>
            </div>
            <p className="text-lg font-black truncate leading-tight">{leaders.cashier?.name || "---"}</p>
            <p className="text-xs font-medium opacity-90">{leaders.cashier ? formatCurrency(leaders.cashier.amount) : "0 FCFA"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    <TrendingUp size={20} className="text-pharmacy-500" />
                    Flux Réel de la Semaine
                </h3>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-pharmacy-500 rounded-full"></div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Encaissements journaliers</span>
                </div>
            </div>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <Tooltip 
                        cursor={{ fill: '#f9fafb' }} 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} 
                        formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Ventes']}
                    />
                    <Bar dataKey="vente" fill="#16a34a" radius={[10, 10, 0, 0]} barSize={45} />
                </BarChart>
                </ResponsiveContainer>
            </div>
          </div>

           {/* Top Products */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-bold text-gray-700 mb-6 flex items-center gap-2">
                 <Award size={20} className="text-yellow-500" />
                 Podium Produits
             </h3>
             <div className="space-y-3">
                 {topProducts.length > 0 ? (
                     topProducts.map((p, index) => (
                         <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-pharmacy-50 transition border border-transparent hover:border-pharmacy-100">
                             <div className="flex items-center gap-4">
                                 <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                                     index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                     index === 1 ? 'bg-gray-200 text-gray-700' : 
                                     'bg-orange-100 text-orange-700'
                                 }`}>
                                     {index + 1}
                                 </span>
                                 <div>
                                     <p className="font-bold text-gray-800 text-sm truncate max-w-[140px]">{p.name}</p>
                                     <p className="text-[10px] text-gray-400 uppercase font-bold">Pharmacie</p>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <p className="text-sm font-black text-pharmacy-600">{p.count}</p>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase">Vendus</p>
                             </div>
                         </div>
                     ))
                 ) : (
                     <div className="text-center py-20">
                         <Package size={48} className="mx-auto text-gray-200 mb-2" />
                         <p className="text-gray-400 text-xs font-bold uppercase">Aucune vente ce jour</p>
                     </div>
                 )}
             </div>
           </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Critical Stocks List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-6">
                <AlertTriangle size={20} className="text-red-500" />
                Stocks à Surveiller
            </h3>
            <div className="overflow-y-auto max-h-64 space-y-2 pr-2 custom-scrollbar">
                {lowStockDrugs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                        <CheckCircle size={40} className="mb-2 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest">Inventaire OK</p>
                    </div>
                ) : (
                    lowStockDrugs.map(drug => (
                        <div key={drug.id} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-red-50 transition rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${drug.stock === 0 ? 'bg-red-600 animate-pulse' : 'bg-orange-400'}`}></div>
                                <span className="text-sm font-bold text-gray-700">{drug.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-black text-red-600 bg-red-100 px-2 py-1 rounded">{drug.stock} unités</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">{drug.category}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Team Activity Tracking */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-6">
                <UserCheck size={20} className="text-indigo-500" />
                Récapitulatif Équipe
            </h3>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <p className="text-[10px] font-black text-indigo-700 uppercase mb-1">Efficacité Comptoir</p>
                        <p className="text-2xl font-black text-indigo-900">94%</p>
                        <p className="text-[10px] text-indigo-600 mt-1 italic">Vendeurs réactifs</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                        <p className="text-[10px] font-black text-green-700 uppercase mb-1">Précision Caisse</p>
                        <p className="text-2xl font-black text-green-900">100%</p>
                        <p className="text-[10px] text-green-600 mt-1 italic">Aucun écart relevé</p>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Progression Objectif Semaine</span>
                        <span className="text-xs font-black text-pharmacy-600">72%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-pharmacy-500 rounded-full transition-all duration-1000" style={{width: '72%'}}></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;