import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { maskPhone } from '@/shared/lib/utils';
import type { QueueEntry, QueueStatus, Queue } from '@/shared/types';

// ── Helpers ────────────────────────────────────────────────────────────────

function diffMinutes(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const diff = (new Date(b).getTime() - new Date(a).getTime()) / 60_000;
  return diff >= 0 ? diff : null;
}

function fmtMinutes(m: number | null): string {
  if (m === null) return '—';
  if (m < 1) return `${Math.round(m * 60)}s`;
  return `${Math.round(m)}min`;
}

function fmtHour(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateTime(d: Date): string {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── CSV export ─────────────────────────────────────────────────────────────

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function exportToCSV(entries: QueueEntry[], dateLabel: string) {
  const headers = [
    '#', 'Nome', 'Telefone', 'Status', 'Atendente',
    '2º Chamado', 'SMS Enviado',
    'Cadastro', 'Chamada', 'Finalização',
    'Espera (min)', 'Atendimento (min)',
  ];

  const STATUS_PT: Record<string, string> = {
    finished: 'Finalizado', waiting: 'Aguardando',
    in_service: 'Em atendimento', absent: 'Ausente',
  };

  const rows = entries.map((e, i) => {
    const wait    = diffMinutes(e.created_at, e.called_at);
    const service = diffMinutes(e.called_at, e.finished_at);
    return [
      i + 1,
      e.customer_name,
      maskPhone(e.phone),
      STATUS_PT[e.status] ?? e.status,
      e.served_by ?? '',
      e.was_absent && e.status === 'finished' ? 'Sim' : '',
      e.sms_sent ? 'Sim' : 'Não',
      fmtHour(e.created_at),
      fmtHour(e.called_at),
      fmtHour(e.finished_at),
      wait    !== null ? Math.round(wait)    : '',
      service !== null ? Math.round(service) : '',
    ].map(csvCell).join(',');
  });

  const csv = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `atendimentos-${dateLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color = 'text-gray-900',
}: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wider font-medium leading-tight">{label}</span>
      <span className={`text-3xl font-black leading-none mt-1 ${color}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400 mt-0.5">{sub}</span>}
    </div>
  );
}

function StatBar({
  label, value, total, colorClass,
}: { label: string; value: number; total: number; colorClass: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-32 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-24 text-right flex-shrink-0">
        {value} <span className="font-normal text-gray-400">({pct}%)</span>
      </span>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | QueueStatus;

const STATUS_LABELS: Record<string, string> = {
  finished:   'Finalizado',
  waiting:    'Aguardando',
  in_service: 'Em atendimento',
  absent:     'Ausente',
};

const STATUS_BADGE: Record<string, string> = {
  finished:   'text-emerald-700 bg-emerald-50',
  waiting:    'text-blue-700 bg-blue-50',
  in_service: 'text-green-700 bg-green-50',
  absent:     'text-amber-700 bg-amber-50',
};

// ── Main component ─────────────────────────────────────────────────────────

interface HistoryModalProps {
  queueId: string;
  onClose: () => void;
}

export function HistoryModal({ queueId, onClose }: HistoryModalProps) {
  const [selectedQueueId, setSelectedQueueId] = useState<string>(queueId);
  const [lastUpdated, setLastUpdated]         = useState<Date | null>(null);
  const [statusFilter, setStatusFilter]       = useState<StatusFilter>('all');
  const [operatorFilter, setOperatorFilter]   = useState<string>('all');

  // ── All queues (for day selector) ───────────────────────────────────────
  const { data: queues = [] } = useQuery({
    queryKey: ['all-queues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('queues')
        .select('id, name, date')
        .order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Pick<Queue, 'id' | 'name' | 'date'>[];
    },
    staleTime: 60_000 * 60,
  });

  const selectedQueue = queues.find(q => q.id === selectedQueueId);

  // ── Entries for selected day ─────────────────────────────────────────────
  const { data: entries = [], isFetching, refetch } = useQuery({
    queryKey: ['dashboard', selectedQueueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('queue_id', selectedQueueId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setLastUpdated(new Date());
      return (data ?? []) as QueueEntry[];
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

  const handleDayChange = useCallback((id: string) => {
    setSelectedQueueId(id);
    setStatusFilter('all');
    setOperatorFilter('all');
    setLastUpdated(null);
  }, []);

  // ── Derived metrics ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const finished          = entries.filter(e => e.status === 'finished');
    const absent            = entries.filter(e => e.status === 'absent');
    const waiting           = entries.filter(e => e.status === 'waiting');
    const inService         = entries.filter(e => e.status === 'in_service');
    const finishedSecondCall = entries.filter(e => e.was_absent && e.status === 'finished');
    const smsSent           = entries.filter(e => e.sms_sent);

    const avg = (nums: number[]) =>
      nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;

    const waitTimes = entries
      .map(e => diffMinutes(e.created_at, e.called_at))
      .filter((v): v is number => v !== null);

    const serviceTimes = finished
      .map(e => diffMinutes(e.called_at, e.finished_at))
      .filter((v): v is number => v !== null);

    const operatorMap = new Map<string, number>();
    finished.forEach(e => {
      const key = e.served_by ?? '—';
      operatorMap.set(key, (operatorMap.get(key) ?? 0) + 1);
    });
    const byOperator = Array.from(operatorMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total:               entries.length,
      finished:            finished.length,
      absent:              absent.length,
      waiting:             waiting.length,
      inService:           inService.length,
      finishedSecondCall:  finishedSecondCall.length,
      smsSent:             smsSent.length,
      avgWait:    avg(waitTimes),
      avgService: avg(serviceTimes),
      byOperator,
      operators:  byOperator.map(o => o.name),
    };
  }, [entries]);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    return entries
      .filter(e => statusFilter   === 'all' || e.status === statusFilter)
      .filter(e => operatorFilter === 'all' || (e.served_by ?? '—') === operatorFilter)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [entries, statusFilter, operatorFilter]);

  const pct = (n: number) =>
    stats.total > 0 ? `${Math.round((n / stats.total) * 100)}% do total` : undefined;

  const today = todayIso();

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3
                         flex items-center gap-3 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Dashboard</h2>

        {/* Day selector */}
        <select
          value={selectedQueueId}
          onChange={e => handleDayChange(e.target.value)}
          className="flex-1 min-w-0 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50
                     text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {queues.map(q => (
            <option key={q.id} value={q.id}>
              {fmtDate(q.date)}{q.date === today ? ' (hoje)' : ''}
            </option>
          ))}
          {queues.length === 0 && (
            <option value={queueId}>Hoje</option>
          )}
        </select>

        <div className="flex items-center gap-2 flex-shrink-0">
          {lastUpdated && (
            <span className="text-xs text-gray-400 hidden md:block">
              {fmtDateTime(lastUpdated)}
            </span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetching}
            className="h-9 px-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl
                       active:bg-blue-100 disabled:opacity-40 touch-manipulation
                       flex items-center gap-1.5 transition-colors"
          >
            <span className={isFetching ? 'inline-block animate-spin' : ''}>↻</span>
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-500
                       active:bg-gray-100 touch-manipulation transition-colors text-lg"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Last updated — mobile */}
      {lastUpdated && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-1.5">
          <span className="text-xs text-gray-400">Atualizado às {fmtDateTime(lastUpdated)}</span>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

        {/* KPI row 1 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Total cadastrado" value={stats.total} />
          <KpiCard label="Finalizados" value={stats.finished}
            sub={pct(stats.finished)} color="text-emerald-600" />
          <KpiCard label="Ausentes" value={stats.absent}
            sub={pct(stats.absent)} color="text-amber-500" />
          <KpiCard label="SMS enviados" value={stats.smsSent} color="text-blue-600" />
        </div>

        {/* KPI row 2 */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label="Tempo médio de espera"
            value={fmtMinutes(stats.avgWait)}
            sub="do cadastro até ser chamado"
          />
          <KpiCard
            label="Tempo médio de atendimento"
            value={fmtMinutes(stats.avgService)}
            sub="do chamado até finalizar"
          />
        </div>

        {/* Status breakdown */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Status dos atendimentos
          </h3>
          <StatBar label="Finalizados"    value={stats.finished}  total={stats.total} colorClass="bg-emerald-500" />
          {stats.finishedSecondCall > 0 && (
            <div className="pl-6 -mt-1">
              <StatBar
                label="↳ 2º chamado"
                value={stats.finishedSecondCall}
                total={stats.finished}
                colorClass="bg-violet-400"
              />
            </div>
          )}
          <StatBar label="Ausentes"       value={stats.absent}    total={stats.total} colorClass="bg-amber-400" />
          <StatBar label="Aguardando"     value={stats.waiting}   total={stats.total} colorClass="bg-blue-400" />
          <StatBar label="Em atendimento" value={stats.inService} total={stats.total} colorClass="bg-green-500" />
        </section>

        {/* By operator */}
        {stats.byOperator.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Atendimentos finalizados por atendente
            </h3>
            {stats.byOperator.map(op => (
              <StatBar
                key={op.name}
                label={op.name}
                value={op.count}
                total={stats.finished}
                colorClass="bg-indigo-500"
              />
            ))}
          </section>
        )}

        {/* Filters + client list */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Clientes <span className="normal-case font-normal">({filteredEntries.length})</span>
            </h3>
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white
                           text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os status</option>
                <option value="finished">Finalizados</option>
                <option value="waiting">Aguardando</option>
                <option value="in_service">Em atendimento</option>
                <option value="absent">Ausentes</option>
              </select>

              {stats.operators.length > 0 && (
                <select
                  value={operatorFilter}
                  onChange={e => setOperatorFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white
                             text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os atendentes</option>
                  {stats.operators.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              )}

              {filteredEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    exportToCSV(filteredEntries, selectedQueue?.date ?? today)
                  }
                  className="h-9 px-3 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-xl
                             active:bg-emerald-100 touch-manipulation transition-colors
                             flex items-center gap-1.5"
                >
                  <span>↓</span> Excel
                </button>
              )}
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">
              Nenhum cliente com os filtros selecionados
            </p>
          ) : (
            <div className="flex flex-col">
              {filteredEntries.map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
                >
                  <span className="text-xs text-gray-300 w-5 text-right flex-shrink-0">
                    {i + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {entry.customer_name}
                    </p>
                    <p className="text-xs text-gray-400">{maskPhone(entry.phone)}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[entry.status] ?? ''}`}>
                      {STATUS_LABELS[entry.status]}
                    </span>
                    {entry.was_absent && entry.status === 'finished' && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium text-violet-700 bg-violet-50">
                        2º chamado
                      </span>
                    )}
                    {entry.was_absent && entry.status !== 'finished' && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium text-orange-600 bg-orange-50">
                        retorno
                      </span>
                    )}
                    {entry.served_by && (
                      <span className="text-xs text-gray-400">{entry.served_by}</span>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 flex-shrink-0 text-right w-12">
                    {fmtHour(entry.finished_at ?? entry.called_at ?? entry.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
