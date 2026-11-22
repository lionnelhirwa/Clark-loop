/* ClarkLoop app: onboarding, accounts, screens, chat, notifications, and profile.
   Uses constants/helpers from data.js. Data is saved in this browser only. */
"use strict";

/* ---------- storage ---------- */
const KEY="clarkloop_v2";
let DB={seq:1,listings:[],messages:[],suggestions:[],donations:[],accounts:[],notifications:[],names:{}};
function load(){try{const r=localStorage.getItem(KEY);if(r){const d=JSON.parse(r);DB=Object.assign(DB,d);DB.names=d.names||{};}}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(DB));}catch(e){note("Storage is full or blocked; this change may not be saved.");}}

/* ---------- tiny DOM helpers ---------- */
const $=s=>document.querySelector(s);
let TOAST;
function toast(m){clearTimeout(TOAST);let t=$("#toast");if(!t){t=document.createElement("div");t.id="toast";t.style.cssText="position:fixed;left:50%;bottom:84px;transform:translateX(-50%);background:var(--fg);color:var(--bg);padding:10px 16px;border-radius:999px;font-size:13px;font-weight:600;z-index:80;max-width:88%;text-align:center;transition:opacity .2s";document.body.appendChild(t);}t.textContent=m;t.style.opacity="1";TOAST=setTimeout(()=>t.style.opacity="0",2200);}
function note(m){toast(m);}
function gradStyle(g){return `background:linear-gradient(135deg,${g[0]},${g[1]})`;}

/* ---------- state ---------- */
let S={user:null,auth:{mode:"landing"},screen:"feed",view:null,thread:null,editing:null,typing:null,
 showClosed:false,menuOpen:false,
 market:{q:"",cat:null,free:false,shop:false},
 post:newPost(),cat:{level:"cat",cat:null},
 assist:{cat:"Clothes",cond:"good",paid:0},
 sug:{topic:TOPICS[0],place:"",body:"",anon:false},
 don:{org:PARTNERS.filter(p=>p.pathway==="donate")[0].name,what:"",cat:"Clothes",cond:"Good",where:""},
 signup:newSignup(),login:{id:"",pass:""}};
function newPost(){return{title:"",desc:"",photos:[],cat:null,sub:null,type:null,cond:"Good",size:"",free:false,price:0,building:BUILDINGS[0][0],pickup:"",vis:"clark"};}
function newSignup(){return{first:"",last:"",role:"",subrole:"",gradMonth:"",gradYear:"",email:"",username:"",pass:"",anon:false};}
const isClark=()=>S.user&&(S.user.role==="clark"||S.user.role==="shop");
const isShop=()=>S.user&&S.user.role==="shop";
const isMaintenance=()=>S.user&&S.user.acct&&S.user.acct.role==="staff"&&S.user.acct.subrole==="maintenance";
const canAct=()=>S.user&&S.user.role!=="guest";
const me=()=>S.user?S.user.email:"";
function nm(email){return DB.names[email]||String(email||"").split("@")[0];}
function myName(){const a=S.user&&S.user.acct;return a?(a.anon?a.first:(a.first+(a.last?" "+a.last:""))):"You";}
function brandMark(){return `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" aria-hidden="true"><path d="M33.5 15.2A13 13 0 1 0 33.5 32.8" stroke="#fff" stroke-width="5.4" stroke-linecap="round"/><path d="M31 9.2l9 1.4-3.6 7.2z" fill="#fff"/></svg>`;}

/* ---------- seed sample data ---------- */
const SAMPLE_SELLERS=new Set();
function seed(){
 Object.assign(DB.names,{"sample1@clarku.edu":"Amara O.","sample2@clarku.edu":"Diego R.","sample3@clarku.edu":"Priya S.",
  [SHOP_NAME]:"Clark Thrift","sample@clarku.edu":"A student","demo@clarku.edu":"Demo User"});
 if(DB.listings.length){markSamples();return;}
 const S0=[
  ["Wool blanket","Bedding & sheets",null,null,"Good","",0,true,0,"Warm wool blanket, washed and in good shape. Great for the cold dorms.","clark","available",1],
  ["Mini fridge","Furniture",null,null,"Good","",0,true,5,"Compact dorm fridge, cools well. Moving out and can't take it home.","everyone","available",3],
  ["Desk lamp","Home goods",null,null,"Good","",5,false,1,"Adjustable LED desk lamp, barely used. Warm and bright settings.","everyone","available",5],
  ["Winter coat","Clothes","Men","Outerwear","Good","M",20,false,2,"Men's insulated winter coat, size M. Kept me warm all last winter.","everyone","available",8],
  ["Floral dress","Clothes","Women","Dresses","New","S",0,true,3,"Brand new floral dress, size S, tags still on. Didn't fit me.","clark","available",10],
  ["Intro stats textbook","Books",null,null,"Poor","",12,false,6,"Intro statistics textbook. Some highlighting inside but all pages intact.","clark","available",14],
  ["Road bike","Bikes & motor",null,null,"Good","54cm",60,false,7,"54cm road bike, recently tuned. Good for getting around Worcester.","everyone","available",20],
  ["Running shoes","Shoes","Unisex",null,"Good","10",15,false,4,"Unisex running shoes, size 10. Light wear on the soles.","clark","available",26],
  ["Storage bins","Home goods",null,null,"Good","",0,true,0,"Set of three stackable plastic storage bins. Clean.","clark","picked_up",30],
  ["Concert tickets x2","Tickets",null,null,"New","",25,false,5,"Two tickets to a local show next month. Can't make it anymore.","clark","available",40]];
 S0.forEach((x,i)=>{const[t,c,sub,ty,cond,sz,pr,free,bi,ds,vis,st,h]=x;const b=BUILDINGS[bi];const seller="sample"+(i%3+1)+SCHOOL;
  DB.listings.push({id:DB.seq++,seller,sellerName:nm(seller),sellerAnon:false,title:t,desc:ds,
   photos:[],cat:c,sub,type:ty,cond,size:sz,price:free?0:pr,free,building:b[0],walk:b[1],pickup:free?b[0]:"",vis,status:st,
   closedBy:st!=="available"?"sample@clarku.edu":null,closedByName:st!=="available"?"A student":null,
   closedAt:st!=="available"?now(h-1):null,pickedPhoto:null,reservedBy:null,reservedAt:null,shop:null,sample:true,ts:now(h)});});
 const SH=[["Corduroy jacket","Clothes","Men","Outerwear","Good","M",8,"Classic corduroy jacket, autumn weight. Donated and steamed."],
  ["Ceramic mug set","Home goods",null,null,"Good","",4,"Set of four ceramic mugs, no chips."],
  ["Paperback bundle","Books",null,null,"Good","",2,"Bundle of five popular paperbacks."],
  ["Desk chair","Furniture",null,null,"Poor","",10,"Sturdy desk chair, some wear on the seat."],
  ["Winter scarf","Accessories",null,null,"Good","",3,"Soft knit winter scarf, neutral grey."]];
 SH.forEach((x,i)=>{const[t,c,sub,ty,cond,sz,pr,ds]=x;DB.listings.push({id:DB.seq++,seller:SHOP_NAME,sellerName:"Clark Thrift",sellerAnon:false,
  title:t,desc:ds,photos:[],cat:c,sub,type:ty,cond,size:sz,price:pr,free:false,building:"The University Center",walk:1,pickup:"",
  vis:"everyone",status:"available",closedBy:null,closedByName:null,closedAt:null,pickedPhoto:null,reservedBy:null,reservedAt:null,shop:SHOP_NAME,sample:true,ts:now(2+i*3)});});
 DB.suggestions.push({id:DB.seq++,author:"sample1@clarku.edu",anon:false,topic:"Bins & recycling",
  place:"Bullock Hall, 2nd floor",body:"Add a recycling bin on this floor. The nearest one is two floors down.",
  votes:["a@clarku.edu","b@clarku.edu","c@clarku.edu"],ts:now(12)});
 DB.suggestions.push({id:DB.seq++,author:"sample2@clarku.edu",anon:true,topic:"Energy",place:"Dodd Hall lounge",
  body:"Lights stay on all night in the lounge. A motion sensor would cut the waste.",votes:[],ts:now(20)});
 markSamples();save();
}
function markSamples(){DB.listings.forEach(l=>{if(/^sample\d?@/.test(l.seller)||l.seller===SHOP_NAME)SAMPLE_SELLERS.add(l.seller);});SAMPLE_SELLERS.add(SHOP_NAME);}

