import { useEffect, useState } from 'react';
import { FileText, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { chartLabel } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import type { ChartDataDTO, GlobalStats } from '../../types';
import { PageSpinner } from '../../components/Spinner';
import { Segmented } from '../../components/Segmented';

type Range = 'daily' | 'monthly';

const RANGES: Record<Range, { title: string; endpoint: string }> = {
  daily: { title: 'Articles per day, last 30 days', endpoint: '/admin/dashboard/stats/daily' },
  monthly: { title: 'Articles per month, last 12 months', endpoint: '/admin/dashboard/stats/monthly' },
};

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="glass flex items-center justify-between p-6">
      <div>
        <p className="eyebrow">{label}</p>
        <p className="mt-3 text-5xl font-medium tabular-nums text-white">{value.toLocaleString()}</p>
      </div>
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-pink-300">{icon}</span>
    </div>
  );
}

function BarChart({ data }: { data: ChartDataDTO[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = Math.ceil(data.length / 8); // keep x labels readable
  return (
    <div>
      <div className="relative">
        <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-t border-white/5" />
          ))}
        </div>
        <span className="absolute -top-5 left-0 text-[11px] tabular-nums text-slate-500">{max}</span>
        <div className="relative flex h-56 items-end gap-1 sm:gap-1.5" role="img" aria-label={`Bar chart, ${data.length} values, maximum ${max}`}>
          {data.map((d) => (
            <div key={d.label} className="group relative flex h-full flex-1 items-end" tabIndex={0}>
              <div
                className="w-full rounded-t bg-gradient-to-t from-wine/70 to-pink-400/80 transition group-hover:from-wine group-hover:to-pink-300 group-focus:from-wine group-focus:to-pink-300"
                style={{ height: `${d.value === 0 ? 1 : Math.max((d.value / max) * 100, 4)}%` }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-ink-900 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100 group-focus:opacity-100">
                {chartLabel(d.label)}: {d.value}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-1 sm:gap-1.5" aria-hidden>
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 overflow-visible whitespace-nowrap text-center text-[10px] text-slate-500">
            {i % step === 0 ? chartLabel(d.label) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [series, setSeries] = useState<Partial<Record<Range, ChartDataDTO[]>>>({});
  const [range, setRange] = useState<Range>('daily');
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([api.get<GlobalStats>('/admin/dashboard'), api.get<ChartDataDTO[]>(RANGES.daily.endpoint)])
      .then(([s, d]) => {
        if (!alive) return;
        setStats(s.data);
        setSeries({ daily: d.data });
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  // The monthly series is only fetched the first time it is requested.
  useEffect(() => {
    if (range !== 'monthly' || series.monthly) return;
    api
      .get<ChartDataDTO[]>(RANGES.monthly.endpoint)
      .then((r) => setSeries((prev) => ({ ...prev, monthly: r.data })))
      .catch(() => {
        toast.error('Could not load monthly statistics.');
        setRange('daily');
      });
  }, [range, series.monthly, toast]);

  if (error) return <p className="glass px-6 py-16 text-center text-white">We couldn't load the overview.</p>;
  if (!stats) return <PageSpinner />;

  const data = series[range];
  const total = data?.reduce((sum, d) => sum + d.value, 0) ?? 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <StatCard label="Users" value={stats.users} icon={<Users size={24} />} />
        <StatCard label="Articles" value={stats.articles} icon={<FileText size={24} />} />
      </div>

      <section className="glass p-6 sm:p-8">
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-medium text-white">{RANGES[range].title}</h2>
            {data && <p className="mt-1 italic text-slate-400">{total.toLocaleString()} in this period</p>}
          </div>
          <Segmented
            label="Time range"
            value={range}
            onChange={setRange}
            options={[
              { value: 'daily', label: '30 days' },
              { value: 'monthly', label: '12 months' },
            ]}
          />
        </div>

        {!data ? (
          <PageSpinner />
        ) : data.length === 0 ? (
          <p className="py-16 text-center italic text-slate-400">No activity yet.</p>
        ) : (
          <BarChart data={data} />
        )}
      </section>
    </div>
  );
}
