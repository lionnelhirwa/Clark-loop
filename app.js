/* ClarkLoop app: storage, state, screens, and event handling.
   Uses constants and helpers from data.js. Data is saved in this browser only. */
"use strict";

/* ---------- storage ---------- */
const KEY="clarkloop_v1";
let DB={seq:1,listings:[],messages:[],suggestions:[],donations:[]};
function load(){try{const r=localStorage.getItem(KEY);if(r)DB=JSON.parse(r);}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(DB));}catch(e){note("Storage is full or blocked; this change may not be saved.");}}

/* ---------- tiny DOM helpers ---------- */
const $=s=>document.querySelector(s);
let TOAST;
function toast(m){clearTimeout(TOAST);let t=$("#toast");if(!t){t=document.createElement("div");t.id="toast";t.style.cssText="position:fixed;left:50%;bottom:78px;transform:translateX(-50%);background:var(--fg);color:var(--bg);padding:10px 16px;border-radius:999px;font-size:13px;font-weight:600;z-index:50;max-width:90%;text-align:center;transition:opacity .2s";document.body.appendChild(t);}t.textContent=m;t.style.opacity="1";TOAST=setTimeout(()=>t.style.opacity="0",2200);}
function note(m){toast(m);}

/* ---------- state ---------- */
let S={user:null,screen:"feed",view:null,thread:null,showClosed:false,
 market:{q:"",cat:null,free:false,shop:false},
 post:newPost(),cat:{level:"cat",cat:null},
 assist:{cat:"Clothes",cond:"good",paid:0},
 sug:{topic:TOPICS[0],place:"",body:"",anon:false},
 don:{org:PARTNERS.filter(p=>p.pathway==="donate")[0].name,what:"",cat:"Clothes",cond:"Good",where:""}};
function newPost(){return{title:"",desc:"",photos:[],cat:null,sub:null,type:null,cond:"Good",size:"",free:false,price:0,pickup:"",vis:"clark"};}
const isClark=()=>S.user&&S.user.role==="clark";
const isShop=()=>S.user&&S.user.role==="shop";
const canAct=()=>S.user&&S.user.role!=="guest";
const me=()=>S.user?S.user.email:"";

/* ---------- seed sample data ---------- */
function seed(){
 if(DB.listings.length)return;
 const S0=[
  ["Wool blanket","Bedding & sheets",null,null,"Good","",0,true,"Outside my hall door (sample)","clark","available",1],
  ["Mini fridge","Furniture",null,null,"Good","",0,true,"By the main entrance (sample)","everyone","available",3],
  ["Desk lamp","Home goods",null,null,"Good","",5,false,"","everyone","available",5],
  ["Winter coat","Clothes","Men","Outerwear","Good","M",20,false,"","everyone","available",8],
  ["Floral dress","Clothes","Women","Dresses","New","S",0,true,"Hall lobby shelf (sample)","clark","available",10],
  ["Intro stats textbook","Books",null,null,"Poor","",12,false,"","clark","available",14],
  ["Road bike","Bikes & motor",null,null,"Good","54cm",60,false,"","everyone","available",20],
  ["Running shoes","Shoes","Unisex",null,"Good","10",15,false,"","clark","available",26],
  ["Storage bins","Home goods",null,null,"Good","",0,true,"Outside my door (sample)","clark","picked_up",30],
  ["Concert tickets x2","Tickets",null,null,"New","",25,false,"","clark","available",40]];
 S0.forEach((x,i)=>{const[t,c,sub,ty,cond,sz,pr,free,pk,vis,st,h]=x;
  DB.listings.push({id:DB.seq++,seller:"sample"+(i%3+1)+SCHOOL,title:t+" (sample)",desc:"Sample listing for the demo.",
   photos:[],cat:c,sub,type:ty,cond,size:sz,price:free?0:pr,free,pickup:pk,vis,status:st,
   closedBy:st!=="available"?"sample"+SCHOOL:null,closedAt:st!=="available"?now(h-1):null,
   reservedBy:null,reservedAt:null,shop:null,sample:true,ts:now(h)});});
 const SH=[["Corduroy jacket","Clothes","Men","Outerwear","Good","M",8],
  ["Ceramic mug set","Home goods",null,null,"Good","",4],["Paperback bundle","Books",null,null,"Good","",2],
  ["Desk chair","Furniture",null,null,"Poor","",10],["Winter scarf","Accessories",null,null,"Good","",3]];
 SH.forEach((x,i)=>{const[t,c,sub,ty,cond,sz,pr]=x;DB.listings.push({id:DB.seq++,seller:SHOP_NAME,
  title:t+" (sample)",desc:"Sample thrift-store item.",photos:[],cat:c,sub,type:ty,cond,size:sz,price:pr,
  free:false,pickup:"",vis:"everyone",status:"available",closedBy:null,closedAt:null,reservedBy:null,
  reservedAt:null,shop:SHOP_NAME,sample:true,ts:now(2+i*3)});});
 DB.suggestions.push({id:DB.seq++,author:"sample1"+SCHOOL,anon:false,topic:"Bins & recycling",
  place:"Sample building, 2nd floor",body:"Add a recycling bin on this floor. The nearest one is two floors down.",
  votes:["a"+SCHOOL,"b"+SCHOOL,"c"+SCHOOL],sample:true,ts:now(12)});
 DB.suggestions.push({id:DB.seq++,author:"sample2"+SCHOOL,anon:true,topic:"Energy",place:"Sample hall lounge",
  body:"Lights stay on all night in the lounge. A motion sensor would help.",votes:[],sample:true,ts:now(20)});
 save();
}

