function FeedbackPanel({ title, items }) {
  return (
    <div className="rounded-[1.75rem] border border-blue-500/20 bg-zinc-950/80 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      <p className="text-xs uppercase tracking-[0.25em] text-blue-400/85">{title}</p>
      <div className="mt-4 space-y-3 text-sm leading-7 text-blue-100/80">
        {items?.length ? (
          items.map((item) => <p key={item}>- {item}</p>)
        ) : (
          <p className="text-blue-300/60">No details available.</p>
        )}
      </div>
    </div>
  );
}

export default FeedbackPanel;
