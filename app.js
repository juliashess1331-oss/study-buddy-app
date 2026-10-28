"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],app=()=>$("#app");
const DAYS=20,PASS=0.8;
let S=STORE.load();
function save(){const ok=STORE.save(S);saveWarn(!ok);return ok}
function saveWarn(on){let w=document.querySelector("#savewarn");if(!on){if(w&&w.remove)w.remove();return}
  if(!w){w=document.createElement("div");w.id="savewarn";w.setAttribute("role","alert");w.textContent="⚠️ Progress could not be saved. Please tell a grown-up.";document.body.prepend(w)}}
save();
// ---------- helpers ----------
function rng(seed){seed=seed>>>0;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
const ri=(r,a,b)=>a+Math.floor(r()*(b-a+1));
const pickOne=(r,arr)=>arr[Math.floor(r()*arr.length)];
function shuffle(r,a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
// Multiple choice: correct answer is given first; distractors are de-duplicated and shuffled.
function mc(r,q,correct,wrongs,extra={}){const ch=[String(correct)];for(const w of wrongs){const s=String(w);if(!ch.includes(s)&&ch.length<4)ch.push(s)}const sh=shuffle(r,ch);return{q,ch:sh,a:sh.indexOf(String(correct)),...extra}}
function numMC(r,q,ans,spread=10,extra){const w=[];let g=0;while(w.length<2&&g++<50){const v=ans+(r()<.5?-1:1)*ri(r,1,spread);if(v>=0&&v!==ans&&!w.includes(v))w.push(v)}return mc(r,q,ans,w,extra)}
const num=(q,ans,extra={})=>({q,num:ans,...extra});
async function hash(pin){if(!S.salt){S.salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,"0")).join("");save()}const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(S.salt+":"+pin));return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,"0")).join("")}
// ---------- reading ----------
const PASSAGE_ORDER=[0,1,2,6,3,10,15,4,7,5,11,13,8,17,9,14,19,12,16,18]; // gentle ramp: level 3 -> 4 -> 5, mixed
function dayLevel(day){return day<=5?3:day<=12?4:5}
function vocabForDay(r,day){const lv=dayLevel(day);const fresh=VOCAB.filter(v=>v[1]===lv),older=VOCAB.filter(v=>v[1]<lv||v[1]===lv);
  const start=((day-1)*2)%fresh.length;const pick=[fresh[start],fresh[(start+1)%fresh.length]];
  for(const w of shuffle(r,older)){if(pick.length>=4)break;if(!pick.includes(w))pick.push(w)}return pick}
// word families that could make a synonym/antonym distractor arguably correct, so they never mix
const FAMILIES=[["enormous","immense"],["fragile","sturdy","feeble"],["timid","humble","cautious","reluctant"],["gloomy","elated","eager","tranquil"],["hostile","courteous","generous","candid"],["rapid","brief"],["observe","glance","ponder","inquire"],["vanish","conceal","descend"],["abundant","diminish","vacant"],["fortunate","prosper"],["vivid","transparent"],["ancient","ordinary"],["frigid","damp"]];
const POS={observe:"v",gather:"v",vanish:"v",descend:"v",conceal:"v",persevere:"v",ponder:"v",diminish:"v",prosper:"v",inquire:"v",glance:"n",obstacle:"n",novice:"n"},pos=w=>POS[w[0]]||"a";
const related=(a,b)=>FAMILIES.some(f=>f.includes(a[0])&&f.includes(b[0]));
function readingParts(day,att){
  const r=rng(day*9973+att*7919+11),words=vocabForDay(r,day),others=VOCAB.filter(v=>!words.includes(v)),P=[];
  const meanings=w=>shuffle(r,others.filter(o=>!related(w,o))).map(o=>o[2]).filter(m=>m!==w[2]);
  P.push({id:"words",name:"Word Wizards 🪄",intro:"Meet your new words! Read each card. Then tap the best answer.",learn:words,
    qs:shuffle(r,[...words.map(w=>mc(r,`What does “${w[0]}” mean?`,w[2],meanings(w))),...words.slice(0,2).map(w=>mc(r,`Context clue! Which word fits?\n“${w[5]}”`,w[0],shuffle(r,others.filter(o=>pos(w)==="v"?pos(o)==="a":pos(o)==="v")).map(o=>o[0])))])});
  P.push({id:"sameopp",name:"Same & Opposite 🔄",intro:"A synonym means the SAME. An antonym means the OPPOSITE.",
    qs:shuffle(r,words.flatMap(w=>{const so=shuffle(r,others.filter(o=>!related(w,o)));return[mc(r,`Which word is a SYNONYM (same) for “${w[0]}”?`,w[3],[w[4],...so.map(o=>o[4])].filter(x=>x!==w[3])),mc(r,`Which word is an ANTONYM (opposite) of “${w[0]}”?`,w[4],[w[3],...so.map(o=>o[3])].filter(x=>x!==w[4]))]})).slice(0,6)});
  const wpPool=shuffle(r,WORDPARTS),mKey=x=>(x[0].match(/Here, (\w+) means/)||[,x[0]])[1],mPool=shuffle(r,MULTI).filter((x,i,arr)=>arr.findIndex(y=>mKey(y)===mKey(x))===i);let wpI=0,mI=0;
  const takeWP=n=>wpPool.slice(wpI,wpI+=n).map(x=>mc(r,x[0],x[1][0],x[1].slice(1))),takeM=n=>mPool.slice(mI,mI+=n).map(x=>mc(r,x[0],x[1][0],x[1].slice(1)));
  const wp=takeWP(4),mm=takeM(2);
  P.push({id:"builders",name:"Word Builders 🧱",intro:"Prefixes go in front. Suffixes go at the end. Roots are in the middle! Some words have two meanings.",qs:shuffle(r,[...wp,...mm])});
  const ps=PASSAGES[PASSAGE_ORDER[(day-1)%PASSAGE_ORDER.length]];
  P.push({id:"story",name:"Story Time 📖",intro:"Read the whole story. Go slow. You can peek back at it later!",passage:ps,qs:ps.q.map(q=>mc(r,`${q[0]}: ${q[1]}`,q[2][0],q[2].slice(1)))});
  const extra=Math.floor((S.min.reading-20)/5);
  for(let e=0;e<extra;e++)P.push({id:"bonus"+(e+1),bonus:1,name:"Bonus Word Builders ⭐",intro:"Bonus round! Show off those word skills.",qs:shuffle(r,[...takeWP(3),...takeM(2)])});
  P.push({id:"quickread",name:"Quick Read 🎤",intro:"Read this out loud. Make your voice fit the words. Just one time!",fluency:FLUENCY[(day-1)%FLUENCY.length]});
  return P}
