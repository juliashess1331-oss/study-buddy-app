"use strict";
const $=s=>document.querySelector(s), app=()=>$("#app");
const DAYS=20, LS="studybuddy_v1";
let S=load();
function load(){try{return JSON.parse(localStorage.getItem(LS))||{}}catch(e){return{}}}
function save(){localStorage.setItem(LS,JSON.stringify(S))}
function init(){S.done=S.done||{};S.unlocked=S.unlocked||1;S.stars=S.stars||0;S.badges=S.badges||[];S.min=S.min||{reading:20,math:20};save()}
init();
// seeded rng
function rng(seed){return()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296}}
const ri=(r,a,b)=>a+Math.floor(r()*(b-a+1));
function shuffleMC(r,q,ch,a){const seen=new Set([ch[a]]);ch=ch.filter((c,i)=>i===a||(!seen.has(c)&&seen.add(c)));a=ch.indexOf(seen.values().next().value);const idx=ch.map((_,i)=>i);for(let i=idx.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]]}return{q,ch:idx.map(i=>ch[i]),a:idx.indexOf(a)}}
function nums(r,ans,n=3,spread=5){const s=new Set([ans]);while(s.size<n){let v=ans+ri(r,-spread,spread);if(v>=0)s.add(v)}return shuffleMC(r,"",[...s].map(String),0)}
async function hash(pin){const salt=S.salt||(S.salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,"0")).join(""));const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(salt+":"+pin));return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,"0")).join("")}
// ---------- content builders ----------
function readingParts(day,attempt){
  const r=rng(day*97+attempt*7919+1), v=VOCAB.slice(((day-1)*4)%VOCAB.length,((day-1)*4)%VOCAB.length+4);
  const pool=VOCAB.filter(x=>!v.includes(x));const pick=()=>pool[ri(r,0,pool.length-1)];
  const P=[];
  P.push({name:"Word Wizards 🪄",intro:"Learn 4 new words! Tap the meaning.",learn:v,qs:v.map(w=>{const o=[w[1],pick()[1],pick()[1]];return shuffleMC(r,`What does “${w[0]}” mean?`,o,0)})});
  P.push({name:"Same & Opposite 🔄",intro:"Synonym = same. Antonym = opposite!",qs:v.flatMap(w=>[shuffleMC(r,`A SYNONYM (same) for “${w[0]}” is…`,[w[2],pick()[3],pick()[0]===w[2]?"purple":pick()[0]],0),shuffleMC(r,`An ANTONYM (opposite) of “${w[0]}” is…`,[w[3],w[2],pick()[2]],0)]).slice(0,6)});
  const ps=PASSAGES[(day-1)%PASSAGES.length];
  P.push({name:"Story Time 📖",intro:"Read the story. Then answer!",passage:ps,qs:ps.q.map(q=>shuffleMC(r,q[0],q[1],q[2]))});
  const ph=PHONICS[(day-1)%4];const its=[...ph.items].sort(()=>r()-.5).slice(0,5);
  P.push({name:"Sound Detective 🔍 – "+ph.k,intro:"Listen to the sounds in your head!",qs:its.map(q=>shuffleMC(r,q[0],q[1],q[2]))});
  const extra=Math.floor((S.min.reading-20)/5);
  for(let e=0;e<extra;e++){const ph2=PHONICS[(day+e)%4];P.push({name:"Bonus Sounds ⭐ – "+ph2.k,intro:"Bonus round!",qs:[...ph2.items].sort(()=>r()-.5).slice(0,5).map(q=>shuffleMC(r,q[0],q[1],q[2]))})}
  P.push({name:"Quick Read 🚀",intro:"Read this out loud with your best silly voice. (Just one!)",fluency:FLUENCY[(day-1)%FLUENCY.length]});
  return P;
}
function factQs(r,n){const q=[];for(let i=0;i<n;i++){if(r()<.5){const a=ri(r,2,10),b=ri(r,2,10);q.push({q:`${a} + ${b} =`,num:a+b})}else{const a=ri(r,6,20),b=ri(r,1,Math.min(a,10));q.push({q:`${a} − ${b} =`,num:a-b})}}return q}
function processQs(r){
  const out=[];
  const t=[()=>{const a=ri(r,12,40),b=ri(r,5,20),c=ri(r,3,9);return{q:`A dragon had ${a} gems. It found ${b} more, then lost ${c}. How many now?`,steps:[{q:`Step 1: ${a} + ${b} =`,num:a+b},{q:`Step 2: ${a+b} − ${c} =`,num:a+b-c}]}},
   ()=>{const a=ri(r,3,6),b=ri(r,2,5);return{q:`There are ${a} bags with ${b} apples each, plus 4 loose apples. How many apples?`,steps:[{q:"Step 1: Which do we do first?",mc:shuffleMC(r,"",[`${b} + ${b} … (${a} times)`,`${a} − ${b}`,`4 − ${b}`],0)},{q:`Step 2: ${a} groups of ${b} =`,num:a*b},{q:`Step 3: ${a*b} + 4 =`,num:a*b+4}]}},
   ()=>{const a=ri(r,30,60),b=ri(r,10,25),c=ri(r,5,15);return{q:`Mia had ${a} stickers. She gave ${b} to Sam and ${c} to Ty. How many are left?`,steps:[{q:"Step 1: Pick the plan",mc:shuffleMC(r,"",[`${a} − ${b}, then − ${c}`,`${a} + ${b} + ${c}`,`${b} − ${c}`],0)},{q:`Step 2: ${a} − ${b} =`,num:a-b},{q:`Step 3: ${a-b} − ${c} =`,num:a-b-c}]}}];
  for(let i=0;i<3;i++)out.push(t[(i+ri(r,0,2))%3]());return out;
}
function placeQs(r){const q=[];for(let i=0;i<5;i++){const n=ri(r,100,999),h=Math.floor(n/100),t=Math.floor(n/10)%10,o=n%10;const k=i%5;
 if(k==0)q.push({...nums(r,t,3,4),q:`In ${n}, what digit is in the TENS place?`});
 else if(k==1)q.push({q:`${h} hundreds, ${t} tens, ${o} ones = ?`,num:n});
 else if(k==2){const m=ri(r,100,999);q.push(shuffleMC(r,`Which is greater?`,[String(Math.max(n,m)),String(Math.min(n,m)===Math.max(n,m)?n+1:Math.min(n,m))],0))}
 else if(k==3)q.push({q:`What is 10 more than ${n}?`,num:n+10});
 else q.push({q:`What is 100 less than ${n}?`,num:n-100})}return q}
