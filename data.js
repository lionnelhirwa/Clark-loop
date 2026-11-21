/* ClarkLoop data + rules. Categories, campus buildings, partner orgs, impact
   assumptions, the rule-based "best next life" scoring, icons, and hero tiles.
   Pure constants and pure functions only (no app state here). */

const GENDERS=["Men","Women","Unisex"];
const BASE=["Shirts","Pants","Shorts","Outerwear","Athletic wear"];
const CLOTHES_TYPES={Men:[...BASE,"Other"],Women:[...BASE,"Skirts","Dresses","Other"],Unisex:[...BASE,"Other"]};
const CATS=[
 {name:"Clothes",em:"👕",mode:"gender_type",g:["#8e5bd0","#5b7bd0"]},
 {name:"Shoes",em:"👟",mode:"gender",g:["#d05b8e","#d0785b"]},
 {name:"Hats",em:"🧢",mode:"flat",g:["#5bb0d0","#5b7bd0"]},
 {name:"Jewelry",em:"💍",mode:"flat",g:["#d0ad5b","#d0785b"]},
 {name:"Accessories",em:"👜",mode:"flat",g:["#b05bd0","#d05b8e"]},
 {name:"Books",em:"📚",mode:"flat",g:["#5bd08e","#5bb0d0"]},
 {name:"School gear",em:"🎒",mode:"flat",g:["#d0785b","#d0ad5b"]},
 {name:"Electronics",em:"💻",mode:"flat",g:["#5b7bd0","#5bd0c4"]},
 {name:"Bikes & motor",em:"🚲",mode:"flat",g:["#5bd0a0","#5bb0d0"]},
 {name:"Home goods",em:"🏠",mode:"flat",g:["#d0a05b","#c45bd0"]},
 {name:"Furniture",em:"🛋️",mode:"flat",g:["#9a7bd0","#5b8ed0"]},
 {name:"Tickets",em:"🎟️",mode:"flat",g:["#d05b5b","#d0785b"]},
 {name:"Bedding & sheets",em:"🛏️",mode:"flat",g:["#5b9ed0","#8e5bd0"]},
 {name:"Other",em:"➕",mode:"flat",g:["#7a8699","#5b7bd0"]}];
function catObj(name){return CATS.find(c=>c.name===name)||CATS[CATS.length-1];}

// Campus pickup spots (name, walk minutes from the center of campus).
const BUILDINGS=[["Wright Hall",2],["Bullock Hall",4],["Dodd Hall",3],["Maywood Hall",5],
 ["Johnson-Sanford Center",6],["The University Center",1],["Goddard Library",3],["Main South (off-campus)",9]];

// Map each UI category to an impact category used by the scorer. null = no impact figure.
const IMPACT_CAT={Clothes:"Clothing",Shoes:"Clothing",Hats:"Clothing",Accessories:"Clothing",
 Jewelry:"Decor",Books:"Books","School gear":"School supplies",Electronics:"Electronics",
 "Bikes & motor":"Furniture","Home goods":"Kitchenware",Furniture:"Furniture",Tickets:null,
 "Bedding & sheets":"Bedding",Other:"Decor"};
// [weight_lb, replacement_usd, co2e_lb] — PLACEHOLDERS, not sourced. Replace before relying on impact numbers.
const CAT_IMPACT={Clothing:[1.5,20,6],Furniture:[30,80,60],"Small appliance":[5,30,25],
 Electronics:[3,60,40],Books:[1.5,25,3],Kitchenware:[3,15,5],Bedding:[4,35,12],
 Decor:[2,12,4],"School supplies":[1,10,2]};
const REQUESTS={Furniture:[0.3,0.2],Bedding:[0.3,0.4],Books:[0.2],Kitchenware:[0.6],
 Decor:[0.3],Electronics:[0.3],Clothing:[0.2],"School supplies":[0.2]};
