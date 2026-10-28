"use strict";
// ---------- learner-friendly helpers: read aloud, mascot, path map, confetti, high contrast ----------
const CAN_SPEAK=typeof window!=="undefined"&&"speechSynthesis" in window&&typeof SpeechSynthesisUtterance!=="undefined";
// Turn screen text into words that sound right when read aloud.
function speakText(t){return String(t||"").replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu,"")
  .replace(/_{2,}/g," blank ").replace(/(\d)\s*[−-]\s*(?=\d|blank|\?)/g,"$1 minus ").replace(/\s[−-]\s/g," minus ")
  .replace(/×/g," times ").replace(/÷/g," divided by ").replace(/=\s*\?/g," equals what?").replace(/=/g," equals ").replace(/\+/g," plus ")
  .replace(/</g," is less than ").replace(/>/g," is greater than ").replace(/\s+/g," ").trim()}
let VOICE=null;
function pickVoice(){try{const v=speechSynthesis.getVoices();VOICE=v.find(x=>/^en[-_]US/i.test(x.lang)&&x.localService)||v.find(x=>/^en/i.test(x.lang))||null}catch(e){}}
if(CAN_SPEAK){pickVoice();try{speechSynthesis.onvoiceschanged=pickVoice}catch(e){}}
function SAY(t){if(!CAN_SPEAK)return false;const s=speakText(t);if(!s)return false;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(s);u.rate=.9;u.pitch=1.05;u.lang="en-US";if(VOICE)u.voice=VOICE;speechSynthesis.speak(u);window.LAST_SAID=s;return true}catch(e){return false}}
function hush(){if(CAN_SPEAK)try{speechSynthesis.cancel()}catch(e){}}
if(typeof window!=="undefined")window.SAY=SAY;
// A read-aloud button. It reads the text of the element(s) named in data-for.
function sayBtn(sel,label="🔊 Read to me",id="",aria=""){return CAN_SPEAK?`<button class="say" ${id?`id="${id}"`:""} data-for="${sel}" aria-label="${aria||label.replace(/^\S+\s/,"")}">${label}</button>`:""}
function textFor(sel){return[...document.querySelectorAll(sel)].map(e=>{if(e.matches("button.ans"))return e.textContent+".";if(e.matches("ol,ul"))return[...e.querySelectorAll("li")].map(li=>li.textContent).join(" ");return e.textContent}).join(" ")}
if(typeof document!=="undefined")document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("button.say");if(!b)return;const sel=b.dataset.for;let t=textFor(sel);if(sel.includes("button.ans"))t=t.replace(/^(.*?[.?!:])\s*/,"$1 Choices: ");SAY(t)});
// Buddy the mascot. Short, friendly lines.
const BUDDY={hi:["Hi! I am Buddy. Let's learn! 🐙","Welcome back! I missed you!","Ready for fun? I am!","You are doing great!"],start:["You can do it!","Take your time.","I am here with you."],win:["Hooray! Look at you go!","You did it! High five!","Wow! Your brain is growing!"],day:["A whole day done! I am so proud!","Day done! Let's dance! 🎉"]};
function mascot(msg,mood=""){return`<div class="mascot ${mood}"><span class="mbody" aria-hidden="true">🐙</span><p class="bubble">${msg}</p></div>`}
// The day path: a winding trail from Day 1 to the last day.
function pathMap(days,isU,isD){const C=4,R=Math.ceil(days/C),cur=(()=>{for(let d=1;d<=days;d++)if(isU(d)&&!isD(d))return d;return 0})();
  const pos=d=>{const r=Math.floor((d-1)/C),c=r%2?C-1-(d-1)%C:(d-1)%C;return[r,c]};
  const pts=Array.from({length:days},(_,i)=>{const[r,c]=pos(i+1);return`${(c+.5)*100/C},${(r+.5)*100/R}`}).join(" ");
  const done=Array.from({length:days},(_,i)=>i+1).filter(isD).length;
  let g="";for(let d=1;d<=days;d++){const u=isU(d),dn=isD(d),[r,c]=pos(d);
    g+=`<button class="day ${dn?"done":""} ${d===cur?"here":""}" style="grid-row:${r+1};grid-column:${c+1}" ${u?"":"disabled"} data-day="${d}" aria-label="Day ${d}${dn?", done":u?(d===cur?", you are here":", open"):", locked"}">${d===cur?`<span class="pin" aria-hidden="true">🐙</span>`:""}<span aria-hidden="true">${dn?"✅":u?"⭐":"🔒"}</span><br>Day ${d}</button>`}
  return`<div class="pathwrap"><p class="pathinfo">🚩 ${done} of ${days} days done 🏁</p><div class="bar" role="progressbar" aria-label="Days done" aria-valuemin="0" aria-valuemax="${days}" aria-valuenow="${done}"><span style="width:${done*100/days}%"></span></div>
  <div class="grid path" style="grid-template-rows:repeat(${R},auto)"><svg class="trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}"/></svg>${g}</div></div>`}
// Confetti and stars. Skipped when the device asks for less motion.
const calm=()=>!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);
function confetti(n=40){if(calm())return 0;const box=document.createElement("div");box.className="confetti";box.setAttribute("aria-hidden","true");const cols=["#ffd23f","#ff6b6b","#4cc9f0","#7bd389","#b388ff","#ff9f1c"];
  for(let i=0;i<n;i++){const s=document.createElement("span");s.textContent=i%5===0?"⭐":"";s.style.left=Math.random()*100+"vw";s.style.background=i%5===0?"none":cols[i%cols.length];s.style.animationDelay=(Math.random()*.6)+"s";s.style.animationDuration=(1.6+Math.random()*1.4)+"s";s.style.transform=`rotate(${Math.random()*360}deg)`;box.appendChild(s)}
  document.body.appendChild(box);let left=n;box.addEventListener("animationend",()=>{if(--left<=0)box.remove()});setTimeout(()=>box.remove(),4000);return n}
function applyHC(){if(typeof document==="undefined"||!document.body)return;document.body.classList.toggle("hc",!!(typeof S!=="undefined"&&S.hc))}
const LEARNER_TEXT=Object.values(BUDDY).flat();