function measGeoQs(r,day){if(day%2){return [shuffleMC(r,"How many sides does a hexagon have? 🛑",["6","5","8"],0),shuffleMC(r,"A shape with 3 sides and 3 corners is a…",["triangle","square","circle"],0),shuffleMC(r,"How many faces does a cube have? 🎲",["6","4","8"],0),shuffleMC(r,"A pizza cut into 4 equal parts. Each part is a…",["fourth","half","third"],0),shuffleMC(r,"Which shape has 4 equal sides?",["square","rectangle (long)","pentagon"],0)].sort(()=>r()-.5)}
 const a=ri(r,10,40),b=ri(r,5,20),h=ri(r,1,11),m=[0,15,30,45][ri(r,0,3)];
 return [shuffleMC(r,"Which is about 1 meter long?",["a door's width","a bug","a road"],0),{q:`A ribbon is ${a} cm. Another is ${b} cm. Total cm?`,num:a+b},shuffleMC(r,"Which tool measures length?",["ruler","clock","scale"],0),shuffleMC(r,`The clock shows ${h}:${String(m).padStart(2,"0")}. Which is right?`,[m==0?`${h} o'clock`:m==30?`half past ${h}`:m==15?`quarter past ${h}`:`quarter to ${h+1}`,`${h+1} o'clock`,`noon`],0),{q:`You have 2 quarters and 3 dimes. How many cents?`,num:80}]}
