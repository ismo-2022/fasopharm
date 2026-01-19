
import React, { useState } from 'react';
import { User, Pharmacy } from '../types';
import { Lock, User as UserIcon, Activity, AlertCircle, ShieldAlert } from 'lucide-react';

interface LoginProps {
  users: User[];
  pharmacies?: Pharmacy[];
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, pharmacies = [], onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPharmaSuspended, setIsPharmaSuspended] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPharmaSuspended(false);

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      // Check for Super Admin (always has access)
      if (user.role === 'SUPER_ADMIN') {
        onLogin(user);
        return;
      }

      // Check for regular user pharmacy status
      if (user.pharmacyId) {
        const pharma = pharmacies.find(p => p.id === user.pharmacyId);
        if (pharma && pharma.status === 'SUSPENDED') {
          setIsPharmaSuspended(true);
          setError(`Accès révoqué : L'établissement "${pharma.name}" est actuellement suspendu par l'administration centrale.`);
          return;
        }
      }
      
      onLogin(user);
    } else {
      setError('Identifiants de connexion incorrects. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="bg-pharmacy-600 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity size={120} />
          </div>
          <div className="inline-flex p-4 bg-white/20 rounded-2xl mb-4 backdrop-blur-md shadow-inner">
            <Activity className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Fasopharm</h1>
          <p className="text-pharmacy-100 mt-2 font-medium tracking-wide">Infrastructure Cloud Pharmaceutique</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          {error && (
            <div className={`p-4 rounded-xl text-sm flex items-start gap-3 border animate-shake ${
                isPharmaSuspended ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {isPharmaSuspended ? <ShieldAlert size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
              <p className="font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Identifiant Staff</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-300" />
                </div>
                <input
                  type="text"
                  required
                  className="pl-12 w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none transition-all bg-gray-50/50"
                  placeholder="nom.utilisateur"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Clé d'Accès</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-300" />
                </div>
                <input
                  type="password"
                  required
                  className="pl-12 w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pharmacy-500 outline-none transition-all bg-gray-50/50"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-pharmacy-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-pharmacy-700 transition duration-300 shadow-xl shadow-pharmacy-600/20 transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            S'authentifier
          </button>

          <div className="text-center pt-4">
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-3">Modes d'accès rapides</p>
            <div className="flex flex-wrap justify-center gap-2">
                <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] text-gray-400 font-mono">
                   <span className="font-black text-gray-500">Super:</span> superadmin / root
                </div>
                <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] text-gray-400 font-mono">
                   <span className="font-black text-gray-500">Admin:</span> admin / 123
                </div>
            </div>
          </div>
        </form>
      </div>
      <p className="mt-8 text-gray-400 text-xs font-medium">© 2025 Fasopharm Infrastructure Group. Tous droits réservés.</p>
    </div>
  );
};

export default Login;
