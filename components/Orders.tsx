import React from 'react';
import { Drug, Supplier } from '../types';
import { ShoppingBag, MessageCircle, AlertTriangle, Phone, ExternalLink } from 'lucide-react';

interface OrdersProps {
  drugs: Drug[];
  suppliers: Supplier[];
}

const Orders: React.FC<OrdersProps> = ({ drugs, suppliers }) => {
  // Logic: Identify low stock items (<20)
  const lowStockDrugs = drugs.filter(d => d.stock < 20);

  // Group by Supplier
  const ordersBySupplier = lowStockDrugs.reduce((acc, drug) => {
    const supplierId = drug.supplierId || 'unknown';
    if (!acc[supplierId]) {
      acc[supplierId] = [];
    }
    acc[supplierId].push(drug);
    return acc;
  }, {} as Record<string, Drug[]>);

  const getSupplierDetails = (id: string) => suppliers.find(s => s.id === id);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR') + ' FCFA';
  };

  const generateWhatsAppLink = (supplier: Supplier | undefined, items: Drug[]) => {
    if (!supplier) return '#';
    
    // Clean phone number (remove spaces, ensure international format)
    // Assuming Burkina Faso (+226) if not specified
    let phone = supplier.contact.replace(/\s+/g, '').replace(/-/g, '');
    if (!phone.startsWith('+')) {
        phone = '+226' + phone;
    }

    const date = new Date().toLocaleDateString('fr-FR');
    let message = `*COMMANDE FASOPHARM - ${date}*\n\n`;
    message += `Bonjour ${supplier.name},\nVoici une commande de réapprovisionnement urgante :\n\n`;
    
    items.forEach(item => {
        // Proposal: Order enough to reach 50 units
        const quantityToOrder = 50 - item.stock;
        message += `- ${item.name} (${item.dosage}) : *${quantityToOrder} boites*\n`;
    });

    message += `\nMerci de confirmer la réception et la livraison.\nCordialement.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="text-pharmacy-600" />
            Réapprovisionnement Intelligent
        </h2>
        <p className="text-gray-500 mt-2">
            Le système détecte les stocks faibles et prépare vos commandes par fournisseur.
            Envoyez-les directement par WhatsApp pour gagner du temps.
        </p>
      </div>

      {lowStockDrugs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 bg-green-100 text-green-600 rounded-full mb-4">
                  <ShoppingBag size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Tout est en ordre !</h3>
              <p className="text-gray-500">Aucun produit n'est actuellement en rupture de stock.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(ordersBySupplier).map(supplierId => {
                  const items = ordersBySupplier[supplierId];
                  const supplier = getSupplierDetails(supplierId);
                  const estimatedCost = items.reduce((sum, item) => sum + (item.price * (50 - item.stock)), 0); // Cost based on retail price (approx)

                  return (
                    <div key={supplierId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">
                                    {supplier ? supplier.name : 'Fournisseur Inconnu'}
                                </h3>
                                {supplier && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <Phone size={12} /> {supplier.contact}
                                    </div>
                                )}
                            </div>
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                                {items.length} articles critiques
                            </span>
                        </div>
                        
                        <div className="p-4 flex-1">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-400 border-b border-gray-100">
                                        <th className="pb-2">Produit</th>
                                        <th className="pb-2 text-right">Stock Actuel</th>
                                        <th className="pb-2 text-right">Qté Suggérée</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td className="py-2 text-gray-800 font-medium">{item.name}</td>
                                            <td className="py-2 text-right text-red-600 font-bold">{item.stock}</td>
                                            <td className="py-2 text-right text-pharmacy-600 font-bold">{50 - item.stock}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <div className="flex justify-between items-center mb-4 text-sm">
                                <span className="text-gray-500">Valeur estimée (Vente)</span>
                                <span className="font-bold text-gray-800">{formatCurrency(estimatedCost)}</span>
                            </div>
                            
                            {supplier ? (
                                <a 
                                    href={generateWhatsAppLink(supplier, items)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-md"
                                >
                                    <MessageCircle size={20} />
                                    Commander via WhatsApp
                                </a>
                            ) : (
                                <button disabled className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                                    <AlertTriangle size={20} />
                                    Contact manquant
                                </button>
                            )}
                        </div>
                    </div>
                  );
              })}
          </div>
      )}
    </div>
  );
};

export default Orders;