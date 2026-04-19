import Navbar from "../components/Navbar";
import { RESOURCES } from "../lib/constants";

function Resources() {
  return (
    <div className="min-h-screen sam-page-bg pb-16">
      <Navbar />
      <div className="mx-auto mt-10 w-full max-w-7xl px-4">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400/85">Resources hub</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">
            Curated prep links that actually help between sessions.
          </h1>
          <p className="mt-4 text-sm leading-7 text-blue-100/75">
            These cover the same tracks available inside the app, so you can keep practicing
            outside the timer too.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {RESOURCES.map((group) => (
            <section
              className="rounded-[2rem] border border-blue-500/20 bg-zinc-950/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm"
              key={group.category}
            >
              <h2 className="text-xl font-semibold text-white">{group.category}</h2>
              <div className="mt-5 space-y-4">
                {group.items.map(([label, url, note]) => (
                  <a
                    className="block rounded-[1.5rem] border border-blue-500/15 bg-blue-950/25 p-4 transition hover:border-blue-400/40 hover:bg-blue-950/45"
                    href={url}
                    key={label}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div className="text-sm font-semibold text-blue-400">{label}</div>
                    <div className="mt-1 break-all text-xs text-blue-200/55">{url}</div>
                    <div className="mt-3 text-sm leading-6 text-blue-100/75">{note}</div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Resources;