const PARTNERS=[
 {name:"Clark Community Thrift Store",pathway:"donate",accepts:["Clothing","Kitchenware","Books","Furniture","Electronics","Bedding","Decor","School supplies"],conds:["good","fair"],dist:0.1},
 {name:"Clark move-out donation bins",pathway:"donate",accepts:["Clothing","Kitchenware","Books","Bedding","Decor","School supplies"],conds:["good"],dist:0.0},
 {name:"Habitat for Humanity ReStore",pathway:"donate",accepts:["Furniture","Kitchenware","Decor","Small appliance"],conds:["good","fair"],dist:3.0},
 {name:"Campus repair cafe",pathway:"repair",accepts:["Electronics","Small appliance","Furniture","Clothing"],conds:["fair","broken"],dist:0.5},
 {name:"Campus e-waste & recycling",pathway:"recycle",accepts:["any"],conds:["good","fair","broken"],dist:0.3}];
const FIT={reuse:{good:1,fair:.5,broken:0},repair:{good:.1,fair:.7,broken:.8},
 donate:{good:.9,fair:.5,broken:0},recycle:{good:.1,fair:.3,broken:.9}};
const PIMPACT={reuse:[.5,1,1],repair:[.4,.8,1],donate:[.5,.8,1],recycle:[0,.2,1]};

const SHOP_NAME="Clark Community Thrift Store", SCHOOL="@clarku.edu", HOLD_H=48;
const TOPICS=["Bins & recycling","Waste","Energy","Water","Reuse & donation","Other"];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];

/* ---------- small utilities ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function initials(name){const p=String(name||"?").trim().split(/\s+/);return((p[0]||"?")[0]+(p[1]?p[1][0]:"")).toUpperCase();}
function ago(ts){const d=(Date.now()-new Date(ts))/1000;if(d<60)return"just now";if(d<3600)return Math.floor(d/60)+"m ago";if(d<86400)return Math.floor(d/3600)+"h ago";return Math.floor(d/86400)+"d ago";}
function stamp(ts){return new Date(ts).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});}
function clock(ts){return new Date(ts).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});}
function datestr(ts){return new Date(ts).toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"});}
function now(h){return new Date(Date.now()-(h||0)*3600000).toISOString();}

/* ---------- inline icons ---------- */
const IC={
 feed:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
 market:'<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
 post:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
 chat:'<path d="M4 5h16v11H9l-5 4V5z"/>',
 loop:'<path d="M20 12a8 8 0 0 1-14 5"/><path d="M4 12a8 8 0 0 1 14-5"/><path d="M18 3v4h-4M6 21v-4h4"/>',
 back:'<path d="M15 5l-7 7 7 7"/>',chev:'<path d="M9 6l6 6-6 6"/>',chevd:'<path d="M6 9l6 6 6-6"/>',
 sun:'<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>',
 moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
 cam:'<rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="12" cy="12.5" r="3.2"/><path d="M8 6l1.5-2h5L16 6"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
 bell:'<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
 leaf:'<path d="M12 21c7-3 9-9 8-16-7-1-14 1-14 9a7 7 0 0 0 6 7z"/><path d="M8 20c1-5 4-8 8-10"/>',
 edit:'<path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/>',
 check:'<path d="M4 12l5 5L20 6"/>',
 checks:'<path d="M1 13l4 4L12 9"/><path d="M8 13l4 4L23 5"/>',
 pin:'<path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.4"/>',
 image:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.8"/><path d="M21 16l-5-4-8 7"/>',
 logout:'<path d="M15 4h4v16h-4"/><path d="M10 12H3"/><path d="M7 8l-4 4 4 4"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 shirt:'<path d="M8 4l4 3 4-3 4 3-2 3-2-1v11H8V9L6 10 4 7z"/>',
 dress:'<path d="M9 3l3 3 3-3 1 5-2 2 3 11H7l3-11-2-2z"/>',
 lamp:'<path d="M9 3h6l3 7H6z"/><path d="M12 10v8"/><path d="M8 21h8"/>',
 book:'<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M9 4v14"/>',
 bike:'<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-8h6M9 9h6l3 8"/>',
 shoe:'<path d="M3 16h12l6 2v2H3z"/><path d="M3 16v-4l5 1 2 3"/>',
 mug:'<path d="M5 8h11v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/><path d="M16 10h2a2 2 0 0 1 0 6h-2"/>',
 chair:'<path d="M7 4v8h10V4M7 12l-1 8M17 12l1 8M6 15h12"/>'};
