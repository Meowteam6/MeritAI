"use client";
import {useEffect,useState,useRef} from "react";
import {createClient} from "@/lib/supabase/client";
type Entry={id:string;kind:string;title:string;body:string;created_at:string};
export default function Activity(){
 const [entries,setEntries]=useState<Entry[]>([]);
 const [title,setTitle]=useState("");
 const [body,setBody]=useState("");
 const [kind,setKind]=useState("note");
 const [status,setStatus]=useState("");
 const [ready,setReady]=useState(false);
 const [busy,setBusy]=useState(false);
 const request=useRef<string|null>(null);
 async function load(){
  const db=createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user) throw new Error("Authentication required");
  const {data,error}=await db.from("profile_activity").select("id,kind,title,body,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50);
  if(error) throw error;
  return data??[];
 }
 useEffect(()=>{let active=true;void load().then(data=>{if(active){setEntries(data);setReady(true);}}).catch(()=>{if(active)setStatus("Unable to load activity. Check database migration and sign-in.");});return ()=>{active=false;};},[]);
 async function save(){
  if(busy||!ready||!title.trim())return;
  setBusy(true);setStatus("");
  try{
   const db=createClient();
   const {data:{user},error:authError}=await db.auth.getUser();
   if(authError||!user)throw new Error("Authentication required");
   request.current??=crypto.randomUUID();
   const {error}=await db.from("profile_activity").upsert({user_id:user.id,kind,title:title.trim(),body,source:"web",request_id:request.current},{onConflict:"user_id,request_id",ignoreDuplicates:true});
   if(error)throw error;
   request.current=null;setTitle("");setBody("");setStatus("Saved to your profile.");
   try{setEntries(await load());}catch{setStatus("Saved, but history could not refresh.");}
  }catch{setStatus("Save not confirmed. Retry without editing to reuse the request ID.");}
  finally{setBusy(false);}
 }
 return <section className="rounded-2xl border border-black/10 bg-surface p-5 flex flex-col gap-4">
  <h2 className="text-xl font-bold">Profile activity</h2>
  <p className="text-muted">Save private notes, progress updates and outreach drafts. Progress notes do not change numeric goal totals.</p>
  <form className="flex flex-col gap-3" onSubmit={e=>{e.preventDefault();void save();}}>
   <label>Type<select className="block w-full border rounded p-2" disabled={busy} value={kind} onChange={e=>{request.current=null;setKind(e.target.value);}}><option value="note">Note</option><option value="goal_progress">Progress note</option><option value="outreach_draft">Outreach draft</option><option value="outreach_manual_sent">Manually sent outreach</option></select></label>
   <label>Title<input className="block w-full border rounded p-2" required maxLength={200} disabled={busy} value={title} onChange={e=>{request.current=null;setTitle(e.target.value);}}/></label>
   <label>Details<textarea className="block w-full border rounded p-2" maxLength={20000} disabled={busy} value={body} onChange={e=>{request.current=null;setBody(e.target.value);}}/></label>
   <button type="submit" disabled={!ready||busy||!title.trim()} className="rounded-xl bg-primary p-3 text-white disabled:opacity-50">{busy?"Saving…":"Save to profile"}</button>
  </form>
  <p role="status">{status}</p>
  {ready&&entries.length===0&&<p>No activity yet.</p>}
  {entries.map(entry=><article key={entry.id} className="border-t pt-3"><h3 className="font-semibold">{entry.title}</h3><p className="text-sm text-muted">{entry.kind.replaceAll("_"," ")} · {new Date(entry.created_at).toLocaleString()}</p><p className="whitespace-pre-wrap break-words">{entry.body}</p></article>)}
 </section>;
}
