import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handler for debugging white screens
window.onerror = (message, source, lineno, colno, error) => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    // Only show if the root element is empty (meaning React didn't render anything)
    if (rootElement.innerHTML.trim() === '' || rootElement.innerHTML.includes('Chargement')) {
      rootElement.innerHTML = `
        <div style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; margin: 20px; font-family: sans-serif; text-align: center;">
          <h2 style="margin-top: 0; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em;">Erreur d'initialisation</h2>
          <p style="font-size: 14px; color: #856404; margin-bottom: 20px;">L'application n'a pas pu démarrer. Détails :</p>
          <div style="background: #fff; padding: 15px; border-radius: 8px; text-align: left; border: 1px solid #eee; overflow: auto; max-height: 200px;">
            <pre style="white-space: pre-wrap; word-break: break-all; font-size: 11px; margin: 0; font-family: monospace; color: #d73a49;">${message}</pre>
          </div>
          <p style="font-size: 12px; margin-top: 20px; font-weight: bold; color: #16a34a;">Vérifiez vos variables d'environnement Supabase.</p>
          <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #16a34a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Réessayer</button>
        </div>
      `;
    }
  }
  return false;
};

console.log('Fasopharm Cloud: Initializing application...');
console.log('Environment check:', {
  hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
