"use strict";
// Step-by-step method tips. They describe HOW to solve; they never compute the answer.
const TIPS=(()=>{
const N=s=>Number(String(s).replace(/[,$]/g,""));
const PL=["ones","tens","hundreds","thousands"];
const digs=n=>String(n).split("").reverse().map(Number); // [ones,tens,...]
function add(a,b){if(a<=12&&b<=12){const big=Math.max(a,b),sm=Math.min(a,b);return[`Start with the bigger number, ${big}.`,`Count on ${sm} more. Put up a finger for each number you say.`,`The last number you say is the answer.`]}
  const A=digs(a),B=digs(b),n=Math.max(A.length,B.length),s=[`Write ${a} on top and ${b} under it. Line up the ${n>2?"ones, tens, and hundreds":"ones and tens"}.`,`Start in the ones column: add ${A[0]} and ${B[0]}.`,`If the ones make 10 or more, write only the ones digit below. Carry the 1 to the top of the tens column.`,`Now the tens column: add ${A[1]||0} and ${B[1]||0}, plus the 1 if you carried.`];
  if(n>2)s.push(`If the tens make 10 or more, carry the 1 to the hundreds column.`,`Last, the hundreds column: add ${A[2]||0} and ${B[2]||0}, plus any carried 1.`);
  s.push(`Check: your answer should be bigger than ${Math.max(a,b)}.`);return s}
function sub(a,b){if(a<=20)return[`Start at the smaller number, ${b}.`,`Count up until you reach ${a}. Put up a finger for each jump.`,`Count your fingers. That is how far apart the numbers are.`];
  const A=digs(a),B=digs(b),s=[`Write ${a} on top and ${b} under it. Line up the places.`,`Start in the ones column. Look at ${A[0]} (top) and ${B[0]} (bottom).`];
  if(A[0]<B[0]){s.push(`Is ${A[0]} smaller than ${B[0]}? Yes! So you need to borrow.`);
    if(A[1]>0)s.push(`Borrow from the tens: cross out the ${A[1]} in the tens column and write the number that comes just before it on top.`,`Give that ten to the ones: the top ones digit gets 10 more.`);
    else s.push(`The tens digit on top is 0, so you can't borrow from it yet.`,`First borrow from the hundreds: cross out the ${A[2]} and write the number just before it. The 0 in the tens becomes 10.`,`Now borrow from the tens: cross out that 10 and write the number just before it. Give 10 more to the ones.`)}
  else s.push(`Is ${A[0]} smaller than ${B[0]}? No. So you can subtract the ones without borrowing.`);
  s.push(`Subtract the ones column.`);
  if(A.length>2)s.push(`Move to the tens. Use the new top digit if you crossed it out. If the top tens digit is smaller than ${B[1]||0}, borrow from the hundreds.`,`Subtract the tens, then subtract the hundreds.`);
  else s.push(`Move to the tens. Use the new top digit if you crossed it out. Subtract ${B[1]||0} from it.`);
  s.push(`Check: add your answer to ${b}. You should get ${a}.`);return s}
function mul(a,b){const big=Math.max(a,b),sm=Math.min(a,b);
  if(sm===0)return[`${a} × ${b} means ${a} groups of ${b}.`,`Picture it. How many things are in that many groups of ${b}?`,`Draw it on your scratch paper to check.`];
  if(big<=12)return[`${a} × ${b} means ${a} groups of ${b}.`,`Skip count by ${big}, ${sm} time${sm===1?"":"s"}. Keep track on your fingers.`,`Or draw an array: ${sm} row${sm===1?"":"s"} with ${big} dots in each. Count all the dots.`];
  if(big%10===0&&sm<=9){const t=big/10;return[`${big} is the same as ${t} tens.`,`First find the fact ${sm} × ${t}. Use skip counting if you need to.`,`That many tens is your answer. Put a 0 on the end of the fact answer.`]}
  const T=Math.floor(big/10)*10,O=big%10;
  if(O===0)return mul(sm,big);
  return[`Break ${big} into tens and ones: ${T} and ${O}.`,`Multiply the tens: ${T} × ${sm}. (Think ${T/10} × ${sm}, then put a 0 on the end.)`,`Multiply the ones: ${O} × ${sm}.`,`Add the two parts together. Use column addition.`]}
function div(a,b){if(a===0)return[`Think of the times fact: ${b} × ? = 0.`,`What number of groups of ${b} makes 0 in all?`];
  return[`${a} ÷ ${b} asks: how many groups of ${b} make ${a}?`,`Think of the times fact: ${b} × ? = ${a}.`,`Skip count by ${b} until you say ${a}. Count how many skips you made.`]}
function arith(q){const t=q.replace(/[$,]/g,"").match(/(\d+) ([+−×÷]) (\d+) = \?/);if(!t)return null;const a=+t[1],b=+t[3];
  return{"+":add,"−":sub,"×":mul,"÷":div}[t[2]](a,b)}
function place(q){let m;
  if(m=q.match(/^Round ([\d,]+) to the nearest (ten|hundred)\./)){const n=N(m[1]),D=digs(n),i=m[2]==="ten"?1:2,s=[`Find the ${PL[i]} digit. In ${m[1]} it is ${D[i]}.`,`Look at the digit just to its right: ${D[i-1]}.`,`Is ${D[i-1]} a 5 or bigger? Then the ${PL[i]} digit goes up to the next number. Is it 4 or less? Then the ${PL[i]} digit stays the same.`];
    if(D[i]===9&&D[i-1]>=5)s.push(`The ${PL[i]} digit is 9. Going up makes it 0, and the ${PL[i+1]} digit goes up to the next number.`);
    s.push(`Change every digit to the right of the ${PL[i]} place to 0.`,`Keep the digits on the left the same${D[i]===9&&D[i-1]>=5?" (except the digit that went up)":""}.`);return s}
  if(m=q.match(/what is the VALUE of the (\d) in the (\w+) place\?/))return[`Find the ${m[1]} that is in the ${m[2]} place.`,`Say the places from the right: ones, tens, hundreds, thousands.`,`To get the value, write the digit, then add a 0 for each place to its right.`,`Ones: no zeros. Tens: 0 after it. Hundreds: 00 after it. Thousands: 000 after it.`];
  if(/^Which number is GREATER\?/.test(q))return[`Both numbers have 4 digits, so start at the left.`,`Compare the thousands digits. The bigger digit means the bigger number.`,`If the thousands digits are the same, compare the hundreds. Then the tens. Then the ones.`];
  if(/^[\d,]+( \+ [\d,]+){1,3} = \?$/.test(q)&&q.includes(",000"))return[`Each part shows a place: thousands, hundreds, tens, and ones.`,`Write the thousands digit first. Then the hundreds digit, the tens digit, and the ones digit.`,`If a place is missing, write a 0 in that place.`,`Read your number. It should have 4 digits.`];
  return null}
function measure(q){let m;
  if(m=q.match(/(\d+) cm long and (\d+) cm wide\. What is its PERIMETER/))return[`Perimeter is the distance all the way around.`,`A rectangle has 4 sides: ${m[1]}, ${m[2]}, ${m[1]}, and ${m[2]}.`,`Add all 4 sides: ${m[1]} + ${m[2]} + ${m[1]} + ${m[2]}.`,`Tip: add the two long sides, then the two short sides, then add those together.`];
  if(m=q.match(/(\d+) feet long and (\d+) feet wide\. What is its AREA/))return[`Area is how many squares cover the inside.`,`Picture ${m[1]} rows with ${m[2]} squares in each row.`,`Multiply length × width: ${m[1]} × ${m[2]}.`,`Use skip counting by ${m[2]} if you need to.`];
  if(m=q.match(/inches are in (\d+) feet/))return[`1 foot = 12 inches.`,`${m[1]} feet means ${m[1]} groups of 12.`,`Multiply ${m[1]} × 12, or skip count by 12, ${m[1]} times.`];
  if(m=q.match(/How many (\w+) are in (\d+) (\w+)\?/)){const r={centimeters:"1 meter = 100 centimeters",grams:"1 kilogram = 1,000 grams",minutes:"1 hour = 60 minutes"}[m[1]],per=r.split("= ")[1].split(" ")[0];return[`${r}.`,`${m[2]} ${m[3]} means ${m[2]} groups of ${per}.`,`Multiply ${m[2]} × ${per}.${per==="60"?` Think ${m[2]} × 6, then put a 0 on the end.`:" Think of the fact, then add the zeros."}`]}
  if(m=q.match(/starts at (\d+):(\d+)\. It lasts (\d+) minutes/))return[`Start at ${m[1]}:${m[2]} on a clock.`,`Count on ${m[3]} minutes by 5s. Each jump of 5 minutes moves to the next number on the clock.`,`If the minutes reach 60, the hour goes up to the next number and the minutes start again at :00.`,`Look at each choice. Which time did you land on?`];
  return null}
const GEOT=[[/corner of a square|smaller than a right angle|larger than a right angle/,["Draw a square on your scratch paper. Look closely at its square corner.","Draw an angle more closed than that corner. Then draw an angle more open than it.","Read the clue again. Match it to the angle you drew."]],
 [/never meet|cross to make square corners/,["Draw two lines that never touch, like train tracks.","Draw two lines that cross and make square corners, like a plus sign.","Say what each choice word means. Which picture matches the clue?"]],
 [/one pair of parallel sides/,["Parallel sides never meet, like train tracks.","Draw each choice shape on your scratch paper.","Count the pairs of parallel sides in each shape. Find the shape with exactly a single pair."]],
 [/How many sides does an? (\w+) have/,["The beginning of a shape word is a clue to how many sides it has.","Draw the shape, or picture where you have seen it.","Count the sides. Make a tally mark for each side so you don't count twice."]],
 [/all three sides equal/,["Equal sides are all the same length.","Think about what each choice word means.","Pick the triangle name that means all sides match."]],
 [/vertices|edges/,["Draw a cube: two squares, then connect their matching corners with lines.","Vertices are the corners. Edges are the straight lines where faces meet.","Count them carefully. Make a tally mark for each."]],
 [/cut into 4 equal parts and 3 are shaded/,["The bottom number of a fraction tells how many equal parts in all.","The top number tells how many parts are shaded.","Find the choice with the shaded parts on top and all the parts on the bottom."]],
 [/same as 1\/2/,["Draw a bar and shade half of it.","Draw a same-size bar for each choice and shade it.","Which drawing's shading covers exactly the same amount as half?"]],
 [/fraction is larger/,["Draw a same-size bar for each fraction and shade it.","When the bottom numbers are the same, more shaded parts means bigger.","Compare your drawings. Which choice has the most shaded?"]],
 [/lines of symmetry/,["A line of symmetry folds a shape so both halves match.","Draw a square. Try a fold line up and down, side to side, and corner to corner.","Count every fold line that makes matching halves."]]];
function geo(q){for(const [re,s] of GEOT)if(re.test(q))return s;return null}
function words(q,ctx){const w=ctx||q;let m;
  if(/How many more/.test(w)&&!ctx)return [`Find what is asked: "How many more?"`,`"How many more" means compare two numbers. So subtract: bigger minus smaller.`,...(arith(q.replace(/.*collected (\d+) cans on Monday and (\d+).*/,"$1 − $2 = ?"))||[])];
  if(m=q.match(/has (\d+) rows with (\d+) carrots/))return[`Find what is asked: how many carrots in all.`,`Every row has the same number. Equal groups means multiply.`,`Multiply rows × carrots in each row: ${m[1]} × ${m[2]}.`,...mul(+m[1],+m[2]).slice(1)];
  if(m=q.match(/^(\d+) campers split into (\d+) equal teams/))return[`Find what is asked: how many on each team.`,`Splitting into equal teams means divide.`,...div(+m[1],+m[2])];
  if(m=q.match(/carried (\d+) people in the morning and (\d+) in the afternoon/))return[`Find what is asked: how many in all.`,`"In all" means put together. So add.`,...add(+m[1],+m[2])];
  return null}
function process(q,ctx){if(/What should we do first\?/.test(q))return[`Read the story again. Find what it asks at the end.`,`Ask: what happens first in the story? What happens next?`,`You can't add the new ones until you know how many there were at the start.`,`Look at each plan. Which plan finds that starting amount?`];
  if(/To share .* equally .* we…/.test(q))return[`"Share equally" means split a total into equal groups.`,`Think: which operation makes equal groups from a total?`,`Check your choice: would every friend get the same amount?`];
  const a=arith(q);if(a)return[`This is just a single step of the puzzle. Solve just this step.`,...a];return null}
function reading(q){let m;
  if(m=q.match(/^What does “(\w+)” mean\?/))return[`Say the word “${m[1]}” out loud. Where have you heard it before?`,`Say a sentence with “${m[1]}” in it.`,`Try each choice in place of the word. Which choice keeps the sentence making sense?`];
  if(/^Context clue!/.test(q))return[`Read the sentence and skip the blank.`,`Look for clue words around the blank. They tell what kind of word fits.`,`Read the sentence again with each choice. Pick the choice that sounds right and makes sense.`];
  if(m=q.match(/SYNONYM \(same\) for “(\w+)”/))return[`A synonym means the SAME, or almost the same.`,`Think about what “${m[1]}” means.`,`Try each choice in a sentence instead of “${m[1]}”. Does the meaning stay the same?`,`Watch out! One choice might mean the opposite.`];
  if(m=q.match(/ANTONYM \(opposite\) of “(\w+)”/))return[`An antonym means the OPPOSITE.`,`Think about what “${m[1]}” means.`,`Think: which choice means the reverse of that?`,`Watch out! One choice might mean the same thing.`];
  if(m=q.match(/^The (prefix|suffix|root) "([\w-]+)" in "(\w+)"/))return[`A ${m[1]} is a word part. ${m[1]==="prefix"?"It goes at the front of a word.":m[1]==="suffix"?"It goes at the end of a word.":"It is the main part of a word."}`,`Think of other words you know with "${m[2]}" in them.`,`What do those words have in common? That shared meaning is the clue.`,`Try each choice with "${m[3]}". Which choice makes sense?`];
  if(/^Which word means "/.test(q))return[`Look at each choice. Find its base word.`,`Now look at the word parts on the front or the end, like re-, un-, in-, -er, -ful, -less, or -able.`,`Ask what each word part means. Which choice matches the meaning in quotes?`];
  if(/^"Unbreakable" means/.test(q))return[`Break the word into parts: un + break + able.`,`Say what each part means.`,`Put the meanings together. Which choice matches?`];
  if(/is the opposite of…$/.test(q))return[`Look at the start of the word. Is there a prefix?`,`Think about what that prefix means.`,`Take the prefix off. What word is left? Use that clue to choose.`];
  if(m=q.match(/Here, (\w+) means…/))return[`“${m[1]}” has more than a single meaning.`,`Read the sentence again. Look at the other words around “${m[1]}”.`,`Picture what is happening in the sentence.`,`Try each choice in place of “${m[1]}”. Which choice makes sense here?`];
  const k=(q.match(/^([A-Z][\w ]+?): /)||[])[1];
  const R={"Main idea":[`The main idea is what the WHOLE story is mostly about.`,`Close the scratch paper and tap “Peek at the story”. Read the title and the first and last parts again.`,`Think: does this choice fit the whole story, or just a small part?`,`Cross out choices that are only small details or not in the story.`],
   "Inference":[`An inference is a smart guess. The story gives clues but does not say it right out.`,`Reread the part of the story that the question is about.`,`Look for clue words: what characters say, do, and feel.`,`Clues + what you already know = your answer. Pick the choice the clues support.`],
   "Sequence":[`Sequence means the order things happen.`,`Find the key words in the question, like “first”, “after”, or “last”.`,`Reread that part of the story. Look for time words like first, then, next, and finally.`,`Put your finger on the event in the question. What happens right before or after it?`],
   "Cause and effect":[`A cause is WHY something happens. The effect is WHAT happens.`,`Find the effect named in the question.`,`Reread that part of the story. Look for clue words like because, so, and since.`,`Pick the choice the story says made it happen.`],
   "Vocabulary":[`Find the word in the story. Reread the whole sentence around it.`,`Look for context clues in the sentences before and after.`,`Try each choice in place of the word. Which choice makes the sentence make sense?`],
   "Detail":[`A detail is a small fact in the story.`,`Find the key words in the question.`,`Tap “Peek at the story” and look for those same words.`,`Read that sentence carefully. Then pick the choice that matches it.`],
   "Problem":[`A problem is what goes wrong for the character, or what they need to fix.`,`Reread the beginning of the story. That is often where the problem starts.`,`Think: what was the character trying to fix?`]};
  return R[k]||null}
return function tipsFor(q){const t=q.q.replace(/^Step \d+: /,"");
  return (q.ctx&&process(t,q.ctx))||words(t,q.ctx)||place(t)||measure(t)||geo(t)||arith(t)||reading(t)||[`Read the question slowly. What is it asking?`,`Underline the key words on your scratch paper.`,`Look at every choice before you pick one.`]}
})();
