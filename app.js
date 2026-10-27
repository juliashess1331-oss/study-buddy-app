"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],app=()=>$("#app");
const DAYS=20,LS="studybuddy_v1",PASS=0.8;
let S=load();
function load(){try{return JSON.parse(localStorage.getItem(LS))||{}}catch(e){return{}}}
function save(){localStorage.setItem(LS,JSON.stringify(S))}
(function init(){S.done=S.done||{};S.unlocked=S.unlocked||1;S.stars=S.stars||0;S.badges=S.badges||[];S.min=S.min||{reading:20,math:20};save()})();
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
  P.push({name:"Word Wizards 🪄",intro:"Meet your new words! Read each card, then tap the best answer.",learn:words,
    qs:shuffle(r,[...words.map(w=>mc(r,`What does “${w[0]}” mean?`,w[2],meanings(w))),...words.slice(0,2).map(w=>mc(r,`Context clue! Which word fits?\n“${w[5]}”`,w[0],shuffle(r,others.filter(o=>pos(w)==="v"?pos(o)==="a":pos(o)==="v")).map(o=>o[0])))])});
  P.push({name:"Same & Opposite 🔄",intro:"Synonym = SAME meaning. Antonym = OPPOSITE meaning.",
    qs:shuffle(r,words.flatMap(w=>{const so=shuffle(r,others.filter(o=>!related(w,o)));return[mc(r,`Which word is a SYNONYM (same) for “${w[0]}”?`,w[3],[w[4],...so.map(o=>o[4])].filter(x=>x!==w[3])),mc(r,`Which word is an ANTONYM (opposite) of “${w[0]}”?`,w[4],[w[3],...so.map(o=>o[3])].filter(x=>x!==w[4]))]})).slice(0,6)});
  const wpPool=shuffle(r,WORDPARTS),mKey=x=>(x[0].match(/Here, (\w+) means/)||[,x[0]])[1],mPool=shuffle(r,MULTI).filter((x,i,arr)=>arr.findIndex(y=>mKey(y)===mKey(x))===i);let wpI=0,mI=0;
  const takeWP=n=>wpPool.slice(wpI,wpI+=n).map(x=>mc(r,x[0],x[1][0],x[1].slice(1))),takeM=n=>mPool.slice(mI,mI+=n).map(x=>mc(r,x[0],x[1][0],x[1].slice(1)));
  const wp=takeWP(4),mm=takeM(2);
  P.push({name:"Word Builders 🧱",intro:"Prefixes go in front. Suffixes go at the end. Roots are the middle! Some words have two meanings, too.",qs:shuffle(r,[...wp,...mm])});
  const ps=PASSAGES[PASSAGE_ORDER[(day-1)%PASSAGE_ORDER.length]];
  P.push({name:"Story Time 📖",intro:"Read the whole story carefully. You can peek back at it during the questions!",passage:ps,qs:ps.q.map(q=>mc(r,`${q[0]}: ${q[1]}`,q[2][0],q[2].slice(1)))});
  const extra=Math.floor((S.min.reading-20)/5);
  for(let e=0;e<extra;e++)P.push({name:"Bonus Word Builders ⭐",intro:"Bonus round! Show off those word skills.",qs:shuffle(r,[...takeWP(3),...takeM(2)])});
  P.push({name:"Quick Read 🎤",intro:"Read this sentence out loud with your best expression. (Just one!)",fluency:FLUENCY[(day-1)%FLUENCY.length]});
  return P}
// ---------- math ----------
function factQ(r){const t=ri(r,0,9);
  if(t<5){const a=ri(r,0,12),b=ri(r,0,12);return num(`${a} × ${b} = ?`,a*b)}
  if(t<8){const b=ri(r,1,10),c=ri(r,0,10);return num(`${b*c} ÷ ${b} = ?`,c)}
  if(t<9){const a=ri(r,6,12),b=ri(r,5,12);return num(`${a} + ${b} = ?`,a+b)}
  const a=ri(r,11,20),b=ri(r,3,a-1);return num(`${a} − ${b} = ?`,a-b)}
