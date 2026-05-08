import { useMemo, useEffect } from 'react';
import { Package, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useScheduleStore } from '@/stores/scheduleStore';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/layout/PageTransition';

function StatCard({ label, value, sub, icon, color }: { label: string; value: number; sub: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 border-l-[3px]" style={{ borderLeftColor: color }}>
      <div className="text-muted-foreground mb-2">{icon}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
      <div className="text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

export function FabDashboard() {
  const { items, fetchItems } = useInventoryStore();
  const { schedules, fetchSchedules } = useScheduleStore();

  useEffect(() => { fetchItems(); fetchSchedules(); }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const total = items.reduce((a, i) => a + (i.total || i.quantity || 0), 0);
  const out = items.filter((i) => i.status === 'out').length;
  const todaySched = schedules.filter((s) => s.date === todayStr).length;
  const completed = schedules.filter((s) => s.status === 'concluido').length;

  const upcoming = useMemo(() =>
    schedules.filter((s) => s.status !== 'cancelado' && s.status !== 'concluido').slice(0, 5),
    [schedules]
  );

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-extrabold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do FabLab SESI</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Itens cadastrados" value={total} sub="no inventário" icon={<Package size={18} />} color="#D42020" />
        <StatCard label="Itens em saída" value={out} sub="fora do lab" icon={<AlertTriangle size={18} />} color="#9CA3AF" />
        <StatCard label="Agendamentos hoje" value={todaySched} sub={`total: ${schedules.length}`} icon={<Calendar size={18} />} color="#2563EB" />
        <StatCard label="Concluídos" value={completed} sub="agendamentos" icon={<CheckCircle size={18} />} color="#16A34A" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border font-bold text-sm">Próximos agendamentos</div>
          <div className="divide-y divide-border">
            {upcoming.length === 0 && (
              <div className="px-5 py-6 text-sm text-muted-foreground text-center">Nenhum agendamento pendente</div>
            )}
            {upcoming.map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{s.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.date} · {s.start_time} - {s.class_name}</div>
                </div>
                <Badge variant={s.status === 'confirmado' ? 'default' : 'secondary'}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border font-bold text-sm">Status do inventário</div>
          <div className="divide-y divide-border">
            {items.slice(0, 6).map((i) => (
              <div key={i.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{i.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{i.category} · {i.last_action}</div>
                </div>
                <Badge variant={i.status === 'in' ? 'default' : 'destructive'}>
                  {i.status === 'in' ? 'Disponível' : 'Em uso'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