/* ---------- visibility ---------- */
function visible(l){if(isClark()||isShop())return true;return l.vis==="everyone";}
function feedItems(){return DB.listings.filter(l=>l.free&&visible(l)&&(S.showClosed||l.status==="available"));}
function marketItems(){const m=S.market;return DB.listings.filter(l=>{
 if(!visible(l))return false;if(l.status!=="available"&&l.status!=="reserved")return false;
 if(m.free&&!l.free)return false;if(m.shop&&!l.shop)return false;
 if(m.cat&&l.cat!==m.cat)return false;
 if(m.q){const q=m.q.toLowerCase();if(!(l.title.toLowerCase().includes(q)||(l.desc||"").toLowerCase().includes(q)))return false;}
 return true;}).sort((a,b)=>new Date(b.ts)-new Date(a.ts));}
function pathLabel(l){let p=[l.cat];if(l.sub)p.push(l.sub);if(l.type)p.push(l.type);return p.join(" › ");}

/* ---------- render ---------- */
function render(){
 const app=$("#app");
 if(!S.user){app.innerHTML=signin();return;}
 if(S.view){app.innerHTML=subpage();return;}
 app.innerHTML=topbar()+`<div class="content" id="content">${screenHtml()}</div>`+navbar();
}
function topbar(){
 const t=(document.documentElement.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"));
 const role=isShop()?"Thrift store":isClark()?"Clark member":canAct()?"Visitor":"Guest";
 return `<div class="bar">
  <div class="brand"><span class="brandC">C</span>ClarkLoop</div><div class="spacer"></div>
  <span class="rolechip">${esc(role)}</span>
  <button class="iconbtn" data-act="theme" aria-label="Toggle theme">${svg(t==="dark"?"sun":"moon",20)}</button>
  <button class="iconbtn" data-act="signout" aria-label="Sign out">${svg("back",20)}</button></div>`;
}
function navbar(){
 const tabs=[["feed","Feed"],["market","Market"],["post","Post"],["chat","Chat"],["loop","LoopBack"]];
 return `<div class="nav">`+tabs.map(([k,l])=>`<button data-act="tab" data-tab="${k}" class="${S.screen===k?"on":""}">${svg(k)}<span>${l}</span></button>`).join("")+`</div>`;
}
function screenHtml(){
 if(S.screen==="feed")return feedScreen();
 if(S.screen==="market")return marketScreen();
 if(S.screen==="post")return postScreen();
 if(S.screen==="chat")return chatScreen();
 return loopScreen();
}

/* cards */
function statusPill(l){
 if(l.status==="picked_up")return `<span class="pill done">Picked up</span>`;
 if(l.status==="sold")return `<span class="pill done">Sold</span>`;
 if(l.status==="reserved")return `<span class="pill res">Reserved</span>`;
 return "";
}
function cardHtml(l){
 const price=l.free?`<span class="price free">Free</span>`:`<span class="price">$${l.price}</span>`;
 const th=l.photos&&l.photos[0]?`<img src="${l.photos[0]}" alt="">`:svg("cam",26);
 const sp=statusPill(l);
 const line2=l.shop?`<span class="pill shop">${esc(l.shop)}</span>`:`<span class="meta">${esc(pathLabel(l))}</span>`;
 return `<div class="card"><div class="lc" data-act="open" data-id="${l.id}">
  <div class="thumb">${th}</div>
  <div class="info"><div class="row1"><span class="title">${esc(l.title)}</span>${price}</div>
   <div class="meta">${esc(l.cond)}${l.size?" · size "+esc(l.size):""}</div>
   ${line2}${sp?`<div>${sp}</div>`:""}</div></div></div>`;
}

/* FEED */
function feedScreen(){
 const items=feedItems();
 let body;
 if(!items.length){
  body=`<div class="empty">${isClark()||isShop()?"Nothing free right now. Check back around move-out.":"No free items available for you right now.<br>Students can share some items with everyone."}</div>`;
 }else body=`<div class="list">${items.map(cardHtml).join("")}</div>`;
 return `<div class="pad"><h2 class="screen">Free stuff to grab</h2>
  <p class="sub">Something left outside? Tap it, then “I picked it up” so nobody wastes a trip.</p>
  <div class="toggle"><span style="font-size:13px;color:var(--muted)">Show already picked up</span>
   <div class="sw ${S.showClosed?"on":""}" data-act="showclosed" role="button" aria-label="Show picked up"></div></div>
  ${body}</div>`;
}

/* MARKET */
function marketScreen(){
 const m=S.market,items=marketItems();
 const cats=["All",...CATS.map(c=>c.name)];
 const chips=`<div class="chips">
   <button class="chip ${m.free?"on":""}" data-act="mfree">Free</button>
   <button class="chip ${m.shop?"on":""}" data-act="mshop">Thrift store</button>
   ${cats.map(c=>`<button class="chip ${((c==="All")?!m.cat:m.cat===c)?"on":""}" data-act="mcat" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
 const vis=(!isClark()&&!isShop())?`<div class="banner">You're browsing public posts. Clark-only posts need a school email.</div>`:"";
 const body=items.length?`<div class="list">${items.map(cardHtml).join("")}</div>`:`<div class="empty">No items match.</div>`;
 return `<div class="pad"><h2 class="screen">Market</h2>
  <input class="search" placeholder="Search lamp, coat, textbook" value="${esc(m.q)}" data-field="q" data-form="market">
  ${chips}${vis}<p class="sub">${items.length} item(s)</p>${body}</div>`;
}

/* POST */
function postScreen(){
 if(!canAct())return `<div class="pad"><div class="empty">Sign in with an email to post.</div></div>`;
 const p=S.post,shop=isShop();
 let shopMgr="";
 if(shop){
  const own=DB.listings.filter(l=>l.shop===SHOP_NAME&&l.seller===me());
  const mgr=own.map(l=>{
   if(l.status==="reserved")return `<div class="card" style="padding:12px;margin-bottom:9px"><b>${esc(l.title)}</b> · $${l.price}
     <div class="meta" style="margin:4px 0 9px">Reserved by ${esc(nameOf(l.reservedBy))} · ${stamp(l.reservedAt)}</div>
     <div class="btnrow"><button class="btn sm" data-act="shopdone" data-id="${l.id}">Paid &amp; picked up</button>
     <button class="btn sm ghost" data-act="shoprelease" data-id="${l.id}">Put back</button></div></div>`;
   if(l.status==="available")return `<div class="card" style="padding:12px;margin-bottom:9px"><b>${esc(l.title)}</b> · $${l.price}
     <div style="margin-top:8px"><button class="btn sm ghost" data-act="shopdone" data-id="${l.id}">Sold in store</button></div></div>`;
   return `<div class="card" style="padding:12px;margin-bottom:9px"><b>${esc(l.title)}</b> · <span class="pill done">Sold</span></div>`;
  }).join("")||`<p class="sub">No items yet. Add one below.</p>`;
  shopMgr=`<h2 class="screen">Reservations &amp; sales</h2>${mgr}<hr class="sep"><h2 class="screen" style="margin-top:14px">Add an item</h2>`;
 }
 const catSel=p.cat?esc(pathLabel({cat:p.cat,sub:p.sub,type:p.type})):`<span class="ph">Select category</span>`;
 const photos=[0,1,2,3].map(i=>{const src=p.photos[i];
  return src?`<div class="pslot"><img src="${src}" alt=""><span class="x" data-act="rmphoto" data-i="${i}">✕</span></div>`
   :`<div class="pslot" data-act="addphoto">${i===p.photos.length?svg("cam",22):""}</div>`;}).join("");
 const visBlock=(isClark())?`<label class="fld">Who can see this?</label>
   <div class="seg"><button class="${p.vis==="clark"?"on":""}" data-act="vis" data-v="clark">Clark only</button>
   <button class="${p.vis==="everyone"?"on":""}" data-act="vis" data-v="everyone">Everyone</button></div>`:"";
 return `<div class="pad">${shopMgr||'<h2 class="screen">Post an item</h2>'}
  <input type="file" accept="image/*" id="photoInput" hidden>
  <label class="fld">Photos</label><div class="photos">${photos}</div>
  <label class="fld">Title</label><input class="in" placeholder="What is it?" value="${esc(p.title)}" data-field="title" data-form="post">
  <label class="fld">Details</label><textarea class="ta" placeholder="Describe your item" data-field="desc" data-form="post">${esc(p.desc)}</textarea>
  <label class="fld">Category</label><div class="pickrow" data-act="pickcat">${catSel}${svg("chev",18)}</div>
  <label class="fld">Condition</label>
  <div class="seg">${["New","Good","Poor"].map(c=>`<button class="${p.cond===c?"on":""}" data-act="cond" data-v="${c}">${c}</button>`).join("")}</div>
  <label class="fld">Size (optional)</label><input class="in" value="${esc(p.size)}" data-field="size" data-form="post" placeholder="e.g. M, 10, 54cm">
  ${shop?"":`<div class="toggle" style="margin-top:8px"><span>Free</span><div class="sw ${p.free?"on":""}" data-act="free" role="button"></div></div>`}
  ${(!p.free)?`<label class="fld">Price (USD)</label><input class="in" type="number" min="0" value="${p.price||""}" data-field="price" data-form="post" placeholder="0">`:""}
  ${(p.free&&!shop)?`<label class="fld">Pickup spot</label><input class="in" value="${esc(p.pickup)}" data-field="pickup" data-form="post" placeholder="e.g. outside my hall door">`:""}
  ${visBlock}
  <div style="height:16px"></div><button class="btn" data-act="submitpost">Post it</button>
  <p class="sub" style="margin-top:12px">Tip: use a public pickup spot. Avoid room numbers.</p></div>`;
}

/* CHAT */
function convos(){
 const map=new Map();
 DB.messages.forEach(m=>{if(m.sender===me()||m.recipient===me()){const other=m.sender===me()?m.recipient:m.sender;
  const k=m.listingId+"|"+other;if(!map.has(k)||new Date(m.ts)>new Date(map.get(k).ts))map.set(k,{listingId:m.listingId,other,ts:m.ts});}});
 let arr=[...map.values()].sort((a,b)=>new Date(b.ts)-new Date(a.ts));
 if(S.thread&&!arr.find(c=>c.listingId===S.thread.listingId&&c.other===S.thread.other))arr.unshift({...S.thread,ts:now(0)});
 return arr;
}
function chatScreen(){
 if(!canAct())return `<div class="pad"><div class="empty">Sign in with an email to chat.</div></div>`;
 const cs=convos();
 if(!cs.length)return `<div class="pad"><h2 class="screen">Chat</h2><div class="empty">No conversations yet.<br>Open an item and tap Message to start one.</div></div>`;
 return `<div class="pad"><h2 class="screen">Chat</h2><div class="list">`+cs.map(c=>{
  const l=DB.listings.find(x=>x.id===c.listingId);
  return `<div class="card"><div class="lc" data-act="thread" data-id="${c.listingId}" data-other="${esc(c.other)}">
   <div class="thumb">${l&&l.photos[0]?`<img src="${l.photos[0]}">`:svg("chat",22)}</div>
   <div class="info"><div class="title">${esc(l?l.title:"Listing")}</div>
   <div class="meta">with ${esc(nameOf(c.other))}</div></div></div></div>`;}).join("")+`</div></div>`;
}

/* LOOPBACK */
function loopScreen(){
 const a=S.assist,names=CATS.filter(c=>c.name!=="Tickets").map(c=>c.name);
 const res=scorePathways(IMPACT_CAT[a.cat],a.cond),best=res[0];
 const imp=impactOf(a.cat,best.pathway);
 const sell=(a.paid>0&&a.cond!=="broken")?Math.round(a.paid*{good:.5,fair:.3,broken:0}[a.cond]):null;
 const sg=DB.suggestions.slice().sort((x,y)=>y.votes.length-x.votes.length||new Date(y.ts)-new Date(x.ts));
 const sgHtml=isClark()?sg.map(s=>{const voted=s.votes.includes(me());
  return `<div class="sgcard"><div style="flex:1;min-width:0">
   <div class="meta" style="color:var(--accent-text);font-weight:650">${esc(s.topic)}${s.place?" · "+esc(s.place):""}</div>
   <div style="margin:3px 0;font-size:14.5px">${esc(s.body)}</div>
   <div class="meta">${s.anon?"Anonymous":esc(nameOf(s.author))} · ${new Date(s.ts).toLocaleDateString()}${s.sample?" · sample":""}</div></div>
   <div class="vote ${voted?"on":""}" data-act="vote" data-id="${s.id}">${svg("post",15)}<div class="vn">${s.votes.length}</div></div></div>`;}).join(""):"";
 const done=DB.listings.filter(l=>l.status==="picked_up"||l.status==="sold");
 let lb=0,usd=0,co2=0;done.forEach(l=>{const im=impactOf(l.cat,"reuse");if(im){lb+=im.lb;usd+=im.usd;co2+=im.co2;}});
 const orgs=PARTNERS.filter(p=>p.pathway==="donate").map(p=>p.name);
 return `<div class="pad">
  <h2 class="screen">Not sure what to do with it?</h2>
  <label class="fld">What is it?</label>
  <select class="in" data-field="cat" data-form="assist">${names.map(n=>`<option ${a.cat===n?"selected":""}>${n}</option>`).join("")}</select>
  <label class="fld">Condition</label>
  <div class="seg">${["good","fair","broken"].map(c=>`<button class="${a.cond===c?"on":""}" data-act="acond" data-v="${c}">${c}</button>`).join("")}</div>
  <label class="fld">What did you pay? (optional)</label>
  <input class="in" type="number" min="0" value="${a.paid||""}" data-field="paid" data-form="assist" placeholder="0">
  <div class="card" style="padding:14px;margin-top:14px">
   <div style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">Best next life</div>
   <div style="font-size:21px;font-weight:800;margin:3px 0;text-transform:capitalize;color:var(--accent-text)">${best.pathway}</div>
   <div style="font-size:14px">${esc(best.reason)}</div>
   ${sell!=null?`<div style="margin-top:8px;font-size:14px">If you sell it, a rough asking price is about <b>$${sell}</b>. Free also works if you just want it gone.</div>`:""}
   ${imp?`<div class="meta" style="margin-top:8px">Est. impact: ${imp.lb} lb kept from waste · ~$${imp.usd} saved · ~${imp.co2} lb CO₂e</div>`:""}
  </div>
  <p class="sub" style="margin-top:8px">Rule-based, not AI yet. Partner and demand data are sample or unverified.</p>

  <hr class="sep"><h2 class="screen" style="margin-top:14px">💡 Suggestion box</h2>
  <p class="sub">Ideas to make Clark greener. The most supported ones rise to the top. Export and share them with the sustainability office.</p>
  ${isClark()?`<label class="fld">Topic</label>
   <select class="in" data-field="topic" data-form="sug">${TOPICS.map(t=>`<option ${S.sug.topic===t?"selected":""}>${t}</option>`).join("")}</select>
   <label class="fld">Where? (building & floor)</label><input class="in" value="${esc(S.sug.place)}" data-field="place" data-form="sug" placeholder="e.g. UC, 2nd floor">
   <label class="fld">Your idea</label><textarea class="ta" data-field="body" data-form="sug" placeholder="What should change?">${esc(S.sug.body)}</textarea>
   <div class="toggle"><span style="font-size:13px">Hide my name</span><div class="sw ${S.sug.anon?"on":""}" data-act="anon" role="button"></div></div>
   <button class="btn sm" data-act="submitsug">Submit idea</button>
   <div style="height:12px"></div>${sgHtml}
   <button class="btn sm ghost" data-act="exportsug" style="margin-top:10px">Export ideas (copy)</button>`
  :`<div class="banner">The suggestion box is for Clark students and staff.</div>`}

  <hr class="sep"><h2 class="screen" style="margin-top:14px">Donate to an organization</h2>
  ${canAct()?`<label class="fld">Organization</label>
   <select class="in" data-field="org" data-form="don">${orgs.map(o=>`<option ${S.don.org===o?"selected":""}>${esc(o)}</option>`).join("")}</select>
   <label class="fld">What are you donating?</label><input class="in" value="${esc(S.don.what)}" data-field="what" data-form="don">
   <label class="fld">Where can they pick it up?</label><input class="in" value="${esc(S.don.where)}" data-field="where" data-form="don">
   <div style="height:12px"></div><button class="btn sm" data-act="submitdon">Request pickup</button>
   <p class="sub" style="margin-top:8px">Demo only: no organization is actually notified yet.</p>`:`<div class="banner">Sign in with an email to request a pickup.</div>`}

  <hr class="sep"><h2 class="screen" style="margin-top:14px">Impact so far</h2>
  <div class="statgrid">
   <div class="stat"><div class="n">${done.length}</div><div class="l">Items rehomed</div></div>
   <div class="stat"><div class="n">${Math.round(lb)}</div><div class="l">lb kept from waste</div></div>
   <div class="stat"><div class="n">$${Math.round(usd)}</div><div class="l">saved (est.)</div></div>
   <div class="stat"><div class="n">${Math.round(co2)}</div><div class="l">lb CO₂e avoided</div></div></div>
  <p class="sub" style="margin-top:8px">Counts items marked picked up or sold, samples included. Figures are unsourced estimates.</p>
 </div>`;
}

/* ---------- subpages ---------- */
function subpage(){
 if(S.view.type==="detail")return detailPage(S.view.id);
 if(S.view.type==="category")return categoryPage();
 if(S.view.type==="thread")return threadPage();
 return "";
}
function subHead(title){return `<div class="subhead"><button class="iconbtn" data-act="back">${svg("back",22)}</button><span class="t">${esc(title)}</span></div>`;}

function detailPage(id){
 const l=DB.listings.find(x=>x.id===id);if(!l)return subHead("Not found")+`<div class="empty">Gone.</div>`;
 const mine=l.seller===me();
 const hero=l.photos&&l.photos[0]?`<img src="${l.photos[0]}" alt="">`:svg("cam",48);
 const price=l.free?`<span class="price free" style="font-size:22px">Free</span>`:`<span class="price" style="font-size:22px">$${l.price}</span>`;
 let actions="";
 if(l.status==="picked_up")actions=`<div class="pill done" style="font-size:13px;padding:8px 12px">Picked up by ${esc(nameOf(l.closedBy||"someone"))}${l.closedAt?" · "+stamp(l.closedAt):""}</div>`;
 else if(l.status==="sold")actions=`<div class="pill done" style="font-size:13px;padding:8px 12px">Sold${l.closedAt?" · "+stamp(l.closedAt):""}</div>`;
 else if(l.status==="reserved"){
  if(l.reservedBy===me())actions=`<div class="note">Reserved for you. Pay in store when you pick it up. Held ${HOLD_H} hours.</div>
    <button class="btn ghost" data-act="cancelres" data-id="${l.id}">Cancel my reservation</button>`;
  else actions=`<div class="pill res" style="font-size:13px;padding:8px 12px">Reserved by someone else</div>`;
 }else{
  const msgBtn=(!mine&&canAct())?`<button class="btn ${l.free||l.shop?"sec":""}" data-act="message" data-id="${l.id}">Message ${l.shop?"shop":"seller"}</button>`:"";
  if(l.shop){
   actions=`${!mine?`<button class="btn" data-act="reserve" data-id="${l.id}">Reserve (pay in store)</button>`:""}
    <button class="btn sec" disabled>Pay in app · coming soon</button>${msgBtn}`;
  }else if(l.free){
   actions=`<button class="btn" data-act="pickup" data-id="${l.id}">I picked it up</button>${msgBtn}`;
  }else{
   actions=`${msgBtn}<button class="btn sec" disabled>Pay in app · coming soon</button>`;
  }
  if(mine&&!l.shop)actions+=`<button class="btn ghost" data-act="closemine" data-id="${l.id}">Mark as ${l.free?"picked up":"sold"}</button>`;
 }
 return subHead("Item")+`<div class="content"><div class="hero">${hero}</div>
  <div class="pad">
   <div class="row1"><span style="font-size:20px;font-weight:750">${esc(l.title)}</span>${price}</div>
   <div class="badges">${l.shop?`<span class="badge red">${esc(l.shop)}</span>`:""}
    <span class="badge">${esc(l.cond)}</span>${l.size?`<span class="badge">Size ${esc(l.size)}</span>`:""}</div>
   <div class="meta">${esc(pathLabel(l))}</div>
   <div class="desc">${esc(l.desc||"No description.")}</div>
   ${l.free&&l.pickup?`<div class="note">📍 ${esc(l.pickup)}</div>`:""}
   <div class="meta" style="margin-top:10px">${l.vis==="everyone"?"Everyone":"Clark only"} · by ${esc(nameOf(l.seller))} · ${ago(l.ts)}${l.sample?" · sample":""}</div>
  </div></div>
  <div class="sticky-actions">${actions}</div>`;
}

function categoryPage(){
 const st=S.cat;
 if(st.level==="cat"){
  return subHead("Select category")+`<div class="pad"><div class="list">`+
   CATS.map(c=>`<div class="catrow" data-act="catpick" data-c="${esc(c.name)}"><span class="em">${c.em}</span>${esc(c.name)}<span class="chev">${(c.mode!=="flat")?svg("chev",18):""}</span></div>`).join("")+`</div></div>`;
 }
 if(st.level==="gender"){
  return subHead(st.cat)+`<div class="pad"><div class="list">`+
   GENDERS.map(g=>`<div class="catrow" data-act="genderpick" data-g="${g}">${g}<span class="chev">${(CATS.find(c=>c.name===st.cat).mode==="gender_type")?svg("chev",18):""}</span></div>`).join("")+`</div></div>`;
 }
 return subHead(st.cat+" · "+st.sub)+`<div class="pad"><div class="list">`+
  CLOTHES_TYPES[st.sub].map(t=>`<div class="catrow" data-act="typepick" data-t="${esc(t)}">${esc(t)}</div>`).join("")+`</div></div>`;
}

function threadPage(){
 const{listingId,other}=S.thread;const l=DB.listings.find(x=>x.id===listingId);
 const msgs=DB.messages.filter(m=>m.listingId===listingId&&((m.sender===me()&&m.recipient===other)||(m.sender===other&&m.recipient===me()))).sort((a,b)=>a.id-b.id);
 const body=msgs.length?msgs.map(m=>`<div class="msg ${m.sender===me()?"me":"them"}">${esc(m.body)}</div>`).join(""):`<div class="empty">Say hi about “${esc(l?l.title:"this item")}”.</div>`;
 return subHead((l?l.title:"Chat")+" · "+nameOf(other))+
  `<div class="content"><div class="thread">${body}</div></div>
   <div class="composer"><input id="msgIn" placeholder="Is this still available?" autocomplete="off">
   <button data-act="send">Send</button></div>`;
}

/* ---------- sign in ---------- */
function signin(){
 return `<div class="content"><div class="signin">
  <h1><span class="brandC" style="width:34px;height:34px;font-size:19px">C</span>ClarkLoop</h1>
  <p class="tag">Give your stuff a next life. Clark first.</p>
  <input class="in" id="emailIn" placeholder="you@clarku.edu" autocomplete="email">
  <button class="btn" data-act="signin">Continue</button>
  <div class="demo">
   <button data-act="demo" data-r="student">Demo: Clark student</button>
   <button data-act="demo" data-r="staff">Demo: Clark staff</button>
   <button data-act="demo" data-r="visitor">Demo: outside visitor</button>
   <button data-act="demo" data-r="shop">Demo: thrift store</button>
   <button data-act="demo" data-r="guest" style="grid-column:1/3">Browse as guest</button>
  </div>
  <p class="sub" style="margin-top:14px">Prototype: emails aren't verified yet, so anyone could type a school address. A real version sends a confirmation link.</p>
 </div></div>`;
}

/* ---------- navigation helpers ---------- */
function openDetail(id){S.view={type:"detail",id};render();}
function openThread(listingId,other){S.thread={listingId,other};S.view={type:"thread"};render();setTimeout(()=>{const t=document.querySelector(".thread");if(t)t.scrollTop=1e9;const i=$("#msgIn");if(i)i.focus();},0);}

/* ---------- events ---------- */
document.addEventListener("click",e=>{
 const el=e.target.closest("[data-act]");if(!el)return;
 const a=el.dataset.act,id=el.dataset.id?+el.dataset.id:null;
 if(a==="signin"){const v=($("#emailIn").value||"").trim().toLowerCase();if(!/.+@.+\..+/.test(v))return toast("Enter a valid email.");setUser(v);return;}
 if(a==="demo"){const r=el.dataset.r;const map={student:["student"+SCHOOL,"clark"],staff:["staff"+SCHOOL,"clark"],visitor:["visitor@example.com","visitor"],shop:["thrift"+SCHOOL,"shop"],guest:["","guest"]};const[em,role]=map[r];S.user=role==="shop"?{email:SHOP_NAME,role:"shop"}:{email:em,role};S.screen="feed";render();return;}
 if(a==="signout"){S.user=null;S.view=null;S.thread=null;render();return;}
 if(a==="theme"){const cur=document.documentElement.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");const next=cur==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",next);try{localStorage.setItem("clarkloop_theme",next);}catch(e){}render();return;}
 if(a==="tab"){S.screen=el.dataset.tab;S.view=null;render();return;}
 if(a==="back"){S.view=null;render();return;}
 if(a==="open"){openDetail(id);return;}
 if(a==="showclosed"){S.showClosed=!S.showClosed;render();return;}
 if(a==="mfree"){S.market.free=!S.market.free;render();return;}
 if(a==="mshop"){S.market.shop=!S.market.shop;render();return;}
 if(a==="mcat"){const c=el.dataset.c;S.market.cat=(c==="All")?null:c;render();return;}
 if(a==="cond"){S.post.cond=el.dataset.v;render();return;}
 if(a==="vis"){S.post.vis=el.dataset.v;render();return;}
 if(a==="free"){S.post.free=!S.post.free;render();return;}
 if(a==="addphoto"){$("#photoInput").click();return;}
 if(a==="rmphoto"){S.post.photos.splice(+el.dataset.i,1);render();return;}
 if(a==="pickcat"){S.cat={level:"cat",cat:null};S.view={type:"category"};render();return;}
 if(a==="submitpost"){submitPost();return;}
 if(a==="catpick"){const c=CATS.find(x=>x.name===el.dataset.c);if(c.mode==="flat"){S.post.cat=c.name;S.post.sub=null;S.post.type=null;S.view=null;render();}else{S.cat={level:"gender",cat:c.name};render();}return;}
 if(a==="genderpick"){const c=CATS.find(x=>x.name===S.cat.cat);S.post.cat=c.name;S.post.sub=el.dataset.g;if(c.mode==="gender"){S.post.type=null;S.view=null;render();}else{S.cat={level:"type",cat:c.name,sub:el.dataset.g};render();}return;}
 if(a==="typepick"){S.post.type=el.dataset.t;S.view=null;render();return;}
 if(a==="pickup"){markStatus(id,"picked_up");openDetail(id);toast("Marked as picked up.");return;}
 if(a==="closemine"){const l=DB.listings.find(x=>x.id===id);markStatus(id,l.free?"picked_up":"sold");openDetail(id);return;}
 if(a==="reserve"){if(reserve(id)){openDetail(id);toast("Reserved. Pay in store within "+HOLD_H+"h.");}else toast("Someone just reserved it.");return;}
 if(a==="cancelres"){const l=DB.listings.find(x=>x.id===id);if(l&&l.reservedBy===me()){l.status="available";l.reservedBy=null;l.reservedAt=null;save();}openDetail(id);return;}
 if(a==="shopdone"){const l=DB.listings.find(x=>x.id===id);if(l){l.status="sold";l.closedBy=me();l.closedAt=now(0);save();}render();return;}
 if(a==="shoprelease"){const l=DB.listings.find(x=>x.id===id);if(l){l.status="available";l.reservedBy=null;l.reservedAt=null;save();}render();return;}
 if(a==="message"){const l=DB.listings.find(x=>x.id===id);openThread(l.id,l.seller);return;}
 if(a==="thread"){openThread(id,el.dataset.other);return;}
 if(a==="send"){sendMsg();return;}
 if(a==="acond"){S.assist.cond=el.dataset.v;render();return;}
 if(a==="anon"){S.sug.anon=!S.sug.anon;render();return;}
 if(a==="vote"){const s=DB.suggestions.find(x=>x.id===id);if(s&&!s.votes.includes(me())){s.votes.push(me());save();}render();return;}
 if(a==="submitsug"){if(!S.sug.body.trim())return toast("Write your idea first.");DB.suggestions.push({id:DB.seq++,author:me(),anon:S.sug.anon,topic:S.sug.topic,place:S.sug.place.trim(),body:S.sug.body.trim(),votes:[],sample:false,ts:now(0)});S.sug={topic:TOPICS[0],place:"",body:"",anon:false};save();toast("Idea added.");render();return;}
 if(a==="exportsug"){exportSug();return;}
 if(a==="submitdon"){if(!S.don.what.trim())return toast("Say what you're donating.");DB.donations.push({...S.don,donor:me(),ts:now(0)});S.don.what="";S.don.where="";save();toast("Pickup requested (demo only).");render();return;}
});

