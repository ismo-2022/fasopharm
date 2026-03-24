
import { Drug, Sale, User, Supplier, Insurance, Pharmacy, Broadcast } from '../types';
import { supabase } from './supabase';

class DatabaseService {
  // --- PHARMACIES ---
  async getPharmacies(): Promise<Pharmacy[]> {
    const { data, error } = await supabase
      .from('pharmacies')
      .select('*');
    if (error) throw error;
    return data || [];
  }

  async savePharmacy(pharmacy: Partial<Pharmacy>): Promise<Pharmacy> {
    const id = pharmacy.id || `pharma_${Date.now()}`;
    const { data, error } = await supabase
      .from('pharmacies')
      .upsert({ ...pharmacy, id })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deletePharmacy(id: string): Promise<void> {
    const { error } = await supabase
      .from('pharmacies')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // --- USERS ---
  async getUsers(pharmacyId?: string): Promise<User[]> {
    let query = supabase.from('users').select('*');
    if (pharmacyId) {
      query = query.eq('pharmacyId', pharmacyId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async saveUser(user: Partial<User>): Promise<User> {
    const id = user.id || `user_${Date.now()}`;
    const { data, error } = await supabase
      .from('users')
      .upsert({ ...user, id })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // --- DRUGS ---
  async getDrugs(pharmacyId?: string): Promise<Drug[]> {
    let query = supabase.from('drugs').select('*');
    if (pharmacyId) {
      query = query.eq('pharmacyId', pharmacyId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async saveDrug(drug: Partial<Drug>, userId?: string): Promise<Drug> {
    const id = drug.id || `drug_${Date.now()}`;
    const { data, error } = await supabase
      .from('drugs')
      .upsert({ ...drug, id })
      .select()
      .single();
    if (error) throw error;

    if (userId) {
      await this.logAction(userId, 'SAVE_DRUG', `Produit ${data.name} mis à jour/créé`);
    }
    return data;
  }

  async deleteDrug(id: string, userId?: string): Promise<void> {
    const { error } = await supabase
      .from('drugs')
      .delete()
      .eq('id', id);
    if (error) throw error;
    if (userId) {
      await this.logAction(userId, 'DELETE_DRUG', `Produit ${id} supprimé`);
    }
  }

  // --- SALES ---
  async createSale(sale: Sale, userId: string): Promise<Sale> {
    // 1. Enregistrer la vente
    const { data: savedSale, error: saleError } = await supabase
      .from('sales')
      .insert({
        ...sale,
        items: sale.items // Supabase JS client handles JSONB objects
      })
      .select()
      .single();
    
    if (saleError) throw saleError;

    // 2. Mettre à jour les stocks
    for (const item of sale.items) {
      const { data: drug } = await supabase
        .from('drugs')
        .select('stock')
        .eq('id', item.id)
        .single();
      
      if (drug) {
        await supabase
          .from('drugs')
          .update({ stock: drug.stock - item.quantity })
          .eq('id', item.id);
      }
    }

    await this.logAction(userId, 'CREATE_SALE', `Vente ${savedSale.id} enregistrée (${savedSale.total} F)`);
    return savedSale;
  }

  async getSales(pharmacyId?: string): Promise<Sale[]> {
    let query = supabase.from('sales').select('*').order('timestamp', { ascending: false });
    if (pharmacyId) {
      query = query.eq('pharmacyId', pharmacyId);
    }
    const { data, error } = await query;
    if (error) throw error;
    
    return data || [];
  }

  // --- INFRA ---
  async getSuppliers(pharmacyId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('pharmacyId', pharmacyId);
    if (error) throw error;
    return data || [];
  }

  async saveSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    const id = supplier.id || `sup_${Date.now()}`;
    const { data, error } = await supabase
      .from('suppliers')
      .upsert({ ...supplier, id })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteSupplier(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getInsurances(pharmacyId: string): Promise<Insurance[]> {
    const { data, error } = await supabase
      .from('insurances')
      .select('*')
      .eq('pharmacyId', pharmacyId);
    if (error) throw error;
    return data || [];
  }

  async saveInsurance(insurance: Partial<Insurance>): Promise<Insurance> {
    const id = insurance.id || `ins_${Date.now()}`;
    const { data, error } = await supabase
      .from('insurances')
      .upsert({ ...insurance, id })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteInsurance(id: string): Promise<void> {
    const { error } = await supabase
      .from('insurances')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // --- LOGGING & AUDIT ---
  async logAction(userId: string, action: string, details: string) {
    const { error } = await supabase
      .from('logs')
      .insert({
        userId,
        action,
        details,
        timestamp: new Date().toISOString()
      });
    if (error) console.error('Error logging action:', error);
  }

  async getAuditLogs(pharmacyId?: string) {
    let query = supabase
      .from('logs')
      .select(`
        *,
        users (
          fullName
        )
      `)
      .order('timestamp', { ascending: false })
      .limit(100);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // --- BACKUP & RESTORE ---
  async getBackupData(pharmacyId?: string) {
    const tables = ['pharmacies', 'users', 'drugs', 'sales', 'suppliers', 'insurances', 'broadcasts'];
    const backup: Record<string, any[]> = {};

    for (const table of tables) {
      let query = supabase.from(table).select('*');
      if (pharmacyId && ['drugs', 'sales', 'suppliers', 'insurances', 'users'].includes(table)) {
        query = query.eq('pharmacyId', pharmacyId);
      }
      const { data } = await query;
      backup[table] = data || [];
    }

    return backup;
  }

  async restoreBackupData(backup: Record<string, any[]>, userId: string) {
    // Order matters for foreign keys
    const tables = ['pharmacies', 'users', 'suppliers', 'insurances', 'drugs', 'sales', 'broadcasts'];
    
    for (const table of tables) {
      if (backup[table] && backup[table].length > 0) {
        const { error } = await supabase.from(table).upsert(backup[table]);
        if (error) {
          console.error(`Error restoring table ${table}:`, error);
          throw error;
        }
      }
    }

    await this.logAction(userId, 'RESTORE_BACKUP', `Restauration complète effectuée`);
  }

  // --- BROADCASTS ---
  async getBroadcasts(): Promise<Broadcast[]> {
    const { data, error } = await supabase
      .from('broadcasts')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async saveBroadcast(broadcast: Partial<Broadcast>): Promise<Broadcast> {
    const id = broadcast.id || `bc_${Date.now()}`;
    const { data, error } = await supabase
      .from('broadcasts')
      .upsert({ ...broadcast, id, timestamp: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteBroadcast(id: string): Promise<void> {
    const { error } = await supabase
      .from('broadcasts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}

export const dbService = new DatabaseService();