function wordQs(r){const q=[];const n=["frogs","cupcakes","rockets","puppies","crayons"];for(let i=0;i<4;i++){const a=ri(r,15,60),b=ri(r,8,35),w=n[ri(r,0,4)];q.push(i%2?{q:`There were ${a+b} ${w}. ${b} hopped away. How many are left?`,num:a}:{q:`Bo has ${a} ${w}. Kim has ${b} more than Bo. How many does Kim have?`,num:a+b})}return q}
function mathParts(day,attempt){const r=rng(day*131+attempt*104729+3),P=[];
 P.push({name:"Fact Rocket 🚀 (timed)",intro:"Answer fast! You have 2 minutes for 20 facts.",timed:120,qs:factQs(r,20)});
 P.push({name:"Step-by-Step Puzzles 🧩",intro:"Solve each step one at a time.",process:processQs(r)});
 P.push({name:"Place Value Party 🏰",intro:"Hundreds, tens, and ones!",qs:placeQs(r)});
 P.push({name:day%2?"Shape Safari 🔺":"Measure Mania 📏",intro:"Look closely and pick!",qs:measGeoQs(r,day)});
 P.push({name:"Story Problems 🐸",intro:"Read it. Think it. Solve it!",qs:wordQs(r)});
 const extra=Math.floor((S.min.math-20)/5);for(let e=0;e<extra;e++)P.push({name:"Bonus Fact Blast ⚡",intro:"Bonus facts, 90 seconds for 15!",timed:90,qs:factQs(r,15)});
 return P}