document.addEventListener("input",e=>{const t=e.target;if(!t.dataset.form)return;const f=t.dataset.form,k=t.dataset.field;let v=t.value;if(k==="price"||k==="paid")v=parseFloat(v)||0;
 if(f==="market"){S.market[k]=v;render();const i=$('[data-field="q"]');if(i){i.focus();const p=String(t.value).length;i.setSelectionRange(p,p);}return;}
 S[f][k]=v;});
document.addEventListener("change",e=>{const t=e.target;if(t.id==="photoInput"&&t.files&&t.files[0]){addPhoto(t.files[0]);t.value="";return;}
 if(t.dataset.form){const f=t.dataset.form,k=t.dataset.field;S[f][k]=t.value;if(f==="assist")render();}});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="msgIn"){e.preventDefault();sendMsg();}});

/* ---------- mutations ---------- */
function setUser(email){const role=email.endsWith(SCHOOL)?"clark":"visitor";S.user={email,role};S.screen="feed";render();}
function markStatus(id,st){const l=DB.listings.find(x=>x.id===id);if(l&&l.status==="available"){l.status=st;l.closedBy=me();l.closedAt=now(0);save();}}
function reserve(id){const l=DB.listings.find(x=>x.id===id);if(l&&l.status==="available"&&l.shop){l.status="reserved";l.reservedBy=me();l.reservedAt=now(0);save();return true;}return false;}
function expireRes(){let ch=false;DB.listings.forEach(l=>{if(l.status==="reserved"&&l.reservedAt&&(Date.now()-new Date(l.reservedAt))/3600000>HOLD_H){l.status="available";l.reservedBy=null;l.reservedAt=null;ch=true;}});if(ch)save();}
function addPhoto(file){if(S.post.photos.length>=4)return toast("Up to 4 photos.");const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const mx=900;let w=img.width,h=img.height;if(w>mx||h>mx){const s=Math.min(mx/w,mx/h);w=Math.round(w*s);h=Math.round(h*s);}const cv=document.createElement("canvas");cv.width=w;cv.height=h;cv.getContext("2d").drawImage(img,0,0,w,h);S.post.photos.push(cv.toDataURL("image/jpeg",0.7));render();};img.src=r.result;};r.readAsDataURL(file);}
function submitPost(){const p=S.post;if(!p.title.trim())return toast("Add a title.");if(!p.cat)return toast("Pick a category.");
 const shop=isShop();
 DB.listings.push({id:DB.seq++,seller:me(),title:p.title.trim(),desc:p.desc.trim(),photos:p.photos.slice(),
  cat:p.cat,sub:p.sub,type:p.type,cond:p.cond,size:p.size.trim(),price:p.free?0:(parseFloat(p.price)||0),
  free:shop?false:p.free,pickup:p.pickup.trim(),vis:shop?"everyone":(isClark()?p.vis:"everyone"),
  status:"available",closedBy:null,closedAt:null,reservedBy:null,reservedAt:null,shop:shop?SHOP_NAME:null,sample:false,ts:now(0)});
 save();S.post=newPost();S.screen="market";S.view=null;render();toast("Posted!");}