// ---------- math ----------
const FX=[0,1,2,3,4,5,10],DV=[1,2,3,4,5,10];
function factQ(r){const t=ri(r,0,9);
  if(t<4){const a=pickOne(r,FX),b=ri(r,0,10);return ri(r,0,1)?num(`${a} × ${b} = ?`,a*b):num(`${b} × ${a} = ?`,a*b)}
  if(t<7){const b=pickOne(r,DV),c=ri(r,0,Math.min(10,Math.floor(50/b)));return num(`${b*c} ÷ ${b} = ?`,c)}
  if(t<9){const a=ri(r,6,12),b=ri(r,5,12);return num(`${a} + ${b} = ?`,a+b)}
  const a=ri(r,11,20),b=ri(r,3,a-1);return num(`${a} − ${b} = ?`,a-b)}
const dg=(n,i)=>Math.floor(n/10**i)%10;
function regroupQ(r,k){let a,b,c;
  if(k===0){do{a=ri(r,120,789);b=ri(r,115,199)}while(dg(a,0)+dg(b,0)<10||dg(a,1)+dg(b,1)<9);return num(`${a} + ${b} = ?`,a+b)}
  if(k===1){do{a=ri(r,1205,6890);b=ri(r,1105,2899)}while(dg(a,0)+dg(b,0)<10);return num(`${a.toLocaleString("en-US")} + ${b.toLocaleString("en-US")} = ?`,a+b)}
  if(k===2){do{a=ri(r,3,9)*100+ri(r,1,8);b=ri(r,112,a-30)}while(dg(a,0)>=dg(b,0)||b%10===0);return num(`${a} − ${b} = ?`,a-b)}
  if(k===3){do{a=ri(r,312,950);b=ri(r,118,a-50)}while(dg(a,0)>=dg(b,0)||dg(a,1)===0);return num(`${a} − ${b} = ?`,a-b)}
  if(k===4){do{a=ri(r,12,68);b=ri(r,11,59);c=ri(r,11,49)}while(dg(a,0)+dg(b,0)+dg(c,0)<10);return num(`${a} + ${b} + ${c} = ?`,a+b+c)}
  if(ri(r,0,1)){do{a=ri(r,18,69);b=ri(r,15,59)}while(dg(a,0)+dg(b,0)<10);return num(`${a} + __ = ${a+b}`,b)}
  do{a=ri(r,52,98);b=ri(r,15,a-12)}while(dg(a,0)>=dg(b,0));return num(`${a} − __ = ${a-b}`,b)}
const GROUPS=[["bags","apples"],["boxes","crayons"],["plates","cookies"],["jars","marbles"],["packs","stickers"]];
function multQ(r,k){const[g,it]=pickOne(r,GROUPS);
  if(k%2===0){const n=ri(r,2,5),e=pickOne(r,[2,3,4,5,10]);return num(`There are ${n} ${g}. Each has ${e} ${it}. How many ${it} in all?`,n*e)}
  const p=pickOne(r,[2,3,4,5,10]),e=ri(r,1,Math.min(10,Math.floor(50/p)));return num(`${p*e} ${it} are shared equally into ${p} ${g}. How many ${it} go in each?`,e)}
const NAMES=["Zara","Milo","Ivy","Theo","Nia","Oscar","Luna","Jett","Kiki","Ravi"];
const THINGS=[["stickers","packs"],["crayons","boxes"],["cookies","trays"],["marbles","bags"],["seeds","rows"],["books","shelves"]];
function processQ(r,k){const n=pickOne(r,NAMES),[it,gr]=pickOne(r,THINGS);
  if(k===0){const g=ri(r,2,5),e=pickOne(r,[2,3,4,5,10]),x=ri(r,5,30);return{q:`${n} has ${g} ${gr} of ${it} with ${e} in each. Then ${n} gets ${x} more ${it}. How many ${it} now?`,steps:[mc(r,"Step 1: What should we do first?",`Multiply ${g} × ${e}`,[`Add ${g} + ${x}`,`Subtract ${x} − ${g}`]),num(`Step 2: ${g} × ${e} = ?`,g*e),num(`Step 3: ${g*e} + ${x} = ?`,g*e+x)]}}
  if(k===1){const p=ri(r,2,5),per=ri(r,2,Math.min(10,Math.floor(50/p))),tot=p*per,start=tot+ri(r,10,60);return{q:`${n} had ${start} ${it}. ${n} gave some away and kept ${tot}, then split the kept ${it} equally among ${p} friends. How many ${it} were given away, and how many does each friend get?`,steps:[num(`Step 1: Given away: ${start} − ${tot} = ?`,start-tot),mc(r,`Step 2: To share ${tot} equally among ${p} friends, we…`,"divide",["multiply","add"]),num(`Step 3: ${tot} ÷ ${p} = ?`,per)]}}
  if(k===2){const c=pickOne(r,[2,3,4,5,10]),q=ri(r,2,5),pay=Math.ceil((c*q+1)/10)*10+ri(r,0,2)*10;return{q:`${n} buys ${q} toys that cost $${c} each and pays with $${pay}. How much change does ${n} get?`,steps:[num(`Step 1: Total cost: ${q} × $${c} = ?`,c*q),num(`Step 2: Change: $${pay} − $${c*q} = ?`,pay-c*q)]}}
  const a=ri(r,120,480),b=ri(r,105,399),c=ri(r,50,a+b-20);return{q:`A library had ${a} books. It got ${b} new books, then lent out ${c}. How many books are on the shelves now?`,steps:[num(`Step 1: ${a} + ${b} = ?`,a+b),num(`Step 2: ${a+b} − ${c} = ?`,a+b-c)]}}
function placeQ(r,k){const n=ri(r,1000,9999),d=String(n).split("").map(Number);
  if(k===0){let pos=ri(r,0,3);while(d[pos]===0)pos=(pos+1)%4;const names=["thousands","hundreds","tens","ones"],val=d[pos]*10**(3-pos);return mc(r,`In ${n.toLocaleString("en-US")}, what is the VALUE of the ${d[pos]} in the ${names[pos]} place?`,val.toLocaleString("en-US"),[val*10,pos<3?val/10:val+10,val+1].map(x=>x.toLocaleString("en-US")))}
  if(k===1){const t=d.map((x,i)=>x*10**(3-i)).filter(x=>x>0).map(x=>x.toLocaleString("en-US"));return num(`${t.join(" + ")} = ?`,n)}
  if(k===2){const t=ri(r,101,989);return num(`Round ${t} to the nearest ten.`,Math.round(t/10)*10)}
  if(k===3){const t=ri(r,1050,9940);return num(`Round ${t.toLocaleString("en-US")} to the nearest hundred.`,Math.round(t/100)*100)}
  let m;do{m=ri(r,1000,9999)}while(m===n);const big=Math.max(n,m),sm=Math.min(n,m);return mc(r,"Which number is GREATER?",big.toLocaleString("en-US"),[sm.toLocaleString("en-US")])}