function regroupQ(r,k){
  if(k===0){let a,b;do{a=ri(r,15,89);b=ri(r,12,89)}while((a%10)+(b%10)<10||a+b>180);return num(`${a} + ${b} = ?`,a+b)}
  if(k===1){let a,b;do{a=ri(r,120,689);b=ri(r,115,299)}while((a%10)+(b%10)<10);return num(`${a} + ${b} = ?`,a+b)}
  if(k===2){let a,b;do{a=ri(r,31,98);b=ri(r,12,a-5)}while(a%10>=b%10);return num(`${a} − ${b} = ?`,a-b)}
  let a,b;do{a=ri(r,302,950);b=ri(r,118,a-50)}while(a%10>=b%10);return num(`${a} − ${b} = ?`,a-b)}
function multQ(r,k){if(k%2===0){const a=ri(r,12,49),b=ri(r,2,6);return num(`${a} × ${b} = ?`,a*b)}const a=ri(r,3,9),b=ri(r,2,9)*10;return num(`${a} × ${b} = ?`,a*b)}
const NAMES=["Zara","Milo","Ivy","Theo","Nia","Oscar","Luna","Jett","Kiki","Ravi"];
const THINGS=[["stickers","packs"],["crayons","boxes"],["cookies","trays"],["marbles","bags"],["seeds","rows"],["books","shelves"]];
function processQ(r,k){const n=pickOne(r,NAMES),[it,gr]=pickOne(r,THINGS);
  if(k===0){const g=ri(r,3,9),e=ri(r,4,12),x=ri(r,5,30);return{q:`${n} has ${g} ${gr} of ${it} with ${e} in each. Then ${n} gets ${x} more ${it}. How many ${it} now?`,steps:[mc(r,"Step 1: What should we do first?",`Multiply ${g} × ${e}`,[`Add ${g} + ${x}`,`Subtract ${x} − ${g}`]),num(`Step 2: ${g} × ${e} = ?`,g*e),num(`Step 3: ${g*e} + ${x} = ?`,g*e+x)]}}
  if(k===1){const p=ri(r,3,8),per=ri(r,3,9),tot=p*per,start=tot+ri(r,10,60);return{q:`${n} had ${start} ${it}. ${n} gave some away and kept ${tot}, then split the kept ${it} equally among ${p} friends. How many ${it} were given away, and how many does each friend get?`,steps:[num(`Step 1: Given away: ${start} − ${tot} = ?`,start-tot),mc(r,`Step 2: To share ${tot} equally among ${p} friends, we…`,"divide",["multiply","add"]),num(`Step 3: ${tot} ÷ ${p} = ?`,per)]}}
  if(k===2){const c=ri(r,4,9),q=ri(r,3,8),pay=Math.ceil((c*q+1)/10)*10+ri(r,0,2)*10;return{q:`${n} buys ${q} toys that cost $${c} each and pays with $${pay}. How much change does ${n} get?`,steps:[num(`Step 1: Total cost: ${q} × $${c} = ?`,c*q),num(`Step 2: Change: $${pay} − $${c*q} = ?`,pay-c*q)]}}
  const a=ri(r,120,480),b=ri(r,105,399),c=ri(r,50,a+b-20);return{q:`A library had ${a} books. It got ${b} new books, then lent out ${c}. How many books are on the shelves now?`,steps:[num(`Step 1: ${a} + ${b} = ?`,a+b),num(`Step 2: ${a+b} − ${c} = ?`,a+b-c)]}}
function placeQ(r,k){const n=ri(r,1000,9999),d=String(n).split("").map(Number);
  if(k===0){let pos=ri(r,0,3);while(d[pos]===0)pos=(pos+1)%4;const names=["thousands","hundreds","tens","ones"],val=d[pos]*10**(3-pos);return mc(r,`In ${n.toLocaleString("en-US")}, what is the VALUE of the ${d[pos]} in the ${names[pos]} place?`,val.toLocaleString("en-US"),[val*10,pos<3?val/10:val+10,val+1].map(x=>x.toLocaleString("en-US")))}
  if(k===1){const t=d.map((x,i)=>x*10**(3-i)).filter(x=>x>0).map(x=>x.toLocaleString("en-US"));return num(`${t.join(" + ")} = ?`,n)}
  if(k===2){const t=ri(r,101,989);return num(`Round ${t} to the nearest ten.`,Math.round(t/10)*10)}
  if(k===3){const t=ri(r,1050,9940);return num(`Round ${t.toLocaleString("en-US")} to the nearest hundred.`,Math.round(t/100)*100)}
  let m;do{m=ri(r,1000,9999)}while(m===n);const big=Math.max(n,m),sm=Math.min(n,m);return mc(r,"Which number is GREATER?",big.toLocaleString("en-US"),[sm.toLocaleString("en-US")])}