function svg(n,w){return `<svg width="${w||22}" height="${w||22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||""}</svg>`;}
function catIcon(cat){const m={Clothes:"shirt",Shoes:"shoe",Books:"book","Home goods":"mug","Bikes & motor":"bike",Furniture:"chair","Bedding & sheets":"book",Electronics:"lamp"};return m[cat]||"cam";}

/* Hero tiles for the landing page (self-contained, no external images). */
const HERO=[
 {t:"Winter coat",p:"$18",i:"shirt",g:["#6d5bd0","#9a5bd0"]},
 {t:"Floral dress",p:"Free",i:"dress",g:["#d05b9e","#d0785b"]},
 {t:"Desk lamp",p:"$5",i:"lamp",g:["#5b8ed0","#5bd0c4"]},
 {t:"Textbooks",p:"$12",i:"book",g:["#5bd08e","#5bb0d0"]},
 {t:"Road bike",p:"$60",i:"bike",g:["#5bd0a0","#8ed05b"]},
 {t:"Running shoes",p:"$15",i:"shoe",g:["#d0a05b","#d0785b"]},
 {t:"Mug set",p:"Free",i:"mug",g:["#c45bd0","#6d5bd0"]},
 {t:"Desk chair",p:"$10",i:"chair",g:["#5b7bd0","#5b9ed0"]},
 {t:"Mini fridge",p:"Free",i:"cam",g:["#d05b5b","#d0785b"]},
 {t:"Backpack",p:"$8",i:"shirt",g:["#5bc4d0","#5b8ed0"]}];

/* ---------- scoring (rule-based, not AI) ---------- */
function closeness(d,mx){return Math.max(0,1-Math.min(d/mx,1));}
function pack(p,c,a,l,pp,reason){let s=100*(0.4*c+0.3*a+0.2*l+0.1*pp);if(a===0)s=Math.min(s,25);if(c===0)s=Math.min(s,15);return{pathway:p,score:Math.round(s*10)/10,reason};}
function scorePathways(impactCat,cond){
 const out=[];const req=REQUESTS[impactCat]||[];
 if(req.length){const n=req.length,mn=Math.min(...req);
  out.push(pack("reuse",FIT.reuse[cond],Math.min(n/3,1),closeness(mn,2),1,`${n} student request(s) nearby, closest ${mn.toFixed(1)} mi.`));
 }else out.push(pack("reuse",FIT.reuse[cond],0,0,0,"No campus requests for this right now."));
 ["repair","donate","recycle"].forEach(pw=>{
  const ok=PARTNERS.filter(p=>p.pathway===pw&&(p.accepts.includes(impactCat)||p.accepts.includes("any"))&&p.conds.includes(cond));
  const c=FIT[pw][cond];
  if(ok.length){const near=ok.slice().sort((a,b)=>a.dist-b.dist)[0];
   out.push(pack(pw,c,1,closeness(near.dist,5),Math.min(ok.length/2,1),`${near.name} takes it (${near.dist.toFixed(1)} mi).`));
  }else if(pw==="recycle")out.push(pack(pw,c,0.4,0,0,"Fall back to campus recycling."));
  else out.push(pack(pw,c,0,0,0,`No ${pw} partner for this and condition.`));});
 return out.sort((a,b)=>b.score-a.score);
}
function impactOf(uiCat,pathway){const k=IMPACT_CAT[uiCat];if(!k||!CAT_IMPACT[k])return null;
 const[w,u,co]=CAT_IMPACT[k],f=PIMPACT[pathway]||PIMPACT.reuse;
 return{lb:Math.round(w*f[2]*10)/10,usd:Math.round(u*f[0]),co2:Math.round(co*f[1])};}