function parts(day,subj,att=0){return subj==="reading"?readingParts(day,att):mathParts(day,att)}
// ---------- progress ----------
const key=(d,s)=>d+"-"+s;
function doneList(d,s){return S.done[key(d,s)]||[]}
function blockDone(d,s){return doneList(d,s).length>=parts(d,s).length}
function dayDone(d){return blockDone(d,"reading")&&blockDone(d,"math")}
function isUnlocked(d){return d<=S.unlocked}
function markPart(d,s,i){const l=doneList(d,s);if(!l.includes(i))l.push(i);S.done[key(d,s)]=l;if(dayDone(d)&&d===S.unlocked&&d<DAYS){S.unlocked=d+1;S.badges.push("Day "+d+" Champ 🏅")}save()}
// ---------- UI ----------
const PRAISE=["Amazing! 🌟","You're a superstar! ⭐","Brain power! 🧠","Woo-hoo! 🎉","Fantastic! 🦄","Totally awesome! 🚀","Nailed it! 🔨"];
const KIND=["Oops! Good try! Let's try that part again. You've got this! 💪","Almost! Brains grow when we practice. Try again! 🌱","Nice effort! Let's give it another go! 🐢➡️🐇"];
function h(html){app().innerHTML=html;window.scrollTo(0,0)}
function home(){
  if(!S.hash)return setupPin();
  let g="";for(let d=1;d<=DAYS;d++){const u=isUnlocked(d),dn=dayDone(d);g+=`<button class="day ${dn?"done":""}" ${u?"":"disabled"} data-day="${d}">${dn?"✅":u?"⭐":"🔒"}<br>Day ${d}</button>`}
  h(`<h1>Study Buddy 🐙</h1><p class="big">Stars: ⭐ ${S.stars} &nbsp; Badges: 🏅 ${S.badges.length}</p><div class="grid">${g}</div><button class="small parent" id="pbtn">Grown-ups 🔐</button>`);
  document.querySelectorAll(".day:not([disabled])").forEach(b=>b.onclick=()=>dayView(+b.dataset.day));
  $("#pbtn").onclick=()=>askPin(parentArea);
}
function dayView(d){if(!isUnlocked(d))return home();
  const blk=s=>{const p=parts(d,s),dl=doneList(d,s);return `<div class="card"><h2>${s==="reading"?"📚 Reading":"🔢 Math"} <small>(~${S.min[s]} min)</small></h2>${p.map((x,i)=>`<button class="part ${dl.includes(i)?"done":""}" data-s="${s}" data-i="${i}" ${i>0&&!dl.includes(i-1)&&!dl.includes(i)?"disabled":""}>${dl.includes(i)?"✅ ":""}${x.name}</button>`).join("")}</div>`};
  h(`<button class="small" id="back">⬅ Home</button><h1>Day ${d}</h1>${blk("reading")}${blk("math")}${dayDone(d)?'<p class="big">🎉 Day complete! The next day is unlocked!</p>':""}`);
  $("#back").onclick=home;document.querySelectorAll(".part:not([disabled])").forEach(b=>b.onclick=()=>runPart(d,b.dataset.s,+b.dataset.i,0));
}
function runPart(d,s,i,att){const P=parts(d,s,att)[i];
  // flatten to questions
  let qs=[];if(P.process)P.process.forEach((pr,pi)=>pr.steps.forEach((st,si)=>qs.push({...(st.mc||{}),q:st.q,num:st.num,ctx:pr.q,step:`Puzzle ${pi+1}, step ${si+1} of ${pr.steps.length}`})));else if(P.qs)qs=P.qs;
  let idx=0,right=0,timer=null,left=P.timed||0;
  const intro=()=>{let x=`<button class="small" id="back">⬅ Back</button><h1>${P.name}</h1><p class="big">${P.intro}</p>`;
    if(P.learn)x+=P.learn.map(w=>`<div class="card"><b class="big">${w[0]}</b><br>means: ${w[1]}<br>same: ${w[2]} · opposite: ${w[3]}</div>`).join("");
    if(P.passage)x+=`<div class="card passage"><h2>${P.passage.t}</h2><p>${P.passage.p}</p></div>`;
    if(P.fluency)x+=`<div class="card passage"><p class="huge">${P.fluency}</p></div><button class="go" id="fl">I read it! 🎤</button>`;
    else x+=`<button class="go" id="start">Let's go! ▶️</button>`;h(x);$("#back").onclick=()=>{clearInterval(timer);dayView(d)};
    if(P.fluency)$("#fl").onclick=()=>finish(1,1);else $("#start").onclick=()=>{if(P.timed)timer=setInterval(()=>{left--;const t=$("#tm");if(t)t.textContent=left+"s";if(left<=0){clearInterval(timer);finish(right,qs.length)}},1000);ask()}};
  const ask=()=>{if(idx>=qs.length){clearInterval(timer);return finish(right,qs.length)}const q=qs[idx];
    let x=`<div class="top"><span>${idx+1} / ${qs.length}</span>${P.timed?`<span id="tm">${left}s</span>`:""}</div>`;
    if(P.passage)x+=`<details class="card"><summary>📖 Peek at the story</summary><p>${P.passage.p}</p></details>`;
    if(q.ctx)x+=`<div class="card">${q.ctx}</div><p>${q.step}</p>`;
    x+=`<p class="huge">${q.q}</p>`;
    if(q.ch)x+=q.ch.map((c,k)=>`<button class="ans" data-k="${k}">${c}</button>`).join("");
    else x+=`<input id="inp" inputmode="numeric" pattern="[0-9]*" autocomplete="off"><div class="pad">${[1,2,3,4,5,6,7,8,9,"⌫",0,"✔"].map(k=>`<button class="key">${k}</button>`).join("")}</div>`;
    h(x+`<p id="fb" class="big"></p>`);
    const answer=ok=>{if(ok)right++;$("#fb").textContent=ok?PRAISE[ri(Math.random,0,PRAISE.length-1)]:(P.timed?"Keep zooming! 🚀":"Not quite — the answer is "+(q.ch?q.ch[q.a]:q.num)+". 💛");document.querySelectorAll("button.ans,button.key").forEach(b=>b.disabled=true);setTimeout(()=>{idx++;ask()},ok||P.timed?600:1600)};
    if(q.ch)document.querySelectorAll(".ans").forEach(b=>b.onclick=()=>answer(+b.dataset.k===q.a));
    else{const inp=$("#inp");document.querySelectorAll(".key").forEach(b=>b.onclick=()=>{const k=b.textContent;if(k==="⌫")inp.value=inp.value.slice(0,-1);else if(k==="✔"){if(inp.value!=="")answer(+inp.value===q.num)}else if(inp.value.length<4)inp.value+=k});inp.onkeydown=e=>{if(e.key==="Enter"&&inp.value!=="")answer(+inp.value===q.num)}}
  };
  const finish=(r,n)=>{const pct=n?r/n:0;
    if(pct>=0.8){const st=pct===1?3:pct>=.9?2:1;S.stars+=st;markPart(d,s,i);reward(st,d,s,i,r,n)}
    else h(`<h1>${KIND[att%KIND.length]}</h1><p class="big">You got ${r} of ${n}. We need ${Math.ceil(n*.8)} to pass.</p><button class="go" id="retry">Try again 🔁</button><button class="small" id="back">⬅ Back</button>`)||($("#retry").onclick=()=>runPart(d,s,i,att+1),$("#back").onclick=()=>dayView(d));};
  intro();
}
function reward(st,d,s,i,r,n){const g=ri(Math.random,0,2);let game="";
  if(g===0){const R=RIDDLES[ri(Math.random,0,RIDDLES.length-1)];game=`<div class="card"><h2>🤔 Riddle time!</h2><p class="big">${R[0]}</p><button class="ans" id="rv">Show answer</button><p id="ra" class="big"></p></div>`;setTimeout(()=>{$("#rv").onclick=()=>$("#ra").textContent=R[1]},0)}
  else if(g===1){const A=ANIMALS[ri(Math.random,0,ANIMALS.length-1)];game=`<div class="card"><h2>🐾 Guess the animal!</h2><p class="big">${A[0]}</p>${A[1].map((c,k)=>`<button class="ans ga" data-k="${k}">${c}</button>`).join("")}<p id="ra" class="big"></p></div>`;setTimeout(()=>document.querySelectorAll(".ga").forEach(b=>b.onclick=()=>$("#ra").textContent=+b.dataset.k===A[2]?"Yes! You got it! 🎉":"Hee hee, nope! Try another! 😄"),0)}
  else{const T=STORIES[ri(Math.random,0,STORIES.length-1)];game=`<div class="card"><h2>📝 Finish the silly story!</h2><p class="big">${T[0]}</p>${T[1].map(c=>`<button class="ans ss">${c}</button>`).join("")}<p id="ra" class="big"></p></div>`;setTimeout(()=>document.querySelectorAll(".ss").forEach(b=>b.onclick=()=>$("#ra").textContent=T[0].replace("___",b.textContent)+" 😂"),0)}
  h(`<h1>${PRAISE[ri(Math.random,0,PRAISE.length-1)]}</h1><p class="huge">${"⭐".repeat(st)}</p><p class="big">${n>1?`${r} of ${n} right!`:"Great reading!"}</p>${blockDone(d,s)?`<p class="big">🏆 ${s==="reading"?"Reading":"Math"} block done!</p>`:""}${game}<button class="go" id="next">Keep going ➡️</button>`);
  $("#next").onclick=()=>dayView(d)}