function measureQ(r,k){
  if(k===0){const l=ri(r,3,15),w=ri(r,2,10);return num(`A rectangle is ${l} cm long and ${w} cm wide. What is its PERIMETER in cm?`,2*(l+w))}
  if(k===1){const l=ri(r,3,12),w=ri(r,2,9);return num(`A rug is ${l} feet long and ${w} feet wide. What is its AREA in square feet?`,l*w)}
  if(k===2){const h=ri(r,1,10),m=ri(r,0,3)*15,add=ri(r,2,9)*5;let tm=h*60+m+add;const H=Math.floor(tm/60),M=tm%60;return mc(r,`Practice starts at ${h}:${String(m).padStart(2,"0")}. It lasts ${add} minutes. When does it end?`,`${(H+11)%12+1}:${String(M).padStart(2,"0")}`,[1,2,3].map(z=>{const t=tm+z*10-20;const HH=Math.floor(t/60),MM=t%60;return `${(HH+11)%12+1}:${String(MM).padStart(2,"0")}`}).concat([`${h}:${String(m).padStart(2,"0")}`]))}
  if(k===3){const f=ri(r,2,6);return num(`How many inches are in ${f} feet? (1 foot = 12 inches)`,f*12)}
  const c=[["meters","centimeters",100],["kilograms","grams",1000],["hours","minutes",60]][ri(r,0,2)],x=ri(r,2,7);return num(`How many ${c[1]} are in ${x} ${c[0]}?`,x*c[2])}
const GEO=[["An angle that is exactly like the corner of a square is called…","a right angle",["an acute angle","an obtuse angle"]],["An angle smaller than a right angle is…","acute",["obtuse","straight"]],["An angle larger than a right angle (but less than a straight line) is…","obtuse",["acute","right"]],["Lines that never meet, like train tracks, are…","parallel",["perpendicular","curved"]],["Lines that cross to make square corners are…","perpendicular",["parallel","wavy"]],["A quadrilateral with exactly one pair of parallel sides is a…","trapezoid",["rectangle","triangle"]],["How many sides does an octagon have?","8",["6","10"]],["How many sides does a pentagon have?","5",["6","4"]],["A triangle with all three sides equal is…","equilateral",["scalene","right"]],["How many vertices (corners) does a cube have?","8",["6","12"]],["How many edges does a cube have?","12",["8","6"]],["A shape is cut into 4 equal parts and 3 are shaded. What fraction is shaded?","3/4",["1/4","4/3"]],["Which fraction is the same as 1/2?","2/4",["2/3","1/4"]],["Which fraction is larger?","3/4",["1/4","2/8"]],["How many lines of symmetry does a square have?","4",["2","1"]]];
function geoQs(r){return shuffle(r,GEO).slice(0,4).map(g=>mc(r,g[0],g[1],g[2]))}
function wordQ(r,k){const n=pickOne(r,NAMES);
  if(k===0){const a=ri(r,145,620),b=ri(r,128,a-10);return num(`${n}'s school collected ${a} cans on Monday and ${b} cans on Tuesday. How many more cans were collected on Monday?`,a-b)}
  if(k===1){const rows=ri(r,4,9),per=ri(r,6,12);return num(`A garden has ${rows} rows with ${per} carrots in each row. How many carrots in all?`,rows*per)}
  if(k===2){const g=ri(r,3,9),each=ri(r,3,9);return num(`${g*each} campers split into ${g} equal teams. How many campers are on each team?`,each)}
  const a=ri(r,236,580),b=ri(r,175,390);return num(`A train carried ${a} people in the morning and ${b} in the afternoon. How many people rode in all?`,a+b)}