function sendMsg(){const i=$("#msgIn");if(!i)return;const v=i.value.trim();if(!v)return;const{listingId,other}=S.thread;
 DB.messages.push({id:DB.seq++,listingId,sender:me(),recipient:other,body:v,ts:now(0)});save();i.value="";
 render();setTimeout(()=>{const t=document.querySelector(".thread");if(t)t.scrollTop=1e9;const n=$("#msgIn");if(n)n.focus();},0);}
function exportSug(){const sg=DB.suggestions.slice().sort((x,y)=>y.votes.length-x.votes.length);
 const rows=[["date","topic","place","idea","votes","from"]];
 sg.forEach(s=>rows.push([s.ts.slice(0,10),s.topic,s.place,s.body.replace(/\s+/g," "),s.votes.length,s.anon?"anonymous":nameOf(s.author)]));
 const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(csv).then(()=>toast("Ideas copied. Paste into an email to Clark."),()=>showCopyBox(csv));
 else showCopyBox(csv);}
function showCopyBox(txt){const w=document.createElement("div");w.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:60;display:flex;align-items:center;justify-content:center;padding:20px";w.innerHTML=`<div style="background:var(--surface);border-radius:14px;padding:16px;max-width:520px;width:100%"><b>Copy these ideas</b><textarea class="ta" style="height:200px;margin-top:10px" readonly>${esc(txt)}</textarea><button class="btn sm" style="margin-top:10px">Close</button></div>`;w.addEventListener("click",ev=>{if(ev.target===w||ev.target.tagName==="BUTTON")w.remove();});document.body.appendChild(w);w.querySelector("textarea").select();}

/* ---------- boot ---------- */
load();seed();expireRes();render();
