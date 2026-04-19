function ScoreCard({ label, score, sublabel }) {
  return (
    <div className="rounded-[1.75rem] border border-blue-500/20 bg-blue-950/30 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-blue-300/70">{label}</p>
      <div className="mt-3 text-4xl font-semibold text-blue-400">{score}</div>
      {sublabel && <p className="mt-2 text-sm text-blue-100/70">{sublabel}</p>}
    </div>
  );
}

export default ScoreCard;
