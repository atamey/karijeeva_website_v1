export default function PressStrip({ logos = [] }) {
  if (!logos?.length) return null;
  return (
    <section className="bg-brand-parchment" data-testid="press-strip">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase text-center mb-8">
          As featured in
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {logos.map((l) => (
            <div key={l.name} className="text-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="font-display text-2xl text-brand-husk tracking-wide">
                {l.name}
              </div>
              {l.subtitle && (
                <p className="font-accent italic text-xs text-ink-muted mt-2 max-w-[200px] mx-auto">
                  "{l.subtitle}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
