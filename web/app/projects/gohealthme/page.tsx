import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GoHealthMe build status | Merit",
  description: "Public development status for GoHealthMe, sourced from GitHub.",
};

export const revalidate = 300;

const REPO = "Meowteam6/gohealthme-tokyo";
const API = `https://api.github.com/repos/${REPO}`;

type Pull = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  draft: boolean;
  updated_at: string;
  base: { ref: string };
  head: { ref: string };
};
type Branch = { name: string; commit: { sha: string } };

async function github<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API}${path}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default async function GoHealthMeStatus() {
  const [pulls, main, develop] = await Promise.all([
    github<Pull[]>("/pulls?state=open&per_page=100"),
    github<Branch>("/branches/main"),
    github<Branch>("/branches/develop"),
  ]);
  const fetchedAt = new Date().toISOString();
  const sorted = pulls?.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)) ?? [];
  const sameCommit = main && develop ? main.commit.sha === develop.commit.sha : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-14">
      <div className="mb-8">
        <Link href="/" className="text-sm underline">← Merit</Link>
        <p className="mt-7 text-xs font-semibold uppercase tracking-widest text-muted">Public project status</p>
        <h1 className="mt-2 font-display text-4xl font-bold">GoHealthMe</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Peer-to-peer health accountability challenges. The V5 hackathon build explores
          USDC on Base, USDC via Circle on Arc, and XRP on XRPL. Testnet only; no real money moves.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <a className="underline" href="https://www.gohealthme.app">Product website</a>
          <a className="underline" href={`https://github.com/${REPO}`}>Source repository</a>
          <a className="underline" href="https://github.com/Meowteam6/MeritAI/issues/35">Tracking roadmap</a>
        </div>
      </div>
      <section className="rounded-xl border border-black/10 bg-white p-6">
        <h2 className="font-display text-xl font-bold">Branch integration</h2>
        {sameCommit === null ? (
          <p className="mt-3 text-muted">Branch status unavailable from GitHub. Do not assume the branches are synchronized.</p>
        ) : (
          <p className="mt-3 text-muted">
            main and develop {sameCommit ? "currently point to the same commit." : "have different tip commits; inspect their diff before promoting."}
          </p>
        )}
        <p className="mt-2 text-xs text-muted">Different tip commits do not by themselves prove a merge conflict.</p>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">Open pull requests</h2>
        {pulls === null ? (
          <p className="mt-3 text-muted">GitHub data temporarily unavailable. No status can be confirmed.</p>
        ) : sorted.length === 0 ? (
          <p className="mt-3 text-muted">No open pull requests returned by GitHub.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sorted.map((pr) => (
              <li key={pr.number} className="rounded-xl border border-black/10 bg-white p-5">
                <a href={pr.html_url} className="font-semibold underline">#{pr.number} {pr.title}</a>
                <p className="mt-2 text-sm text-muted">
                  {pr.draft ? "Draft" : "Open for review"} · {pr.head.ref} → {pr.base.ref}
                </p>
                <p className="mt-1 text-xs text-muted">GitHub updated: {new Date(pr.updated_at).toLocaleString("en-US", { timeZone: "UTC", timeZoneName: "short" })}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="mt-8 text-xs text-muted">
        Source: public GitHub API · Page generated {fetchedAt}. GitHub responses may be cached for up to five minutes.
        This is not a CI pass, security audit, or production deployment confirmation.
      </p>
    </main>
  );
}
