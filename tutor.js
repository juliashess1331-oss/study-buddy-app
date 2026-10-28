"use strict";
// Step-by-step tutor for multi-digit + and −. The learner does every step.
// The tutor checks each step. It never shows the final answer.
const TUTOR=(()=>{
const PL=["ones","tens","hundreds","thousands","ten thousands","hundred thousands"];
const PN=["one","ten","hundred","thousand","ten thousand","hundred thousand"];
const dg=(n,i)=>Math.floor(n/10**i)%10, len=n=>String(n).length;
const cap=s=>s[0].toUpperCase()+s.slice(1);
const N=s=>Number(String(s).replace(/,/g,""));
// Turn a question into a tutor job, or null.
function parse(q){const t=(q&&q.q||"").replace(/,/g,"").trim();let m,job=null;
  if(m=t.match(/^(\d+)((?: \+ \d+)+) = \?$/)){const nums=[+m[1],...m[2].split(" + ").slice(1).map(Number)];job={op:"+",nums}}
  else if(m=t.match(/^(\d+) − (\d+) = \?$/))job={op:"−",nums:[+m[1],+m[2]]};
  else if(m=t.match(/^(\d+) \+ __ = (\d+)$/))job={op:"−",nums:[+m[2],+m[1]],note:`To find the missing number, start with ${m[2]}. Take away ${m[1]}.`};
  else if(m=t.match(/^(\d+) − __ = (\d+)$/))job={op:"−",nums:[+m[1],+m[2]],note:`To find the missing number, start with ${m[1]}. Take away ${m[2]}.`};
  if(!job||job.nums.length>4||Math.max(...job.nums)<10||job.nums.some(x=>!Number.isSafeInteger(x)))return null;
  if(job.op==="−"&&job.nums[0]<job.nums[1])return null;return job}
// Build the list of steps. Each step: {col,kind,prompt,expect,hint,set:[[row,col,value]]}
function plan(job){const{op,nums}=job,steps=[];const n=Math.max(...nums.map(len));
  if(op==="+"){let carry=0;
    for(let i=0;i<n;i++){const ds=nums.filter(x=>len(x)>i||i===0).map(x=>dg(x,i));const parts=ds.slice();if(carry)parts.push(carry);
      const sum=parts.reduce((a,b)=>a+b,0),P=PL[i];
      if(parts.length===1){steps.push({col:i,kind:"num",prompt:`${cap(P)} column. Only ${parts[0]} is here. What do you write below?`,expect:sum,hint:`Just bring the digit down.`,set:[["ans",i,sum]]})}
      else{steps.push({col:i,kind:"num",prompt:`${cap(P)} column. Add ${parts.join(" + ")}${carry?` (the ${carry} is carried)`:""}. What do you get?`,expect:sum,hint:sum>9&&ds.some(d=>d>=5)?`Try making a ten first. Then add what is left.`:`Count on from the bigger number. Use your fingers.`,set:[]});
        if(sum<10)steps[steps.length-1].set=[["ans",i,sum]];
        else{steps.push({col:i,kind:"num",prompt:`${sum} is 10 or more. Write only its ones digit below. Which digit?`,expect:sum%10,hint:`Look at the right side of ${sum}.`,set:[["ans",i,sum%10]]});
          const last=i===n-1;steps.push({col:i,kind:"num",prompt:last?`There are no more columns. The tens of ${sum} go in a new column. What do you write?`:`${sum} has tens in it. Carry them to the ${PL[i+1]}. What do you carry?`,expect:Math.floor(sum/10),hint:`How many full tens fit in ${sum}?`,set:last?[["ans",i+1,Math.floor(sum/10)]]:[["mark",i+1,Math.floor(sum/10)]]})}}
      carry=sum>9?Math.floor(sum/10):0}}
  else{const[a,b]=nums;const T=[...Array(n)].map((_,i)=>dg(a,i)),B=[...Array(n)].map((_,i)=>dg(b,i));
    const top=i=>T.slice(i+1).every(x=>x===0);
    for(let i=0;i<n;i++){const P=PL[i];
      if(i>0&&i>=len(b)&&T[i]===0&&top(i)){steps.push({col:i,kind:"ok",prompt:`The top digit in the ${P} is now 0. Nothing is left here. We do not write a 0 in front.`,set:[]});continue}
      steps.push({col:i,kind:"yn",prompt:`${cap(P)} column. Top is ${T[i]}. Bottom is ${B[i]}. Can you take ${B[i]} away from ${T[i]}?`,expect:T[i]>=B[i]?"yes":"no",hint:`Is the top number at least as big as the bottom one?`,set:[]});
      if(T[i]<B[i]){let j=i+1;while(T[j]===0){steps.push({col:j,kind:"ok",prompt:`The ${PL[j]} digit is 0. It has nothing to lend. Look one more place to the left.`,set:[]});j++}
        steps.push({col:j,kind:"num",prompt:`Borrow from the ${PL[j]}. Cross out the ${T[j]}. What is 1 less than ${T[j]}?`,expect:T[j]-1,hint:`Count back by one.`,set:[["mark",j,T[j]-1]]});T[j]--;
        for(let k=j-1;k>i;k--){steps.push({col:k,kind:"num",prompt:`The 0 in the ${PL[k]} gets 10. Then it lends 1 to the right. What is 10 − 1?`,expect:9,hint:`Count back one from 10.`,set:[["mark",k,9]]});T[k]=9}
        steps.push({col:i,kind:"num",prompt:`The ${P} top digit gets 10 more. What is 10 + ${T[i]}?`,expect:T[i]+10,hint:`Start at 10. Count on ${T[i]}.`,set:[["mark",i,T[i]+10]]});T[i]+=10}
      const df=T[i]-B[i];
      steps.push({col:i,kind:"num",prompt:B[i]===0?`What is ${T[i]} − 0?`:`What is ${T[i]} − ${B[i]}?`,expect:df,hint:B[i]===0?`Taking away 0 leaves the same number.`:`Count up from ${B[i]} to ${T[i]}. Count your jumps.`,set:[["ans",i,df]]});
      if(df===0&&i===n-1&&i>0&&steps.some(s=>s.set.some(x=>x[0]==="ans"&&x[1]<i&&true)))steps.push({col:i,kind:"ok",prompt:`That 0 is in front. We do not write it.`,set:[["ans",i,""]]})}}
  steps.push({col:-1,kind:"end",prompt:`You did every step! Read your answer in the grid. Then type it in the question.`,set:[]});
  return{n:n+(op==="+"?1:0),steps}}
// Read the learner's answer from a finished grid (used by tests).
function gridAnswer(cells){const a=cells.ans;let s="";for(let i=a.length-1;i>=0;i--)if(a[i]!==undefined&&a[i]!=="")s+=a[i];return s.replace(/^0+(?=\d)/,"")}
function apply(cells,st){for(const[r,c,v]of st.set){if(r==="mark"){cells.mark[c]=v}else cells.ans[c]=v}}
// ---------- mini-lessons on other numbers ----------
function rr(seed){seed=seed>>>0||7;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
function lessons(job,seed){const r=rr(seed),ri=(a,b)=>a+Math.floor(r()*(b-a+1));
  const avoid=new Set(job?job.nums.concat(job.op==="+"?[job.nums.reduce((a,b)=>a+b,0)]:[job.nums[0]-job.nums[1]]):[]);
  const pick=(f)=>{for(let g=0;g<200;g++){const v=f();if(!v.some(x=>avoid.has(x)))return v}return f()};
  const L={};
  {const[n]=pick(()=>[ri(2,9)*100+ri(1,9)*10+ri(1,9)]),[m]=pick(()=>[ri(1,9)*100+ri(1,9)*10+ri(0,9)]);
   L.place={title:"Place value",lines:[`Look at ${n}.`,`It has ${dg(n,2)} hundreds.`,`It has ${dg(n,1)} tens.`,`It has ${dg(n,0)} ones.`,`Each place is worth 10 of the place on its right.`],blocks:n,check:{p:`How many tens are in ${m}? Look at the tens digit.`,e:dg(m,1)}}}
  {const[a,b]=pick(()=>[ri(100,899),ri(11,89)]);
   L.lineup={title:"Lining up",lines:[`Write the numbers in columns.`,`Ones go under ones.`,`Tens go under tens.`,`Line up on the right side.`],grid:[a,b,"+"],check:{p:`Line up ${a} and ${b}. Which digit of ${a} sits above the ${dg(b,1)} in ${b}?`,e:dg(a,1)}}}
  {const[a,b]=pick(()=>[ri(21,79),ri(11,19)]);
   L.ones={title:"Start at the ones",lines:[`Always start on the right.`,`That is the ones column.`,`Then move left, one column at a time.`],grid:[a,b,"+"],check:{p:`In ${a} + ${b}, what are the ones? Add ${dg(a,0)} + ${dg(b,0)}.`,e:dg(a,0)+dg(b,0)}}}
  {const[a,b]=pick(()=>{let a,b;do{a=ri(15,69);b=ri(15,29)}while(dg(a,0)+dg(b,0)<10);return[a,b]});const s=dg(a,0)+dg(b,0);
   L.carry={title:"Carrying",lines:[`Look at ${a} + ${b}.`,`Ones: ${dg(a,0)} + ${dg(b,0)} = ${s}.`,`${s} is 1 ten and ${s-10} ones.`,`Write ${s-10} in the ones.`,`Carry the 1 ten to the tens column.`],grid:[a,b,"+"],check:{p:`Now the tens: ${dg(a,1)} + ${dg(b,1)} + the carried 1. What is it?`,e:dg(a,1)+dg(b,1)+1}}}
  {const[a,b]=pick(()=>{let a,b;do{a=ri(41,98);b=ri(12,a-10)}while(dg(a,0)>=dg(b,0));return[a,b]});
   L.borrow={title:"Borrowing",lines:[`Look at ${a} − ${b}.`,`Ones: ${dg(a,0)} is less than ${dg(b,0)}.`,`So borrow 1 ten from the tens.`,`The tens go from ${dg(a,1)} to ${dg(a,1)-1}.`,`The ones go from ${dg(a,0)} to ${dg(a,0)+10}.`],grid:[a,b,"−"],check:{p:`Now the ones are ${dg(a,0)+10}. What is ${dg(a,0)+10} − ${dg(b,0)}?`,e:dg(a,0)+10-dg(b,0)}}}
  {const[a,b]=pick(()=>[ri(2,9)*100,ri(1,9)*10+ri(1,9)]);
   L.zeros={title:"Borrowing across zeros",lines:[`Look at ${a} − ${b}.`,`The ones have 0. The tens have 0 too.`,`So go to the hundreds first.`,`The ${dg(a,2)} hundreds become ${dg(a,2)-1}.`,`The tens get 10. Then they lend 1.`,`So the tens become 9. The ones become 10.`],grid:[a,b,"−"],check:{p:`In ${a} − ${b}, what do the hundreds become after borrowing?`,e:dg(a,2)-1}}}
  {const[a,b]=pick(()=>{const b=ri(12,39),c=ri(11,49);return[b+c,b]});
   L.inverse={title:"Check with the opposite",lines:[`Adding undoes taking away.`,`Say ${a} − ${b} = ${a-b}.`,`Check it: ${a-b} + ${b}.`,`If you get ${a}, you were right!`],check:{p:`Check ${a} − ${b} = ${a-b}. What is ${a-b} + ${b}?`,e:a}}}
  {const[a,b]=pick(()=>[ri(7,9),ri(4,9)]),[c]=pick(()=>[ri(6,9)]);
   L.maketen={title:"Make a ten",lines:[`Look at ${a} + ${b}.`,`${a} needs ${10-a} more to make 10.`,`Take ${10-a} from the ${b}. That leaves ${b-(10-a)}.`,`So ${a} + ${b} is 10 + ${b-(10-a)}.`],check:{p:`How many does ${c} need to make 10?`,e:10-c}}}
  {const[a,b]=pick(()=>[ri(2,7)*10+9,ri(11,39)]);
   L.comp={title:"Make it friendly",lines:[`Look at ${a} + ${b}.`,`${a} is close to ${a+1}.`,`Add ${a+1} + ${b} first. That is easy.`,`Then take 1 away. You added 1 too many.`],check:{p:`What is ${a+1} + ${b}?`,e:a+1+b}}}
  {const[a,b]=pick(()=>[ri(21,59),ri(2,3)*10+ri(1,8)]);const[c,d]=pick(()=>[ri(21,65),ri(2,3)*10]);
   L.line={title:"Number line jumps",lines:[`Look at ${a} + ${b}.`,`Start at ${a}.`,`Jump ${Math.floor(b/10)*10} by tens.`,`Then jump ${b%10} by ones.`,`Where you land is the sum.`],jumps:[a,Math.floor(b/10)*10,b%10],check:{p:`Start at ${c}. Jump ${d}. Where do you land?`,e:c+d}}}
  {const[n]=pick(()=>[ri(1,3)*100+ri(1,4)*10+ri(1,5)]);L.blocks={title:"Base-ten blocks",lines:[`Big squares are hundreds. Sticks are tens. Little cubes are ones.`,`You can trade 1 ten for 10 ones.`,`You can trade 10 ones for 1 ten.`,`Trading does not change the number.`],trade:n,check:{p:`Trade 1 ten of ${n} for ones. How many ones now?`,e:dg(n,0)+10}}}
  const order=!job||job.op==="+"?["place","lineup","ones","carry","maketen","comp","line","inverse","blocks"]:["place","lineup","ones","borrow","zeros","inverse","line","comp","blocks"];
  return order.map(k=>({id:k,...L[k]}))}
// ---------- screen ----------
let T=null;
const $t=s=>document.querySelector("#tutor "+s);
function gridHTML(rows,op,n,cells,cur){let h=`<table class="tgrid" aria-label="Place value grid"><tr><th></th>${[...Array(n)].map((_,k)=>`<th class="${n-1-k===cur?"cur":""}">${PL[n-1-k].replace("ten thousands","10 thou.")}</th>`).join("")}</tr>`;
  if(cells)h+=`<tr class="mark"><td></td>${[...Array(n)].map((_,k)=>{const c=n-1-k,v=cells.mark[c];return`<td class="${c===cur?"cur":""}">${v===undefined?"":v}</td>`}).join("")}</tr>`;
  rows.forEach((x,ri)=>{h+=`<tr><td class="op">${ri===rows.length-1?op:""}</td>${[...Array(n)].map((_,k)=>{const c=n-1-k,show=len(x)>c;const struck=cells&&ri===0&&op==="−"&&cells.mark[c]!==undefined;return`<td class="${c===cur?"cur":""}${struck?" x":""}">${show?dg(x,c):""}</td>`}).join("")}</tr>`});
  if(cells)h+=`<tr class="ans"><td class="op">=</td>${[...Array(n)].map((_,k)=>{const c=n-1-k,v=cells.ans[c];return`<td class="${c===cur?"cur":""}">${v===undefined?"":v}</td>`}).join("")}</tr>`;
  return h+"</table>"}
function blocksHTML(h,t,o){const sq=`<span class="bh" aria-hidden="true"></span>`,st=`<span class="bt" aria-hidden="true"></span>`,cu=`<span class="bo" aria-hidden="true"></span>`;
  return`<div class="blocks" aria-label="${h} hundreds, ${t} tens, ${o} ones"><div>${sq.repeat(h)}</div><div>${st.repeat(t)}</div><div>${cu.repeat(o)}</div><p><b>${h}</b> hundreds · <b>${t}</b> tens · <b>${o}</b> ones</p></div>`}
function keypad(kind){if(kind==="yn")return`<div class="tkeys yn"><button class="tk" data-v="yes">👍 Yes</button><button class="tk" data-v="no">👎 No</button></div>`;
  if(kind==="ok"||kind==="end")return`<button class="go tk" data-v="ok">${kind==="end"?"Back to my question ✔":"OK ➡️"}</button>`;
  return`<div class="tin" aria-live="polite"><span id="tval"></span></div><div class="tkeys">${[1,2,3,4,5,6,7,8,9,"⌫",0,"✔"].map(k=>`<button class="tk" data-v="${k}" aria-label="${k==="⌫"?"Delete":k==="✔"?"Check":k}">${k}</button>`).join("")}</div>`}
function say(t){try{if(window.SAY)window.SAY(t)}catch(e){}}
function render(){const el=document.querySelector("#tutor");if(!el)return;const{job,P,i,cells,tab}=T;
  let h=`<div class="ttop"><b>🧮 Step-by-step helper</b><button id="tx" aria-label="Close helper">✖ Close</button></div><div class="ttabs"><button id="tt1" class="${tab==="steps"?"on":""}">Do it step by step</button><button id="tt2" class="${tab==="learn"?"on":""}">Mini-lessons</button></div><div class="tbody">`;
  if(tab==="steps"){const st=P.steps[i];if(job.note&&i===0)h+=`<p class="tnote">${job.note}</p>`;
    h+=gridHTML(job.nums,job.op,P.n,cells,st.col);
    h+=`<p class="tstep">Step ${Math.min(i+1,P.steps.length)} of ${P.steps.length}</p><p class="tprompt" id="tprompt">${st.prompt}</p><button class="tsay small" id="tsay" aria-label="Read this step out loud">🔊 Read to me</button><div id="tfb" class="fb" aria-live="polite">${T.fb||""}</div>`+keypad(st.kind)}
  else if(T.lesson===null){h+=`<p>Pick a lesson. Each one uses other numbers.</p>`+T.L.map((l,k)=>`<button class="part tl" data-k="${k}">${l.title}</button>`).join("")}
  else{const l=T.L[T.lesson];h+=`<button class="small" id="tlb">⬅ All lessons</button><h2>${l.title}</h2>`+l.lines.map(x=>`<p class="tline">${x}</p>`).join("");
    if(l.grid)h+=gridHTML(l.grid.slice(0,2),l.grid[2],Math.max(len(l.grid[0]),len(l.grid[1])),null,0);
    if(l.blocks)h+=blocksHTML(dg(l.blocks,2),dg(l.blocks,1),dg(l.blocks,0));
    if(l.jumps){const[a,t,o]=l.jumps;h+=`<div class="nline" aria-label="Number line"><span>${a}</span> ➡️ +${t} ➡️ <span>${a+t}</span> ➡️ +${o} ➡️ <span>${a+t+o}</span></div>`}
    if(l.trade){const B=T.blocks;h+=blocksHTML(B[0],B[1],B[2])+`<button class="small" id="tr1" ${B[1]?"":"disabled"}>Trade 1 ten ➡️ 10 ones</button><button class="small" id="tr2" ${B[2]>=10?"":"disabled"}>Trade 10 ones ➡️ 1 ten</button><button class="small" id="tr3" ${B[0]?"":"disabled"}>Trade 1 hundred ➡️ 10 tens</button><p class="tline">The number is still ${B[0]*100+B[1]*10+B[2]}.</p>`}
    h+=`<div class="card"><p class="tprompt" id="tprompt">${l.check.p}</p><div id="tfb" class="fb" aria-live="polite">${T.fb||""}</div>${keypad("num")}</div>`}
  el.innerHTML=h+"</div>";wire()}
function wire(){$t("#tx").onclick=close;$t("#tt1").onclick=()=>{T.tab="steps";T.fb="";T.val="";render()};$t("#tt2").onclick=()=>{T.tab="learn";T.lesson=null;T.fb="";T.val="";render()};
  document.querySelectorAll("#tutor .tl").forEach(b=>b.onclick=()=>{T.lesson=+b.dataset.k;T.fb="";T.val="";const l=T.L[T.lesson];if(l.trade)T.blocks=[dg(l.trade,2),dg(l.trade,1),dg(l.trade,0)];render()});
  const lb=$t("#tlb");if(lb)lb.onclick=()=>{T.lesson=null;T.fb="";render()};
  const tr=(id,f)=>{const b=$t(id);if(b)b.onclick=()=>{f(T.blocks);render()}};
  tr("#tr1",B=>{B[1]--;B[2]+=10});tr("#tr2",B=>{B[2]-=10;B[1]++});tr("#tr3",B=>{B[0]--;B[1]+=10});
  const sb=$t("#tsay");if(sb)sb.onclick=()=>say($t("#tprompt").textContent);
  document.querySelectorAll("#tutor .tk").forEach(b=>b.onclick=()=>press(b.dataset.v));
  const v=$t("#tval");if(v)v.textContent=T.val||""}
function press(k){if(T.tab==="steps"){const st=T.P.steps[T.i];
    if(st.kind==="ok"){apply(T.cells,st);T.i++;T.fb="";T.val="";return render()}
    if(st.kind==="end")return close();
    if(st.kind==="yn")return check(k,st);}
  if(k==="⌫"){T.val=(T.val||"").slice(0,-1);return wire()}
  if(k==="✔"){if(!T.val)return;const v=+T.val;T.val="";if(T.tab==="steps")return check(v,T.P.steps[T.i]);
    const l=T.L[T.lesson];T.fb=v===l.check.e?`<p class="right">✅ Yes! Nice work.</p>`:`<p class="wrong">Not quite. Look at the lesson again. Then try again.</p>`;return render()}
  if((T.val||"").length<3)T.val=(T.val||"")+k;wire()}
function check(v,st){if(String(v)===String(st.expect)){apply(T.cells,st);T.i++;T.fb=`<p class="right">✅ ${["Yes!","Right!","Good job!","You got it!"][T.i%4]}</p>`;T.tries=0}
  else{T.tries=(T.tries||0)+1;T.fb=`<p class="wrong">Not yet. ${st.hint}${T.tries>1?" You can use scratch paper too.":""}</p>`}
  T.val="";render()}
function open(q,seed){const job=parse(q);if(!job)return false;close();
  const el=document.createElement("div");el.id="tutor";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-label","Step-by-step helper");document.body.appendChild(el);
  T={job,P:plan(job),i:0,cells:{mark:[],ans:[]},tab:"steps",lesson:null,L:lessons(job,seed===undefined?(Math.random()*1e9)|0:seed),fb:"",val:""};render();return true}
function close(){const el=document.querySelector("#tutor");if(el)el.remove();T=null}
return{parse,plan,apply,gridAnswer,lessons,open,close,state:()=>T,PL}})();