function mathParts(day,att){const r=rng(day*104729+att*15485863+7),P=[];
  P.push({name:"Fact Mix ⚡",intro:"Multiplication, division, and more. Take your time and think!",qs:Array.from({length:12},()=>factQ(r))});
  P.push({name:"Regroup Rally 🔁",intro:"Carry and borrow like a pro. Work it out on paper if you like!",qs:shuffle(r,[0,1,2,3,0,3].map(k=>regroupQ(r,k)))});
  P.push({name:"Multiply Mountain ⛰️",intro:"Bigger multiplying! Break numbers into tens and ones.",qs:[0,1,0,1,0].map(k=>multQ(r,k))});
  P.push({name:"Step-by-Step Puzzles 🧩",intro:"Solve each puzzle one step at a time.",process:shuffle(r,[0,1,2,3]).slice(0,3).map(k=>processQ(r,k))});
  P.push({name:"Place Value Castle 🏰",intro:"Thousands, hundreds, tens, and ones!",qs:shuffle(r,[0,1,2,3,4]).map(k=>placeQ(r,k))});
  P.push({name:"Measure & Shapes 📐",intro:"Measure it, time it, shape it!",qs:shuffle(r,[...shuffle(r,[0,1,2,3,4]).slice(0,3).map(k=>measureQ(r,k)),...geoQs(r).slice(0,3)])});
  P.push({name:"Story Problems 🐸",intro:"Read carefully. Which operation do you need?",qs:shuffle(r,[0,1,2,3]).map(k=>wordQ(r,k))});
  const extra=Math.floor((S.min.math-20)/5);for(let e=0;e<extra;e++)P.push({name:"Bonus Fact Mix ⭐",intro:"Bonus facts! No rush.",qs:Array.from({length:10},()=>factQ(r))});
  return P}
function parts(day,subj,att=0){return subj==="reading"?readingParts(day,att):mathParts(day,att)}
function flatQs(P){if(P.process){const qs=[];P.process.forEach((pr,pi)=>pr.steps.forEach((st,si)=>qs.push({...st,ctx:pr.q,step:`Puzzle ${pi+1} of ${P.process.length} · step ${si+1} of ${pr.steps.length}`})));return qs}return P.qs||[]}
// ---------- progress ----------
const key=(d,s)=>d+"-"+s;
const doneList=(d,s)=>S.done[key(d,s)]||[];
const blockDone=(d,s)=>doneList(d,s).length>=parts(d,s).length;
const dayDone=d=>blockDone(d,"reading")&&blockDone(d,"math");
const isUnlocked=d=>d>=1&&d<=S.unlocked;
function markPart(d,s,i){const l=doneList(d,s);if(!l.includes(i))l.push(i);S.done[key(d,s)]=l;if(dayDone(d)&&d===S.unlocked&&d<DAYS){S.unlocked=d+1}if(dayDone(d)&&!S.badges.includes("Day "+d+" Champ"))S.badges.push("Day "+d+" Champ");save()}
// ---------- grading (pure, tested) ----------
function grade(q,response){if(q.ch)return Number(response)===q.a;const v=String(response).trim();if(!/^\d+$/.test(v))return false;return Number(v)===q.num}
const correctText=q=>q.ch?q.ch[q.a]:String(q.num);
// ---------- UI ----------
const PRAISE=["Amazing! 🌟","You're a superstar! ⭐","Brain power! 🧠","Woo-hoo! 🎉","Fantastic! 🦄","Totally awesome! 🚀","Nailed it! 🔨","Spectacular! 🎆"];
const KIND=["Not quite, and that's okay! Brains grow when we practice. 🌱","Good try! Let's look at it together. 💛","Oops! Mistakes help us learn. 🐢"];
const RETRY=["Good effort! Let's try this part again with new questions. You've got this! 💪","So close! Practice makes progress. Ready for another go? 🌈","Nice try! Every try makes your brain stronger. Let's go again! 🧠"];
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function h(html){app().innerHTML=html;window.scrollTo(0,0)}
function home(){if(!S.hash)return setupPin();
  let g="";for(let d=1;d<=DAYS;d++){const u=isUnlocked(d),dn=dayDone(d);g+=`<button class="day ${dn?"done":""}" ${u?"":"disabled"} data-day="${d}" aria-label="Day ${d}">${dn?"✅":u?"⭐":"🔒"}<br>Day ${d}</button>`}
  h(`<h1>Study Buddy 🐙</h1><p class="big">⭐ ${S.stars} stars &nbsp;·&nbsp; 🏅 ${S.badges.length} badges</p><div class="grid">${g}</div><button class="small gear" id="pbtn">⚙️ Grown-up / Settings 🔐</button>`);
  $$(".day:not([disabled])").forEach(b=>b.onclick=()=>dayView(+b.dataset.day));$("#pbtn").onclick=()=>askPin(settingsArea)}
