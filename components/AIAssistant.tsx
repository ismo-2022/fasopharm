
import React, { useState, useRef, useEffect } from 'react';
import { Message, Drug, Sale, Supplier, Insurance, CartItem } from '../types';
import { getChatResponse } from '../services/geminiService';
import { Send, Bot, User, Sparkles, Database, Stethoscope, PlusCircle, AlertCircle } from 'lucide-react';

interface AIAssistantProps {
  drugs: Drug[];
  sales: Sale[];
  suppliers: Supplier[];
  insurances: Insurance[];
  onAddToCart?: (drug: Drug) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ drugs, sales, suppliers, insurances, onAddToCart }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'model', text: 'Bonjour ! Je suis l\'IA de Fasopharm. Décrivez-moi les symptômes du client ou posez-moi une question sur le stock pour que je puisse vous aider.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => m.text);

    const contextData = JSON.stringify({
      inventaire_disponible: drugs.map(d => ({
        id: d.id,
        nom: d.name,
        prix: d.price,
        stock: d.stock,
        categorie: d.category,
        dosage: d.dosage
      })),
      mission_specifique: "Si l'utilisateur décrit des symptômes, suggère une ordonnance parmi les produits en stock. Donne la posologie. Ajoute toujours un avertissement : 'Ceci est une suggestion IA, la validation du pharmacien est obligatoire'."
    });
    
    const responseText = await getChatResponse(history, userMsg.text, contextData);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  // Fonction pour extraire et afficher les produits suggérés comme boutons d'action
  const renderMessageContent = (text: string) => {
    // On cherche les noms de médicaments du stock dans le texte pour proposer l'ajout au panier
    const foundDrugs = drugs.filter(d => text.toLowerCase().includes(d.name.toLowerCase()));

    return (
      <div className="space-y-3">
        <p className="leading-relaxed">{text}</p>
        {foundDrugs.length > 0 && onAddToCart && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Ajouter au panier :</p>
            <div className="flex flex-wrap gap-2">
              {foundDrugs.map(drug => (
                <button 
                  key={drug.id}
                  onClick={() => onAddToCart(drug)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-pharmacy-50 text-pharmacy-700 rounded-lg border border-pharmacy-200 hover:bg-pharmacy-100 transition text-xs font-bold"
                >
                  <PlusCircle size={14} />
                  {drug.name} ({drug.price} F)
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden m-4">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-pharmacy-700 to-indigo-600 text-white flex items-center gap-3 shadow-sm justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
            <Stethoscope size={24} />
          </div>
          <div>
            <h2 className="font-bold text-lg">Assistant Diagnostic IA</h2>
            <p className="text-xs text-pharmacy-100 opacity-80">Suggestions d'ordonnance & Stocks</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1 text-[10px] bg-black/20 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
          <Database size={12} />
          <span>Stock Sync</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-white text-gray-400 border border-gray-200' : 'bg-pharmacy-600 text-white'
              }`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm text-sm ${
                msg.role === 'user' 
                ? 'bg-pharmacy-700 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                {msg.role === 'model' ? renderMessageContent(msg.text) : msg.text}
                <p className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
             <div className="flex max-w-[80%] gap-3">
              <div className="w-9 h-9 rounded-xl bg-pharmacy-100 text-pharmacy-600 flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm rounded-tl-none flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-pharmacy-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-pharmacy-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-pharmacy-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Warning Box */}
      <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
        <AlertCircle size={14} className="text-amber-600 shrink-0" />
        <p className="text-[10px] text-amber-700 font-medium">L'IA assiste mais ne remplace pas l'expertise du pharmacien diplômé.</p>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 shadow-inner bg-gray-50 text-sm"
            placeholder="Décrivez les symptômes (ex: toux sèche, fièvre depuis hier)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-pharmacy-600 text-white p-3 rounded-xl hover:bg-pharmacy-700 disabled:opacity-50 shadow-lg transition transform active:scale-95"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
