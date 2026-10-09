export const todayLabel = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function formatDate(value?: string | number | null): string {
  if (value == null) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const shortId = (id: string) => id.slice(0, 8);

export const initial = (s?: string | null) => (s?.trim()[0] ?? '?').toUpperCase();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Shortens chart labels: "2026-10-09" -> "09/10", "2026-10" -> "Oct 26". Anything else is kept as is. */
export function chartLabel(label: string): string {
  const day = /^\d{4}-(\d{2})-(\d{2})/.exec(label);
  if (day) return `${day[2]}/${day[1]}`;
  const month = /^(\d{4})-(\d{2})$/.exec(label);
  if (month) return `${MONTHS[Number(month[2]) - 1] ?? month[2]} ${month[1].slice(2)}`;
  return label;
}