function dayView(d){if(!isUnlocked(d))return home();
  const blk=s=>{const p=parts(d,s),dl=doneList(d,s);return `<div class="card"><h2>${s==="reading"?"📚 Reading":"🔢 Math"} <small>(about ${S.min[s]} min)</small></h2>${p.map((x,i)=>{const dn=dl.includes(i),open=dn||i===0||dl.includes(i-1);return `<button class="part ${dn?"done":""}" data-s="${s}" data-i="${i}" ${open?"":"disabled"}>${dn?"✅ ":open?"":"🔒 "}${x.name}</button>`}).join("")}</div>`};
  h(`<button class="small" id="back">⬅ Home</button><h1>Day ${d}</h1>${blk("reading")}${blk("math")}${dayDone(d)?`<p class="big">🎉 Day ${d} complete!${d<DAYS?" Day "+(d+1)+" is unlocked!":" You finished them all!"}</p>`:""}`);
  $("#back").onclick=home;$$(".part:not([disabled])").forEach(b=>b.onclick=()=>runPart(d,b.dataset.s,+b.dataset.i,0))}
let CUR=null; // current question (used by automated tests)
function runPart(d,s,i,att){const P=parts(d,s,att)[i],qs=flatQs(P);let idx=0,right=0;
  const intro=()=>{let x=`<button class="small" id="back">⬅ Back</button><h1>${P.name}</h1><p class="big">${P.intro}</p>`;
    if(P.learn)x+=P.learn.map(w=>`<div class="card word"><b class="big">${w[0]}</b><br>Means: ${w[2]}<br>Same: <i>${w[3]}</i> · Opposite: <i>${w[4]}</i><br><small>“${w[5].replace("___",w[0])}”</small></div>`).join("");
    if(P.passage)x+=`<div class="card passage"><h2>${P.passage.t}</h2>${P.passage.p.map(t=>`<p>${esc(t)}</p>`).join("")}</div>`;
    x+=P.fluency?`<div class="card passage"><p class="huge">${P.fluency}</p></div><button class="go" id="fl">I read it! 🎤</button>`:`<button class="go" id="start">Let's go! ▶️</button>`;
    h(x);$("#back").onclick=()=>dayView(d);if(P.fluency)$("#fl").onclick=()=>finish(1,1);else $("#start").onclick=ask};
  const ask=()=>{if(idx>=qs.length)return finish(right,qs.length);const q=CUR=qs[idx];let done=false;
    let x=`<div class="top"><span>Question ${idx+1} of ${qs.length}</span><span id="score">✅ ${right}</span></div>`;
    if(P.passage)x+=`<details class="card"><summary>📖 Peek at the story</summary>${P.passage.p.map(t=>`<p>${esc(t)}</p>`).join("")}</details>`;
    if(q.ctx)x+=`<div class="card ctx">${esc(q.ctx)}</div><p class="step">${q.step}</p>`;
    x+=`<p class="huge q">${esc(q.q).replace(/\n/g,"<br>")}</p>`;
    x+=q.ch?q.ch.map((c,k)=>`<button class="ans" data-k="${k}">${esc(c)}</button>`).join(""):`<input id="inp" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="Your answer" readonly><div class="pad">${[1,2,3,4,5,6,7,8,9,"⌫",0,"✔"].map(k=>`<button class="key" data-key="${k}">${k}</button>`).join("")}</div>`;
    padReset();const qText=(q.ctx?q.ctx+"\n":"")+q.q;
    h(x+`<button class="spbtn" id="sp">✏️ Scratch Paper</button><div id="fb" class="fb" aria-live="polite"></div>`);$("#sp").onclick=()=>padOpen(qText,q);
    const respond=(resp,btn)=>{if(done)return;done=true;const ok=grade(q,resp);if(ok)right++;$("#score").textContent="✅ "+right;
      $$("button.ans,button.key").forEach(b=>b.disabled=true);
      if(q.ch){$$("button.ans")[q.a].classList.add("correct");if(!ok&&btn)btn.classList.add("wrong")}else $("#inp").classList.add(ok?"correct":"wrong");
      const fb=$("#fb");fb.className="fb "+(ok?"right":"wrong");
      fb.innerHTML=ok?`<p class="big">${rnd(PRAISE)}</p>`:`<p class="big">${rnd(KIND)}</p><p class="big">The answer is <b>${esc(correctText(q))}</b>.</p><button class="go" id="nx">Next ➡️</button>`;
      if(ok)setTimeout(()=>{idx++;ask()},800);else $("#nx").onclick=()=>{idx++;ask()}};
    if(q.ch)$$(".ans").forEach(b=>b.onclick=()=>respond(b.dataset.k,b));
    else{const inp=$("#inp");$$(".key").forEach(b=>b.onclick=()=>{const k=b.dataset.key;if(k==="⌫")inp.value=inp.value.slice(0,-1);else if(k==="✔"){if(inp.value!=="")respond(inp.value)}else if(inp.value.length<6)inp.value+=k})}};
  const finish=(r,n)=>{CUR=null;padReset();const pct=n?r/n:0;
    if(pct>=PASS){const st=pct===1?3:pct>=.9?2:1;S.stars+=st;markPart(d,s,i);reward(st,d,s,r,n)}
    else{h(`<h1 class="retry">${RETRY[att%RETRY.length]}</h1><p class="big" id="result">You got ${r} of ${n}. You need ${Math.ceil(n*PASS-1e-9)} to pass.</p><button class="go" id="retry">Try again 🔁</button><button class="small" id="back">⬅ Back</button>`);$("#retry").onclick=()=>runPart(d,s,i,att+1);$("#back").onclick=()=>dayView(d)}};
  intro()}
