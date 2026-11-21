/* ClarkLoop data + rules (no framework). Categories, partners, impact, and the
   rule-based "best next life" scoring. Pure constants and pure functions only. */

const GENDERS=["Men","Women","Unisex"];
const BASE=["Shirts","Pants","Shorts","Outerwear","Athletic wear"];
const CLOTHES_TYPES={Men:[...BASE,"Other"],Women:[...BASE,"Skirts","Dresses","Other"],Unisex:[...BASE,"Other"]};
const CATS=[
 {name:"Clothes",em:"👕",mode:"gender_type"},{name:"Shoes",em:"👟",mode:"gender"},
 {name:"Hats",em:"🧢",mode:"flat"},{name:"Jewelry",em:"💍",mode:"flat"},
 {name:"Accessories",em:"👜",mode:"flat"},{name:"Books",em:"📚",mode:"flat"},
 {name:"School gear",em:"🎒",mode:"flat"},{name:"Electronics",em:"💻",mode:"flat"},
 {name:"Bikes & motor",em:"🚲",mode:"flat"},{name:"Home goods",em:"🏠",mode:"flat"},
 {name:"Furniture",em:"🛋️",mode:"flat"},{name:"Tickets",em:"🎟️",mode:"flat"},
 {name:"Bedding & sheets",em:"🛏️",mode:"flat"},{name:"Other",em:"➕",mode:"flat"}];

// Map each UI category to an impact category used by the scorer. null = no impact figure.
const IMPACT_CAT={Clothes:"Clothing",Shoes:"Clothing",Hats:"Clothing",Accessories:"Clothing",
 Jewelry:"Decor",Books:"Books","School gear":"School supplies",Electronics:"Electronics",
 "Bikes & motor":"Furniture","Home goods":"Kitchenware",Furniture:"Furniture",Tickets:null,
 "Bedding & sheets":"Bedding",Other:"Decor"};
// [weight_lb, replacement_usd, co2e_lb] — PLACEHOLDERS, not sourced. Replace before relying on impact numbers.
const CAT_IMPACT={Clothing:[1.5,20,6],Furniture:[30,80,60],"Small appliance":[5,30,25],
 Electronics:[3,60,40],Books:[1.5,25,3],Kitchenware:[3,15,5],Bedding:[4,35,12],
 Decor:[2,12,4],"School supplies":[1,10,2]};
// Sample on-campus demand (distances in miles) used by the reuse pathway.
const REQUESTS={Furniture:[0.3,0.2],Bedding:[0.3,0.4],Books:[0.2],Kitchenware:[0.6],
 Decor:[0.3],Electronics:[0.3],Clothing:[0.2],"School supplies":[0.2]};
// Partner orgs. The repair/recycle ones are SAMPLES until real contacts are added.
const PARTNERS=[
 {name:"Clark Community Thrift Store",pathway:"donate",accepts:["Clothing","Kitchenware","Books","Furniture","Electronics","Bedding","Decor","School supplies"],conds:["good","fair"],dist:0.1},
 {name:"Clark move-out donation bins",pathway:"donate",accepts:["Clothing","Kitchenware","Books","Bedding","Decor","School supplies"],conds:["good"],dist:0.0},
 {name:"Habitat for Humanity ReStore",pathway:"donate",accepts:["Furniture","Kitchenware","Decor","Small appliance"],conds:["good","fair"],dist:3.0},
 {name:"Campus repair cafe (sample)",pathway:"repair",accepts:["Electronics","Small appliance","Furniture","Clothing"],conds:["fair","broken"],dist:0.5},
 {name:"Campus e-waste & recycling (sample)",pathway:"recycle",accepts:["any"],conds:["good","fair","broken"],dist:0.3}];
// How well a condition suits each pathway (0..1).
const FIT={reuse:{good:1,fair:.5,broken:0},repair:{good:.1,fair:.7,broken:.8},
 donate:{good:.9,fair:.5,broken:0},recycle:{good:.1,fair:.3,broken:.9}};