/* ---------- accounts / auth ---------- */
function ensureWelcome(email){if(!DB.notifications.some(n=>n.user===email)){DB.notifications.push({id:DB.seq++,user:email,icon:"leaf",text:"Welcome to ClarkLoop",sub:"Tap an item to grab, sell, or give it a next life.",ts:now(0),read:false});save();}}
function sessionRole(acc){return acc.role==="outside"?"visitor":(acc.subrole==="thrift"?"shop":"clark");}
function signInAccount(acc){S.user={email:acc.email,role:sessionRole(acc),acct:acc};DB.names[acc.email]=acc.first+(acc.last?" "+acc.last:"");ensureWelcome(acc.email);S.auth={mode:"landing"};S.screen="feed";S.view=null;save();render();}
function createAccount(){const s=S.signup;
 if(!s.first.trim()||!s.last.trim())return toast("Add your first and last name.");
 if(!s.role)return toast("Choose what you are.");
 if(s.role==="student"&&(!s.gradMonth||!s.gradYear))return toast("Add your graduation month and year.");
 if(s.role==="staff"&&!s.subrole)return toast("Choose your staff role.");
 const clark=s.role==="student"||s.role==="staff";
 const email=(s.email||"").trim().toLowerCase();
 if(clark&&!email.endsWith(SCHOOL))return toast("Use your Clark email ("+SCHOOL+").");
 if(!clark&&!/.+@.+\..+/.test(email))return toast("Enter a valid email.");
 if((s.pass||"").length<4)return toast("Password should be at least 4 characters.");
 if(DB.accounts.some(a=>a.email===email))return toast("That email already has an account. Try logging in.");
 const acc={id:DB.seq++,first:s.first.trim(),last:s.last.trim(),role:s.role,subrole:s.role==="staff"?s.subrole:null,
  gradMonth:s.gradMonth,gradYear:s.gradYear,email,username:(s.username||"").trim().toLowerCase(),anon:s.anon,pass:s.pass};
 DB.accounts.push(acc);S.signup=newSignup();signInAccount(acc);toast("Welcome to ClarkLoop!");}
function doLogin(){const id=(S.login.id||"").trim().toLowerCase();const pass=S.login.pass||"";
 if(!id)return toast("Enter your email or username.");
 const acc=DB.accounts.find(a=>a.email===id||(a.username&&a.username===id));
 if(!acc)return toast("No account found. Tap Get started to make one.");
 if(acc.pass!==pass)return toast("Wrong password.");
 S.login={id:"",pass:""};signInAccount(acc);toast("Welcome back!");}
function openDemoModal(){
 const opts=[["student","Clark student","Browse, grab free items, buy, sell, and chat"],
  ["maintenance","Clark maintenance staff","Student reports and the impact summary"],
  ["thrift","Clark thrift store staff","Full access, plus manage shop reservations"],
  ["outside","Outside visitor","See public posts and shop the thrift store"]];
 modalWrap(`<b style="font-size:17px">Try a demo</b><p class="sub" style="margin:6px 0 13px">See ClarkLoop from each kind of account.</p>`+
  opts.map(o=>`<button class="demopick" data-act="demorole" data-r="${o[0]}"><div><div style="font-weight:700;font-size:15px">${o[1]}</div><div class="sub" style="margin:0">${o[2]}</div></div>${svg("chev",18)}</button>`).join("")+
  `<button class="btn ghost sm" data-act="modalClose" style="margin-top:4px">Cancel</button>`);
}
function demoLoginRole(r){
 const map={student:{first:"Demo",last:"Student",role:"student",subrole:null,gradMonth:"May",gradYear:"2029",email:"demo.student@clarku.edu"},
  maintenance:{first:"Sam",last:"Rivera",role:"staff",subrole:"maintenance",email:"facilities@clarku.edu"},
  thrift:{first:"Clark",last:"Thrift",role:"staff",subrole:"thrift",email:SHOP_NAME},
  outside:{first:"Jordan",last:"Lee",role:"outside",subrole:null,email:"jordan@example.com"}};
 const acc=Object.assign({id:0,username:"",anon:false,pass:"",gradMonth:"",gradYear:""},map[r]);
 S.screen="feed";signInAccount(acc);
}

/* ---------- visibility ---------- */
function visible(l){if(isClark())return true;return l.vis==="everyone";}
function feedItems(){return DB.listings.filter(l=>l.free&&visible(l)&&(S.showClosed||l.status==="available"));}
function marketItems(){const m=S.market;return DB.listings.filter(l=>{
 if(!visible(l))return false;if(l.status!=="available"&&l.status!=="reserved")return false;
 if(m.free&&!l.free)return false;if(m.shop&&!l.shop)return false;
 if(m.cat&&l.cat!==m.cat)return false;
 if(m.q){const q=m.q.toLowerCase();if(!(l.title.toLowerCase().includes(q)||(l.desc||"").toLowerCase().includes(q)))return false;}
 return true;}).sort((a,b)=>new Date(b.ts)-new Date(a.ts));}
function pathLabel(l){let p=[l.cat];if(l.sub)p.push(l.sub);if(l.type)p.push(l.type);return p.join(" › ");}
function unreadNotif(){return DB.notifications.filter(n=>n.user===me()&&!n.read).length;}

/* ---------- render ---------- */
function render(){
 const app=$("#app");
 app.classList.toggle("authlight",!S.user&&(S.auth.mode==="login"||S.auth.mode==="signup"));
 if(!S.user){app.innerHTML=authView();return;}
 if(S.view){app.innerHTML=subpage();return;}
 app.innerHTML=topbar()+`<div class="content" id="content">${screenHtml()}</div>`+navbar();
}

