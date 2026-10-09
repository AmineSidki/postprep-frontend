import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { Article } from '../types';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../lib/format';
import { Segmented } from './Segmented';
import { StatusBadge } from './StatusBadge';

function CopyButton({ text, label }: { text: string; label: string }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 1500);
    } catch {
      toast.error('Copy failed. Your browser blocked clipboard access.');
    }
  };
  return (
    <button onClick={copy} aria-label={`Copy ${label}`} className="icon-btn !h-7 !w-7">
      {done ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
    </button>
  );
}

const Section = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <section>
    <div className="mb-2 flex items-center justify-between">
      <h3 className="eyebrow">{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

export function ArticleView({ article }: { article: Article }) {
  const [mode, setMode] = useState<'formatted' | 'json'>('formatted');
  const out = article.outputJson;
  const score = out?.confidenceScore == null ? null : Math.max(0, Math.min(100, Math.round(out.confidenceScore * 100)));
  const meta = [article.language?.toUpperCase(), formatDate(article.createdAt)].filter(Boolean).join('  ·  ');

  return (
    <article className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-3">
            <StatusBadge status={article.status} />
            {meta && <span className="eyebrow">{meta}</span>}
          </div>
          <h2 className="text-2xl font-medium leading-snug tracking-tight text-white">{article.title || 'Untitled document'}</h2>
        </div>
        <Segmented
          label="View"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'formatted', label: 'Formatted' },
            { value: 'json', label: 'JSON' },
          ]}
        />
      </header>

      {mode === 'json' ? (
        <div className="relative">
          <div className="absolute right-2 top-2">
            <CopyButton text={JSON.stringify(article, null, 2)} label="JSON" />
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/40 p-5 text-xs leading-6 text-emerald-300/90">
            {JSON.stringify(article, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="space-y-8">
          <Section title="Summary" action={out?.summary ? <CopyButton text={out.summary} label="summary" /> : undefined}>
            <p className="text-[15px] leading-7 text-slate-200">{out?.summary || '—'}</p>
          </Section>

          <div className="grid gap-8 sm:grid-cols-2">
            <Section title="Keywords">
              <div className="flex flex-wrap gap-2">
                {out?.keywords?.length ? out.keywords.map((k) => <span key={k} className="chip">{k}</span>) : <span className="text-slate-500">—</span>}
              </div>
            </Section>
            <Section title="Categories">
              <div className="flex flex-wrap gap-2">
                {out?.categories?.length
                  ? out.categories.map((c) => (
                      <span key={c} className="chip border-pink-300/20 bg-pink-400/10 text-pink-100">
                        {c}
                      </span>
                    ))
                  : <span className="text-slate-500">—</span>}
              </div>
            </Section>
          </div>

          <div className="grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-2">
            <Section title="SEO title" action={out?.seoTitle ? <CopyButton text={out.seoTitle} label="SEO title" /> : undefined}>
              <p className="text-slate-200">{out?.seoTitle || '—'}</p>
            </Section>
            {score !== null && (
              <Section title="Confidence">
                <div className="flex items-center gap-3">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"
                    role="progressbar"
                    aria-valuenow={score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Confidence"
                  >
                    <div className="h-full rounded-full bg-gradient-to-r from-wine to-pink-400" style={{ width: `${score}%` }} />
                  </div>
                  <span className="w-10 text-right tabular-nums text-white">{score}%</span>
                </div>
                <p className="mt-2 text-xs italic text-slate-500">Similarity between the analysis and the source text.</p>
              </Section>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
