import {createClient} from "@supabase/supabase-js";

const keys=["target","base","bonus","equity","consumer","b2b","applications","outreach","practice","posts"] as const;
type GoalKey=typeof keys[number];
/** Only call after OAuth issuer, audience and scope verification at transport boundary.
 * Supabase must accept the verified user access token; never substitute a service key.
 */
export async function profileTools(token:string){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key||!token)throw new Error("Profile access unavailable");
 const db=createClient(url,key,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await db.auth.getUser(token);
 if(error||!user)throw new Error("Authentication required");
 const id=user.id;
 return {
  async getProfile(){return {id,email:user.email??null};},
  async getGoals(){
   const {data,error}=await db.from("personal_goals").select("values,updated_at").eq("user_id",id).maybeSingle();
   if(error)throw new Error("Goals unavailable");
   return data??{values:{},updated_at:null};
  },
  async listActivity(){
   const {data,error}=await db.from("profile_activity").select("id,kind,title,body,created_at").eq("user_id",id).order("created_at",{ascending:false}).limit(50);
   if(error)throw new Error("Activity unavailable");
   return data??[];
  },
  async saveActivity(input:{request_id:string;kind:"note"|"goal_progress"|"outreach_draft"|"outreach_manual_sent";title:string;body:string}){
   if(!["note","goal_progress","outreach_draft","outreach_manual_sent"].includes(input.kind)||!input.title.trim()||input.title.length>200||input.body.length>20000||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.request_id))throw new Error("Invalid activity");
   const {error}=await db.from("profile_activity").upsert({...input,user_id:id,source:"chatgpt"},{onConflict:"user_id,request_id",ignoreDuplicates:true});
   if(error)throw new Error("Save not confirmed");
   const {data,error:readError}=await db.from("profile_activity").select("id,kind,title,body,created_at").eq("user_id",id).eq("request_id",input.request_id).single();
   if(readError||!data||data.kind!==input.kind||data.title!==input.title||data.body!==input.body)throw new Error("Request conflict or save not confirmed");
   return data;
  }
 };
}
