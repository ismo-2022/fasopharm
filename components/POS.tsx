
import React, { useState, useEffect, useRef } from 'react';
import { Drug, CartItem, Sale, PaymentMethod, User, Insurance, PendingOrder, Pharmacy } from '../types';
import { ShoppingCart, Plus, Minus, Search, CreditCard, Banknote, Smartphone, Printer, CheckCircle, ShieldCheck, User as UserIcon, Send, Clock, X, ChevronDown, ChevronUp, Coins, Store, MapPin, Phone } from 'lucide-react';

interface POSProps {
  drugs: Drug[];
  setDrugs: React.Dispatch<React.SetStateAction<Drug[]>>;
  insurances: Insurance[];
  onSaleComplete: (sale: Sale) => void;
  currentUser: User;
  pendingOrders: PendingOrder[];
  setPendingOrders: React.Dispatch<React.SetStateAction<PendingOrder[]>>;
  pharmacies: Pharmacy[];
}

const POS: React.FC<POSProps> = ({ drugs, setDrugs, insurances, onSaleComplete, currentUser, pendingOrders, setPendingOrders, pharmacies }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPendingOpen, setIsPendingOpen] = useState(false);
  
  const [showInsurance, setShowInsurance] = useState(false);
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<string>('');
  const [coverageRate, setCoverageRate] = useState<number>(0);
  
  const [patientName, setPatientName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountReceived, setAmountReceived] = useState<number | ''>(''); 
  
  const [showReceipt, setShowReceipt] = useState<Sale | null>(null);
  const [showPendingTicket, setShowPendingTicket] = useState<PendingOrder | null>(null);

  const isPreparer = currentUser.role === 'SELLER' || currentUser.role === 'AGENT';
  const isCashier = currentUser.role === 'CASHIER' || currentUser.role === 'ADMIN';

  const searchInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  const currentPharmacy = pharmacies.find(p => p.id === currentUser.pharmacyId) || pharmacies[0];
  const localPendingOrders = pendingOrders.filter(order => order.pharmacyId === currentUser.pharmacyId);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const insuranceAmount = selectedInsuranceId ? Math.round(totalAmount * (coverageRate / 100)) : 0;
  const patientAmount = totalAmount - insuranceAmount;

  const amountToPay = patientAmount; 
  const changeDue = typeof amountReceived === 'number' ? amountReceived - amountToPay : 0;
  const isAmountSufficient = paymentMethod !== 'CASH' || (typeof amountReceived === 'number' && amountReceived >= amountToPay);

  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  const handleInsuranceChange = (id: string) => {
    setSelectedInsuranceId(id);
    if (id) {
      const ins = insurances.find(i => i.id === id);
      setCoverageRate(ins ? ins.defaultCoverage : 0);
    } else {
      setCoverageRate(0);
      setPatientName('');
      setPolicyNumber('');
    }
  };

  const addToCart = (drug: Drug) => {
    const existing = cart.find(item => item.id === drug.id);
    if (existing) {
      if (existing.quantity < drug.stock) {
        setCart(cart.map(item => item.id === drug.id ? { ...item, quantity: item.quantity + 1 } : item));
      } else {
        alert("Stock insuffisant !");
      }
    } else {
      if (drug.stock > 0) {
        setCart([...cart, { ...drug, quantity: 1 }]);
      } else {
        alert("Produit en rupture de stock.");
      }
    }
    setSearchTerm('');
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        const drug = drugs.find(d => d.id === id);
        if (newQty > 0 && drug && newQty <= drug.stock) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }));
  };

  const handleSendToCashier = () => {
    if (cart.length === 0) return;
    const newOrder: PendingOrder = {
      id: Date.now().toString(),
      pharmacyId: currentUser.pharmacyId || '',
      ticketNumber: `T-${Math.floor(Math.random() * 900) + 100}`,
      timestamp: new Date(),
      items: [...cart],
      total: totalAmount,
      preparedBy: currentUser.fullName,
      insuranceId: selectedInsuranceId,
      patientName,
      policyNumber
    };
    setPendingOrders(prev => [...prev, newOrder]);
    setCart([]);
    setShowPendingTicket(newOrder);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (selectedInsuranceId && (!patientName.trim() || !policyNumber.trim())) {
      alert("Infos patient requises.");
      return;
    }
    if (!isAmountSufficient) {
       alert("Montant reçu insuffisant.");
       return;
    }

    const newDrugs = drugs.map(d => {
      const cartItem = cart.find(c => c.id === d.id);
      if (cartItem) return { ...d, stock: d.stock - cartItem.quantity };
      return d;
    });
    setDrugs(newDrugs);

    const selectedIns = insurances.find(i => i.id === selectedInsuranceId);
    const sale: Sale = {
      id: `S${Date.now().toString().slice(-8)}`,
      pharmacyId: currentUser.pharmacyId || '',
      timestamp: new Date(),
      items: [...cart],
      total: totalAmount,
      paymentMethod: paymentMethod,
      servedBy: currentUser.fullName,
      insuranceId: selectedInsuranceId || undefined,
      insuranceName: selectedIns?.name,
      insuranceCoverageRate: selectedInsuranceId ? coverageRate : undefined,
      insuranceAmount: selectedInsuranceId ? insuranceAmount : 0,
      patientAmount: patientAmount,
      patientName: selectedInsuranceId ? patientName : undefined,
      policyNumber: selectedInsuranceId ? policyNumber : undefined,
      amountReceived: paymentMethod === 'CASH' && typeof amountReceived === 'number' ? amountReceived : undefined,
      changeGiven: paymentMethod === 'CASH' ? changeDue : undefined
    };

    onSaleComplete(sale);
    setCart([]);
    setShowReceipt(sale);
  };

  const formatCurrency = (value: number) => value.toLocaleString('fr-FR') + ' FCFA';  return (
    <div className="flex flex-col lg:flex-row h-full bg-gray-100 overflow-hidden relative text-xs">
      {showReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-800 text-white p-3 md:p-4 text-center">
              <h3 className="font-black uppercase tracking-widest text-xs md:text-sm">Reçu de Vente</h3>
            </div>
            <div className="p-4 md:p-6 bg-white font-mono text-[10px] md:text-xs overflow-y-auto flex-1">
              <div className="text-center mb-4">
                <p className="font-black text-lg md:text-xl uppercase tracking-tighter text-gray-900">{currentPharmacy.name}</p>
                <p className="text-[8px] md:text-[9px] text-gray-500 mt-0.5 uppercase font-bold">{currentPharmacy.address}</p>
              </div>
              <div className="border-b border-dashed border-gray-300 my-3"></div>
              <div className="space-y-2 mb-4">
                {showReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-2">
                    <span className="truncate">{item.quantity} x {item.name}</span>
                    <span className="font-bold shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-300 pt-3">
                <div className="flex justify-between font-black text-base md:text-lg text-gray-900">
                  <span>TOTAL</span>
                  <span>{formatCurrency(showReceipt.patientAmount || showReceipt.total)}</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 flex gap-2">
              <button onClick={() => setShowReceipt(null)} className="flex-1 py-2 md:py-3 bg-gray-200 text-gray-800 rounded-xl font-bold text-xs">Fermer</button>
              <button onClick={() => { window.print(); setShowReceipt(null); }} className="flex-[2] py-2 md:py-3 bg-pharmacy-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 text-xs">
                <Printer size={16} /> Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showPendingTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-xs text-center border-t-4 border-pharmacy-500">
                <h3 className="text-sm md:text-base font-bold text-gray-800 uppercase tracking-widest">Numéro de Ticket</h3>
                <div className="bg-gray-100 p-4 md:p-6 rounded-xl border-2 border-dashed border-gray-300 my-4">
                    <p className="text-3xl md:text-4xl font-mono font-black text-gray-900">{showPendingTicket.ticketNumber}</p>
                </div>
                <button onClick={() => setShowPendingTicket(null)} className="w-full py-2 md:py-3 bg-pharmacy-600 text-white rounded-xl font-bold shadow-lg text-xs uppercase tracking-widest">TERMINER</button>
            </div>
        </div>
      )}

      {/* Mobile Cart Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40 flex flex-col gap-2">
        {isCashier && localPendingOrders.length > 0 && (
          <button 
            onClick={() => setIsPendingOpen(!isPendingOpen)}
            className="p-3 bg-indigo-600 text-white rounded-full shadow-2xl relative"
          >
            <Clock size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              {localPendingOrders.length}
            </span>
          </button>
        )}
        <button 
          onClick={() => setIsCartOpen(!isCartOpen)}
          className="p-3 bg-pharmacy-600 text-white rounded-full shadow-2xl relative"
        >
          <ShoppingCart size={20} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Pending Orders Sidebar/Overlay */}
      {isCashier && localPendingOrders.length > 0 && (
          <>
            {isPendingOpen && (
              <div className="fixed inset-0 bg-black/50 z-[60] lg:hidden" onClick={() => setIsPendingOpen(false)} />
            )}
            <div className={`fixed lg:static inset-y-0 left-0 z-[70] lg:z-20 w-64 bg-white border-r border-gray-200 flex flex-col shadow-2xl lg:shadow-none transform transition-transform duration-300 ${isPendingOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-3 bg-indigo-600 text-white flex justify-between items-center">
                    <h3 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} /> En attente ({localPendingOrders.length})
                    </h3>
                    <button onClick={() => setIsPendingOpen(false)} className="lg:hidden p-1 hover:bg-white/10 rounded">
                      <X size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {localPendingOrders.map(order => (
                        <div key={order.id} onClick={() => {setCart(order.items); if(order.insuranceId) handleInsuranceChange(order.insuranceId); setPendingOrders(prev => prev.filter(o => o.id !== order.id)); setIsPendingOpen(false); setIsCartOpen(true);}} className="p-3 bg-white border border-gray-100 rounded-xl hover:border-pharmacy-400 cursor-pointer transition shadow-sm">
                            <div className="flex justify-between items-start">
                              <p className="font-mono font-black text-xl text-pharmacy-600">{order.ticketNumber}</p>
                              <span className="text-[8px] font-black text-gray-400 uppercase">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-xs font-black text-gray-800 mt-0.5">{formatCurrency(order.total)}</p>
                            <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5 truncate">Par: {order.preparedBy}</p>
                        </div>
                    ))}
                </div>
            </div>
          </>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-2 md:p-3 bg-white border-b border-gray-200 shadow-sm z-10">
           <div className="flex gap-2 md:gap-3 max-w-5xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input ref={searchInputRef} type="text" placeholder="Rechercher un produit..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none text-xs md:text-sm transition" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-gray-50 custom-scrollbar">
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 max-w-6xl mx-auto">
              {drugs.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map(drug => (
                <div key={drug.id} onClick={() => addToCart(drug)} className={`bg-white p-2.5 md:p-3 rounded-xl border transition shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between h-36 md:h-44 group relative overflow-hidden ${drug.stock === 0 ? 'opacity-50 pointer-events-none' : 'border-white hover:border-pharmacy-400'}`}>
                  <div>
                    <h3 className="font-black text-gray-800 text-[10px] md:text-xs leading-tight group-hover:text-pharmacy-600 truncate">{drug.name}</h3>
                    <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase mt-0.5 truncate">{drug.category}</p>
                  </div>
                  <div className="mt-1 md:mt-2 border-t border-gray-50 pt-1.5 md:pt-2">
                    <p className="font-black text-sm md:text-lg text-gray-900">{formatCurrency(drug.price).split(' ')[0]} <span className="text-[8px] md:text-[9px] text-gray-400">F</span></p>
                    <p className={`text-[8px] md:text-[9px] font-black uppercase mt-0.5 ${drug.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                       {drug.stock > 0 ? `${drug.stock} En stock` : 'Rupture'}
                    </p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Cart Sidebar/Overlay */}
      <>
        {isCartOpen && (
          <div className="fixed inset-0 bg-black/50 z-[80] lg:hidden" onClick={() => setIsCartOpen(false)} />
        )}
        <div className={`fixed lg:static inset-y-0 right-0 z-[90] lg:z-30 w-full sm:w-80 lg:w-96 bg-white border-l border-gray-200 shadow-2xl flex flex-col h-full transform transition-transform duration-300 ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
            <div className="p-3 md:p-4 bg-gray-900 text-white flex justify-between items-center shadow-lg">
               <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-pharmacy-600 rounded-lg"><ShoppingCart size={16} /></div>
                  <div>
                      <h3 className="font-black text-[10px] md:text-xs uppercase tracking-widest">{isPreparer && !isCashier ? 'Préparation Commande' : 'Caisse de Vente'}</h3>
                  </div>
               </div>
               <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg">
                 <X size={18} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2 bg-gray-50 custom-scrollbar">
               {cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-20 text-center px-6">
                   <ShoppingCart size={48} md:size={64} strokeWidth={1} />
                   <p className="mt-3 font-black uppercase tracking-widest text-[10px] md:text-xs">Panier vide</p>
                 </div>
               ) : (
                 cart.map(item => (
                   <div key={item.id} className="bg-white p-2 md:p-3 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
                      <div className="flex justify-between items-start mb-1.5 gap-2">
                          <span className="font-black text-gray-800 text-[10px] md:text-xs leading-tight">{item.name}</span>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition shrink-0"><X size={14} /></button>
                      </div>
                      <div className="flex justify-between items-center">
                          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                              <button onClick={() => updateQuantity(item.id, -1)} className="p-0.5 hover:bg-white rounded-md"><Minus size={10}/></button>
                              <span className="w-6 md:w-8 text-center font-black text-[10px] md:text-xs">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="p-0.5 hover:bg-white rounded-md"><Plus size={10}/></button>
                          </div>
                          <span className="font-black text-gray-900 text-[10px] md:text-xs">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="bg-white p-3 md:p-4 border-t border-gray-100 shadow-2xl">
               <div className="space-y-2 mb-3 md:mb-4">
                   <div className="flex justify-between text-gray-400 text-[8px] font-black uppercase tracking-widest">
                       <span>Sous-total</span>
                       <span>{formatCurrency(totalAmount)}</span>
                   </div>
                   
                   <div className="flex items-center justify-between">
                       <button onClick={() => setShowInsurance(!showInsurance)} className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 transition ${showInsurance ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-500'}`}>
                          <ShieldCheck size={12} /> Assurance {showInsurance ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                       </button>
                       {selectedInsuranceId && <span className="text-[10px] md:text-xs text-indigo-600 font-black">-{formatCurrency(insuranceAmount)}</span>}
                   </div>

                   {showInsurance && (
                       <div className="bg-indigo-50 p-2 md:p-3 rounded-xl border border-indigo-100 space-y-1.5 md:space-y-2 animate-fade-in">
                           <select value={selectedInsuranceId} onChange={(e) => handleInsuranceChange(e.target.value)} className="w-full p-2 border border-indigo-200 rounded-lg bg-white text-[10px] md:text-xs font-bold outline-none">
                              <option value="">Sélectionner</option>
                              {insurances.map(ins => <option key={ins.id} value={ins.id}>{ins.name} ({ins.defaultCoverage}%)</option>)}
                           </select>
                           {selectedInsuranceId && (
                               <div className="grid grid-cols-1 gap-1.5">
                                  <input type="text" placeholder="Nom Patient" value={patientName} onChange={e => setPatientName(e.target.value)} className="w-full p-2 border border-indigo-100 rounded-lg text-[9px] md:text-[10px] font-bold" />
                                  <input type="text" placeholder="Matricule" value={policyNumber} onChange={e => setPolicyNumber(e.target.value)} className="w-full p-2 border border-indigo-100 rounded-lg text-[9px] md:text-[10px] font-bold" />
                                </div>
                           )}
                       </div>
                   )}

                   <div className="flex justify-between items-end border-t border-gray-50 pt-2 md:pt-3">
                       <span className="font-black text-gray-400 uppercase tracking-widest text-[8px]">Net à Payer</span>
                       <span className="font-black text-pharmacy-700 text-xl md:text-2xl leading-none">{formatCurrency(patientAmount)}</span>
                   </div>
               </div>

               {isCashier || !isPreparer ? (
                  <div className="space-y-2 md:space-y-3">
                      <div className="grid grid-cols-3 gap-1.5">
                         {['CASH', 'MOBILE_MONEY', 'CARD'].map(m => (
                             <button key={m} onClick={() => setPaymentMethod(m as PaymentMethod)} className={`py-1.5 md:py-2 rounded-lg flex flex-col items-center justify-center border transition ${paymentMethod === m ? 'border-pharmacy-500 bg-pharmacy-50 text-pharmacy-700' : 'border-gray-50 bg-gray-50 text-gray-400'}`}>
                                 {m === 'CASH' ? <Banknote size={14} /> : m === 'CARD' ? <CreditCard size={14} /> : <Smartphone size={14} />}
                                 <span className="text-[8px] md:text-[9px] font-black uppercase mt-0.5">{m === 'CASH' ? 'Espèces' : m === 'CARD' ? 'Carte' : 'Mobile'}</span>
                             </button>
                         ))}
                      </div>

                      {paymentMethod === 'CASH' && (
                          <div className="bg-green-50 p-2 md:p-3 rounded-xl border border-green-100">
                              <div className="flex justify-between items-center mb-1">
                                  <label className="text-[8px] md:text-[9px] font-black text-green-700 uppercase tracking-widest">Reçu</label>
                                  {typeof amountReceived === 'number' && changeDue >= 0 && (
                                      <div className="text-[8px] font-black text-green-700 flex items-center gap-1">
                                          <Coins size={10} /> Rendu: {formatCurrency(changeDue)}
                                      </div>
                                  )}
                              </div>
                              <input ref={cashInputRef} type="number" placeholder="0" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full bg-white border border-green-200 rounded-lg p-1.5 md:p-2 text-lg md:text-xl font-black text-gray-900 outline-none" />
                          </div>
                      )}
                      
                      <button onClick={handleCheckout} disabled={cart.length === 0 || !isAmountSufficient} className={`w-full py-3 md:py-4 rounded-xl font-black text-sm md:text-base shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 ${cart.length === 0 || !isAmountSufficient ? 'bg-gray-200 text-gray-400' : 'bg-pharmacy-600 text-white hover:bg-pharmacy-700'}`}>
                          <CheckCircle size={18} md:size={20} /> VALIDER LE PAIEMENT
                      </button>
                  </div>
               ) : (
                  <button onClick={handleSendToCashier} disabled={cart.length === 0} className={`w-full py-3 md:py-4 rounded-xl font-black text-sm md:text-base shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 ${cart.length === 0 ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                      <Send size={18} md:size={20} /> ENVOYER CAISSE
                  </button>
               )}
            </div>
        </div>
      </>
    </div>
  );
};

export default POS;
