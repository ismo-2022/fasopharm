
const API_BASE_URL = 'http://localhost:8000/api'; // Ajustez l'URL de votre serveur Laravel

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  // 'Authorization': `Bearer ${localStorage.getItem('token')}` // Décommenter si vous utilisez Sanctum
});

export const apiService = {
  // Drugs
  getDrugs: async () => {
    const res = await fetch(`${API_BASE_URL}/drugs`, { headers: getHeaders() });
    return res.json();
  },
  saveDrug: async (drug: any) => {
    const method = drug.id && !drug.id.toString().startsWith('temp_') ? 'PUT' : 'POST';
    const url = method === 'PUT' ? `${API_BASE_URL}/drugs/${drug.id}` : `${API_BASE_URL}/drugs`;
    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(drug)
    });
    return res.json();
  },
  deleteDrug: async (id: string) => {
    await fetch(`${API_BASE_URL}/drugs/${id}`, { method: 'DELETE', headers: getHeaders() });
  },

  // Sales
  getSales: async () => {
    const res = await fetch(`${API_BASE_URL}/sales`, { headers: getHeaders() });
    return res.json();
  },
  createSale: async (sale: any) => {
    const res = await fetch(`${API_BASE_URL}/sales`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sale)
    });
    return res.json();
  },

  // Auth
  login: async (credentials: any) => {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error('Identifiants invalides');
    return res.json();
  },

  // Suppliers & Insurances
  getSuppliers: async () => {
    const res = await fetch(`${API_BASE_URL}/suppliers`, { headers: getHeaders() });
    return res.json();
  },
  getInsurances: async () => {
    const res = await fetch(`${API_BASE_URL}/insurances`, { headers: getHeaders() });
    return res.json();
  }
};
