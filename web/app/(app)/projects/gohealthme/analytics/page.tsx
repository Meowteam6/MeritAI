import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GoHealthMe Search Analytics | Merit",
  description: "Private Search Console analytics for GoHealthMe.",
};

type SearchRow = {
  keys: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type SearchResult = {
  rows?: SearchRow[];
  responseAggregationType?: string;
};

async function getSearchData(
  accessToken: string,
  dimension: "query" | "page",
  startDate: string,
  endDate: string,
): Promise<SearchResult> {
  const response = await fetch(
    "https://searchconsole.googleapis.com/webmasters/v3/sites/" +
      encodeURIComponent("sc-domain:gohealthme.app") +
      "/searchAnalytics/query",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: [dimension],
        rowLimit: 25,
        dataState: "final",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) {
    throw new Error(`Search Console returned HTTP ${response.status}`);
  }
  return (await response.json()) as SearchResult;
}

export default async function GoHealthMeAnalytics() {
  // This route is nested under the authenticated (app) layout.
  // Tokens stay server-side. A delegated OAuth token with
  // https://www.googleapis.com/auth/webmasters.readonly is required.
  const token = process.env.GOHEALTHME_GSC_ACCESS_TOKEN;
  const today = new Date();
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  const dateString = (date: Date) => date.toISOString().slice(0, 10);
  const startDate = dateString(start);
  const endDate = dateString(end);
  let queries: SearchResult | null = null;
  let pages: SearchResult | null = null;
  let error: string | null = null;

  if (token) {
    try {
      [queries, pages] = await Promise.all([
        getSearchData(token, "query", startDate, endDate),
        getSearchData(token, "page", startDate, endDate),
      ]);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Search data unavailable";
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-5 py-10">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted">Private GoHealthMe workspace</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Search visibility</h1>
        <p className="mt-2 text-muted">
          Google Search Console · sc-domain:gohealthme.app · {startDate} to {endDate}
        </p>
      </div>
      {!token ? (
        <p className="rounded-xl border p-5">
          Google Search Console is verified, but Merit has not been authorized.
          Configure a short-lived read-only OAuth access token on the server
          as GOHEALTHME_GSC_ACCESS_TOKEN to preview data. Production integration
          needs a secure token refresh flow. No figures are shown until connected.
        </p>
      ) : error ? (
        <p className="rounded-xl border p-5">
          Search data unavailable: {error}. Check the token, scope, property
          permission, and API enablement. No zeros are inferred.
        </p>
      ) : (
        <div className="space-y-8">
          {([
            ["Search queries", queries],
            ["Landing pages", pages],
          ] as const).map(([label, result]) => (
            <section key={label} className="rounded-xl border p-5">
              <h2 className="font-display text-xl font-semibold">{label}</h2>
              {!result?.rows?.length ? (
                <p className="mt-3 text-muted">
                  No rows returned for this date range. This may reflect new
                  verification, low activity, or Search Console privacy thresholds.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th className="p-2">Search term / URL</th>
                        <th className="p-2">Clicks</th>
                        <th className="p-2">Impressions</th>
                        <th className="p-2">CTR</th>
                        <th className="p-2">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="max-w-sm break-all p-2">{row.keys[0] ?? "Unknown"}</td>
                          <td className="p-2">{row.clicks ?? "—"}</td>
                          <td className="p-2">{row.impressions ?? "—"}</td>
                          <td className="p-2">{row.ctr === undefined ? "—" : `${(row.ctr * 100).toFixed(1)}%`}</td>
                          <td className="p-2">{row.position?.toFixed(1) ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
      <p className="text-xs text-muted">
        Search Console may omit anonymized queries. This is search performance,
        not a count of signups or challenge participation.
      </p>
    </main>
  );
}
