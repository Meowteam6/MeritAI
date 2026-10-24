import type { Metadata } from "next";
import { GtmBoard } from "./GtmBoard";

export const metadata: Metadata = {
  title: "GoHealthMe GTM workspace | Merit",
  description: "Private GoHealthMe campaign and outreach planning workspace.",
};

export default function GoHealthMeGtmPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-5 py-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Private GoHealthMe workspace
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">GTM campaigns & outreach</h1>
        <p className="mt-2 text-muted">
          Plan outreach, record follow-ups, and track sources for gohealthme.app.
          Work-in-progress local planner: entries live only in this browser and
          are not synchronized between devices or users.
        </p>
        <a className="mt-3 inline-block underline" href="/projects/gohealthme/analytics">
          View Search Console analytics
        </a>
      </header>
      <GtmBoard />
    </main>
  );
}
