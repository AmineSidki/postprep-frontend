/** Fixed ambient backdrop, mounted once for the whole app. */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
      <div className="blob blob-pink" />
      <div className="blob blob-purple" />
      <div className="blob blob-wine" />
    </div>
  );
}
