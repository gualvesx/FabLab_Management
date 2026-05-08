import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, ChevronDown, ChevronUp, Download, FileText, Printer, RefreshCw, Calendar, CheckCircle, Clock, XCircle, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { PageTransition } from '@/components/layout/PageTransition';
import { supabase } from '@/lib/supabase';
import type { MaterialUsage } from '@/types';
import type { Report } from '@/types';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────
type TabType = 'diario' | 'semanal' | 'mensal' | 'materiais';

interface ScheduleRow {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  responsible: string;
  class_name: string;
  status: string;
}

// ── Helpers ──────────────────────────────────────────────────────
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function periodLabel(type: string, start: string, end: string) {
  if (type === 'daily') return `Dia ${formatDateBR(start)}`;
  if (type === 'weekly') return `Semana ${formatDateBR(start)} → ${formatDateBR(end)}`;
  return `Mês ${formatDateBR(start)} → ${formatDateBR(end)}`;
}

function typeToTab(type: string): TabType {
  return type === 'daily' ? 'diario' : type === 'weekly' ? 'semanal' : 'mensal';
}

function tabToType(tab: TabType): 'daily' | 'weekly' | 'monthly' {
  return tab === 'diario' ? 'daily' : tab === 'semanal' ? 'weekly' : 'monthly';
}

function today() { return new Date().toISOString().split('T')[0]; }
function weekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toISOString().split('T')[0];
}
function monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// ── PDF print helper ─────────────────────────────────────────────
function printReport(report: Report, schedules: ScheduleRow[], materials: MaterialUsage[]) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;

  const statusColor = (s: string) => {
    if (s === 'concluido')  return '#16a34a';
    if (s === 'cancelado')  return '#dc2626';
    if (s === 'confirmado') return '#2563eb';
    return '#d97706';
  };

  const html = `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8"/>
<title>Relatório FabLab SESI</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Helvetica Neue',Arial,sans-serif; color:#111; background:#fff; padding:32px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #D42020; padding-bottom:16px; margin-bottom:24px; }
  .logo-block h1 { font-size:22px; font-weight:900; color:#D42020; }
  .logo-block p { font-size:12px; color:#666; margin-top:2px; }
  .meta { text-align:right; font-size:12px; color:#666; }
  .meta strong { display:block; color:#111; font-size:13px; }
  .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
  .stat { border:1px solid #e5e7eb; border-radius:8px; padding:12px; text-align:center; }
  .stat .num { font-size:28px; font-weight:900; }
  .stat .lbl { font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:#666; margin-top:2px; }
  .bar-wrap { margin-bottom:24px; }
  .bar-wrap h3 { font-size:12px; text-transform:uppercase; letter-spacing:.1em; color:#888; margin-bottom:8px; }
  .bar-bg { height:10px; background:#f3f4f6; border-radius:5px; overflow:hidden; }
  .bar-fg { height:100%; border-radius:5px; background:#16a34a; }
  .bar-label { font-size:14px; font-weight:700; color:#16a34a; margin-top:4px; }
  table { width:100%; border-collapse:collapse; font-size:12px; margin-bottom:24px; }
  th { background:#f9fafb; text-align:left; padding:8px 10px; font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:#555; border-bottom:2px solid #e5e7eb; }
  td { padding:8px 10px; border-bottom:1px solid #f3f4f6; }
  .badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:700; color:#fff; }
  .section-title { font-size:13px; font-weight:700; margin-bottom:10px; margin-top:20px; color:#111; padding-bottom:4px; border-bottom:1px solid #e5e7eb; }
  .footer { margin-top:32px; border-top:1px solid #e5e7eb; padding-top:12px; font-size:10px; color:#999; text-align:center; }
  @media print { body { padding:20px; } @page { margin:1cm; } }
</style>
</head><body>
<div class="header">
  <div class="logo-block">
    <h1>FabLab SESI SP</h1>
    <p>Plataforma Educacional · Relatório de Atividades</p>
  </div>
  <div class="meta">
    <strong>${periodLabel(report.type, report.period_start, report.period_end)}</strong>
    Gerado por: ${report.generated_by}<br/>
    Em: ${new Date(report.generated_at).toLocaleString('pt-BR')}
  </div>
</div>

<div class="stats">
  <div class="stat"><div class="num" style="color:#2563eb">${report.total_schedules}</div><div class="lbl">Total</div></div>
  <div class="stat"><div class="num" style="color:#16a34a">${report.total_completed}</div><div class="lbl">Concluídos</div></div>
  <div class="stat"><div class="num" style="color:#d97706">${report.total_pending}</div><div class="lbl">Pendentes</div></div>
  <div class="stat"><div class="num" style="color:#dc2626">${report.total_cancelled}</div><div class="lbl">Cancelados</div></div>
</div>

<div class="bar-wrap">
  <h3>Taxa de conclusão</h3>
  <div class="bar-bg"><div class="bar-fg" style="width:${pct(report.total_completed, report.total_schedules)}%"></div></div>
  <div class="bar-label">${pct(report.total_completed, report.total_schedules)}%</div>
</div>

${schedules.length > 0 ? `
<div class="section-title">Agendamentos do período</div>
<table>
  <thead><tr><th>#</th><th>Título</th><th>Data</th><th>Horário</th><th>Turma</th><th>Responsável</th><th>Status</th></tr></thead>
  <tbody>
  ${schedules.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${s.title}</td>
      <td>${formatDateBR(s.date)}</td>
      <td>${s.start_time ? s.start_time.substring(0,5) : '—'}${s.end_time ? ' – ' + s.end_time.substring(0,5) : ''}</td>
      <td>${s.class_name || '—'}</td>
      <td>${s.responsible}</td>
      <td><span class="badge" style="background:${statusColor(s.status)}">${s.status}</span></td>
    </tr>`).join('')}
  </tbody>
</table>` : ''}