// Pathway impact multipliers: [usd share, co2 share, diverted share].
const PIMPACT={reuse:[.5,1,1],repair:[.4,.8,1],donate:[.5,.8,1],recycle:[0,.2,1]};

const SHOP_NAME="Clark Community Thrift Store", SCHOOL="@clarku.edu", HOLD_H=48;
const TOPICS=["Bins & recycling","Waste","Energy","Water","Reuse & donation","Other"];

/* ---------- small utilities ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function nameOf(email){return email===SHOP_NAME?SHOP_NAME:String(email).split("@")[0];}
function ago(ts){const d=(Date.now()-new Date(ts))/1000;if(d<3600)return Math.max(1,Math.floor(d/60))+"m ago";if(d<86400)return Math.floor(d/3600)+"h ago";return Math.floor(d/86400)+"d ago";}
function stamp(ts){return new Date(ts).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});}
function now(h){return new Date(Date.now()-(h||0)*3600000).toISOString();}

/* ---------- inline icons ---------- */
const IC={
 feed:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
 market:'<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
 post:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
 chat:'<path d="M4 5h16v11H9l-5 4V5z"/>',
 loop:'<path d="M20 12a8 8 0 0 1-14 5"/><path d="M4 12a8 8 0 0 1 14-5"/><path d="M18 3v4h-4M6 21v-4h4"/>',
 back:'<path d="M15 5l-7 7 7 7"/>',chev:'<path d="M9 6l6 6-6 6"/>',
 sun:'<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>',
 moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
 cam:'<rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="12" cy="12.5" r="3.2"/><path d="M8 6l1.5-2h5L16 6"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'};
function svg(n,w){return `<svg width="${w||22}" height="${w||22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;}

/* ---------- scoring (rule-based, not AI) ---------- */
function close(d,mx){return Math.max(0,1-Math.min(d/mx,1));}
function pack(p,c,a,l,pp,reason){let s=100*(0.4*c+0.3*a+0.2*l+0.1*pp);if(a===0)s=Math.min(s,25);if(c===0)s=Math.min(s,15);return{pathway:p,score:Math.round(s*10)/10,reason,c,a};}
function scorePathways(impactCat,cond){
 const out=[];const req=REQUESTS[impactCat]||[];
 if(req.length){const n=req.length,mn=Math.min(...req);
  out.push(pack("reuse",FIT.reuse[cond],Math.min(n/3,1),close(mn,2),1,`${n} student request(s) nearby, closest ${mn.toFixed(1)} mi.`));
 }else out.push(pack("reuse",FIT.reuse[cond],0,0,0,"No campus requests for this right now."));
 ["repair","donate","recycle"].forEach(pw=>{
  const ok=PARTNERS.filter(p=>p.pathway===pw&&(p.accepts.includes(impactCat)||p.accepts.includes("any"))&&p.conds.includes(cond));
  const c=FIT[pw][cond];
  if(ok.length){const near=ok.slice().sort((a,b)=>a.dist-b.dist)[0];
   out.push(pack(pw,c,1,close(near.dist,5),Math.min(ok.length/2,1),`${near.name} takes it (${near.dist.toFixed(1)} mi).`));
  }else if(pw==="recycle")out.push(pack(pw,c,0.4,0,0,"Fall back to campus recycling."));
  else out.push(pack(pw,c,0,0,0,`No ${pw} partner for this + condition.`));});
 return out.sort((a,b)=>b.score-a.score);
}
function impactOf(uiCat,pathway){const k=IMPACT_CAT[uiCat];if(!k||!CAT_IMPACT[k])return null;
 const[w,u,co]=CAT_IMPACT[k],f=PIMPACT[pathway]||PIMPACT.reuse;
 return{lb:Math.round(w*f[2]*10)/10,usd:Math.round(u*f[0]),co2:Math.round(co*f[1])};}
