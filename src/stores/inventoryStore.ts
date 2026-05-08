import { create } from 'zustand';
import type { InventoryItem, Movement } from '@/types';
import { supabase } from '@/lib/supabase';

interface InventoryState {
  items: InventoryItem[];
  movements: Movement[];
  loading: boolean;
  fetchItems: () => Promise<void>;
  fetchMovements: () => Promise<void>;
  addItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addMovement: (m: Omit<Movement, 'id' | 'moved_at'>) => Promise<void>;
}

// Helper: ensure numeric fields are numbers, not strings
function sanitizeItem(item: Partial<InventoryItem>): any {
  const out: any = { ...item };
  if ('quantity'  in out) out.quantity  = Number(out.quantity)  || 0;
  if ('total'     in out) out.total     = Number(out.total)     || 1;
  if ('min_stock' in out) out.min_stock = Number(out.min_stock) || 0;
  return out;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  movements: [],
  loading: false,

  fetchItems: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name');
    set({ items: (data as InventoryItem[]) ?? [], loading: false });
  },

  fetchMovements: async () => {
    const { data } = await supabase
      .from('movements')
      .select('*')
      .order('moved_at', { ascending: false });
    set({ movements: (data as Movement[]) ?? [] });
  },

  addItem: async (item) => {
    const { data } = await supabase
      .from('inventory_items')
      .insert(sanitizeItem(item))
      .select()
      .single();
    if (data) set({ items: [data as InventoryItem, ...get().items] });
  },

  updateItem: async (id, data) => {
    const { data: updated } = await supabase
      .from('inventory_items')
      .update(sanitizeItem(data))
      .eq('id', id)
      .select()
      .single();
    if (updated) {
      set({ items: get().items.map(i => i.id === id ? (updated as InventoryItem) : i) });
    }
  },

  deleteItem: async (id) => {
    await supabase.from('inventory_items').delete().eq('id', id);
    set({ items: get().items.filter(i => i.id !== id) });
  },

  addMovement: async (m) => {
    const payload = {
      item_id:     m.item_id     || null,
      item_name:   m.item_name,
      action:      m.action,
      quantity:    Number(m.quantity) || 1,
      responsible: m.responsible,
      notes:       m.notes,
      moved_at:    new Date().toISOString(),
    };
    const { data } = await supabase.from('movements').insert(payload).select().single();
    if (data) set({ movements: [data as Movement, ...get().movements] });
  },
}));
