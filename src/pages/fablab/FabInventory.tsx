import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, ArrowUp, ArrowDown, Pencil, Trash2, Search,
  Package, AlertTriangle, Upload, FileDown, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useAuthStore } from '@/stores/authStore';
import { INV_CATS, UNIT_MEASURES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { PageTransition } from '@/components/layout/PageTransition';
import type { InventoryCategory } from '@/types';

// ─── Constants ──────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', category: 'Equipamento' as InventoryCategory,
  subcategory: '', quantity: 0, total: 1, unit_measure: 'un',
  description: '', location: '', min_stock: 0,
};

const CAT_COLORS: Record<string, string> = {
  'Equipamento': '#2563eb', 'Eletrônico': '#7c3aed', 'Ferramenta': '#ea580c',
  'Insumo': '#059669', 'Material': '#0891b2', 'Consumível': '#D42020',
  'EPI': '#d97706', 'Outro': '#6b7280',
};

const VALID_CATS = ['Equipamento','Eletrônico','Ferramenta','Insumo','Material','Consumível','EPI','Outro'];

// ─── CSV Template ────────────────────────────────────────────────
const CSV_TEMPLATE = [
  'nome,categoria,subcategoria,quantidade_atual,quantidade_total,unidade,localizacao,estoque_minimo,descricao',
  'Arduino Uno,Eletrônico,Microcontrolador,5,10,un,Prateleira A1,2,Rev3 com USB',
  'Filamento PLA 1kg,Insumo,Filamento,3,5,kg,Armário B,1,Cor branca 1.75mm',
  'Alicate de Bico,Ferramenta,,2,2,un,Gaveta C3,1,',
].join('\n');

