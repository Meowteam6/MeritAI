"use client";
import { useEffect, useState } from "react";
import Activity from "./Activity";
import { createClient } from "@/lib/supabase/client";

const fields = [
 ["target","Annual combined income target"], ["base","Annual base salary"], ["bonus","Annual bonus"], ["equity","Annualized equity / options estimate"], ["consumer","Consumer business personal annual profit"], ["b2b","B2B business personal annual profit"], ["applications","Applications this week"], ["outreach","Outreach this week"], ["practice","Interview practice sessions this week"], ["posts","Published posts this week"]
] as const;
type Values = Record<string, number>;
const money = (n:number) => n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});
export default function GoalsPage(){
 const [values,setValues]=useState<Values>({});
 const [ready,setReady]=useState(false);
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 useEffect(()=>{
  let active=true;
  async function load(){
   try {
    const db=createClient();
    const {data:{user},error:authError}=await db.auth.getUser();
    if(authError || !user) throw new Error("Sign in to access goals.");
    const {data,error}=await db.schema("develop").from("personal_goals").select("values").eq("user_id",user.id).maybeSingle();
    if(error) throw error;
    if(active){setValues(data?.values ?? {});setReady(true);}
   } catch {if(active)setMessage("Unable to load goals. Check sign-in and database setup.");}
  }
  void load();return ()=>{active=false;};
 },[]);
 async function save(){
  setSaving(true);setMessage("");
  try{
   const db=createClient();
   const {data:{user},error:authError}=await db.auth.getUser();
   if(authError || !user) throw new Error("Sign in required");
   const {error}=await db.schema("develop").from("personal_goals").upsert({user_id:user.id,values,updated_at:new Date().toISOString()});
   if(error) throw error;
   setMessage("Saved.");
  }catch{setMessage("Save failed. Your changes have not been saved.");}finally{setSaving(false);}
 }
 const total=["base","bonus","equity","consumer","b2b"].reduce((sum,key)=>sum+(values[key]??0),0);
 const target=values.target??0;
 return <div className="flex flex-col gap-6">
  <header><h1 className="font-display text-3xl font-bold text-ink">Career & income goals</h1><p className="text-muted">Track annual compensation, business profit and weekly progress. Equity estimates are not realized cash.</p></header>
  <section className="rounded-2xl bg-surface border border-black/5 p-6">
   <p>Combined annual estimate</p><p className="text-3xl font-bold">{money(total)}</p>
   <p>{target>0?money(Math.max(0,target-total))+" remaining":"Set an annual target"}</p>
   {target>0 && <progress className="w-full" aria-label="Income goal progress" max={target} value={Math.min(total,target)}/>}
  </section>
  <form className="grid gap-4 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();void save();}}>
   {fields.map(([key,label])=><label key={key} className="flex flex-col gap-1 text-sm">{label}<input className="rounded-xl border border-black/15 bg-surface p-3" type="number" min="0" step="1" disabled={!ready||saving} value={values[key]??""} onChange={e=>{const n=e.target.valueAsNumber;setValues(old=>({...old,[key]:Number.isFinite(n)?Math.max(0,n):0}));}}/></label>)}
   <button className="rounded-xl bg-primary p-3 text-white disabled:opacity-50" disabled={!ready||saving} type="submit">{saving?"Saving…":"Save goals"}</button>
  </form><p role="status">{message || (!ready?"Loading…":"")}</p>
  <Activity/>
 </div>;
}
