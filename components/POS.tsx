
import React, { useState, useEffect, useRef } from 'react';
import { Drug, CartItem, Sale, PaymentMethod, User, Insurance, PendingOrder, Pharmacy } from '../types';
import { ShoppingCart, Plus, Minus, Trash, Search, AlertOctagon, CreditCard, Banknote, Smartphone, Printer, CheckCircle, ShieldCheck, Camera, Loader2, User as UserIcon, FileText, Send, Clock, X, RefreshCw, ChevronDown, ChevronUp, Coins, Store, MapPin, Phone } from 'lucide-react';
import { checkDrugInteractions, analyzeMedicineBox } from '../services/geminiService';

interface POSProps {
  drugs: Drug[];
  setDrugs: React.Dispatch<React.SetStateAction<Drug[]>>;
  insurances: Insurance[];
  onSaleComplete: (sale: Sale) => void;
  currentUser: User;
  pendingOrders: PendingOrder[];
  setPendingOrders: React.Dispatch<React.SetStateAction<PendingOrder[]>>;
  pharmacies: Pharmacy[]; // Ajout des pharmacies pour l'affichage dynamique
}

const POS: React.FC<POSProps> = ({ drugs, setDrugs, insurances, onSaleComplete, currentUser, pendingOrders, setPendingOrders, pharmacies }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [interactionAlert, setInteractionAlert] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
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

  // Get Current Pharmacy Details
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
      alert("Infos patient requises pour l'assurance.");
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

  const formatCurrency = (value: number) => value.toLocaleString('fr-FR') + ' FCFA';

  const PendingTicketModal = () => {
      if (!showPendingTicket) return null;
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-80 text-center border-t-4 border-pharmacy-500">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{currentPharmacy.name}</p>
                <h3 className="text-xl font-bold text-gray-800">Ticket de Préparation</h3>
                <div className="bg-gray-100 p-6 rounded-xl border-2 border-dashed border-gray-300 my-6">
                    <p className="text-5xl font-mono font-black text-gray-900">{showPendingTicket.ticketNumber}</p>
                </div>
                <p className="text-xs text-gray-500 mb-6 italic">Veuillez présenter ce numéro à la caisse pour le règlement.</p>
                <button onClick={() => setShowPendingTicket(null)} className="w-full py-3 bg-pharmacy-600 text-white rounded-xl hover:bg-pharmacy-700 font-bold shadow-lg">Terminer</button>
            </div>
        </div>
      );
  }

  const ReceiptModal = () => {
    if (!showReceipt) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden flex flex-col max-h-[90vh]">
          <div className="bg-gray-800 text-white p-6 text-center">
            <h3 className="font-black uppercase tracking-widest">Reçu de Vente</h3>
          </div>
          
          <div className="p-8 bg-white font-mono text-sm overflow-y-auto flex-1">
            <div className="text-center mb-6">
              <p className="font-black text-2xl uppercase tracking-tighter text-gray-900">{currentPharmacy.name}</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">{currentPharmacy.address}</p>
              <p className="text-[10px] text-gray-500 font-bold">TEL: {currentPharmacy.phone}</p>
            </div>
            
            <div className="border-b border-dashed border-gray-300 my-4"></div>
            
            <div className="flex justify-between text-[10px] mb-4 text-gray-500">
              <span>REÇU: {showReceipt.id}</span>
              <span>{new Date(showReceipt.timestamp).toLocaleString()}</span>
            </div>
            
            {showReceipt.insuranceName && (
              <div className="my-4 border border-indigo-200 p-3 rounded-lg text-[11px] bg-indigo-50">
                <p className="font-black text-indigo-800">ASSURANCE: {showReceipt.insuranceName}</p>
                <p>PATIENT: {showReceipt.patientName}</p>
                <p>MATRICULE: {showReceipt.policyNumber}</p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {showReceipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="max-w-[180px] leading-tight">{item.quantity} x {item.name}</span>
                  <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-b border-dashed border-gray-300 my-4"></div>
            
            <div className="space-y-1">
                <div className="flex justify-between font-bold text-gray-600">
                  <span>TOTAL BRUT</span>
                  <span>{formatCurrency(showReceipt.total)}</span>
                </div>

                {showReceipt.insuranceName && (
                   <div className="flex justify-between text-indigo-600 font-bold">
                       <span>PART TIERS-PAYANT ({showReceipt.insuranceCoverageRate}%)</span>
                       <span>-{formatCurrency(showReceipt.insuranceAmount || 0)}</span>
                   </div>
                )}
                
                <div className="flex justify-between font-black text-xl text-gray-900 pt-4 mt-2 border-t border-gray-100">
                  <span>NET À PAYER</span>
                  <span>{formatCurrency(showReceipt.patientAmount || showReceipt.total)}</span>
                </div>

                {showReceipt.paymentMethod === 'CASH' && (
                    <div className="mt-4 pt-4 border-t border-gray-50 space-y-1 text-right text-xs">
                      <div className="text-gray-400">ESPÈCES REÇU: {formatCurrency(showReceipt.amountReceived || 0)}</div>
                      <div className="font-black text-gray-800">MONNAIE RENDUE: {formatCurrency(showReceipt.changeGiven || 0)}</div>
                    </div>
                )}
            </div>
            
            <div className="text-center mt-10 space-y-1">
              <p className="text-[10px] text-gray-400 font-bold">MODE: {showReceipt.paymentMethod}</p>
              <p className="text-[10px] text-gray-400 font-bold">SERVI PAR: {showReceipt.servedBy}</p>
              <p className="text-xs font-black mt-4 uppercase">*** Merci de votre confiance ***</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 flex gap-3 border-t border-gray-200">
             <button onClick={() => setShowReceipt(null)} className="flex-1 py-4 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300">Fermer</button>
             <button onClick={() => { window.print(); setShowReceipt(null); }} className="flex-[2] py-4 bg-pharmacy-600 text-white rounded-xl font-bold hover:bg-pharmacy-700 flex justify-center items-center gap-2 shadow-lg">
               <Printer size={20} /> Imprimer Reçu
             </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden relative">
      {showReceipt && <ReceiptModal />}
      {showPendingTicket && <PendingTicketModal />}
      
      {/* Pending Orders Bar */}
      {isCashier && localPendingOrders.length > 0 && (
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-20 shadow-xl">
              <div className="p-4 bg-indigo-600 text-white">
                  <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} /> Tickets en attente
                  </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {localPendingOrders.map(order => (
                      <div key={order.id} onClick={() => {setCart(order.items); if(order.insuranceId) handleInsuranceChange(order.insuranceId); setPendingOrders(prev => prev.filter(o => o.id !== order.id));}} className="p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-pharmacy-400 hover:shadow-md cursor-pointer transition">
                          <div className="flex justify-between items-center mb-2">
                              <span className="font-mono font-black text-2xl text-pharmacy-600">{order.ticketNumber}</span>
                              <span className="text-[10px] font-bold text-gray-400">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-[10px] font-black text-gray-400 uppercase truncate">Par: {order.preparedBy}</p>
                          <p className="text-sm font-black text-gray-800 mt-1">{formatCurrency(order.total)}</p>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10">
           <div className="flex gap-4 max-w-5xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input ref={searchInputRef} type="text" placeholder="Rechercher un produit..." className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none text-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition font-bold shadow-sm">
                 {isScanning ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                 <span className="hidden md:inline">Scanner IA</span>
                 <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        setIsScanning(true);
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            const result = await analyzeMedicineBox(reader.result as string);
                            if (result?.name) {
                                const found = drugs.find(d => d.name.toLowerCase().includes(result.name!.toLowerCase()));
                                if (found) addToCart(found);
                                else alert(`Produit "${result.name}" non trouvé en stock.`);
                            }
                            setIsScanning(false);
                        };
                        reader.readAsDataURL(file);
                    }
                 }} />
              </label>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-6xl mx-auto">
              {drugs.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map(drug => (
                <div key={drug.id} onClick={() => addToCart(drug)} className={`bg-white p-4 rounded-2xl border-2 transition shadow-sm hover:shadow-xl cursor-pointer flex flex-col justify-between h-52 group relative overflow-hidden ${drug.stock === 0 ? 'opacity-50 pointer-events-none' : 'border-white hover:border-pharmacy-400'}`}>
                  {drug.stock < 20 && drug.stock > 0 && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-3 py-1 font-black rounded-bl-xl">STOCK BAS</div>}
                  <div>
                    <h3 className="font-black text-gray-800 leading-tight group-hover:text-pharmacy-600 transition">{drug.name}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase mt-1">{drug.category}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{drug.dosage}</p>
                  </div>
                  <div className="mt-4 border-t border-gray-50 pt-3">
                    <p className="font-black text-2xl text-gray-900">{formatCurrency(drug.price).split(' ')[0]} <span className="text-[10px] text-gray-400">F</span></p>
                    <p className={`text-[10px] font-black uppercase mt-1 ${drug.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                       {drug.stock > 0 ? `${drug.stock} Disponibles` : 'Rupture'}
                    </p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-[420px] bg-white border-l border-gray-200 shadow-2xl flex flex-col h-full z-30">
          <div className="p-5 bg-gray-900 text-white flex justify-between items-center shadow-lg">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-pharmacy-600 rounded-lg"><ShoppingCart size={20} /></div>
                <div>
                    <h3 className="font-black text-sm uppercase tracking-widest">{isPreparer && !isCashier ? 'Préparation' : 'Caisse'}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{currentPharmacy.name}</p>
                </div>
             </div>
             {cart.length > 0 && <button onClick={() => setCart([])} className="text-gray-500 hover:text-white transition"><Trash size={20} /></button>}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
             {cart.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-20 text-center px-10">
                 <ShoppingCart size={80} strokeWidth={1} />
                 <p className="mt-4 font-black uppercase tracking-widest text-sm">Le panier est vide</p>
               </div>
             ) : (
               cart.map(item => (
                 <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm animate-fade-in">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-black text-gray-800 leading-tight">{item.name}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition"><X size={18} /></button>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center bg-gray-100 rounded-xl p-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-lg transition shadow-sm"><Minus size={14}/></button>
                            <span className="w-10 text-center font-black text-sm">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-lg transition shadow-sm"><Plus size={14}/></button>
                        </div>
                        <span className="font-black text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                 </div>
               ))
             )}
          </div>

          <div className="bg-white p-6 border-t border-gray-100 shadow-2xl">
             <div className="space-y-3 mb-6">
                 <div className="flex justify-between text-gray-400 text-xs font-black uppercase tracking-widest">
                     <span>Sous-total</span>
                     <span>{formatCurrency(totalAmount)}</span>
                 </div>
                 
                 <div className="flex items-center justify-between">
                     <button onClick={() => setShowInsurance(!showInsurance)} className={`text-xs font-black uppercase tracking-widest flex items-center gap-1 transition ${showInsurance ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-500'}`}>
                        <ShieldCheck size={14} /> Tiers-Payant {showInsurance ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                     </button>
                     {selectedInsuranceId && <span className="text-sm text-indigo-600 font-black">-{formatCurrency(insuranceAmount)}</span>}
                 </div>

                 {showInsurance && (
                     <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-3 animate-fade-in">
                         <select value={selectedInsuranceId} onChange={(e) => handleInsuranceChange(e.target.value)} className="w-full p-3 border border-indigo-200 rounded-xl bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Sélectionner une Assurance</option>
                            {insurances.map(ins => <option key={ins.id} value={ins.id}>{ins.name} ({ins.defaultCoverage}%)</option>)}
                         </select>
                         {selectedInsuranceId && (
                             <div className="grid grid-cols-1 gap-2">
                                <input type="text" placeholder="Nom Complet Patient" value={patientName} onChange={e => setPatientName(e.target.value)} className="w-full p-3 border border-indigo-100 rounded-xl text-xs font-bold" />
                                <input type="text" placeholder="N° de Carte/Matricule" value={policyNumber} onChange={e => setPolicyNumber(e.target.value)} className="w-full p-3 border border-indigo-100 rounded-xl text-xs font-bold" />
                             </div>
                         )}
                     </div>
                 )}

                 <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                     <span className="font-black text-gray-400 uppercase tracking-widest text-xs">Net à Payer</span>
                     <span className="font-black text-pharmacy-700 text-4xl leading-none">{formatCurrency(patientAmount)}</span>
                 </div>
             </div>

             {isCashier || !isPreparer ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                       {['CASH', 'MOBILE_MONEY', 'CARD'].map(m => (
                           <button key={m} onClick={() => setPaymentMethod(m as PaymentMethod)} className={`py-3 rounded-xl flex flex-col items-center justify-center border-2 transition ${paymentMethod === m ? 'border-pharmacy-500 bg-pharmacy-50 text-pharmacy-700' : 'border-gray-50 bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                               {m === 'CASH' ? <Banknote size={20} /> : m === 'CARD' ? <CreditCard size={20} /> : <Smartphone size={20} />}
                               <span className="text-[10px] font-black uppercase mt-1">{m === 'CASH' ? 'Espèces' : m === 'CARD' ? 'Carte' : 'Mobile'}</span>
                           </button>
                       ))}
                    </div>

                    {paymentMethod === 'CASH' && (
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-black text-green-700 uppercase tracking-widest">Montant Encaissé</label>
                                {typeof amountReceived === 'number' && changeDue >= 0 && (
                                    <div className="text-xs font-black text-green-700 flex items-center gap-1">
                                        <Coins size={14} /> Rendre: {formatCurrency(changeDue)}
                                    </div>
                                )}
                            </div>
                            <input ref={cashInputRef} type="number" placeholder="Entrer le reçu..." value={amountReceived} onChange={(e) => setAmountReceived(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full bg-white border border-green-200 rounded-xl p-3 text-2xl font-black text-gray-900 outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                    )}
                    
                    <button onClick={handleCheckout} disabled={cart.length === 0 || !isAmountSufficient} className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2 ${cart.length === 0 || !isAmountSufficient ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-pharmacy-600 text-white hover:bg-pharmacy-700'}`}>
                        <CheckCircle size={24} /> {paymentMethod === 'CASH' && !isAmountSufficient ? 'MONTANT REÇU INSUFFISANT' : 'VALIDER LE RÈGLEMENT'}
                    </button>
                </div>
             ) : (
                <button onClick={handleSendToCashier} disabled={cart.length === 0} className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2 ${cart.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    <Send size={24} /> ENVOYER À LA CAISSE
                </button>
             )}
          </div>
      </div>
    </div>
  );
};

export default POS;
