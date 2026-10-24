"use client";

import { useEffect, useMemo, useState } from "react";

type Channel = "Paid ads" | "Product Hunt & directories" | "Friends & family beta" | "Conference outreach" | "Ecosystem outreach" | "Conferences, hackathons & accelerators";
type Status = "Planned" | "Contacted" | "In progress" | "Responded" | "Converted" | "Paused";
type Entry = {
  id: string;
  name: string;
  channel: Channel;
  status: Status;
  contact: string;
  url: string;
  owner: string;
  due: string;
  note: string;
  utm: string;
  createdAt: string;
};
const channels: Channel[] = [
  "Paid ads",
  "Product Hunt & directories",
  "Friends & family beta",
  "Conference outreach",
  "Ecosystem outreach",
  "Conferences, hackathons & accelerators",
];
const statuses: Status[] = ["Planned", "Contacted", "In progress", "Responded", "Converted", "Paused"];
const KEY = "merit-gohealthme-gtm-local-v1";
function safeUrl(raw: string) {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
function utmLink(channel: Channel, name: string) {
  const url = new URL("https://www.gohealthme.app/");
  url.searchParams.set("utm_source", channel.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
  url.searchParams.set("utm_medium", channel === "Paid ads" ? "paid" : "outreach");
  url.searchParams.set("utm_campaign", name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60) || "launch");
  return url.href;
}

export function GtmBoard() {
  const [items, setItems] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);
  const [channel, setChannel] = useState<Channel>("Friends & family beta");
  const [status, setStatus] = useState<Status>("Planned");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [url, setUrl] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("All channels");
  const [term, setTerm] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          queueMicrotask(() => setItems(parsed.filter((item): item is Entry =>
            typeof item === "object" && item !== null &&
            typeof item.id === "string" && typeof item.name === "string" &&
            channels.includes(item.channel) && statuses.includes(item.status))));
        }
      }
    } catch {
      queueMicrotask(() => setMessage("Saved entries could not be loaded. Your current browser may restrict local storage."));
    }
    queueMicrotask(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(items)); }
    catch { queueMicrotask(() => setMessage("Changes could not be saved in this browser.")); }
  }, [ready, items]);
  const visible = useMemo(
    () => items.filter((item) =>
      (filter === "All channels" || item.channel === filter) &&
      [item.name, item.contact, item.owner, item.note].join(" ").toLowerCase().includes(term.toLowerCase())),
    [items, filter, term],
  );
  const count = (s: Status) => items.filter((item) => item.status === s).length;
  function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    const entry: Entry = {
      id: crypto.randomUUID(),
      name: name.trim(), channel, status, contact: contact.trim(),
      url: url.trim(), owner: owner.trim(), due, note: note.trim(),
      utm: utmLink(channel, name.trim()), createdAt: new Date().toISOString(),
    };
    setItems((current) => [entry, ...current]);
    setName(""); setContact(""); setUrl(""); setDue(""); setNote("");
    setMessage("Saved locally in this browser. Not synchronized to Merit servers.");
  }
  function exportCsv() {
    const fields: (keyof Entry)[] = ["name", "channel", "status", "contact", "url", "owner", "due", "note", "utm", "createdAt"];
    const q = (v: string) => '"' + v.replace(/"/g, '""').replace(/^[=+\-@]/, "'$&") + '"';
    const csv = [fields.join(","), ...items.map((entry) => fields.map((field) => q(entry[field])).join(","))].join("\r\n");
    const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = href; a.download = "gohealthme-gtm.csv"; a.click();
    URL.revokeObjectURL(href);
  }
  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-4">
        {([["Total outreach", items.length], ["Planned", count("Planned")], ["Responded", count("Responded")], ["Converted", count("Converted")]] as const).map(([label, value]) => (
          <div key={label} className="rounded-xl border p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{ready ? value : "—"}</p>
          </div>
        ))}
      </section>
      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-semibold">Log campaign or outreach</h2>
        <form onSubmit={addItem} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">Campaign or organization
            <input required maxLength={160} value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border p-2 text-foreground" placeholder="E.g. NY health-tech accelerator"/>
          </label>
          <label className="space-y-1 text-sm">Channel
            <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className="w-full rounded-lg border p-2 text-foreground">
              {channels.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">Status
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full rounded-lg border p-2 text-foreground">
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">Contact / organization
            <input value={contact} onChange={(e) => setContact(e.target.value)} className="w-full rounded-lg border p-2 text-foreground"/>
          </label>
          <label className="space-y-1 text-sm">Campaign or opportunity URL
            <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full rounded-lg border p-2 text-foreground" placeholder="https://..."/>
          </label>
          <label className="space-y-1 text-sm">Owner
            <input value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full rounded-lg border p-2 text-foreground"/>
          </label>
          <label className="space-y-1 text-sm">Follow-up / deadline
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-full rounded-lg border p-2 text-foreground"/>
          </label>
          <label className="space-y-1 text-sm">Notes / next action
            <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg border p-2 text-foreground"/>
          </label>
          <div className="md:col-span-2"><button type="submit" className="rounded-lg border px-4 py-2 font-semibold">Add outreach</button></div>
        </form>
        {message && <p role="status" className="mt-3 text-sm text-muted">{message}</p>}
      </section>
      <section className="space-y-4 rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Outreach pipeline</h2>
          <button type="button" onClick={exportCsv} disabled={!items.length} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Export CSV</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <select aria-label="Filter channel" value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border p-2">
            <option>All channels</option>{channels.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input aria-label="Search outreach" placeholder="Search campaign, contact or owner" value={term} onChange={(e) => setTerm(e.target.value)} className="rounded-lg border p-2"/>
        </div>
        {!ready ? <p>Loading local entries…</p> : visible.length === 0 ? (
          <p className="text-muted">No outreach records match. Add your first campaign above.</p>
        ) : (
          <ul className="space-y-3">
            {visible.map((item) => (
              <li key={item.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><h3 className="font-semibold">{item.name}</h3><p className="text-sm text-muted">{item.channel} · {item.contact || "No contact"}</p></div>
                  <select aria-label={`Status of ${item.name}`} value={item.status} onChange={(e) => setItems((current) => current.map((row) => row.id === item.id ? { ...row, status: e.target.value as Status } : row))} className="rounded-lg border p-2 text-sm">
                    {statuses.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <p className="text-sm">Owner: {item.owner || "Unassigned"} · Follow-up: {item.due || "Not set"}</p>
                {item.note && <p className="text-sm">{item.note}</p>}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <a href={item.utm} target="_blank" rel="noopener noreferrer" className="underline">Open tracked campaign link</a>
                  <button type="button" onClick={() => navigator.clipboard.writeText(item.utm).then(() => setMessage("Campaign URL copied.")).catch(() => setMessage("Clipboard unavailable."))} className="underline">Copy UTM</button>
                  {safeUrl(item.url) && <a className="underline" href={safeUrl(item.url)!} target="_blank" rel="noopener noreferrer">Opportunity</a>}
                  <button type="button" onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))} className="underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-sm text-muted">
        UTM links label traffic for a future analytics integration; they do not measure clicks, signups or conversions by themselves.
        Export your CSV before clearing browser data. No emails are sent from this workspace.
      </p>
    </div>
  );
}