function measureQ(r,k){
  if(k===0){const l=ri(r,3,15),w=ri(r,2,10);return num(`A rectangle is ${l} cm long and ${w} cm wide. What is its PERIMETER in cm?`,2*(l+w))}
  if(k===1){const l=pickOne(r,[2,3,4,5,10]),w=ri(r,2,10);return num(`A rug is ${l} feet long and ${w} feet wide. What is its AREA in square feet?`,l*w)}
  if(k===2){const h=ri(r,1,10),m=ri(r,0,3)*15,add=ri(r,2,9)*5;let tm=h*60+m+add;const H=Math.floor(tm/60),M=tm%60;return mc(r,`Practice starts at ${h}:${String(m).padStart(2,"0")}. It lasts ${add} minutes. When does it end?`,`${(H+11)%12+1}:${String(M).padStart(2,"0")}`,[1,2,3].map(z=>{const t=tm+z*10-20;const HH=Math.floor(t/60),MM=t%60;return `${(HH+11)%12+1}:${String(MM).padStart(2,"0")}`}).concat([`${h}:${String(m).padStart(2,"0")}`]))}
  if(k===3){const f=ri(r,2,3);return num(`How many inches are in ${f} feet? (1 foot = 12 inches)`,f*12)}
  const c=[["meters","centimeters",100],["kilograms","grams",1000]][ri(r,0,1)],x=ri(r,2,7);return num(`How many ${c[1]} are in ${x} ${c[0]}?`,x*c[2])}
const GEO=[["An angle that is exactly like the corner of a square is called…","a right angle",["an acute angle","an obtuse angle"]],["An angle smaller than a right angle is…","acute",["obtuse","straight"]],["An angle larger than a right angle (but less than a straight line) is…","obtuse",["acute","right"]],["Lines that never meet, like train tracks, are…","parallel",["perpendicular","curved"]],["Lines that cross to make square corners are…","perpendicular",["parallel","wavy"]],["A quadrilateral with exactly one pair of parallel sides is a…","trapezoid",["rectangle","triangle"]],["How many sides does an octagon have?","8",["6","10"]],["How many sides does a pentagon have?","5",["6","4"]],["A triangle with all three sides equal is…","equilateral",["scalene","right"]],["How many vertices (corners) does a cube have?","8",["6","12"]],["How many edges does a cube have?","12",["8","6"]],["A shape is cut into 4 equal parts and 3 are shaded. What fraction is shaded?","3/4",["1/4","4/3"]],["Which fraction is the same as 1/2?","2/4",["2/3","1/4"]],["Which fraction is larger?","3/4",["1/4","2/8"]],["How many lines of symmetry does a square have?","4",["2","1"]]];
function geoQs(r){return shuffle(r,GEO).slice(0,4).map(g=>mc(r,g[0],g[1],g[2]))}
function wordQ(r,k){const n=pickOne(r,NAMES);
  if(k===0){const a=ri(r,145,620),b=ri(r,128,a-10);return num(`${n}'s school collected ${a} cans on Monday and ${b} cans on Tuesday. How many more cans were collected on Monday?`,a-b)}
  if(k===1){const rows=ri(r,2,5),per=pickOne(r,[2,3,4,5,10]);return num(`A garden has ${rows} rows with ${per} carrots in each row. How many carrots in all?`,rows*per)}
  if(k===2){const g=ri(r,2,5),each=ri(r,2,Math.min(10,Math.floor(50/g)));return num(`${g*each} campers split into ${g} equal teams. How many campers are on each team?`,each)}
  const a=ri(r,236,580),b=ri(r,175,390);return num(`A train carried ${a} people in the morning and ${b} in the afternoon. How many people rode in all?`,a+b)}
function mathParts(day,att){const r=rng(day*104729+att*15485863+7),P=[];
  P.push({id:"facts",name:"Fact Mix ⚡",intro:"Add, take away, times, and share. Take your time and think!",qs:Array.from({length:12},()=>factQ(r))});
  P.push({id:"regroup",name:"Regroup Rally 🔁",intro:"Carry and borrow like a pro. Use paper if you like!",qs:shuffle(r,[0,1,2,3,4,5,2,5].map(k=>regroupQ(r,k)))});
  P.push({id:"groups",name:"Equal Groups 🍎",intro:"Make equal groups and share them out. Draw them if it helps!",qs:[0,1,0,1,0,1].map(k=>multQ(r,k))});
  P.push({id:"puzzles",name:"Step-by-Step Puzzles 🧩",intro:"Solve each puzzle one step at a time.",process:shuffle(r,[0,1,2,3]).slice(0,3).map(k=>processQ(r,k))});
  P.push({id:"place",name:"Place Value Castle 🏰",intro:"Thousands, hundreds, tens, and ones!",qs:shuffle(r,[0,1,2,3,4]).map(k=>placeQ(r,k))});
  P.push({id:"measure",name:"Measure & Shapes 📐",intro:"Measure it, time it, shape it!",qs:shuffle(r,[...shuffle(r,[0,1,2,3,4]).slice(0,3).map(k=>measureQ(r,k)),...geoQs(r).slice(0,3)])});
  P.push({id:"story",name:"Story Problems 🐸",intro:"Read each story slowly. Do you add, take away, times, or share?",qs:shuffle(r,[0,1,2,3]).map(k=>wordQ(r,k))});
  const extra=Math.floor((S.min.math-20)/5);for(let e=0;e<extra;e++)P.push({id:"bonus"+(e+1),bonus:1,name:"Bonus Fact Mix ⭐",intro:"Bonus facts! No rush.",qs:Array.from({length:10},()=>factQ(r))});
  return P}