/* ===== onboarding ===== */
function heroTile(x){return `<div class="htile" style="${gradStyle(x.g)}">${svg(x.i,38)}<div><div class="ht">${esc(x.t)}</div><div class="hp">${esc(x.p)}</div></div></div>`;}
function authView(){
 if(S.auth.mode==="login")return loginView();
 if(S.auth.mode==="signup")return signupView();
 return landingView();
}
function landingView(){
 const r1=HERO.concat(HERO).map(heroTile).join("");
 const rev=HERO.slice().reverse();const r2=rev.concat(rev).map(heroTile).join("");
 const rot=HERO.slice(4).concat(HERO.slice(0,4));const r3=rot.concat(rot).map(heroTile).join("");
 return `<div class="land">
  <div class="marquee"><div class="mrow">${r1}</div><div class="mrow r">${r2}</div><div class="mrow">${r3}</div></div>
  <div class="land-grad"></div>
  <div class="land-top"><span></span><button class="demochip" data-act="demo">${svg("loop",15)} Demo</button></div>
  <div class="land-foot">
   <div class="land-logo"><span class="brandC">${brandMark()}</span><span>ClarkLoop</span></div>
   <p class="land-desc">Clarkies' first reuse app, built for environmental sustainability and social impact.</p>
   <button class="btn grad" data-act="gosignup">Get started</button>
   <button class="linkbtn" data-act="gologin">Already have an account? <b>Log in</b></button>
  </div></div>`;
}
function loginView(){
 return `<div class="content"><div class="auth">
  <button class="iconbtn" data-act="toland" style="margin:8px 0 0;width:fit-content">${svg("back",22)}</button>
  <h1>Welcome back</h1><p class="tag">Ready to continue your impact.</p>
  <label class="fld">Email or username</label><input class="in" data-form="login" data-field="id" value="${esc(S.login.id)}" placeholder="you@clarku.edu" autocomplete="username">
  <label class="fld">Password</label><input class="in" type="password" data-form="login" data-field="pass" value="${esc(S.login.pass)}" autocomplete="current-password">
  <div style="height:18px"></div><button class="btn grad" data-act="dologin">Log in</button>
  <button class="linkbtn" data-act="gosignup" style="margin-top:12px">New here? <b>Get started</b></button>
 </div></div>`;
}
function signupView(){
 const s=S.signup;
 const years=[];for(let y=2026;y<=2032;y++)years.push(String(y));
 let cond="";
 if(s.role==="student"){
  cond=`<div class="two"><div><label class="fld">Grad month</label>
   <select class="in" data-form="signup" data-field="gradMonth"><option value="">Month</option>${MONTHS.map(m=>`<option ${s.gradMonth===m?"selected":""}>${m}</option>`).join("")}</select></div>
   <div><label class="fld">Grad year</label>
   <select class="in" data-form="signup" data-field="gradYear"><option value="">Year</option>${years.map(y=>`<option ${s.gradYear===y?"selected":""}>${y}</option>`).join("")}</select></div></div>
   <label class="fld">Clark email</label><input class="in" data-form="signup" data-field="email" value="${esc(s.email)}" placeholder="you@clarku.edu">`;
 }else if(s.role==="staff"){
  cond=`<label class="fld">Staff role</label>
   <select class="in" data-form="signup" data-field="subrole"><option value="">Choose one</option>
   <option value="maintenance" ${s.subrole==="maintenance"?"selected":""}>Clark maintenance staff</option>
   <option value="thrift" ${s.subrole==="thrift"?"selected":""}>Clark thrift store staff</option></select>
   <label class="fld">Clark email</label><input class="in" data-form="signup" data-field="email" value="${esc(s.email)}" placeholder="you@clarku.edu">`;
 }else if(s.role==="outside"){
  cond=`<label class="fld">Email</label><input class="in" data-form="signup" data-field="email" value="${esc(s.email)}" placeholder="you@email.com">`;
 }
 return `<div class="content"><div class="auth">
  <button class="iconbtn" data-act="toland" style="margin:8px 0 0;width:fit-content">${svg("back",22)}</button>
  <h1>Welcome to ClarkLoop</h1><p class="tag">Your impact counts more than you imagine. Get started now.</p>
  <div class="two"><div><label class="fld">First name</label><input class="in" data-form="signup" data-field="first" value="${esc(s.first)}"></div>
   <div><label class="fld">Last name</label><input class="in" data-form="signup" data-field="last" value="${esc(s.last)}"></div></div>
  <label class="fld">I am a</label>
  <select class="in" data-form="signup" data-field="role"><option value="">Choose one</option>
   <option value="student" ${s.role==="student"?"selected":""}>Clark student</option>
   <option value="staff" ${s.role==="staff"?"selected":""}>Clark staff</option>
   <option value="outside" ${s.role==="outside"?"selected":""}>Other (outside of Clark)</option></select>
  ${cond}
  <label class="fld">Username (optional)</label><input class="in" data-form="signup" data-field="username" value="${esc(s.username)}" placeholder="for logging in">
  <label class="fld">Password</label><input class="in" type="password" data-form="signup" data-field="pass" value="${esc(s.pass)}" autocomplete="new-password">
  <div class="toggle" style="margin-top:6px"><div><div style="font-size:14px;font-weight:600">Stay anonymous</div><div class="sub" style="margin:0">Hide my name on posts (optional)</div></div>
   <div class="sw ${s.anon?"on":""}" data-act="suanon" role="button"></div></div>
  <div style="height:10px"></div><button class="btn grad" data-act="create">Create account</button>
  <button class="linkbtn" data-act="gologin" style="margin-top:10px">Have an account? <b>Log in</b></button>
 </div></div>`;
}

