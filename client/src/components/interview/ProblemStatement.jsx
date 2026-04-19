function ProblemStatement({ problem, showTitle = true }) {
  if (!problem) return null;

  return (
    <div className="space-y-6">
      {!showTitle && problem.externalUrl && (
        <a
          className="inline-flex text-xs font-semibold text-blue-400 underline-offset-4 hover:underline"
          href={problem.externalUrl}
          rel="noreferrer"
          target="_blank"
        >
          Full statement on source site →
        </a>
      )}
      {showTitle && (
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400/80">Problem</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{problem.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-blue-500/25 bg-blue-950/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-blue-100/90 shadow-sm">
              {problem.difficulty}
            </div>
            {problem.problemSource && (
              <span className="rounded-full border border-blue-500/20 bg-zinc-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200/80">
                {problem.problemSource}
              </span>
            )}
          </div>
          {problem.externalUrl && (
            <a
              className="mt-4 inline-flex text-sm font-semibold text-blue-400 underline-offset-4 hover:underline"
              href={problem.externalUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open full statement on source site →
            </a>
          )}
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400/85">
          Statement
        </h2>
        <p className="mt-3 text-sm leading-7 text-blue-100/80">{problem.statement}</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400/85">
          Constraints
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-blue-100/80">
          {(problem.constraints || []).map((constraint) => (
            <li key={constraint}>- {constraint}</li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-blue-500/20 bg-zinc-950/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400/85">Sample input</p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm text-blue-50">
            {problem.sampleInput}
          </pre>
        </div>
        <div className="rounded-[1.5rem] border border-blue-500/20 bg-zinc-950/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400/85">Sample output</p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm text-blue-50">
            {problem.sampleOutput}
          </pre>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400/85">Hints</h2>
        <ul className="mt-3 space-y-2 text-sm text-blue-100/80">
          {(problem.hints || []).map((hint) => (
            <li key={hint}>- {hint}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ProblemStatement;