// ─── Component ──────────────────────────────────────────────────
export function FabInventory() {
  const { t: _t } = useTranslation();
  const { items, movements, addItem, updateItem, deleteItem, addMovement, fetchItems, fetchMovements } = useInventoryStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchItems(); fetchMovements(); }, []);

  // ── UI state ──
  const [tab,        setTab]        = useState<'items' | 'history'>('items');
  const [filter,     setFilter]     = useState('all');
  const [catFilter,  setCatFilter]  = useState('all');
  const [search,     setSearch]     = useState('');

  // ── Item form ──
  const [addOpen,    setAddOpen]    = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const setF = (k: keyof typeof EMPTY_FORM, v: any) => setForm(p => ({ ...p, [k]: v }));

  // ── Movement ──
  const [moveItem,   setMoveItem]   = useState<{ id: string; type: 'entrada' | 'saida' } | null>(null);
  const [moveForm,   setMoveForm]   = useState({ quantity: 1, notes: '', responsible: user?.name || '' });

  // ── Delete ──
  const [deleteId,   setDeleteId]   = useState<string | null>(null);

  // ── CSV ──
  const [csvModal,      setCsvModal]      = useState(false);
  const [csvError,      setCsvError]      = useState('');
  const [csvImporting,  setCsvImporting]  = useState(false);
  const [csvPreview,    setCsvPreview]    = useState<any[]>([]);
  const csvRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'professor';

  // ── Derived ──
  const filtered = items.filter(i => {
    const okStatus =
      filter === 'all' ||
      (filter === 'in'  && i.quantity > 0) ||
      (filter === 'out' && i.quantity === 0) ||
      (filter === 'low' && i.quantity > 0 && i.quantity < i.total * 0.3);
    const okCat    = catFilter === 'all' || i.category === catFilter;
    const okSearch = !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.description ?? '').toLowerCase().includes(search.toLowerCase());
    return okStatus && okCat && okSearch;
  });

  const totalItems = items.length;
  const available  = items.filter(i => i.quantity > 0).length;
  const critical   = items.filter(i => i.quantity > 0 && i.quantity < i.total * 0.3).length;
  const outOfStock = items.filter(i => i.quantity === 0).length;

  const stockStatus = (i: typeof items[0]) => {
    if (i.quantity === 0) return { label: 'Esgotado', variant: 'destructive' as const, pct: 0 };
    const p = i.total > 0 ? (i.quantity / i.total) * 100 : 100;
    if (p < 30) return { label: 'Crítico',    variant: 'secondary'    as const, pct: p };
    return           { label: 'Disponível', variant: 'default'      as const, pct: p };
  };

  // ── Item CRUD ──
  const openAdd  = () => { setEditItemId(null); setForm(EMPTY_FORM); setAddOpen(true); };
  const openEdit = (item: typeof items[0]) => {
    setForm({
      name: item.name, category: item.category as InventoryCategory,
      subcategory: item.subcategory || '', quantity: item.quantity, total: item.total,
      unit_measure: (item as any).unit_measure || 'un',
      description: item.description, location: (item as any).location || '',
      min_stock: (item as any).min_stock || 0,
    });
    setEditItemId(item.id);
    setAddOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(), category: form.category,
      subcategory: form.subcategory,
      quantity: Number(form.quantity), total: Number(form.total),
      unit_measure: form.unit_measure,
      status: Number(form.quantity) > 0 ? 'in' as const : 'out' as const,
      description: form.description, location: form.location,
      min_stock: Number(form.min_stock),
      last_action: new Date().toISOString().split('T')[0],
      last_action_by: user?.name || '',
    };
    if (editItemId) { updateItem(editItemId, payload); setEditItemId(null); setAddOpen(false); }
    else            { addItem(payload); setAddOpen(false); }
    setForm(EMPTY_FORM);
  };

  // ── Movement ──
  const handleMove = () => {
    if (!moveItem) return;
    const item = items.find(i => i.id === moveItem.id);
    if (!item) return;
    const delta  = Number(moveForm.quantity);
    if (delta <= 0) return;
    const newQty = moveItem.type === 'entrada' ? item.quantity + delta : item.quantity - delta;
    if (newQty < 0) return;
    updateItem(moveItem.id, {
      quantity: newQty, status: newQty > 0 ? 'in' : 'out',
      last_action: new Date().toISOString().split('T')[0],
      last_action_by: moveForm.responsible,
    });
    addMovement({
      item_id: moveItem.id, item_name: item.name,
      action: moveItem.type, quantity: delta,
      responsible: moveForm.responsible, notes: moveForm.notes,
    });
    setMoveItem(null);
    setMoveForm({ quantity: 1, notes: '', responsible: user?.name || '' });
  };

  // ── CSV helpers ──
  const downloadTemplate = () => {
    const blob = new Blob(['\uFEFF' + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'modelo-importacao-inventario.csv';
    a.click();
  };

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError('');
    setCsvPreview([]);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setCsvError('Selecione um arquivo .csv'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text  = (ev.target?.result as string).replace(/\r/g, '');
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { setCsvError('Arquivo CSV vazio ou sem dados.'); return; }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
        const rows = lines.slice(1)
          .map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj: any = {};
            headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
            return obj;
          })
          .filter(r => r.nome || r.name);
        if (rows.length === 0) { setCsvError('Nenhuma linha de dados encontrada.'); return; }
        setCsvPreview(rows);
      } catch {
        setCsvError('Erro ao ler o arquivo. Verifique o formato.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const importCSV = async () => {
    if (csvPreview.length === 0) return;
    setCsvImporting(true);
    setCsvError('');
    let ok = 0; let errs = 0;
    for (const row of csvPreview) {
      let cat = row.categoria || row.category || 'Outro';
      if (!VALID_CATS.includes(cat)) cat = 'Outro';
      const qty = Number(row.quantidade_atual ?? row.quantity ?? row.quantidade ?? 0);
      const payload = {
        name:           row.nome || row.name || 'Item sem nome',
        category:       cat,
        subcategory:    row.subcategoria || row.subcategory || '',
        quantity:       qty,
        total:          Number((row.quantidade_total ?? row.total ?? qty) || 1),
        unit_measure:   row.unidade || row.unit_measure || 'un',
        location:       row.localizacao || row.location || '',
        min_stock:      Number(row.estoque_minimo ?? row.min_stock ?? 0),
        description:    row.descricao || row.description || '',
        status:         qty > 0 ? 'in' : 'out',
        last_action:    new Date().toISOString().split('T')[0],
        last_action_by: user?.name || '',
      };
      const { error } = await supabase.from('inventory_items').insert(payload);
      if (error) errs++; else ok++;
    }
    await fetchItems();
    setCsvImporting(false);
    if (errs > 0) {
      setCsvError(`${ok} itens importados. ${errs} falharam (verifique categorias e campos obrigatórios).`);
    } else {
      setCsvModal(false);
      setCsvPreview([]);
      if (csvRef.current) csvRef.current.value = '';
    }
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">
            {tab === 'items' ? 'Inventário' : 'Histórico de Movimentações'}
          </h1>
          <p className="text-sm text-muted-foreground">{totalItems} itens · {outOfStock} esgotados</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={tab === 'items'   ? 'default' : 'outline'} onClick={() => setTab('items')}>Itens</Button>
          <Button size="sm" variant={tab === 'history' ? 'default' : 'outline'} onClick={() => setTab('history')}>Histórico</Button>

          {isAdmin && tab === 'items' && (
            <>
              <Button size="sm" variant="outline" onClick={downloadTemplate} title="Baixar modelo CSV">
                <FileDown size={14} className="mr-1" /> Modelo CSV
              </Button>
              <Button size="sm" variant="outline"
                style={{ borderColor: 'var(--fab-primary)', color: 'var(--fab-primary)' }}
                onClick={() => { setCsvModal(true); setCsvPreview([]); setCsvError(''); }}>
                <Upload size={14} className="mr-1" /> Importar CSV
              </Button>
              <Button size="sm" onClick={openAdd} style={{ background: 'var(--fab-primary)' }}>
                <Plus size={14} className="mr-1" /> Cadastrar item
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {tab === 'items' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total',       value: totalItems, icon: <Package size={16} />,       color: '#2563eb' },
            { label: 'Disponíveis', value: available,  icon: <Check size={16} />,          color: '#059669' },
            { label: 'Críticos',    value: critical,   icon: <AlertTriangle size={16} />,  color: '#d97706' },
            { label: 'Esgotados',   value: outOfStock, icon: <Package size={16} />,        color: '#D42020' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: s.color + '15', color: s.color }}>{s.icon}</div>
              <div>
                <div className="text-xl font-extrabold leading-none">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Items tab */}
      {tab === 'items' && (
        <>
          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar item..." className="pl-9 h-9 text-sm" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { val: 'all', label: 'Todos' }, { val: 'in', label: 'Disponível' },
                { val: 'out', label: 'Esgotado' }, { val: 'low', label: 'Crítico' },
              ].map(f => (
                <button key={f.val} onClick={() => setFilter(f.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                    ${filter === f.val
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-sm">
              <option value="all">Todas categorias</option>
              {INV_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(item => {
              const st       = stockStatus(item);
              const catColor = CAT_COLORS[item.category] || '#6b7280';
              return (
                <div key={item.id}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: catColor + '15', color: catColor }}>{item.category}</span>
                        {(item as any).subcategory && (
                          <span className="text-[10px] text-muted-foreground">{(item as any).subcategory}</span>
                        )}
                        <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                      </div>
                      <h3 className="font-semibold text-sm leading-snug truncate">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                      {(item as any).location && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{(item as any).location}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}>
                          <Pencil size={12} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Stock bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">Estoque</span>
                      <span className="text-xs font-bold">
                        {item.quantity}
                        <span className="font-normal text-muted-foreground">
                          /{item.total} {(item as any).unit_measure || 'un'}
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(st.pct, 100)}%`,
                          background: st.pct < 30 ? '#D42020' : st.pct < 60 ? '#d97706' : '#059669',
                        }} />
                    </div>
                    {(item as any).min_stock > 0 && item.quantity <= (item as any).min_stock && (
                      <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> Abaixo do estoque mínimo ({(item as any).min_stock})
                      </p>
                    )}
                  </div>

                  {/* Move buttons */}
                  <div className="flex gap-2 pt-1 border-t border-border/50">
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1"
                      onClick={() => { setMoveItem({ id: item.id, type: 'entrada' }); setMoveForm({ quantity: 1, notes: '', responsible: user?.name || '' }); }}>
                      <ArrowDown size={11} className="text-green-600" /> Entrada
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1"
                      disabled={item.quantity === 0}
                      onClick={() => { setMoveItem({ id: item.id, type: 'saida' }); setMoveForm({ quantity: 1, notes: '', responsible: user?.name || '' }); }}>
                      <ArrowUp size={11} className="text-red-600" /> Saída
                    </Button>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <Package size={36} className="mx-auto mb-3 opacity-20" />
                <p>Nenhum item encontrado.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                {['Item', 'Ação', 'Qtd', 'Responsável', 'Data', 'Obs.'].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movements.slice(0, 100).map(m => (
                <tr key={m.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium">{m.item_name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
                      ${m.action === 'entrada'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {m.action === 'entrada' ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
                      {m.action === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-bold">{m.quantity}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{m.responsible}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {new Date(m.moved_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{m.notes}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ Add / Edit Modal ══ */}
      <Dialog open={addOpen} onOpenChange={o => { if (!o) { setAddOpen(false); setEditItemId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItemId ? 'Editar Item' : 'Cadastrar Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome do item *</Label>
              <Input value={form.name} onChange={e => setF('name', e.target.value)}
                placeholder="Ex: Arduino Uno Rev3" className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria *</Label>
                <select value={form.category} onChange={e => setF('category', e.target.value as InventoryCategory)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {INV_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subcategoria</Label>
                <Input value={form.subcategory} onChange={e => setF('subcategory', e.target.value)}
                  placeholder="Ex: Microcontrolador" className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Qtd. atual</Label>
                <Input type="number" min="0" value={form.quantity} onChange={e => setF('quantity', +e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Qtd. total</Label>
                <Input type="number" min="1" value={form.total} onChange={e => setF('total', +e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unidade</Label>
                <select value={form.unit_measure} onChange={e => setF('unit_measure', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {UNIT_MEASURES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Localização</Label>
                <Input value={form.location} onChange={e => setF('location', e.target.value)}
                  placeholder="Ex: Prateleira A3" className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estoque mínimo</Label>
                <Input type="number" min="0" value={form.min_stock} onChange={e => setF('min_stock', +e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição / Observações</Label>
              <textarea value={form.description} onChange={e => setF('description', e.target.value)}
                placeholder="Especificações, modelo, fornecedor..." rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditItemId(null); setForm(EMPTY_FORM); }}>Cancelar</Button>
            <Button onClick={handleSave} style={{ background: 'var(--fab-primary)' }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Movement Modal ══ */}
      <Dialog open={!!moveItem} onOpenChange={o => { if (!o) setMoveItem(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{moveItem?.type === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(() => {
              const item = items.find(i => i.id === moveItem?.id);
              return item ? (
                <p className="text-sm text-muted-foreground">
                  Item: <strong className="text-foreground">{item.name}</strong> · Estoque atual:{' '}
                  <strong>{item.quantity} {(item as any).unit_measure || 'un'}</strong>
                </p>
              ) : null;
            })()}
            {moveItem?.type === 'saida' && (() => {
              const item  = items.find(i => i.id === moveItem?.id);
              const over  = item && Number(moveForm.quantity) > item.quantity;
              return over ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle size={11} /> Quantidade maior que o estoque disponível.
                </p>
              ) : null;
            })()}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantidade *</Label>
              <Input type="number" min="1" value={moveForm.quantity}
                onChange={e => setMoveForm(p => ({ ...p, quantity: +e.target.value }))} className="h-10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Responsável</Label>
              <Input value={moveForm.responsible}
                onChange={e => setMoveForm(p => ({ ...p, responsible: e.target.value }))} className="h-10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Observações</Label>
              <Input value={moveForm.notes}
                onChange={e => setMoveForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Motivo, destino..." className="h-10" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveItem(null)}>Cancelar</Button>
            <Button onClick={handleMove}
              style={{ background: moveItem?.type === 'entrada' ? '#059669' : '#D42020' }}>
              {moveItem?.type === 'entrada' ? 'Confirmar entrada' : 'Confirmar saída'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Delete Confirm ══ */}
      <Dialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir item?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            O item e todo o histórico de movimentações serão removidos permanentemente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { if (deleteId) { deleteItem(deleteId); setDeleteId(null); } }}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ CSV Import Modal ══ */}
      <Dialog open={csvModal} onOpenChange={o => {
        if (!o) { setCsvModal(false); setCsvPreview([]); setCsvError(''); if (csvRef.current) csvRef.current.value = ''; }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Importar itens via CSV</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {/* Info box */}
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-sm text-blue-700 dark:text-blue-400">
              <p className="font-semibold mb-1">Colunas esperadas (em ordem):</p>
              <code className="text-xs font-mono block leading-relaxed">
                nome, categoria, subcategoria, quantidade_atual, quantidade_total, unidade, localizacao, estoque_minimo, descricao
              </code>
              <p className="mt-2 text-xs">
                Categorias válidas: Equipamento, Eletrônico, Ferramenta, Insumo, Material, Consumível, EPI, Outro
              </p>
              <button onClick={downloadTemplate}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold underline hover:opacity-70">
                <FileDown size={12} /> Baixar modelo CSV de exemplo
              </button>
            </div>

            {/* File input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Selecionar arquivo CSV
              </Label>
              <input
                ref={csvRef}
                type="file"
                accept=".csv"
                onChange={handleCSVFile}
                className="block w-full text-sm text-muted-foreground
                  file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-border
                  file:text-xs file:font-semibold file:bg-muted file:text-foreground
                  hover:file:bg-muted/80 cursor-pointer"
              />
            </div>

            {/* Error */}
            {csvError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
                {csvError}
              </div>
            )}

            {/* Preview table */}
            {csvPreview.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Prévia — {csvPreview.length} {csvPreview.length === 1 ? 'item' : 'itens'} detectados
                </p>
                <div className="border border-border rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        {['Nome', 'Categoria', 'Qtd atual', 'Qtd total', 'Unidade', 'Localização'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-bold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {csvPreview.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="px-3 py-1.5 font-medium">{row.nome || row.name}</td>
                          <td className="px-3 py-1.5">{row.categoria || row.category || 'Outro'}</td>
                          <td className="px-3 py-1.5">{row.quantidade_atual ?? row.quantity ?? '—'}</td>
                          <td className="px-3 py-1.5">{row.quantidade_total ?? row.total ?? '—'}</td>
                          <td className="px-3 py-1.5">{row.unidade || row.unit_measure || 'un'}</td>
                          <td className="px-3 py-1.5">{row.localizacao || row.location || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCsvModal(false); setCsvPreview([]); setCsvError(''); }}>
              Cancelar
            </Button>
            <Button
              onClick={importCSV}
              disabled={csvPreview.length === 0 || csvImporting}
              style={{ background: 'var(--fab-primary)' }}
            >
              {csvImporting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload size={13} className="mr-1.5" />
                  Importar {csvPreview.length} {csvPreview.length === 1 ? 'item' : 'itens'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
