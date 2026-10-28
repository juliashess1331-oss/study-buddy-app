"use strict";
// Grown-up dashboard (behind the passcode): skill accuracy, struggle skills, days done, export.
const DASH=(()=>{
const api={};
const pct=x=>Math.round(x*100);
// Pure: build every number the dashboard shows. ctx = {days, dayDone(d), isDone(d,s,id), req, pid}
api.stats=(S,ctx)=>{const T=SKILL.today(),keys=Object.keys(SKILL.NAMES);
  const skills=keys.map(k=>{const R=S.sk&&S.sk[k],a=SKILL.accuracy(S,k)||{r:0,n:0,pct:0,sessions:0},last=R&&R.h.length?R.h[R.h.length-1]:null;
    return{k,name:SKILL.name(k),subject:k.split(":")[0],sessions:a.sessions,n:a.n,r:a.r,pct:a.n?pct(a.pct):null,mastered:!!(R&&R.m),
      trend:R?R.h.slice(-5).map(x=>x.n?pct(x.r/x.n):0):[],lastPct:last&&last.n?pct(last.r/last.n):null,lastN:last?last.n:0,
      review:R&&R.due!==null&&R.due!==undefined?Math.max(0,R.due-T):null,reviewsDone:!!(R&&R.done)}});
  const struggle=skills.filter(s=>!s.mastered&&s.n>0&&((s.n>=5&&s.pct<70)||(s.lastN>=3&&s.lastPct<60))).sort((a,b)=>a.pct-b.pct);
  const days=[];for(let d=1;d<=ctx.days;d++){const ps=[];let last=0;
    for(const s of ["reading","math"])for(const id of ctx.req[s]){const c=S.comp[ctx.pid(d,s,id)];if(c){ps.push(c);last=Math.max(last,c.t||0)}}
    const tot=ctx.req.reading.length+ctx.req.math.length,n=ps.reduce((a,c)=>a+(c.n||0),0),r=ps.reduce((a,c)=>a+(c.r||0),0);
    days.push({d,done:ctx.dayDone(d),parts:ps.length,of:tot,finished:ctx.dayDone(d)&&last?last:null,pct:n?pct(r/n):null})}
  const N=skills.reduce((a,s)=>a+s.n,0),Rr=skills.reduce((a,s)=>a+s.r,0);
  return{skills,struggle,days,totals:{daysDone:days.filter(x=>x.done).length,days:ctx.days,parts:days.reduce((a,x)=>a+x.parts,0),questions:N,right:Rr,pct:N?pct(Rr/N):null,stars:S.stars||0,badges:(S.badges||[]).length,mastered:skills.filter(s=>s.mastered).length}}};
const q=v=>{const t=String(v===null||v===undefined?"":v);return/[",\n]/.test(t)?`"${t.replace(/"/g,'""')}"`:t};
const day=t=>{if(!t)return"";const x=new Date(t);return`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`};
api.csv=st=>{const L=[["Study Buddy progress"],["Days done",`${st.totals.daysDone} of ${st.totals.days}`],["Questions answered (first try)",st.totals.questions],["Right on first try %",st.totals.pct],["Stars",st.totals.stars],[],
  ["Skill","Subject","Sessions","Questions","Right on first try","Accuracy %","Mastered","Next review in days","Recent sessions %","Needs help"]];
  st.skills.forEach(s=>L.push([s.name,s.subject,s.sessions,s.n,s.r,s.pct,s.mastered?"yes":"no",s.review===null?"":s.review,s.trend.join(" "),st.struggle.includes(s)?"yes":"no"]));
  L.push([],["Day","Parts done","Parts total","Day done","Finished on","Accuracy %"]);st.days.forEach(x=>L.push([x.d,x.parts,x.of,x.done?"yes":"no",day(x.finished),x.pct]));
  return L.map(r=>r.map(q).join(",")).join("\n")+"\n"};
api.day=day;
return api})();
// ---------- dashboard screen (only opened from Grown-up / Settings) ----------
function dashCtx(){return{days:DAYS,dayDone,req:STORE.REQ,pid:STORE.pid}}
function dashboard(){const st=DASH.stats(S,dashCtx()),T=st.totals,bar=v=>v===null?"—":`<span class="mbar" aria-hidden="true"><span style="width:${v}%"></span></span> ${v}%`;
  const row=s=>`<tr class="${st.struggle.includes(s)?"weak":""}"><th scope="row">${s.name}${s.mastered?" 🏆":""}</th><td>${s.n?bar(s.pct):"Not yet"}</td><td>${s.n}</td><td>${s.trend.length?s.trend.join(" → ")+"%":"—"}</td><td>${s.reviewsDone?"Done":s.review===null?"—":s.review===0?"Today":"In "+s.review+" d"}</td></tr>`;
  const sub=x=>st.skills.filter(s=>s.subject===x).map(row).join("");
  h(`<button class="small" id="dback">⬅ Back to settings</button><h1>📊 Progress dashboard</h1>
  <div class="card dsum"><p><b>${T.daysDone}</b> of ${T.days} days done · <b>${T.parts}</b> parts done</p><p><b>${T.questions}</b> questions answered · <b>${T.pct===null?"—":T.pct+"%"}</b> right on the first try</p><p>⭐ ${T.stars} stars · 🏅 ${T.badges} badges · 🏆 ${T.mastered} skills mastered</p></div>
  <div class="card" id="struggle"><h2>Needs more help</h2>${st.struggle.length?`<ul>${st.struggle.map(s=>`<li><b>${s.name}</b>: ${s.pct}% right on the first try${s.lastPct!==null?` (last session ${s.lastPct}%)`:""}. Try <i>Extra practice → ${s.name}</i>, or the step-by-step helper together.</li>`).join("")}</ul>`:`<p>${T.questions?"No struggle skills right now. 🎉":"No answers yet. Check back after a few parts."}</p>`}</div>
  <div class="card"><h2>Accuracy by skill</h2><p><small>Counts the first try on each question. Mastered = 80%+ over the last two sessions.</small></p>
  <div class="tscroll"><table class="dt"><caption class="sr">Accuracy by skill</caption><thead><tr><th scope="col">Skill</th><th scope="col">First-try right</th><th scope="col">Qs</th><th scope="col">Recent</th><th scope="col">Review</th></tr></thead>
  <tbody><tr class="sec"><th scope="rowgroup" colspan="5">📚 Reading</th></tr>${sub("reading")}<tr class="sec"><th scope="rowgroup" colspan="5">🔢 Math</th></tr>${sub("math")}</tbody></table></div></div>
  <div class="card"><h2>Days</h2><div class="dgrid">${st.days.map(x=>`<div class="dd ${x.done?"done":x.parts?"some":""}" role="img" aria-label="Day ${x.d}: ${x.done?"done"+(x.finished?" on "+DASH.day(x.finished):""):x.parts+" of "+x.of+" parts"}"><b>Day ${x.d}</b><br>${x.done?"✅":x.parts?x.parts+"/"+x.of:"—"}${x.pct!==null?`<br><small>${x.pct}%</small>`:""}</div>`).join("")}</div></div>
  <div class="card"><h2>Export</h2><p><small>A spreadsheet file (CSV) with the numbers above. It has no names or personal info.</small></p><button class="small" id="dcsv">⬇️ Save as spreadsheet (CSV)</button>${navigator.share?`<button class="small" id="dshare">📤 Share</button>`:""}<button class="small" id="dcopy">📋 Copy as text</button><textarea id="dtext" rows="5" readonly aria-label="Progress as text">${esc(DASH.csv(st))}</textarea><p id="dmsg" class="big" aria-live="polite"></p></div>
  <button class="small" id="dback2">⬅ Back to settings</button>`);
  const csv=DASH.csv(st),fname=`study-buddy-progress-${DASH.day(Date.now())}.csv`,m=t=>$("#dmsg").textContent=t;
  $("#dback").onclick=$("#dback2").onclick=settingsArea;
  $("#dcsv").onclick=()=>{try{const u=URL.createObjectURL(new Blob([csv],{type:"text/csv"})),a=document.createElement("a");a.href=u;a.download=fname;a.hidden=true;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);m("Saved ✔ (check Files → Downloads)")}catch(e){m("Could not save. Use Copy as text.")}};
  const sh=$("#dshare");if(sh)sh.onclick=async()=>{try{const f=new File([csv],fname,{type:"text/csv"});if(navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({files:[f],title:"Study Buddy progress"});else await navigator.share({title:"Study Buddy progress",text:csv});m("Shared ✔")}catch(e){if(e&&e.name!=="AbortError")m("Could not share. Use Copy as text.")}};
  $("#dcopy").onclick=async()=>{const t=$("#dtext");t.select();try{await navigator.clipboard.writeText(csv);m("Copied ✔")}catch(e){try{document.execCommand("copy");m("Copied ✔")}catch(_){m("Select the text and copy it.")}}}}