${materials.length > 0 ? `
<div class="section-title">Uso de materiais</div>
<table>
  <thead><tr><th>Material</th><th>Categoria</th><th>Total usado</th><th>Nº de usos</th></tr></thead>
  <tbody>
  ${materials.slice(0, 20).map(m => `
    <tr><td>${m.item_name}</td><td>${m.category}</td><td><strong>${m.total_used}</strong></td><td>${m.times_used}×</td></tr>`).join('')}
  </tbody>
</table>` : ''}

<div class="footer">FabLab SESI SP · Relatório gerado automaticamente pela Plataforma Educacional</div>
</body></html>`;

  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

// ── StatCard ─────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '18', color }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-extrabold leading-none" style={{ color }}>{value}</div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export function FabReports() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<TabType>('diario');
  const [reports, setReports] = useState<Report[]>([]);
  const [materialUsage, setMaterialUsage] = useState<MaterialUsage[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin' || user?.role === 'professor';

  useEffect(() => {
    supabase.from('reports').select('*').order('generated_at', { ascending: false })
      .then(({ data }) => { if (data) setReports(data as Report[]); });
    supabase.from('material_usage').select('*').order('total_used', { ascending: false })
      .then(({ data }) => { if (data) setMaterialUsage(data as MaterialUsage[]); });
  }, []);

  // ── Generate Report ───────────────────────────────────────────
  const generateReport = async () => {
    setGenerating(true);
    const type = tabToType(tab);

    let start = today();
    let end   = today();
    if (type === 'weekly')  { start = weekStart(); }
    if (type === 'monthly') { start = monthStart(); }

    // Fetch schedules in period
    const { data: scheds } = await supabase
      .from('schedules')
      .select('id, title, date, start_time, end_time, responsible, class_name, status')
      .gte('date', start)
      .lte('date', end);

    const rows: ScheduleRow[] = (scheds as ScheduleRow[]) ?? [];
    const total     = rows.length;
    const completed = rows.filter(s => s.status === 'concluido').length;
    const pending   = rows.filter(s => s.status === 'pendente' || s.status === 'confirmado').length;
    const cancelled = rows.filter(s => s.status === 'cancelado').length;

    const summary = {
      stats: { total, completed, pending, cancelled },
      top_materials: materialUsage.slice(0, 5).map(m => ({ item_name: m.item_name, total: m.total_used })),
      schedules: rows.map(s => ({ title: s.title, start_time: s.start_time, responsible: s.responsible, status: s.status })),
    };

    const payload = {
      type,
      period_start:    start,
      period_end:      end,
      total_schedules: total,
      total_completed: completed,
      total_pending:   pending,
      total_cancelled: cancelled,
      generated_by:    user?.name || '',
      generated_by_id: null,
      generated_at:    new Date().toISOString(),
      summary,
    };

    const { data } = await supabase.from('reports').insert(payload).select().single();
    if (data) setReports(prev => [data as Report, ...prev]);
    setGenerating(false);
  };

  // ── Print Report ─────────────────────────────────────────────
  const handlePrint = async (report: Report) => {
    setPrintingId(report.id);
    const type = report.type;
    const start = report.period_start;
    const end   = report.period_end;

    const { data: scheds } = await supabase
      .from('schedules')
      .select('id, title, date, start_time, end_time, responsible, class_name, status')
      .gte('date', start)
      .lte('date', end);

    printReport(report, (scheds as ScheduleRow[]) ?? [], materialUsage);
    setPrintingId(null);
  };

  // ── Download CSV ──────────────────────────────────────────────
  const downloadCSV = (report: Report) => {
    const rows = [
      ['Tipo', 'Período início', 'Período fim', 'Total', 'Concluídos', 'Pendentes', 'Cancelados', 'Taxa conclusão %', 'Gerado por', 'Gerado em'],
      [
        report.type,
        report.period_start,
        report.period_end,
        report.total_schedules,
        report.total_completed,
        report.total_pending,
        report.total_cancelled,
        pct(report.total_completed, report.total_schedules),
        report.generated_by,
        new Date(report.generated_at).toLocaleString('pt-BR'),
      ],
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio-fablab-${report.period_start}.csv`;
    a.click();
  };

  const filtered = tab === 'materiais'
    ? []
    : reports.filter(r => r.type === tabToType(tab));

  return (
    <PageTransition>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">{t('fablab.reportsTitle')}</h1>
          <p className="text-sm text-muted-foreground">Agendamentos e uso de materiais — diário, semanal e mensal</p>
        </div>
        {isAdmin && tab !== 'materiais' && (
          <Button size="sm" onClick={generateReport} disabled={generating} style={{ background: 'var(--fab-primary)' }}>
            {generating
              ? <><RefreshCw size={14} className="mr-1.5 animate-spin" />Gerando...</>
              : <><Activity size={14} className="mr-1.5" />Gerar relatório {tab}</>}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6">
        {(['diario', 'semanal', 'mensal', 'materiais'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={cn('px-4 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-colors',
              tab === tb ? 'border-[#D42020] text-[#D42020]' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tb === 'diario' ? 'Diário' : tb === 'semanal' ? 'Semanal' : tb === 'mensal' ? 'Mensal' : 'Uso de Materiais'}
          </button>
        ))}
      </div>

      {/* Report list */}
      {tab !== 'materiais' && (
        <>
          {filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
              <FileText size={36} className="opacity-20" />
              <p className="font-medium">Nenhum relatório {tab} gerado ainda.</p>
              {isAdmin && <p className="text-sm">Clique em "Gerar relatório" para criar o primeiro.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => (
                <div key={r.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
                  {/* Header */}
                  <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <button
                      className="flex items-center gap-3 flex-1 text-left"
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#D4202015' }}>
                        <BarChart2 size={17} style={{ color: '#D42020' }} />
                      </div>
                      <div>
                        <div className="font-bold text-sm">{periodLabel(r.type, r.period_start, r.period_end)}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Gerado por {r.generated_by} · {new Date(r.generated_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="default" className="text-[10px]">{r.total_completed} concluídos</Badge>
                      <Badge variant="secondary" className="text-[10px]">{r.total_schedules} total</Badge>

                      {/* Download CSV */}
                      <button
                        onClick={() => downloadCSV(r)}
                        title="Baixar CSV"
                        className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Download size={14} />
                      </button>

                      {/* Print PDF */}
                      <button
                        onClick={() => handlePrint(r)}
                        disabled={printingId === r.id}
                        title="Imprimir / Salvar PDF"
                        className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        {printingId === r.id
                          ? <RefreshCw size={14} className="animate-spin" />
                          : <Printer size={14} />}
                      </button>

                      <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="p-1.5 text-muted-foreground">
                        {expanded === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expanded === r.id && (
                    <div className="px-5 pb-5 border-t border-border">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
                        <StatCard label="Total" value={r.total_schedules} color="#2563eb" icon={<Calendar size={16} />} />
                        <StatCard label="Concluídos" value={r.total_completed} color="#16a34a" icon={<CheckCircle size={16} />} />
                        <StatCard label="Pendentes" value={r.total_pending} color="#d97706" icon={<Clock size={16} />} />
                        <StatCard label="Cancelados" value={r.total_cancelled} color="#dc2626" icon={<XCircle size={16} />} />
                      </div>

                      {/* Completion bar */}
                      <div className="mb-4 p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Taxa de conclusão</span>
                          <span className="text-base font-extrabold text-emerald-600">{pct(r.total_completed, r.total_schedules)}%</span>
                        </div>
                        <div className="h-2 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: pct(r.total_completed, r.total_schedules) + '%' }} />
                        </div>
                      </div>

                      {/* Schedule list from summary */}
                      {r.summary?.schedules && r.summary.schedules.length > 0 && (
                        <div>
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Agendamentos ({r.summary.schedules.length})
                          </div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {r.summary.schedules.map((s: any, i: number) => (
                              <div key={i} className="flex items-center justify-between gap-3 text-xs bg-muted/30 rounded-lg px-3 py-2">
                                <span className="font-medium truncate">{s.title}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {s.start_time && <span className="text-muted-foreground">{s.start_time.substring(0,5)}</span>}
                                  <span className="text-muted-foreground">{s.responsible}</span>
                                  <span className={cn(
                                    'px-1.5 py-0.5 rounded-full font-semibold text-[9px] uppercase',
                                    s.status === 'concluido'  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                    s.status === 'cancelado'  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    s.status === 'confirmado' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  )}>
                                    {s.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Materials usage */}
      {tab === 'materiais' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-sm">Uso de Materiais</h2>
            <button
              onClick={() => {
                const rows = [['Material', 'Categoria', 'Total usado', 'Nº de usos'], ...materialUsage.map(m => [m.item_name, m.category, m.total_used, m.times_used])];
                const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'uso-materiais-fablab.csv';
                a.click();
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Download size={13} /> Exportar CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  {['#', 'Material', 'Categoria', 'Total usado', 'Nº de usos', 'Uso relativo'].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {materialUsage.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum dado de uso registrado.</td></tr>
                ) : materialUsage.map((m, i) => {
                  const maxUsed = materialUsage[0]?.total_used || 1;
                  const rel = Math.round((m.total_used / maxUsed) * 100);
                  return (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold">{m.item_name}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{m.category}</span>
                      </td>
                      <td className="px-4 py-3 font-bold">{m.total_used}</td>
                      <td className="px-4 py-3">{m.times_used}×</td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: rel + '%' }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{rel}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