function parts(day,subj,att=0){return subj==="reading"?readingParts(day,att):mathParts(day,att)}
function flatQs(P){if(P.process){const qs=[];P.process.forEach((pr,pi)=>pr.steps.forEach((st,si)=>qs.push({...st,ctx:pr.q,step:`Puzzle ${pi+1} of ${P.process.length} · step ${si+1} of ${pr.steps.length}`})));return qs}return P.qs||[]}
// ---------- progress ----------
// Progress is worked out from completion records, so it can't drift out of sync.
const isDone=(d,s,id)=>!!S.comp[STORE.pid(d,s,id)];
const blockDone=(d,s)=>STORE.REQ[s].every(id=>isDone(d,s,id));
const dayDone=d=>blockDone(d,"reading")&&blockDone(d,"math");
function unlockedThrough(){let u=Math.min(DAYS,Math.max(1,S.ovr||1));for(let d=1;d<=DAYS;d++)if(d<=u&&dayDone(d))u=Math.min(DAYS,Math.max(u,d+1));return u}
const isUnlocked=d=>d>=1&&d<=unlockedThrough();
function markPart(d,s,id,r,n){S.comp[STORE.pid(d,s,id)]={t:Date.now(),r,n};if(S.cur&&S.cur.pid===STORE.pid(d,s,id))delete S.cur;if(dayDone(d)&&!S.badges.includes("Day "+d+" Champ"))S.badges.push("Day "+d+" Champ");save()}
// ---------- grading (pure, tested) ----------
function grade(q,response){if(q.ch)return Number(response)===q.a;const v=String(response).trim();if(!/^\d+$/.test(v))return false;return Number(v)===q.num}
// ---------- UI ----------
const PRAISE=["Amazing! 🌟","You're a superstar! ⭐","Brain power! 🧠","Woo-hoo! 🎉","Super cool! 🦄","So awesome! 🚀","Nailed it! 🔨","Wow, wow, wow! 🎆"];
const KIND=["Not quite. That's okay! Mistakes help us learn. 🌱","Good try! Hard work helps your brain grow. 💛","Oops! Every mistake teaches you something. 🐢"];
const MOVEON=["This one was hard. That's okay! Let's keep going. You can try it again later. 💛","Tough one! Hard ones help your brain grow. Let's try the next one. 🌱"];
const RETRY=["Good work! Let's try this part again. You will get new questions. You've got this! 💪","So close! Practice makes progress. Ready for another go? 🌈","Nice try! Every try makes your brain stronger. Let's go again! 🧠"];
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function h(html){app().innerHTML=html;window.scrollTo(0,0)}
function home(){if(!S.hash)return setupPin();
  let g="";for(let d=1;d<=DAYS;d++){const u=isUnlocked(d),dn=dayDone(d);g+=`<button class="day ${dn?"done":""}" ${u?"":"disabled"} data-day="${d}" aria-label="Day ${d}">${dn?"✅":u?"⭐":"🔒"}<br>Day ${d}</button>`}
  h(`<h1>Study Buddy 🐙</h1><p class="big">⭐ ${S.stars} stars &nbsp;·&nbsp; 🏅 ${S.badges.length} badges</p>${reviewHTML()}<div class="grid">${g}</div><button class="part" id="xp">🎯 Extra practice</button>${noteHTML()}<button class="small gear" id="pbtn">⚙️ Grown-up / Settings 🔐</button>`);
  const nb=$("#noteok");if(nb)nb.onclick=()=>{S.note=1;save();home()};
  $$(".rvb").forEach(b=>b.onclick=()=>practice(b.dataset.k,"review"));$("#xp").onclick=()=>practiceMenu();
  $$(".day:not([disabled])").forEach(b=>b.onclick=()=>dayView(+b.dataset.day));$("#pbtn").onclick=()=>askPin(settingsArea)}
// ---------- skills: review and extra practice ----------
const skillKeys=()=>Object.keys(SKILL.NAMES);
function reviewHTML(){const due=SKILL.dueList(S);if(!due.length)return"";return`<div class="card review"><h2>🔁 Review time</h2><p>Practice these again to keep them strong.</p>${due.map(k=>`<button class="part rvb" data-k="${k}">${SKILL.name(k)}</button>`).join("")}</div>`}
function skillDay(k){const[s,id]=k.split(":");for(let d=unlockedThrough();d>=1;d--)if(parts(d,s).some(P=>P.id===id))return d;for(let d=1;d<=DAYS;d++)if(parts(d,s).some(P=>P.id===id))return d;return 1}
// Make a fresh set of questions for one skill.
function skillSet(k,n,seed){const[s,id]=k.split(":"),d=skillDay(k);let qs=[],P0=null;for(let a=0;a<6&&qs.length<n;a++){const P=parts(d,s,seed+a).find(P=>P.id===id);if(!P)break;if(!P0)P0=P;
    if(P.passage){qs=flatQs(P).slice(0,n);P0=P;break}
    if(P.process){qs=flatQs({process:P.process.slice(0,2)});break}qs=qs.concat(flatQs(P))}
  if(!(P0&&P0.process))qs=qs.slice(0,n);return{P0,qs,s,d}}
function practiceMenu(){const keys=skillKeys().filter(k=>skillDay(k)<=unlockedThrough()||S.sk[k]),w=SKILL.weakest(S,keys);
  h(`<button class="small" id="back">⬅ Back</button><h1>🎯 Extra practice</h1><p class="big">New questions every time. Pick one.</p><button class="go xpk" data-k="${w}">⭐ Best pick: ${SKILL.name(w)}</button>${keys.filter(k=>k!==w).map(k=>`<button class="part xpk" data-k="${k}">${SKILL.name(k)}${SKILL.mastered(S,k)?" 🏆":""}</button>`).join("")}`);
  $("#back").onclick=home;$$(".xpk").forEach(b=>b.onclick=()=>practice(b.dataset.k,"extra"))}
function practice(k,mode){const seed=1000+Math.floor(Math.random()*1e6),{P0,qs,s,d}=skillSet(k,mode==="review"?5:6,seed);if(!P0||!qs.length)return home();
  const P={...P0,id:mode+"-"+k.replace(":","-"),name:(mode==="review"?"🔁 Review: ":"🎯 Practice: ")+SKILL.name(k),intro:mode==="review"?"Let's see if you still remember. Take your time.":"Fresh questions just for practice.",qs,process:null};
  runPart(d,s,0,seed,{P,k,done:(r,n)=>{let msg;if(mode==="review"){const due=SKILL.reviewed(S,k,r,n);msg=r/n>=PASS?(due===null?"You remember it well! All reviews done! 🏆":"Great memory! Next review comes later. 🌟"):"Good practice! We will review it again tomorrow. 💪"}
    else msg=r/n>=PASS?"Awesome practice! 🌟":"Good practice! Every try helps you learn. 💪";
    if(r/n>=PASS)S.stars+=1;save();h(`<h1>${msg}</h1><p class="big" id="result">You got ${r} of ${n} right on the first try.</p><button class="go" id="again">🎯 More practice</button><button class="small" id="home">🏠 Home</button>`);$("#again").onclick=()=>practice(k,"extra");$("#home").onclick=home}})}