/* ===== top bar + nav ===== */
function topbar(){
 const t=(document.documentElement.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"));
 const un=unreadNotif();
 const menu=S.menuOpen?`<div class="menu"><div class="mhead"><b>${esc(myName())}</b><span>${roleLabel()}</span></div>
   <button data-act="goprofile">${svg("user",18)} Profile</button>
   <button data-act="gosettings">${svg("gear",18)} Settings</button>
   <button data-act="goimpact">${svg("leaf",18)} Impact</button>
   <button class="danger" data-act="signout">${svg("logout",18)} Log out</button></div>`:"";
 return `<div class="bar">
  <div class="brand"><span class="brandtext">ClarkLoop</span></div><div class="spacer"></div>
  <button class="iconbtn" data-act="theme" aria-label="Theme">${svg(t==="dark"?"sun":"moon",21)}</button>
  <button class="iconbtn" data-act="notif" aria-label="Notifications">${svg("bell",21)}${un?`<span class="badge-dot">${un>9?"9+":un}</span>`:""}</button>
  <button class="avatar" data-act="avatarmenu" aria-label="Account">${esc(initials(myName()))}</button>
  ${menu}</div>`;
}
function roleLabel(){if(isShop())return "Thrift store staff";if(isMaintenance())return "Maintenance staff";if(S.user.role==="clark")return "Clark student";return "Outside visitor";}
function navIcon(k){return {feed:"feed",market:"market",post:"post",chat:"chat",loop:"loop",reports:"book",impact:"leaf"}[k]||k;}
function navbar(){
 const tabs=isMaintenance()?[["feed","Feed"],["reports","Reports"],["impact","Impact"]]
   :[["feed","Feed"],["market","Market"],["post","Post"],["chat","Chat"],["loop","LoopBack"]];
 return `<div class="nav">`+tabs.map(([k,l])=>`<button data-act="tab" data-tab="${k}" class="${S.screen===k?"on":""}">${svg(navIcon(k))}<span>${l}</span></button>`).join("")+`</div>`;
}
function screenHtml(){
 if(isMaintenance())return S.screen==="reports"?reportsScreen():S.screen==="impact"?impactScreen():feedScreen();
 return S.screen==="feed"?feedScreen():S.screen==="market"?marketScreen():S.screen==="post"?postScreen():S.screen==="chat"?chatScreen():loopScreen();}
function firstName(){return (S.user&&S.user.acct&&S.user.acct.first)?S.user.acct.first:"there";}
function greet(){return `<div class="greet"><div class="gsmall">Welcome back</div><div class="gname">Hi, ${esc(firstName())}</div></div>`;}
function quickActions(){
 let items;
 if(isMaintenance())items=[["book","reports","Reports"],["leaf","impact","Impact"]];
 else if(S.user.role==="visitor")items=[["market","market","Browse"],["leaf","loop","Donate"]];
 else items=[["post","post","Post item"],["market","market","Browse"],["leaf","loop","Donate"],["edit","loop","Suggest"]];
 return `<div class="qa" style="grid-template-columns:repeat(${items.length},minmax(0,1fr))">`+
  items.map(([ic,tab,label])=>`<button data-act="tab" data-tab="${tab}"><span class="qi">${svg(ic,20)}</span>${label}</button>`).join("")+`</div>`;
}

/* ---------- cards ---------- */
function thumbHtml(l,size){const g=catObj(l.cat).g;return `<div class="thumb" style="${gradStyle(g)}${size?`;width:${size}px;height:${size}px`:""}">${l.photos&&l.photos[0]?`<img src="${l.photos[0]}" alt="">`:svg(catIcon(l.cat),30)}</div>`;}
function statusPill(l){if(l.status==="picked_up")return `<span class="pill done">Picked up</span>`;if(l.status==="sold")return `<span class="pill done">Sold</span>`;if(l.status==="reserved")return `<span class="pill res">Reserved</span>`;return "";}
function cardHtml(l){
 const price=l.free?`<span class="price free">Free</span>`:`<span class="price">$${l.price}</span>`;
 const sp=statusPill(l);
 const line2=l.shop?`<span class="pill shop">${esc(l.shop)}</span>`:`<span class="meta">${esc(pathLabel(l))}</span>`;
 return `<div class="card"><div class="lc" data-act="open" data-id="${l.id}">
  ${thumbHtml(l)}
  <div class="info"><div class="row1"><span class="title">${esc(l.title)}</span>${price}</div>
   <div class="meta">${esc(l.cond)}${l.size?" · size "+esc(l.size):""}</div>
   ${line2}
   <div class="metarow">${svg("pin",13)} ${esc(l.building)} · ~${l.walk} min</div>
   ${sp?`<div>${sp}</div>`:""}</div></div></div>`;
}

/* FEED */
function feedScreen(){
 const items=feedItems();
 const body=items.length?`<div class="list">${items.map(cardHtml).join("")}</div>`
  :`<div class="empty">${isClark()?"Nothing free right now. Check back around move-out.":"No free items available for you right now.<br>Students can share some items with everyone."}</div>`;
 return `<div class="pad">${greet()}${quickActions()}<h2 class="screen">Free nearby</h2>
  <p class="sub">Something left out for grabs? Open it, then tap “I picked it up” so no one else makes the trip.</p>
  <div class="toggle"><span style="font-size:13px;color:var(--muted)">Show already picked up</span>
   <div class="sw ${S.showClosed?"on":""}" data-act="showclosed" role="button"></div></div>
  ${body}</div>`;
}

/* MARKET */
function marketScreen(){
 const m=S.market,items=marketItems();const cats=["All",...CATS.map(c=>c.name)];
 const chips=`<div class="chips">
   <button class="chip ${m.free?"on":""}" data-act="mfree">Free</button>
   <button class="chip ${m.shop?"on":""}" data-act="mshop">Thrift store</button>
   ${cats.map(c=>`<button class="chip ${((c==="All")?!m.cat:m.cat===c)?"on":""}" data-act="mcat" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
 const vis=(!isClark())?`<div class="banner">You're browsing public posts. Clark-only posts need a school account.</div>`:"";
 const body=items.length?`<div class="list">${items.map(cardHtml).join("")}</div>`:`<div class="empty">No items match.</div>`;
 return `<div class="pad"><h2 class="screen">Market</h2>
  <input class="search" placeholder="Search lamp, coat, textbook" value="${esc(m.q)}" data-field="q" data-form="market">
  ${chips}${vis}<p class="sub">${items.length} item(s)</p>${body}</div>`;
}

/* POST */
function postScreen(){
 if(!canAct())return `<div class="pad"><div class="empty">Sign in to post.</div></div>`;
 const p=S.post,shop=isShop();let shopMgr="";
 if(shop){
  const own=DB.listings.filter(l=>l.shop===SHOP_NAME&&l.seller===me());
  const mgr=own.map(l=>{
   if(l.status==="reserved")return `<div class="card" style="padding:12px;margin-bottom:9px"><b>${esc(l.title)}</b> · $${l.price}
     <div class="meta" style="margin:4px 0 9px">Reserved by ${esc(nm(l.reservedBy))} · ${stamp(l.reservedAt)}</div>
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
 const visBlock=(isClark()&&!shop)?`<label class="fld">Who can see this?</label>
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
  <label class="fld">Pickup building</label>
  <select class="in" data-field="building" data-form="post">${BUILDINGS.map(b=>`<option ${p.building===b[0]?"selected":""}>${b[0]}</option>`).join("")}</select>
  ${shop?"":`<div class="toggle" style="margin-top:8px"><span>Free</span><div class="sw ${p.free?"on":""}" data-act="free" role="button"></div></div>`}
  ${(!p.free)?`<label class="fld">Price (USD)</label><input class="in" type="number" min="0" value="${p.price||""}" data-field="price" data-form="post" placeholder="0">`:""}
  ${visBlock}
  <div style="height:16px"></div><button class="btn grad" data-act="submitpost">Post it</button>
  <p class="sub" style="margin-top:12px">Tip: meet at a public spot. Avoid sharing your room number.</p></div>`;
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
 if(!canAct())return `<div class="pad"><div class="empty">Sign in to chat.</div></div>`;
 const cs=convos();
 if(!cs.length)return `<div class="pad"><h2 class="screen">Chat</h2><div class="empty">No conversations yet.<br>Open an item and tap Message to start one.</div></div>`;
 return `<div class="pad"><h2 class="screen">Chat</h2><div class="list">`+cs.map(c=>{
  const l=DB.listings.find(x=>x.id===c.listingId);const last=lastMsg(c.listingId,c.other);
  return `<div class="card"><div class="lc" data-act="thread" data-id="${c.listingId}" data-other="${esc(c.other)}">
   ${l?thumbHtml(l):`<div class="thumb" style="${gradStyle(['#7a8699','#5b7bd0'])}">${svg("chat",22)}</div>`}
   <div class="info"><div class="row1"><span class="title">${esc(l?l.title:"Listing")}</span></div>
   <div class="meta">${esc(nm(c.other))}</div>
   ${last?`<div class="meta">${last.sender===me()?"You: ":""}${esc(last.body)}</div>`:""}</div></div></div>`;}).join("")+`</div></div>`;
}
function lastMsg(lid,other){const ms=DB.messages.filter(m=>m.listingId===lid&&((m.sender===me()&&m.recipient===other)||(m.sender===other&&m.recipient===me())));return ms[ms.length-1];}

/* LOOPBACK */
function loopScreen(){
 const a=S.assist,names=CATS.filter(c=>c.name!=="Tickets").map(c=>c.name);
 const res=scorePathways(IMPACT_CAT[a.cat],a.cond),best=res[0];const imp=impactOf(a.cat,best.pathway);
 const sell=(a.paid>0&&a.cond!=="broken")?Math.round(a.paid*{good:.5,fair:.3,broken:0}[a.cond]):null;
 const sg=DB.suggestions.slice().sort((x,y)=>y.votes.length-x.votes.length||new Date(y.ts)-new Date(x.ts));
 const sgHtml=isClark()?sg.map(s=>{const voted=s.votes.includes(me());
  return `<div class="sgcard"><div style="flex:1;min-width:0">
   <div class="meta" style="color:var(--accent-text);font-weight:650">${esc(s.topic)}${s.place?" · "+esc(s.place):""}</div>
   <div style="margin:3px 0;font-size:14.5px">${esc(s.body)}</div>
   <div class="meta">${s.anon?"Anonymous":esc(nm(s.author))} · ${new Date(s.ts).toLocaleDateString()}</div></div>
   <div class="vote ${voted?"on":""}" data-act="vote" data-id="${s.id}">${svg("post",15)}<div class="vn">${s.votes.length}</div></div></div>`;}).join(""):"";
 const orgs=PARTNERS.filter(p=>p.pathway==="donate").map(p=>p.name);
 return `<div class="pad">
  <h2 class="screen">Not sure what to do with it?</h2>
  <label class="fld">What is it?</label>
  <select class="in" data-field="cat" data-form="assist">${names.map(n=>`<option ${a.cat===n?"selected":""}>${n}</option>`).join("")}</select>
  <label class="fld">Condition</label>
  <div class="seg">${["good","fair","broken"].map(c=>`<button class="${a.cond===c?"on":""}" data-act="acond" data-v="${c}">${c}</button>`).join("")}</div>
  <label class="fld">What did you pay? (optional)</label>
  <input class="in" type="number" min="0" value="${a.paid||""}" data-field="paid" data-form="assist" placeholder="0">
  <div class="card" style="padding:15px;margin-top:14px">
   <div style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">Best next life</div>
   <div style="font-size:22px;font-weight:800;margin:3px 0;text-transform:capitalize;" class="brandtext">${best.pathway}</div>
   <div style="font-size:14px">${esc(best.reason)}</div>
   ${sell!=null?`<div style="margin-top:8px;font-size:14px">If you sell it, a rough asking price is about <b>$${sell}</b>. Free also works if you just want it gone.</div>`:""}
   ${imp?`<div class="meta" style="margin-top:8px">Est. impact: ${imp.lb} lb kept from waste · ~$${imp.usd} saved · ~${imp.co2} lb CO₂e</div>`:""}
  </div>
  <p class="sub" style="margin-top:8px">A simple rule-based guide (not AI yet). An AI photo assistant is a planned next step.</p>

  <hr class="sep"><h2 class="screen" style="margin-top:14px">Suggestion box</h2>
  <p class="sub">Ideas to make Clark greener. The most supported ones rise to the top, ready to share with the sustainability office.</p>
  ${isClark()?`<label class="fld">Topic</label>
   <select class="in" data-field="topic" data-form="sug">${TOPICS.map(t=>`<option ${S.sug.topic===t?"selected":""}>${t}</option>`).join("")}</select>
   <label class="fld">Where? (building & floor)</label><input class="in" value="${esc(S.sug.place)}" data-field="place" data-form="sug" placeholder="e.g. UC, 2nd floor">
   <label class="fld">Your idea</label><textarea class="ta" data-field="body" data-form="sug" placeholder="What should change?">${esc(S.sug.body)}</textarea>
   <div class="toggle"><span style="font-size:13px">Hide my name</span><div class="sw ${S.sug.anon?"on":""}" data-act="sganon" role="button"></div></div>
   <button class="btn sm" data-act="submitsug">Submit idea</button>
   <div style="height:12px"></div>${sgHtml}
   <button class="btn sm ghost" data-act="exportsug" style="margin-top:10px">Export ideas (copy)</button>`
  :`<div class="banner">The suggestion box is for Clark students and staff.</div>`}

  <hr class="sep"><h2 class="screen" style="margin-top:14px">Donate to an organization</h2>
  ${canAct()?`<label class="fld">Organization</label>
   <select class="in" data-field="org" data-form="don">${orgs.map(o=>`<option ${S.don.org===o?"selected":""}>${esc(o)}</option>`).join("")}</select>
   <label class="fld">What are you donating?</label><input class="in" value="${esc(S.don.what)}" data-field="what" data-form="don">
   <label class="fld">Where can they pick it up?</label><input class="in" value="${esc(S.don.where)}" data-field="where" data-form="don">
   <div style="height:12px"></div><button class="btn sm" data-act="submitdon">Request pickup</button>`:""}
 </div>`;
}

/* ===== subpages ===== */
function subpage(){const t=S.view.type;
 if(t==="detail")return detailPage(S.view.id);
 if(t==="category")return categoryPage();
 if(t==="thread")return threadPage();
 if(t==="notifications")return notifPage();
 if(t==="profile")return profilePage();
 if(t==="settings")return settingsPage();
 if(t==="impact")return impactPage();
 return "";
}
function subHead(title){return `<div class="subhead"><button class="iconbtn" data-act="back">${svg("back",22)}</button><span class="t">${esc(title)}</span></div>`;}

function detailPage(id){
 const l=DB.listings.find(x=>x.id===id);if(!l)return subHead("Not found")+`<div class="empty">This item is gone.</div>`;
 const mine=l.seller===me();const g=catObj(l.cat).g;
 const hero=`<div class="hero-img" style="${gradStyle(g)}">${l.photos&&l.photos[0]?`<img src="${l.photos[0]}" alt="">`:svg(catIcon(l.cat),52)}</div>`;
 const price=l.free?`<span class="price free" style="font-size:22px">Free</span>`:`<span class="price" style="font-size:22px">$${l.price}</span>`;
 let actions="";
 if(l.status==="picked_up")actions=`<div class="pill done" style="font-size:13px;padding:9px 13px">Picked up by ${esc(l.closedByName||nm(l.closedBy)||"someone")}${l.closedAt?" · "+stamp(l.closedAt):""}</div>`;
 else if(l.status==="sold")actions=`<div class="pill done" style="font-size:13px;padding:9px 13px">Sold${l.closedAt?" · "+stamp(l.closedAt):""}</div>`;
 else if(l.status==="reserved"){
  if(l.reservedBy===me())actions=`<div class="note">${svg("clock")}<div>Reserved for you. Pay in store when you pick it up. Held ${HOLD_H} hours.</div></div>
    <button class="btn ghost" data-act="cancelres" data-id="${l.id}">Cancel my reservation</button>`;
  else actions=`<div class="pill res" style="font-size:13px;padding:9px 13px">Reserved by someone else</div>`;
 }else{
  const msgBtn=(!mine&&canAct())?`<button class="btn ${l.free||l.shop?"sec":"grad"}" data-act="message" data-id="${l.id}">Message ${l.shop?"shop":"seller"}</button>`:"";
  if(l.shop)actions=`${!mine?`<button class="btn grad" data-act="reserve" data-id="${l.id}">Reserve (pay in store)</button>`:""}<button class="btn sec" disabled>Pay in app · coming soon</button>${msgBtn}`;
  else if(l.free)actions=`${!mine?`<button class="btn grad" data-act="pickup" data-id="${l.id}">I picked it up</button>`:""}${msgBtn}`;
  else actions=`${msgBtn}<button class="btn sec" disabled>Pay in app · coming soon</button>`;
  if(mine&&!l.shop)actions+=`<button class="btn ghost" data-act="closemine" data-id="${l.id}">Mark as ${l.free?"picked up":"sold"}</button>`;
 }
 const proof=l.pickedPhoto?`<div class="proof"><img src="${l.pickedPhoto}" alt="Pickup photo"></div>`:"";
 return subHead(l.title)+`<div class="content">${hero}
  <div class="pad">
   <div class="row1"><span style="font-size:21px;font-weight:750">${esc(l.title)}</span>${price}</div>
   <div class="badges">${l.shop?`<span class="badge red">${esc(l.shop)}</span>`:""}<span class="badge">${esc(l.cond)}</span>${l.size?`<span class="badge">Size ${esc(l.size)}</span>`:""}<span class="badge">${esc(pathLabel(l))}</span></div>
   <div class="desc">${esc(l.desc||"No description added.")}</div>
   <div class="note" style="margin-bottom:9px">${svg("pin")}<div><b>${esc(l.building)}</b> · about ${l.walk} min walk${l.free&&l.pickup?`<br>Pickup: ${esc(l.pickup)}`:""}</div></div>
   ${proof}
   <div class="metarow" style="margin-top:12px">${svg("user",13)} ${esc(l.sellerAnon?"Anonymous":l.sellerName||nm(l.seller))}</div>
   <div class="metarow" style="margin-top:5px">${svg("clock",13)} Posted ${esc(datestr(l.ts))} · ${ago(l.ts)}</div>
   <div class="metarow" style="margin-top:5px">${l.vis==="everyone"?"Visible to everyone":"Visible to Clark only"}</div>
  </div></div>
  <div class="sticky-actions">${actions}</div>`;
}

function categoryPage(){
 const st=S.cat;
 if(st.level==="cat")return subHead("Select category")+`<div class="pad"><div class="list">`+
   CATS.map(c=>`<div class="catrow" data-act="catpick" data-c="${esc(c.name)}"><span class="em">${c.em}</span>${esc(c.name)}<span class="chev">${(c.mode!=="flat")?svg("chev",18):""}</span></div>`).join("")+`</div></div>`;
 if(st.level==="gender")return subHead(st.cat)+`<div class="pad"><div class="list">`+
   GENDERS.map(gd=>`<div class="catrow" data-act="genderpick" data-g="${gd}">${gd}<span class="chev">${(catObj(st.cat).mode==="gender_type")?svg("chev",18):""}</span></div>`).join("")+`</div></div>`;
 return subHead(st.cat+" · "+st.sub)+`<div class="pad"><div class="list">`+
  CLOTHES_TYPES[st.sub].map(t=>`<div class="catrow" data-act="typepick" data-t="${esc(t)}">${esc(t)}</div>`).join("")+`</div></div>`;
}

function threadPage(){
 const{listingId,other}=S.thread;const l=DB.listings.find(x=>x.id===listingId);
 const msgs=DB.messages.filter(m=>m.listingId===listingId&&((m.sender===me()&&m.recipient===other)||(m.sender===other&&m.recipient===me()))).sort((a,b)=>a.id-b.id);
 const lastMine=[...msgs].reverse().find(m=>m.sender===me());
 const rows=msgs.map(m=>{
  const mine=m.sender===me();
  if(S.editing===m.id&&mine)return `<div class="medit"><input id="editIn" value="${esc(m.body)}"><button class="iconbtn" data-act="saveedit" data-id="${m.id}">${svg("check",20)}</button><button class="iconbtn" data-act="canceledit">${svg("back",20)}</button></div>`;
  let stat=`${clock(m.ts)}${m.edited?" · edited":""}`;
  if(mine){stat+=` · <button class="mact" data-act="editmsg" data-id="${m.id}">Edit</button>`;
   if(m.id===lastMine.id)stat+=m.status==="read"?` · <span class="rd">${svg("checks",13)} Read</span>`:` · ${svg("check",13)} Delivered`;}
  return `<div class="mwrap ${mine?"me":"them"}"><div class="msg">${esc(m.body)}</div><div class="mstat">${stat}</div></div>`;
 }).join("");
 const typing=(S.typing&&S.typing.listingId===listingId&&S.typing.other===other)?`<div class="typing"><i></i><i></i><i></i></div>`:"";
 const body=msgs.length||typing?rows+typing:`<div class="empty">Say hi about “${esc(l?l.title:"this item")}”.</div>`;
 return subHead((l?l.title:"Chat")+" · "+nm(other))+
  `<div class="content"><div class="thread">${body}</div></div>
   <div class="composer"><input id="msgIn" placeholder="Message ${esc(nm(other))}" autocomplete="off">
   <button class="send" data-act="send" aria-label="Send">${svg("chev",20)}</button></div>`;
}

function notifPage(){
 const list=DB.notifications.filter(n=>n.user===me()).sort((a,b)=>new Date(b.ts)-new Date(a.ts));
 const body=list.length?list.map(n=>`<div class="notif ${n.read?"":"unread"}"><div class="ni">${svg(n.icon||"bell",18)}</div>
   <div style="flex:1;min-width:0"><div style="font-weight:650;font-size:14.5px">${esc(n.text)}</div>
   ${n.sub?`<div class="meta" style="white-space:normal">${esc(n.sub)}</div>`:""}
   <div class="meta">${ago(n.ts)}</div></div></div>`).join(""):`<div class="empty">No notifications yet.</div>`;
 return subHead("Notifications")+`<div class="content"><div class="pad"><div class="list">${body}</div></div></div>`;
}

function profilePage(){
 const a=S.user.acct||{};const mine=DB.listings.filter(l=>l.seller===me());
 const active=mine.filter(l=>l.status==="available"||l.status==="reserved");
 const done=DB.listings.filter(l=>(l.status==="picked_up"||l.status==="sold")&&l.closedBy===me()).length+mine.filter(l=>l.status==="picked_up"||l.status==="sold").length;
 return subHead("Profile")+`<div class="content"><div class="phead">
   <div class="pbig">${esc(initials(myName()))}</div>
   <div><div class="pname">${esc(a.anon?"Anonymous":myName())}</div><div class="prole">${roleLabel()}</div></div></div>
  <div class="pad">
   <div class="statgrid" style="margin-bottom:16px">
    <div class="stat"><div class="n">${active.length}</div><div class="l">Active listings</div></div>
    <div class="stat"><div class="n">${done}</div><div class="l">Items rehomed</div></div></div>
   ${a.email?`<div class="metarow" style="margin:4px 0">${svg("user",13)} ${esc(a.email)}</div>`:""}
   ${a.role==="student"&&a.gradMonth?`<div class="metarow" style="margin:6px 0">${svg("book",13)} Graduating ${esc(a.gradMonth)} ${esc(a.gradYear)}</div>`:""}
   <hr class="sep"><h2 class="screen" style="margin-top:14px">Your listings</h2>
   ${mine.length?`<div class="list" style="margin-top:10px">${mine.map(cardHtml).join("")}</div>`:`<p class="sub" style="margin-top:8px">You haven't posted anything yet.</p>`}
  </div></div>`;
}

function settingsPage(){
 const t=(document.documentElement.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"));
 const a=S.user.acct||{};
 return subHead("Settings")+`<div class="content"><div class="pad">
   <div class="toggle"><span>Dark theme</span><div class="sw ${t==="dark"?"on":""}" data-act="theme" role="button"></div></div>
   <div class="toggle"><div><div style="font-size:15px">Stay anonymous</div><div class="sub" style="margin:0">Hide your name on new posts</div></div>
     <div class="sw ${a.anon?"on":""}" data-act="toggleanon" role="button"></div></div>
   <hr class="sep">
   <div class="note" style="margin-top:14px">${svg("leaf")}<div>This prototype uses example listings and saves everything in this browser only, so data doesn't sync between devices yet.</div></div>
   <div style="height:16px"></div>
   <button class="btn ghost" data-act="signout">Log out</button>
   <div style="height:10px"></div>
   <button class="btn ghost" data-act="cleardata" style="color:var(--accent-text)">Reset app data</button>
  </div></div>`;
}

function impactBlock(){
 const done=DB.listings.filter(l=>l.status==="picked_up"||l.status==="sold");
 let lb=0,usd=0,co2=0;done.forEach(l=>{const im=impactOf(l.cat,"reuse");if(im){lb+=im.lb;usd+=im.usd;co2+=im.co2;}});
 const addressed=DB.suggestions.filter(s=>s.addressed).length;
 return `<div class="statgrid">
   <div class="stat g"><div class="n">${done.length}</div><div class="l">Items rehomed</div></div>
   <div class="stat"><div class="n">${Math.round(lb)}</div><div class="l">lb kept from waste</div></div>
   <div class="stat"><div class="n">$${Math.round(usd)}</div><div class="l">saved (est.)</div></div>
   <div class="stat"><div class="n">${Math.round(co2)}</div><div class="l">lb CO₂e avoided</div></div></div>
  <div class="card" style="padding:14px;margin-top:14px"><b>Ideas handled</b><div class="sub" style="margin:6px 0 0">${addressed} of ${DB.suggestions.length} community ideas marked addressed.</div></div>
  <p class="sub" style="margin-top:12px">Counts items marked picked up or sold. Weight, price, and CO₂ figures are placeholders, not sourced yet.</p>`;
}
function impactPage(){return subHead("Impact")+`<div class="content"><div class="pad"><h2 class="screen">Impact so far</h2><p class="sub">Across everyone on ClarkLoop.</p>${impactBlock()}</div></div>`;}
function impactScreen(){return `<div class="pad">${greet()}<h2 class="screen">Impact summary</h2><p class="sub">What ClarkLoop has kept out of the landfill so far.</p>${impactBlock()}</div>`;}
function reportsScreen(){
 const sg=DB.suggestions.slice().sort((a,b)=>b.votes.length-a.votes.length||new Date(b.ts)-new Date(a.ts));
 const open=sg.filter(s=>!s.addressed).length;
 const cards=sg.map(s=>`<div class="sgcard" style="align-items:flex-start">
   <div style="flex:1;min-width:0">
    <div class="meta" style="color:var(--accent-text);font-weight:650">${esc(s.topic)}${s.place?" · "+esc(s.place):""}</div>
    <div style="margin:3px 0;font-size:14.5px">${esc(s.body)}</div>
    <div class="meta">${s.anon?"Anonymous":esc(nm(s.author))} · ${new Date(s.ts).toLocaleDateString()} · ${s.votes.length} support</div></div>
   <button class="vote ${s.addressed?"on":""}" data-act="addr" data-id="${s.id}">${svg(s.addressed?"check":"clock",16)}<div class="vn" style="font-size:9.5px;font-weight:700">${s.addressed?"Done":"Open"}</div></button></div>`).join("");
 return `<div class="pad">${greet()}<h2 class="screen">Community reports</h2>
  <p class="sub">What students are asking for, most supported first. Mark what you've handled, then export the list for facilities.</p>
  <div class="statgrid" style="margin-bottom:14px">
   <div class="stat"><div class="n">${sg.length}</div><div class="l">Total ideas</div></div>
   <div class="stat"><div class="n">${open}</div><div class="l">Still open</div></div></div>
  ${cards||'<div class="empty">No reports yet.</div>'}
  <button class="btn sm ghost" data-act="exportsug" style="margin-top:12px">Export reports (copy)</button></div>`;
}

/* ---------- sign in view already handled ---------- */
function openDetail(id){S.view={type:"detail",id};render();}
function openThread(listingId,other){S.thread={listingId,other};S.view={type:"thread"};markRead(listingId,other);render();scrollThread();}
function scrollThread(){setTimeout(()=>{const t=document.querySelector(".thread");if(t)t.scrollTop=1e9;const i=$("#msgIn");if(i)i.focus();},0);}
function markRead(lid,other){let ch=false;DB.messages.forEach(m=>{if(m.listingId===lid&&m.sender===other&&m.recipient===me()&&m.status!=="read"){m.status="read";ch=true;}});DB.notifications.forEach(n=>{if(n.user===me()&&!n.read&&n.lid===lid){n.read=true;ch=true;}});if(ch)save();}

/* ---------- events ---------- */
document.addEventListener("click",e=>{
 const el=e.target.closest("[data-act]");
 const a=el?el.dataset.act:null;
 if(a==="avatarmenu"){S.menuOpen=!S.menuOpen;render();return;}
 if(S.menuOpen&&!(el&&el.closest(".menu"))){S.menuOpen=false;if(!a){render();return;}}
 if(!el)return;
 const id=el.dataset.id?+el.dataset.id:null;
 // onboarding
 if(a==="demo"){openDemoModal();return;}
 if(a==="demorole"){closeModal();demoLoginRole(el.dataset.r);return;}
 if(a==="gosignup"){S.auth={mode:"signup"};render();return;}
 if(a==="gologin"){S.auth={mode:"login"};render();return;}
 if(a==="toland"){S.auth={mode:"landing"};render();return;}
 if(a==="create"){createAccount();return;}
 if(a==="dologin"){doLogin();return;}
 if(a==="suanon"){S.signup.anon=!S.signup.anon;render();return;}
 // top bar / menu
 if(a==="theme"){const cur=document.documentElement.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");const next=cur==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",next);try{localStorage.setItem("clarkloop_theme",next);}catch(e){}render();return;}
 if(a==="notif"){DB.notifications.forEach(n=>{if(n.user===me())n.read=true;});save();S.view={type:"notifications"};render();return;}
 if(a==="goprofile"){S.view={type:"profile"};render();return;}
 if(a==="gosettings"){S.view={type:"settings"};render();return;}
 if(a==="goimpact"){S.view={type:"impact"};render();return;}
 if(a==="signout"){S.user=null;S.view=null;S.thread=null;S.auth={mode:"landing"};render();return;}
 if(a==="cleardata"){try{localStorage.removeItem(KEY);}catch(e){}DB={seq:1,listings:[],messages:[],suggestions:[],donations:[],accounts:[],notifications:[],names:{}};seed();S.user=null;S.view=null;S.auth={mode:"landing"};toast("App data reset.");render();return;}
 if(a==="toggleanon"){if(S.user.acct){S.user.acct.anon=!S.user.acct.anon;const ac=DB.accounts.find(x=>x.email===me());if(ac)ac.anon=S.user.acct.anon;save();}render();return;}
 // nav
 if(a==="tab"){S.screen=el.dataset.tab;S.view=null;render();return;}
 if(a==="back"){S.view=null;S.editing=null;render();return;}
 if(a==="open"){openDetail(id);return;}
 if(a==="showclosed"){S.showClosed=!S.showClosed;render();return;}
 // market
 if(a==="mfree"){S.market.free=!S.market.free;render();return;}
 if(a==="mshop"){S.market.shop=!S.market.shop;render();return;}
 if(a==="mcat"){const c=el.dataset.c;S.market.cat=(c==="All")?null:c;render();return;}
 // post
 if(a==="cond"){S.post.cond=el.dataset.v;render();return;}
 if(a==="vis"){S.post.vis=el.dataset.v;render();return;}
 if(a==="free"){S.post.free=!S.post.free;render();return;}
 if(a==="addphoto"){$("#photoInput").click();return;}
 if(a==="rmphoto"){S.post.photos.splice(+el.dataset.i,1);render();return;}
 if(a==="pickcat"){S.cat={level:"cat",cat:null};S.view={type:"category"};render();return;}
 if(a==="submitpost"){submitPost();return;}
 if(a==="catpick"){const c=catObj(el.dataset.c);if(c.mode==="flat"){S.post.cat=c.name;S.post.sub=null;S.post.type=null;S.view=null;render();}else{S.cat={level:"gender",cat:c.name};render();}return;}
 if(a==="genderpick"){const c=catObj(S.cat.cat);S.post.cat=c.name;S.post.sub=el.dataset.g;if(c.mode==="gender"){S.post.type=null;S.view=null;render();}else{S.cat={level:"type",cat:c.name,sub:el.dataset.g};render();}return;}
 if(a==="typepick"){S.post.type=el.dataset.t;S.view=null;render();return;}
 // detail
 if(a==="pickup"){openPickupModal(id);return;}
 if(a==="closemine"){const l=DB.listings.find(x=>x.id===id);markStatus(id,l.free?"picked_up":"sold");openDetail(id);return;}
 if(a==="reserve"){if(reserve(id)){openDetail(id);toast("Reserved. Pay in store within "+HOLD_H+"h.");}else toast("Someone just reserved it.");return;}
 if(a==="cancelres"){const l=DB.listings.find(x=>x.id===id);if(l&&l.reservedBy===me()){l.status="available";l.reservedBy=null;l.reservedAt=null;save();}openDetail(id);return;}
 if(a==="shopdone"){const l=DB.listings.find(x=>x.id===id);if(l){l.status="sold";l.closedBy=me();l.closedByName=myName();l.closedAt=now(0);save();}render();return;}
 if(a==="shoprelease"){const l=DB.listings.find(x=>x.id===id);if(l){l.status="available";l.reservedBy=null;l.reservedAt=null;save();}render();return;}
 if(a==="message"){const l=DB.listings.find(x=>x.id===id);openThread(l.id,l.seller);return;}
 // chat
 if(a==="thread"){openThread(id,el.dataset.other);return;}
 if(a==="send"){sendMsg();return;}
 if(a==="editmsg"){S.editing=id;render();setTimeout(()=>{const i=$("#editIn");if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},0);return;}
 if(a==="canceledit"){S.editing=null;render();scrollThread();return;}
 if(a==="saveedit"){const i=$("#editIn");const m=DB.messages.find(x=>x.id===id);if(m&&i&&i.value.trim()){m.body=i.value.trim();m.edited=true;save();}S.editing=null;render();scrollThread();return;}
 // loop
 if(a==="acond"){S.assist.cond=el.dataset.v;render();return;}
 if(a==="sganon"){S.sug.anon=!S.sug.anon;render();return;}
 if(a==="vote"){const s=DB.suggestions.find(x=>x.id===id);if(s&&!s.votes.includes(me())){s.votes.push(me());save();}render();return;}
 if(a==="addr"){const s=DB.suggestions.find(x=>x.id===id);if(s){s.addressed=!s.addressed;save();}render();return;}
 if(a==="submitsug"){if(!S.sug.body.trim())return toast("Write your idea first.");DB.suggestions.push({id:DB.seq++,author:me(),anon:S.sug.anon,topic:S.sug.topic,place:S.sug.place.trim(),body:S.sug.body.trim(),votes:[],ts:now(0)});S.sug={topic:TOPICS[0],place:"",body:"",anon:false};save();toast("Idea added.");render();return;}
 if(a==="exportsug"){exportSug();return;}
 if(a==="submitdon"){if(!S.don.what.trim())return toast("Say what you're donating.");DB.donations.push({...S.don,donor:me(),ts:now(0)});S.don.what="";S.don.where="";save();toast("Pickup requested (demo only).");render();return;}
 // pickup modal
 if(a==="pickupConfirm"){confirmPickup();return;}
 if(a==="pickupPhoto"){$("#pickupInput").click();return;}
 if(a==="modalClose"){closeModal();return;}
});
document.addEventListener("input",e=>{const t=e.target;if(!t.dataset.form)return;const f=t.dataset.form,k=t.dataset.field;let v=t.value;if(k==="price"||k==="paid")v=parseFloat(v)||0;
 if(f==="market"){S.market[k]=v;render();const i=$('[data-field="q"]');if(i){i.focus();const p=String(t.value).length;i.setSelectionRange(p,p);}return;}
 S[f][k]=v;});
document.addEventListener("change",e=>{const t=e.target;
 if(t.id==="photoInput"&&t.files&&t.files[0]){addPhoto(t.files[0]);t.value="";return;}
 if(t.id==="pickupInput"&&t.files&&t.files[0]){readPhoto(t.files[0],d=>{PICK.photo=d;renderPickupModal();});t.value="";return;}
 if(t.dataset.form){const f=t.dataset.form,k=t.dataset.field;S[f][k]=t.value;if(f==="signup"||f==="assist")render();}});
document.addEventListener("keydown",e=>{if(e.key==="Enter"){if(e.target.id==="msgIn"){e.preventDefault();sendMsg();}if(e.target.id==="editIn"){e.preventDefault();const m=DB.messages.find(x=>x.id===S.editing);if(m&&e.target.value.trim()){m.body=e.target.value.trim();m.edited=true;save();}S.editing=null;render();scrollThread();}}});

/* ---------- mutations ---------- */
function markStatus(id,st){const l=DB.listings.find(x=>x.id===id);if(l&&l.status==="available"){l.status=st;l.closedBy=me();l.closedByName=myName();l.closedAt=now(0);save();}}
function reserve(id){const l=DB.listings.find(x=>x.id===id);if(l&&l.status==="available"&&l.shop){l.status="reserved";l.reservedBy=me();l.reservedAt=now(0);save();return true;}return false;}
function expireRes(){let ch=false;DB.listings.forEach(l=>{if(l.status==="reserved"&&l.reservedAt&&(Date.now()-new Date(l.reservedAt))/3600000>HOLD_H){l.status="available";l.reservedBy=null;l.reservedAt=null;ch=true;}});if(ch)save();}
function readPhoto(file,cb){const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const mx=1000;let w=img.width,h=img.height;if(w>mx||h>mx){const s=Math.min(mx/w,mx/h);w=Math.round(w*s);h=Math.round(h*s);}const cv=document.createElement("canvas");cv.width=w;cv.height=h;cv.getContext("2d").drawImage(img,0,0,w,h);cb(cv.toDataURL("image/jpeg",0.72));};img.src=r.result;};r.readAsDataURL(file);}
function addPhoto(file){if(S.post.photos.length>=4)return toast("Up to 4 photos.");readPhoto(file,d=>{S.post.photos.push(d);render();});}
function submitPost(){const p=S.post;if(!p.title.trim())return toast("Add a title.");if(!p.cat)return toast("Pick a category.");
 const shop=isShop();const b=BUILDINGS.find(x=>x[0]===p.building)||BUILDINGS[0];
 DB.listings.push({id:DB.seq++,seller:me(),sellerName:S.user.acct&&S.user.acct.anon?"Anonymous":myName(),sellerAnon:!!(S.user.acct&&S.user.acct.anon),
  title:p.title.trim(),desc:p.desc.trim(),photos:p.photos.slice(),cat:p.cat,sub:p.sub,type:p.type,cond:p.cond,size:p.size.trim(),
  price:p.free?0:(parseFloat(p.price)||0),free:shop?false:p.free,building:b[0],walk:b[1],pickup:p.free?b[0]:"",
  vis:shop?"everyone":(isClark()?p.vis:"everyone"),status:"available",closedBy:null,closedByName:null,closedAt:null,
  pickedPhoto:null,reservedBy:null,reservedAt:null,shop:shop?SHOP_NAME:null,sample:false,ts:now(0)});
 save();S.post=newPost();S.screen="market";S.view=null;render();toast("Posted!");}
function sendMsg(){const i=$("#msgIn");if(!i)return;const v=i.value.trim();if(!v)return;const{listingId,other}=S.thread;
 DB.messages.push({id:DB.seq++,listingId,sender:me(),recipient:other,body:v,ts:now(0),status:"delivered",edited:false});
 DB.notifications.push({id:DB.seq++,user:other,icon:"chat",lid:listingId,text:"New message from "+myName(),sub:v.slice(0,60),ts:now(0),read:false});
 save();i.value="";render();scrollThread();maybeAutoReply(listingId,other);}
function maybeAutoReply(listingId,other){ // demo liveliness: sample sellers reply so chat feels real
 if(!SAMPLE_SELLERS.has(other))return;
 const myEmail=me();
 setTimeout(()=>{S.typing={listingId,other};if(threadOpen(listingId,other))render(),scrollThread();},900);
 setTimeout(()=>{S.typing=null;
  DB.messages.forEach(m=>{if(m.listingId===listingId&&m.sender===myEmail&&m.recipient===other)m.status="read";});
  const l=DB.listings.find(x=>x.id===listingId);
  const reply=l&&l.status!=="available"?"Thanks for reaching out! I think this one is already taken.":"Hi! Yes, it's still available. When works for you to meet?";
  DB.messages.push({id:DB.seq++,listingId,sender:other,recipient:myEmail,body:reply,ts:now(0),status:"read",edited:false});
  DB.notifications.push({id:DB.seq++,user:myEmail,icon:"chat",lid:listingId,text:"New message from "+nm(other),sub:reply.slice(0,60),ts:now(0),read:threadOpen(listingId,other)});
  save();if(S.user)render(),threadOpen(listingId,other)&&scrollThread();},2300);
}
function threadOpen(listingId,other){return S.view&&S.view.type==="thread"&&S.thread&&S.thread.listingId===listingId&&S.thread.other===other;}
function exportSug(){const sg=DB.suggestions.slice().sort((x,y)=>y.votes.length-x.votes.length);
 const rows=[["date","topic","place","idea","votes","from"]];
 sg.forEach(s=>rows.push([s.ts.slice(0,10),s.topic,s.place,s.body.replace(/\s+/g," "),s.votes.length,s.anon?"anonymous":nm(s.author)]));
 const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(csv).then(()=>toast("Ideas copied. Paste into an email to Clark."),()=>showCopyBox(csv));
 else showCopyBox(csv);}
function showCopyBox(txt){const w=modalWrap(`<b>Copy these ideas</b><textarea class="ta" style="height:200px;margin-top:10px" readonly>${esc(txt)}</textarea><button class="btn sm" data-act="modalClose" style="margin-top:10px">Close</button>`);w.querySelector("textarea").select();}

/* ---------- pickup modal ---------- */
let PICK={id:null,photo:null};
function modalWrap(inner){const w=document.createElement("div");w.className="modalwrap";w.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:70;display:flex;align-items:center;justify-content:center;padding:20px";w.innerHTML=`<div style="background:var(--surface);border-radius:16px;padding:18px;max-width:420px;width:100%">${inner}</div>`;w.addEventListener("click",ev=>{if(ev.target===w)w.remove();});document.body.appendChild(w);return w;}
function closeModal(){const w=$(".modalwrap");if(w)w.remove();}
function openPickupModal(id){PICK={id,photo:null};renderPickupModal();}
function renderPickupModal(){closeModal();const inner=`<b style="font-size:17px">Confirm pickup</b>
  <p class="sub" style="margin:6px 0 12px">Add a photo of where you grabbed it (optional). It helps others see it's gone.</p>
  <input type="file" accept="image/*" id="pickupInput" hidden>
  <div class="pslot" data-act="pickupPhoto" style="width:100%;height:150px;border-radius:12px">${PICK.photo?`<img src="${PICK.photo}" style="width:100%;height:100%;object-fit:cover">`:svg("image",30)}</div>
  <div style="height:12px"></div><button class="btn grad" data-act="pickupConfirm">I picked it up</button>
  <div style="height:8px"></div><button class="btn ghost" data-act="modalClose">Cancel</button>`;
 modalWrap(inner);}
function confirmPickup(){const l=DB.listings.find(x=>x.id===PICK.id);if(l&&l.status==="available"){l.status="picked_up";l.closedBy=me();l.closedByName=myName();l.closedAt=now(0);l.pickedPhoto=PICK.photo;save();}closeModal();openDetail(PICK.id);toast("Nice. Marked as picked up.");}

/* ---------- boot ---------- */
load();seed();expireRes();render();
