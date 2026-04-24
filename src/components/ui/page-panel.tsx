type PagePanelProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function PagePanel({ title, description, children }: PagePanelProps) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
      <div className="max-w-3xl">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">{description}</p>
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