// ---------- parent ----------
function pinPad(title,cb,extra=""){h(`<h1>${title}</h1>${extra}<input id="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off"><p id="pe" class="err"></p><button class="go" id="ok">OK</button><button class="small" id="cancel">Cancel</button>`);$("#ok").onclick=()=>cb($("#pin").value);const c=$("#cancel");c.onclick=home;$("#pin").focus()}
function setupPin(){h(`<h1>Welcome, grown-up! 👋</h1><p>Set a 4–6 digit parent passcode. It protects settings, resets, and unlocking days. (It is stored only as a hash on this device.)</p><input id="p1" type="password" inputmode="numeric" maxlength="6" placeholder="passcode"><input id="p2" type="password" inputmode="numeric" maxlength="6" placeholder="again"><p id="pe" class="err"></p><button class="go" id="ok">Save passcode</button>`);
  $("#ok").onclick=async()=>{const a=$("#p1").value,b=$("#p2").value;if(!/^\d{4,6}$/.test(a))return $("#pe").textContent="Use 4 to 6 digits.";if(a!==b)return $("#pe").textContent="Those don't match.";S.hash=await hash(a);save();home()}}
function askPin(next){pinPad("Grown-ups only 🔐",async v=>{if(await hash(v)===S.hash)next();else $("#pe").textContent="Wrong passcode."})}
function parentArea(){
  h(`<h1>Parent area</h1><div class="card"><h2>Minutes per subject</h2>${["reading","math"].map(s=>`<label>${s}: <select id="m-${s}">${[20,25,30].map(m=>`<option ${S.min[s]==m?"selected":""}>${m}</option>`).join("")}</select></label><br>`).join("")}<small>More minutes adds bonus parts to new or unfinished blocks.</small><br><button class="small" id="sm">Save minutes</button></div>
  <div class="card"><h2>Progress</h2><p>Unlocked through day ${S.unlocked} of ${DAYS}. Stars: ${S.stars}.</p><label>Unlock through day <input id="ud" type="number" min="1" max="${DAYS}" value="${Math.min(S.unlocked+1,DAYS)}"></label><button class="small" id="ub">Unlock</button><br><button class="small danger" id="rs">Reset all progress</button></div>
  <div class="card"><h2>Change passcode</h2><input id="np" type="password" inputmode="numeric" maxlength="6" placeholder="new 4–6 digits"><button class="small" id="cp">Change</button></div>
  <button class="small" id="help">📱 iPhone setup help</button><button class="small" id="home">⬅ Done</button><p id="msg" class="big"></p>`);
  const m=t=>$("#msg").textContent=t;
  $("#sm").onclick=()=>{S.min.reading=+$("#m-reading").value;S.min.math=+$("#m-math").value;save();m("Saved ✔")};
  $("#ub").onclick=()=>{const n=Math.max(1,Math.min(DAYS,+$("#ud").value||1));S.unlocked=Math.max(S.unlocked,n);save();parentArea();$("#msg").textContent="Unlocked through day "+S.unlocked};
  $("#rs").onclick=()=>{if(confirm("Erase all progress? (Passcode stays.)")){S.done={};S.unlocked=1;S.stars=0;S.badges=[];save();m("Progress reset.")}};
  $("#cp").onclick=async()=>{const v=$("#np").value;if(!/^\d{4,6}$/.test(v))return m("Use 4–6 digits.");S.hash=await hash(v);save();m("Passcode changed ✔")};
  $("#help").onclick=help;$("#home").onclick=home}
