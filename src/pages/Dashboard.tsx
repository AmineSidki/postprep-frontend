import { useState, type DragEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FileText, FileType, Type, Upload } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { cn } from '../lib/cn';
import { useArticlePolling } from '../hooks/useArticlePolling';
import { useToast } from '../context/ToastContext';
import type { Article } from '../types';
import { AnalysisState } from '../components/AnalysisState';
import { PageHeader } from '../components/PageHeader';
import { Segmented } from '../components/Segmented';
import { Spinner } from '../components/Spinner';

type Tab = 'pdf' | 'text';

const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

const uploadPdf = (file: File) => {
  const body = new FormData();
  body.append('pdfFile', file);
  return api.post<Article>('/article/upload/pdf', body, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// The endpoint reads the request body as a plain string, so the text is sent as-is (not wrapped in JSON).
const uploadText = (text: string) => api.post<Article>('/article/upload/text', text, { headers: { 'Content-Type': 'text/plain' } });

export function Dashboard() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [articleId, setArticleId] = useState<string | null>(null);
  const poll = useArticlePolling(articleId);

  const canSubmit = tab === 'pdf' ? file !== null : text.trim().length > 0;

  const pick = (f: File | null | undefined) => {
    if (!f) return;
    if (!isPdf(f)) return toast.error('Please choose a PDF file.');
    setFile(f);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const { data } = tab === 'pdf' ? await uploadPdf(file!) : await uploadText(text);
      setArticleId(data.id);
    } catch (err) {
      toast.error(errorMessage(err, 'The upload failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setArticleId(null);
    setFile(null);
    setText('');
  };

  return (
    <>
      <PageHeader title="New analysis" description="Upload a PDF or paste text to get a title, summary, keywords and categories." />

      {articleId ? (
        <section className="glass animate-fade-in p-6 sm:p-8">
          <AnalysisState {...poll} />
          <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">
            <button className="btn btn-primary" onClick={reset}>
              Analyze another
            </button>
            <Link to="/my-articles" className="btn btn-ghost">
              Go to My articles
            </Link>
          </div>
        </section>
      ) : (
        <form onSubmit={submit} className="glass animate-fade-in space-y-6 p-6 sm:p-8">
          <Segmented
            label="Input type"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'pdf', label: <><FileType size={15} /> PDF</> },
              { value: 'text', label: <><Type size={15} /> Text</> },
            ]}
          />

          {tab === 'pdf' ? (
            <label
              htmlFor="pdf-input"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center transition focus-within:ring-2 focus-within:ring-pink-300/50',
                dragging ? 'border-pink-300/60 bg-pink-400/10' : 'border-white/20 bg-black/20 hover:bg-black/30',
              )}
            >
              <input id="pdf-input" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-pink-300">{file ? <FileText size={22} /> : <Upload size={22} />}</span>
              {file ? (
                <>
                  <span className="max-w-full truncate font-medium text-white">{file.name}</span>
                  <span className="text-xs text-slate-400">{formatSize(file.size)} · click to replace</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-white">Drop a PDF here, or click to browse</span>
                  <span className="text-xs italic text-slate-400">Scanned documents are read with OCR.</span>
                </>
              )}
            </label>
          ) : (
            <div>
              <label htmlFor="text-input" className="sr-only">
                Text to analyze
              </label>
              <textarea id="text-input" className="field min-h-[16rem] resize-y leading-6" placeholder="Paste the text you want analyzed…" value={text} onChange={(e) => setText(e.target.value)} />
              <p className="mt-2 text-right text-xs text-slate-500">{text.length.toLocaleString()} characters</p>
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={!canSubmit || submitting} className="btn btn-primary px-8">
              {submitting && <Spinner size={16} />}
              {submitting ? 'Uploading…' : 'Analyze'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