const standalone=()=>navigator.standalone===true||(window.matchMedia&&matchMedia("(display-mode: standalone)").matches);
function noteHTML(){return S.note?"":`<div class="card note" id="note"><b>📌 Note for a grown-up</b><p>${standalone()?"Great! You opened Study Buddy from the Home Screen icon. Always open it this way so progress stays saved.":"Please open Study Buddy from its Home Screen icon, not from Safari. Each one keeps its own progress."} A backup code is in Grown-up / Settings.</p><button class="small" id="noteok">Got it</button></div>`}
function dayView(d){if(!isUnlocked(d))return home();
  const blk=s=>{const p=parts(d,s);return `<div class="card"><h2>${s==="reading"?"📚 Reading":"🔢 Math"} <small>(about ${S.min[s]} min)</small></h2>${p.map((x,i)=>{const dn=isDone(d,s,x.id),open=dn||i===0||isDone(d,s,p[i-1].id);return `<button class="part ${dn?"done":""}" data-s="${s}" data-i="${i}" ${open?"":"disabled"}>${dn?"✅ ":open?"":"🔒 "}${x.name}</button>`}).join("")}</div>`};
  h(`<button class="small" id="back">⬅ Home</button><h1>Day ${d}</h1>${blk("reading")}${blk("math")}${dayDone(d)?`<p class="big">🎉 Day ${d} complete!${d<DAYS?" Day "+(d+1)+" is unlocked!":" You finished them all!"}</p>`:""}`);
  $("#back").onclick=home;$$(".part:not([disabled])").forEach(b=>b.onclick=()=>runPart(d,b.dataset.s,+b.dataset.i,0))}
const TUTBTN=`<button class="spbtn tutbtn">🧮 Step-by-step helper</button>`;
let CUR=null; // current question (used by automated tests)
function runPart(d,s,i,att,X){const P=X?X.P:parts(d,s,att)[i],skk=X?X.k:SKILL.key(s,P.id),qs=flatQs(P),id=STORE.pid(d,s,P.id);let idx=0,right=0;
  const resume=S.cur&&S.cur.pid===id&&S.cur.att===att&&S.cur.idx>0&&S.cur.idx<qs.length?S.cur:null;
  const intro=()=>{let x=`<button class="small" id="back">⬅ Back</button><h1>${P.name}</h1><p class="big">${P.intro}</p>`;
    if(P.learn)x+=P.learn.map(w=>`<div class="card word"><b class="big">${w[0]}</b><br>Means: ${w[2]}<br>Same: <i>${w[3]}</i> · Opposite: <i>${w[4]}</i><br><small>“${w[5].replace("___",w[0])}”</small></div>`).join("");
    if(P.passage)x+=`<div class="card passage"><h2>${P.passage.t}</h2>${P.passage.p.map(t=>`<p>${esc(t)}</p>`).join("")}</div>`;
    x+=P.fluency?`<div class="card passage"><p class="huge">${P.fluency}</p></div><button class="go" id="fl">I read it! 🎤</button>`:(resume?`<button class="go" id="resume">Keep going from question ${resume.idx+1} ▶️</button><button class="small" id="start">Start over</button>`:`<button class="go" id="start">Let's go! ▶️</button>`);
    h(x);$("#back").onclick=()=>X?home():dayView(d);if(P.fluency)$("#fl").onclick=()=>finish(1,1);else{$("#start").onclick=()=>{idx=0;right=0;ask()};if(resume)$("#resume").onclick=()=>{idx=resume.idx;right=resume.right;ask()}}};
  const saveSpot=()=>{S.cur={pid:id,att,idx,right};save()};
  const ask=()=>{if(idx>=qs.length)return finish(right,qs.length);const q=CUR=qs[idx];let done=false,tries=0;const maxT=q.ch?Math.min(3,q.ch.length-1):3;
    let x=`<div class="top"><span>Question ${idx+1} of ${qs.length}</span><span id="score" title="Right on the first try">✅ ${right}</span></div>`;
    if(P.passage)x+=`<details class="card"><summary>📖 Peek at the story</summary>${P.passage.p.map(t=>`<p>${esc(t)}</p>`).join("")}</details>`;
    if(q.ctx)x+=`<div class="card ctx">${esc(q.ctx)}</div><p class="step">${q.step}</p>`;
    x+=`<p class="huge q">${esc(q.q).replace(/\n/g,"<br>")}</p>`;
    x+=q.ch?q.ch.map((c,k)=>`<button class="ans" data-k="${k}">${esc(c)}</button>`).join(""):`<input id="inp" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="Your answer" readonly><div class="pad">${[1,2,3,4,5,6,7,8,9,"⌫",0,"✔"].map(k=>`<button class="key" data-key="${k}">${k}</button>`).join("")}</div>`;
    padReset();const canTut=!!TUTOR.parse(q);const qText=(q.ctx?q.ctx+"\n":"")+q.q;
    h(x+`<button class="spbtn" id="sp">✏️ Scratch Paper</button><button class="spbtn help" id="ah">🙋 Ask for help</button>${canTut?TUTBTN:""}<div id="fb" class="fb" aria-live="polite"></div>`);$("#sp").onclick=()=>padOpen(qText,q);$("#ah").onclick=()=>{padOpen(qText,q);tipsShow()};
    const tipsHTML=()=>`<p><b>💡 How to work it out:</b></p><ol class="fbtips">${TIPS(q).map(t=>`<li>${esc(t)}</li>`).join("")}</ol>${canTut?TUTBTN:""}`;
    const wireTut=()=>$$(".tutbtn").forEach(b=>b.onclick=()=>TUTOR.open(q));wireTut();
    const respond=(resp,btn)=>{if(done)return;const ok=grade(q,resp);tries++;if(tries===1)SKILL.record(S,skk,ok);const fb=$("#fb");
      if(ok){done=true;if(tries===1)right++;$("#score").textContent="✅ "+right;$$("button.ans,button.key").forEach(b=>b.disabled=true);
        if(btn)btn.classList.add("correct");else $("#inp").classList.add("correct");fb.className="fb right";
        fb.innerHTML=`<p class="big">${tries===1?rnd(PRAISE):"You figured it out! Great job sticking with it! 💪"}</p>`;idx++;saveSpot();setTimeout(ask,900);return}
      $$("button.ans,button.key").forEach(b=>b.disabled=true);if(btn)btn.classList.add("wrong");else $("#inp").classList.add("wrong");fb.className="fb wrong";
      if(tries<maxT){fb.innerHTML=`<p class="big">${rnd(KIND)}</p>${tipsHTML()}<button class="go" id="ta">Try again 🔁</button>`;wireTut();
        $("#ta").onclick=()=>{fb.className="fb";fb.innerHTML="";$$("button.ans").forEach(b=>{if(!b.classList.contains("wrong"))b.disabled=false});$$("button.key").forEach(b=>b.disabled=false);const i=$("#inp");if(i){i.value="";i.classList.remove("wrong")}}}
      else{done=true;fb.innerHTML=`<p class="big">${rnd(MOVEON)}</p><p>Want to see how to do it? You can always ask a grown-up for help.</p><button class="small" id="ot">💡 Open Tips</button><button class="small" id="os">✏️ Scratch Paper</button>${canTut?TUTBTN:""}<button class="go" id="nx">Next ➡️</button>`;wireTut();
        $("#ot").onclick=()=>{padOpen(qText,q);tipsShow()};$("#os").onclick=()=>padOpen(qText,q);idx++;saveSpot();$("#nx").onclick=ask}};
    if(q.ch)$$(".ans").forEach(b=>b.onclick=()=>respond(b.dataset.k,b));
    else{const inp=$("#inp");$$(".key").forEach(b=>b.onclick=()=>{const k=b.dataset.key;if(k==="⌫")inp.value=inp.value.slice(0,-1);else if(k==="✔"){if(inp.value!=="")respond(inp.value)}else if(inp.value.length<6)inp.value+=k})}};
  const finish=(r,n)=>{CUR=null;TUTOR.close();padReset();const pct=n?r/n:0;if(X){if(S.cur&&S.cur.pid===id){delete S.cur}return X.done(r,n)}
    if(pct>=PASS){const st=pct===1?3:pct>=.9?2:1;S.stars+=st;markPart(d,s,P.id,r,n);reward(st,d,s,r,n)}
    else{if(S.cur&&S.cur.pid===id){delete S.cur;save()}
      h(`<h1 class="retry">${RETRY[att%RETRY.length]}</h1><p class="big" id="result">You got ${r} of ${n} right on the first try. You need ${Math.ceil(n*PASS-1e-9)} to pass. Mistakes help you learn, so let's practice again!</p><button class="go" id="retry">Try again 🔁</button><button class="small" id="back">⬅ Back</button>`);$("#retry").onclick=()=>runPart(d,s,i,att+1);$("#back").onclick=()=>dayView(d)}};
  intro()}