function help(){h(`<h1>iPhone setup help</h1><div class="card"><h2>1. Add to Home Screen</h2><ol><li>Open the app's web address in <b>Safari</b>.</li><li>Tap the <b>Share</b> button (square with arrow).</li><li>Tap <b>Add to Home Screen</b>, then <b>Add</b>.</li><li>Open it once from the home screen while online so it saves itself for offline use.</li></ol></div>
<div class="card"><h2>2. Lock the phone to this app (Guided Access)</h2><ol><li>Open <b>Settings</b>.</li><li>Tap <b>Accessibility</b>.</li><li>Scroll down and tap <b>Guided Access</b>.</li><li>Turn <b>Guided Access</b> on.</li><li>Tap <b>Passcode Settings</b> → <b>Set Guided Access Passcode</b> and enter a passcode (you can also turn on Face ID / Touch ID).</li><li>Optional: set a <b>Time Limit</b> alarm.</li><li>Open <b>Study Buddy</b> from the home screen.</li><li><b>Triple-click the side button</b> (or Home button on older iPhones), then tap <b>Start</b>.</li><li>To end: triple-click again, enter the Guided Access passcode, tap <b>End</b>.</li></ol></div>
<div class="card"><h2>Privacy</h2><p>No accounts, ads, trackers, or internet use after install. Progress stays on this phone (localStorage). Clearing Safari website data erases progress.</p></div><button class="small" id="b">⬅ Back</button>`);$("#b").onclick=parentArea}
if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("service-worker.js").catch(()=>{});
home();