function reward(st,d,s,r,n){const g=Math.floor(Math.random()*3);let game="",wire=()=>{};
  if(g===0){const R=rnd(RIDDLES);game=`<div class="card"><h2>🤔 Riddle time!</h2><p class="big">${R[0]}</p><button class="ans" id="rv">Show the answer</button><p id="ra" class="big"></p></div>`;wire=()=>$("#rv").onclick=()=>$("#ra").textContent=R[1]}
  else if(g===1){const A=rnd(ANIMALS),opts=shuffle(Math.random,A[1]);game=`<div class="card"><h2>🐾 Guess the animal!</h2><p class="big">${A[0]}</p>${opts.map(c=>`<button class="ans ga">${c}</button>`).join("")}<p id="ra" class="big"></p></div>`;wire=()=>$$(".ga").forEach(b=>b.onclick=()=>$("#ra").textContent=b.textContent===A[1][0]?`Yes! It's a ${A[1][0].toLowerCase()}! 🎉`:"Hee hee, nope! Try another one! 😄")}
  else{const T=rnd(STORIES);game=`<div class="card"><h2>📝 Finish the silly story!</h2><p class="big">${T[0]}</p>${T[1].map(c=>`<button class="ans ss">${c}</button>`).join("")}<p id="ra" class="big"></p></div>`;wire=()=>$$(".ss").forEach(b=>b.onclick=()=>$("#ra").textContent=T[0].replace("___",b.textContent)+" 😂")}
  h(`<h1 class="passed">${rnd(PRAISE)}</h1><p class="huge">${"⭐".repeat(st)}</p><p class="big" id="result">${n>1?`You got ${r} of ${n} right!`:"Great reading!"}</p>${blockDone(d,s)?`<p class="big">🏆 ${s==="reading"?"Reading":"Math"} block done!</p>`:""}${game}<button class="go" id="next">Keep going ➡️</button>`);
  wire();$("#next").onclick=()=>dayView(d)}