function reward(st,d,s,r,n){const g=Math.floor(Math.random()*3);let game="",wire=()=>{};
  if(g===0){const R=rnd(RIDDLES);game=`<div class="card"><h2>🤔 Riddle time!</h2><p class="big">${R[0]}</p><button class="ans" id="rv">Show the answer</button><p id="ra" class="big"></p></div>`;wire=()=>$("#rv").onclick=()=>$("#ra").textContent=R[1]}
  else if(g===1){const A=rnd(ANIMALS),opts=shuffle(Math.random,A[1]);game=`<div class="card"><h2>🐾 Guess the animal!</h2><p class="big">${A[0]}</p>${opts.map(c=>`<button class="ans ga">${c}</button>`).join("")}<p id="ra" class="big"></p></div>`;wire=()=>$$(".ga").forEach(b=>b.onclick=()=>$("#ra").textContent=b.textContent===A[1][0]?`Yes! It's a ${A[1][0].toLowerCase()}! 🎉`:"Hee hee, nope! Try another one! 😄")}
  else{const T=rnd(STORIES);game=`<div class="card"><h2>📝 Finish the silly story!</h2><p class="big">${T[0]}</p>${T[1].map(c=>`<button class="ans ss">${c}</button>`).join("")}<p id="ra" class="big"></p></div>`;wire=()=>$$(".ss").forEach(b=>b.onclick=()=>$("#ra").textContent=T[0].replace("___",b.textContent)+" 😂")}
  h(`<h1 class="passed">${rnd(PRAISE)}</h1><p class="huge">${"⭐".repeat(st)}</p><p class="big" id="result">${n>1?`You got ${r} of ${n} right on the first try!`:"Great reading!"}</p>${blockDone(d,s)?`<p class="big">🏆 ${s==="reading"?"Reading":"Math"} block done!</p>`:""}${game}<button class="go" id="next">Keep going ➡️</button>`);
  wire();$("#next").onclick=()=>dayView(d)}

