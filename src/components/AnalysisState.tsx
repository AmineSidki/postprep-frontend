import { AlertCircle, FileWarning } from 'lucide-react';
import type { PollState } from '../hooks/useArticlePolling';
import { ArticleView } from './ArticleView';
import { Spinner } from './Spinner';

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">{children}</div>
);

/** Renders whichever stage a polled article is in: loading, processing, interrupted, failed, or the result. */
export function AnalysisState({ article, error, timedOut, retry }: PollState) {
  if (error) {
    return (
      <Centered>
        <AlertCircle size={28} className="text-rose-300" />
        <p className="text-white">We couldn't load this analysis.</p>
        <button className="btn btn-ghost mt-2" onClick={retry}>
          Try again
        </button>
      </Centered>
    );
  }

  if (!article) {
    return (
      <Centered>
        <Spinner size={26} className="text-pink-300" />
        <p className="italic text-slate-400">Loading…</p>
      </Centered>
    );
  }

  if (article.status === 'PROCESSING') {
    return (
      <Centered>
        <Spinner size={26} className="text-pink-300" />
        <p className="text-white">{timedOut ? 'This is taking longer than expected.' : 'Reading your document…'}</p>
        <p className="max-w-sm italic text-slate-400">
          {timedOut
            ? 'You can leave this page. The result will appear in My articles once it is ready.'
            : 'Analysis runs in the background. You can leave this page and find the result in My articles.'}
        </p>
      </Centered>
    );
  }

  if (article.status === 'INTERRUPTED') {
    return (
      <Centered>
        <FileWarning size={28} className="text-rose-300" />
        <p className="text-white">The analysis was interrupted.</p>
        <p className="max-w-sm italic text-slate-400">The document couldn't be processed. Try uploading it again.</p>
      </Centered>
    );
  }

  return <ArticleView article={article} />;
}