// ---------- scratch paper (drawing never touches grading or progress) ----------
const PAD={strokes:[],redo:[],color:"#222",size:4,erase:false,bg:"plain",cur:null};
const PADCOLORS=[["#222","Black"],["#1f6fe5","Blue"],["#e03131","Red"],["#2f9e44","Green"]],PADSIZES=[[3,"Thin"],[6,"Medium"],[12,"Thick"]];
function padInit(){if($("#pad"))return;const d=document.createElement("div");d.id="pad";d.hidden=true;d.setAttribute("role","dialog");d.setAttribute("aria-label","Scratch paper");
  d.innerHTML=`<div id="padtop"><p id="padq"></p><button id="pdtips" class="tipsbtn" aria-label="Tips: how to work it out" aria-expanded="false">💡 Tips</button><button id="pdclose" class="close" aria-label="Close scratch paper">✖ Close</button></div><div id="tipsbox" hidden role="region" aria-label="Tips"><div class="tipshead"><b>💡 How to work it out</b><button id="tipsx" aria-label="Close tips">✖</button></div><ol id="tipslist"></ol><p class="tipsnote">You can do it! 💪</p></div><div id="padbar"><button id="pdpen" class="on" aria-label="Pen">✏️</button><button id="pderase" aria-label="Eraser">🧽</button>${PADCOLORS.map((c,i)=>`<button class="sw pcol ${i?"":"on"}" data-c="${c[0]}" aria-label="${c[1]} pen" style="background:${c[0]}"></button>`).join("")}${PADSIZES.map((z,i)=>`<button class="psz ${i?"":"on"}" data-z="${z[0]}" aria-label="${z[1]} pen"><span style="display:inline-block;width:${z[0]+4}px;height:${z[0]+4}px;border-radius:50%;background:#222;vertical-align:middle"></span></button>`).join("")}<button id="pdundo" aria-label="Undo">↩️</button><button id="pdredo" aria-label="Redo">↪️</button><button id="pdbg" aria-label="Paper style">📄</button><button id="pdclear" aria-label="Clear all">🗑️</button></div><div id="padwrap"><canvas id="padc"></canvas></div>`;
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
function tipsShow(){const L=$("#tipslist");L.innerHTML="";(PAD.q?TIPS(PAD.q):[]).forEach(t=>{const li=document.createElement("li");li.textContent=t;L.appendChild(li)});$("#tipsbox").hidden=false;$("#pdtips").setAttribute("aria-expanded","true")}
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
  <div class="card"><h2>Progress</h2><p>Unlocked through Day ${S.unlocked} of ${DAYS}. Stars: ${S.stars}.</p><label>Unlock through day: <input id="ud" type="number" min="1" max="${DAYS}" value="${Math.min(S.unlocked+1,DAYS)}"></label><button class="small" id="ub">Unlock</button><button class="small danger" id="rs">Reset all progress</button></div>
  <div class="card"><h2>Change passcode</h2><form><input id="np" type="password" inputmode="numeric" maxlength="6" placeholder="New 4–6 digits" autocomplete="off"></form><button class="small" id="cp">Change passcode</button></div>
  <button class="small" id="help">📱 iPhone setup help</button><button class="small" id="home">⬅ Done</button><p id="msg" class="big"></p>`);
  const m=t=>$("#msg").textContent=t;
  $("#sm").onclick=()=>{S.min.reading=+$("#m-reading").value;S.min.math=+$("#m-math").value;save();m("Saved ✔")};
  $("#ub").onclick=()=>{const n=Math.max(1,Math.min(DAYS,Math.floor(+$("#ud").value)||1));S.unlocked=Math.max(S.unlocked,n);save();settingsArea();$("#msg").textContent="Unlocked through Day "+S.unlocked+" ✔"};
  $("#rs").onclick=()=>{if(confirm("Erase all progress? (The passcode stays.)")){S.done={};S.unlocked=1;S.stars=0;S.badges=[];save();m("Progress reset.")}};
  $("#cp").onclick=async()=>{const v=$("#np").value;if(!/^\d{4,6}$/.test(v))return m("Please use 4–6 digits.");S.hash=await hash(v);save();m("Passcode changed ✔")};
  $("#help").onclick=help;$("#home").onclick=home}
function help(){h(`<h1>iPhone setup help</h1><div class="card"><h2>1. Add to Home Screen</h2><ol><li>Open the app's web address in <b>Safari</b>.</li><li>Tap the <b>Share</b> button (the square with an arrow).</li><li>Tap <b>Add to Home Screen</b>, then <b>Add</b>.</li><li>Open it once from the Home Screen while online so it saves itself for offline use.</li></ol></div>
<div class="card"><h2>2. Lock the phone to this app (Guided Access)</h2><ol><li>Open <b>Settings</b>.</li><li>Tap <b>Accessibility</b>.</li><li>Scroll down and tap <b>Guided Access</b>.</li><li>Turn <b>Guided Access</b> on.</li><li>Tap <b>Passcode Settings</b> → <b>Set Guided Access Passcode</b>, and enter a passcode (you can also turn on Face ID or Touch ID).</li><li>Optional: set a <b>Time Limit</b>.</li><li>Open <b>Study Buddy</b> from the Home Screen.</li><li><b>Triple-click the side button</b> (or the Home button on older iPhones), then tap <b>Start</b>.</li><li>To end: triple-click again, enter the Guided Access passcode, and tap <b>End</b>.</li></ol></div>
<div class="card"><h2>Privacy</h2><p>No accounts, ads, trackers, or internet use after install. The learner's progress stays on this phone. Clearing Safari website data erases progress and the passcode.</p></div><button class="small" id="b">⬅ Back</button>`);$("#b").onclick=settingsArea}
if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("service-worker.js").catch(()=>{});
document.addEventListener("submit",e=>e.preventDefault());
home();