// ---------- scratch paper (drawing never touches grading or progress) ----------
const PAD={strokes:[],redo:[],color:"#222",size:4,erase:false,bg:"plain",cur:null};
const PADCOLORS=[["#222","Black"],["#1f6fe5","Blue"],["#e03131","Red"],["#2f9e44","Green"]],PADSIZES=[[3,"Thin"],[6,"Medium"],[12,"Thick"]];
function padInit(){if($("#pad"))return;const d=document.createElement("div");d.id="pad";d.hidden=true;d.setAttribute("role","dialog");d.setAttribute("aria-label","Scratch paper");
  d.innerHTML=`<div id="padtop"><p id="padq"></p><button id="pdtips" class="tipsbtn" aria-label="Tips: how to work it out" aria-expanded="false">💡 Tips</button><button id="pdclose" class="close" aria-label="Close scratch paper">✖ Close</button></div><div id="tipsbox" hidden role="region" aria-label="Tips"><div class="tipshead"><b>💡 How to work it out</b><button id="tipsx" aria-label="Close tips">✖</button></div><ol id="tipslist"></ol><p class="tipsnote">Stuck? Mistakes are how we learn. It is okay to ask a grown-up or teacher for help! 💛</p></div><div id="padbar"><button id="pdpen" class="on" aria-label="Pen">✏️</button><button id="pderase" aria-label="Eraser">🧽</button>${PADCOLORS.map((c,i)=>`<button class="sw pcol ${i?"":"on"}" data-c="${c[0]}" aria-label="${c[1]} pen" style="background:${c[0]}"></button>`).join("")}${PADSIZES.map((z,i)=>`<button class="psz ${i?"":"on"}" data-z="${z[0]}" aria-label="${z[1]} pen"><span style="display:inline-block;width:${z[0]+4}px;height:${z[0]+4}px;border-radius:50%;background:#222;vertical-align:middle"></span></button>`).join("")}<button id="pdundo" aria-label="Undo">↩️</button><button id="pdredo" aria-label="Redo">↪️</button><button id="pdbg" aria-label="Paper style">📄</button><button id="pdclear" aria-label="Clear all">🗑️</button></div><div id="padwrap"><canvas id="padc"></canvas></div>`;
  document.body.appendChild(d);const c=$("#padc"),w=$("#padwrap");
  const pt=e=>{const r=c.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  c.addEventListener("pointerdown",e=>{e.preventDefault();c.setPointerCapture&&c.setPointerCapture(e.pointerId);PAD.cur={c:PAD.color,s:PAD.erase?PAD.size*3:PAD.size,e:PAD.erase,p:[pt(e)]};PAD.strokes.push(PAD.cur);PAD.redo=[];padDraw();padBtns()});
  c.addEventListener("pointermove",e=>{if(!PAD.cur)return;e.preventDefault();const ev=e.getCoalescedEvents?e.getCoalescedEvents():[e];(ev.length?ev:[e]).forEach(x=>PAD.cur.p.push(pt(x)));padDraw()});
  const end=()=>{PAD.cur=null};["pointerup","pointercancel","pointerleave"].forEach(t=>c.addEventListener(t,end));
  ["touchstart","touchmove","gesturestart"].forEach(t=>d.addEventListener(t,e=>{if(e.target===c||t==="gesturestart")e.preventDefault()},{passive:false}));
  $("#pdpen").onclick=()=>{PAD.erase=false;padBtns()};$("#pderase").onclick=()=>{PAD.erase=true;padBtns()};
  $$(".pcol").forEach(b=>b.onclick=()=>{PAD.color=b.dataset.c;PAD.erase=false;padBtns()});$$(".psz").forEach(b=>b.onclick=()=>{PAD.size=+b.dataset.z;padBtns()});
  $("#pdundo").onclick=()=>{if(PAD.strokes.length){PAD.redo.push(PAD.strokes.pop());padDraw();padBtns()}};
  $("#pdredo").onclick=()=>{if(PAD.redo.length){PAD.strokes.push(PAD.redo.pop());padDraw();padBtns()}};
  $("#pdbg").onclick=()=>{PAD.bg={plain:"lined",lined:"grid",grid:"plain"}[PAD.bg];w.className=PAD.bg==="plain"?"":PAD.bg;padBtns()};
  $("#pdclear").onclick=()=>{if(!PAD.strokes.length||$("#padconfirm"))return;const k=document.createElement("div");k.id="padconfirm";k.innerHTML=`Erase the whole page? 🧹<br><button id="pdyes">Yes, clear it</button><button id="pdno">No, keep it</button>`;w.appendChild(k);
    $("#pdyes").onclick=()=>{PAD.strokes=[];PAD.redo=[];k.remove();padDraw();padBtns()};$("#pdno").onclick=()=>k.remove()};
  $("#pdclose").onclick=padClose;$("#pdtips").onclick=()=>{$("#tipsbox").hidden?tipsShow():tipsHide()};$("#tipsx").onclick=tipsHide;
  const rs=()=>{if(!d.hidden)padSize()};window.addEventListener("resize",rs);window.addEventListener("orientationchange",()=>setTimeout(rs,250))}
function padSize(){const c=$("#padc"),r=c.getBoundingClientRect(),dpr=window.devicePixelRatio||1;c.width=Math.max(1,Math.round(r.width*dpr));c.height=Math.max(1,Math.round(r.height*dpr));padDraw()}
function padDraw(){const c=$("#padc");if(!c)return;const x=c.getContext("2d"),dpr=c.width/(c.getBoundingClientRect().width||1);x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,c.width,c.height);x.setTransform(dpr,0,0,dpr,0,0);x.lineCap=x.lineJoin="round";
  for(const s of PAD.strokes){x.globalCompositeOperation=s.e?"destination-out":"source-over";x.strokeStyle=x.fillStyle=s.c;x.lineWidth=s.s;const p=s.p;
    if(p.length===1){x.beginPath();x.arc(p[0][0],p[0][1],s.s/2,0,7);x.fill();continue}
    x.beginPath();x.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length-1;i++){x.quadraticCurveTo(p[i][0],p[i][1],(p[i][0]+p[i+1][0])/2,(p[i][1]+p[i+1][1])/2)}x.lineTo(p[p.length-1][0],p[p.length-1][1]);x.stroke()}
  x.globalCompositeOperation="source-over"}
function padBtns(){$("#pdpen").classList.toggle("on",!PAD.erase);$("#pderase").classList.toggle("on",PAD.erase);$$(".pcol").forEach(b=>b.classList.toggle("on",!PAD.erase&&b.dataset.c===PAD.color));$$(".psz").forEach(b=>b.classList.toggle("on",+b.dataset.z===PAD.size));
  $("#pdundo").disabled=!PAD.strokes.length;$("#pdredo").disabled=!PAD.redo.length;$("#pdclear").disabled=!PAD.strokes.length;$("#pdbg").textContent={plain:"📄",lined:"📝",grid:"🔲"}[PAD.bg]}
function tipsShow(){const L=$("#tipslist");L.innerHTML="";(PAD.q?TIPS(PAD.q):[]).forEach(t=>{const li=document.createElement("li");li.textContent=t;L.appendChild(li)});
  const ob=$("#tipstut");if(ob)ob.remove();if(PAD.q&&TUTOR.parse(PAD.q)){const b=document.createElement("button");b.id="tipstut";b.className="spbtn tutbtn";b.textContent="🧮 Step-by-step helper";const q=PAD.q;b.onclick=()=>TUTOR.open(q);L.after(b)}$("#tipsbox").hidden=false;$("#pdtips").setAttribute("aria-expanded","true")}
function tipsHide(){const b=$("#tipsbox");if(b){b.hidden=true;$("#pdtips").setAttribute("aria-expanded","false")}}
function padOpen(qText,q){padInit();PAD.q=q||null;tipsHide();$("#padq").textContent=qText;$("#pad").hidden=false;document.body.classList.add("padopen");padSize();padBtns()}
function padClose(){const d=$("#pad");if(!d)return;tipsHide();d.hidden=true;document.body.classList.remove("padopen");const k=$("#padconfirm");if(k)k.remove()}
function padReset(){PAD.strokes=[];PAD.redo=[];PAD.cur=null;padClose();padDraw()}
// ---------- settings (passcode) ----------
function setupPin(){h(`<h1>Welcome, grown-up! 👋</h1><div class="card"><p>Please set a 4–6 digit settings passcode. It keeps Grown-up / Settings private, so only a grown-up or teacher can change minutes, reset progress, or unlock days for the learner. It is stored only as a scrambled hash on this device.</p><form><input id="p1" type="password" inputmode="numeric" maxlength="6" placeholder="Passcode" autocomplete="off"><input id="p2" type="password" inputmode="numeric" maxlength="6" placeholder="Type it again" autocomplete="off"></form><p id="pe" class="err"></p><button class="go" id="ok">Save passcode</button></div>`);
  $("#ok").onclick=async()=>{const a=$("#p1").value,b=$("#p2").value;if(!/^\d{4,6}$/.test(a))return $("#pe").textContent="Please use 4 to 6 digits.";if(a!==b)return $("#pe").textContent="Those don't match. Try again.";S.hash=await hash(a);save();home()}}
function askPin(next){h(`<h1>Settings (passcode) 🔐</h1><p>For a grown-up or teacher.</p><form><input id="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="Passcode"></form><p id="pe" class="err"></p><button class="go" id="ok">Open</button><button class="small" id="cancel">Cancel</button>`);
  $("#cancel").onclick=home;$("#ok").onclick=async()=>{if(await hash($("#pin").value)===S.hash)next();else{$("#pe").textContent="That passcode isn't right.";$("#pin").value=""}}}
function settingsArea(){
  h(`<h1>⚙️ Grown-up / Settings</h1><p>Choose how the learner practices on this device.</p><div class="card"><h2>Minutes per subject</h2>${["reading","math"].map(s=>`<label>${s[0].toUpperCase()+s.slice(1)}: <select id="m-${s}">${[20,25,30].map(m=>`<option value="${m}" ${S.min[s]==m?"selected":""}>${m} minutes</option>`).join("")}</select></label>`).join("")}<p><small>25 or 30 minutes adds bonus parts to blocks.</small></p><button class="small" id="sm">Save minutes</button></div>
  <div class="card"><h2>Progress</h2><p>Unlocked through Day ${unlockedThrough()} of ${DAYS}. Days finished: ${Array.from({length:DAYS},(_,i)=>i+1).filter(dayDone).length}. Stars: ${S.stars}.</p><p><small>Days unlock on their own when the day before is finished. You can also unlock days by hand here.</small></p><label>Unlock through day: <input id="ud" type="number" min="1" max="${DAYS}" value="${Math.min(unlockedThrough()+1,DAYS)}"></label><button class="small" id="ub">Unlock</button><button class="small danger" id="rs">Reset all progress</button></div>
  <div class="card"><h2>Backup code</h2><p><small>Progress is saved on this device after every answer. To be extra safe, copy this code and keep it somewhere (a note or a photo). Paste it here later to bring progress back, even on a new phone. It holds progress only, not the passcode or any personal info.</small></p><textarea id="bk" rows="4" readonly aria-label="Backup code">${STORE.exportCode(S)}</textarea><button class="small" id="bkc">📋 Copy backup code</button><textarea id="rsin" rows="3" placeholder="Paste a backup code here" aria-label="Paste a backup code"></textarea><button class="small" id="rsb">Restore from code</button></div>
  <div class="card"><h2>Change passcode</h2><form><input id="np" type="password" inputmode="numeric" maxlength="6" placeholder="New 4–6 digits" autocomplete="off"></form><button class="small" id="cp">Change passcode</button></div>
  <button class="small" id="help">📱 iPhone setup help</button><button class="small" id="home">⬅ Done</button><p id="msg" class="big"></p>`);
  const m=t=>$("#msg").textContent=t;
  $("#sm").onclick=()=>{S.min.reading=+$("#m-reading").value;S.min.math=+$("#m-math").value;save();m("Saved ✔")};
  $("#ub").onclick=()=>{const n=Math.max(1,Math.min(DAYS,Math.floor(+$("#ud").value)||1));S.ovr=Math.max(S.ovr||1,n);save();settingsArea();$("#msg").textContent="Unlocked through Day "+unlockedThrough()+" ✔"};
  $("#rs").onclick=()=>{if(confirm("Erase all progress? (The passcode stays.)")){S.comp={};S.ovr=1;S.stars=0;S.badges=[];S.sk={};delete S.cur;save();settingsArea();$("#msg").textContent="Progress reset."}};
  $("#bkc").onclick=async()=>{const t=$("#bk");t.select();try{await navigator.clipboard.writeText(t.value);m("Copied ✔")}catch(e){try{document.execCommand("copy");m("Copied ✔")}catch(_){m("Select the code and copy it.")}}};
  $("#rsb").onclick=()=>{const N=STORE.importCode($("#rsin").value,S);if(!N)return m("That code doesn't look right. Check it and try again.");if(!confirm("Replace progress on this device with the backup?"))return;S=N;save();settingsArea();$("#msg").textContent="Progress restored ✔"};
  $("#cp").onclick=async()=>{const v=$("#np").value;if(!/^\d{4,6}$/.test(v))return m("Please use 4–6 digits.");S.hash=await hash(v);save();m("Passcode changed ✔")};
  $("#help").onclick=help;$("#home").onclick=home}
function help(){h(`<h1>iPhone setup help</h1><div class="card"><h2>1. Add to Home Screen</h2><ol><li>Open the app's web address in <b>Safari</b>.</li><li>Tap the <b>Share</b> button (the square with an arrow).</li><li>Tap <b>Add to Home Screen</b>, then <b>Add</b>.</li><li>Open it once from the Home Screen while online so it saves itself for offline use.</li></ol></div>
<div class="card"><h2>2. Lock the phone to this app (Guided Access)</h2><ol><li>Open <b>Settings</b>.</li><li>Tap <b>Accessibility</b>.</li><li>Scroll down and tap <b>Guided Access</b>.</li><li>Turn <b>Guided Access</b> on.</li><li>Tap <b>Passcode Settings</b> → <b>Set Guided Access Passcode</b>, and enter a passcode (you can also turn on Face ID or Touch ID).</li><li>Optional: set a <b>Time Limit</b>.</li><li>Open <b>Study Buddy</b> from the Home Screen.</li><li><b>Triple-click the side button</b> (or the Home button on older iPhones), then tap <b>Start</b>.</li><li>To end: triple-click again, enter the Guided Access passcode, and tap <b>End</b>.</li></ol></div>
<div class="card"><h2>Privacy</h2><p>No accounts, ads, trackers, or internet use after install. The learner's progress stays on this phone, saved after every answer.</p><p><b>Keep progress safe:</b> always open Study Buddy from its Home Screen icon. The icon and a Safari tab keep <b>separate</b> progress. Deleting the icon or clearing Safari website data erases progress, so keep a backup code (Grown-up / Settings).</p></div><button class="small" id="b">⬅ Back</button>`);$("#b").onclick=settingsArea}
if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("service-worker.js").catch(()=>{});
document.addEventListener("submit",e=>e.preventDefault());
home();
STORE.persist();
STORE.recover(S).then(M=>{if(!M)return;S=M;save();if(!$("#pin")&&!CUR)home()});
