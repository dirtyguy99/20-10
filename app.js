const wishes = [
 ['Luôn là chính mình','Chúc cậu luôn tự tin với những điều làm nên mình. Không cần trở thành một ai khác, cậu đã đủ đặc biệt để được yêu thương và trân trọng. Chúc mừng 20/10!'],
 ['Một ngày thật dịu dàng','Chúc ngày 20/10 của cậu bắt đầu bằng một nụ cười, có những niềm vui nhỏ ghé qua và khép lại bằng cảm giác bình yên trong lòng.'],
 ['Rạng rỡ như hoa','Mong cậu luôn rạng rỡ theo cách của riêng mình. Dù là ngày nắng hay ngày mưa, vẫn có thật nhiều điều đẹp đẽ chờ cậu phía trước.'],
 ['Yêu thương đủ đầy','Chúc cậu được lắng nghe, được thấu hiểu và được yêu thương bằng những điều chân thành nhất. Không chỉ hôm nay, mà trong mọi ngày của cuộc sống.'],
 ['Bình yên trong tim','Giữa những bận rộn thường ngày, mong cậu luôn tìm được một khoảng trời bình yên, một người để sẻ chia và một lý do để mỉm cười.'],
 ['Cứ ước mơ nhé','Chúc những ước mơ cậu đang ấp ủ có thêm đôi cánh. Mong cậu đủ can đảm để bắt đầu, đủ kiên trì để đi tiếp và luôn có người đồng hành.'],
 ['Thương mình một chút','Hôm nay, hãy dành cho mình một món ngon, một bài hát yêu thích hoặc một buổi chiều thảnh thơi. Cậu xứng đáng được chăm sóc, cả từ chính mình.'],
 ['Nụ cười của cậu','Chúc cậu có thật nhiều ngày vui đến mức quên cả thời gian. Mong nụ cười luôn ở lại trên môi và những điều ấm áp luôn ở lại trong tim.'],
 ['Hạnh phúc giản đơn','Mong hạnh phúc đến với cậu từ những điều rất nhỏ: một lời hỏi han, một cái ôm đúng lúc, một tách trà ấm và những người luôn nhớ đến cậu.'],
 ['Cảm ơn vì có cậu','Cảm ơn cậu vì sự hiện diện, lòng tốt và những điều đẹp đẽ cậu mang đến cho cuộc đời. Chúc ngày 20/10 của cậu ngập tràn những yêu thương xứng đáng.']
];
const svg = document.querySelector('#bouquet');
const ns='http://www.w3.org/2000/svg';
function el(tag,attrs={},parent=svg){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(parent)parent.append(e);return e;}
// Shared satin shading keeps the layered roses light enough for mobile.
const defs=el('defs');
[['velvet','#500a1b','#a40d2d','#d62e49'],['scarlet','#730b24','#c51e3e','#f45a68'],['crimson','#590a20','#b51537','#e8455e'],['fold','#450b1b','#8a0d29','#d33550']].forEach(([name,dark,mid,light])=>{
 const grad=el('radialGradient',{id:`rose-${name}`,cx:'44%',cy:'15%',r:'88%'},defs);
 el('stop',{offset:'0%','stop-color':light},grad);el('stop',{offset:'48%','stop-color':mid},grad);el('stop',{offset:'100%','stop-color':dark},grad);
});
// Uneven petals use soft shading and pink highlights, without dark contour lines.
function drawRose(parent,x,y,size,angle=0,index=null){
 const g=el('g',{transform:`translate(${x} ${y}) rotate(${angle}) scale(${size})`},parent);
 if(index!==null)g.dataset.color='red';
 if(index!==null){g.classList.add('rose');g.setAttribute('role','button');g.setAttribute('tabindex','0');g.dataset.index=index;g.dataset.wish=index%wishes.length;g.setAttribute('aria-label',`Bông hồng ${index+1}: ${wishes[index%wishes.length][0]}`);el('circle',{r:43,fill:'transparent',class:'focus-ring'},g);}
 const p=el('g',{class:'petals'},g);
 const shape=el('g',{transform:`rotate(${Math.sin((index??3)*7)*8}) scale(1 ${.96+Math.sin(index??2)*.04})`},p);
 el('path',{d:'M-35-14L-38-28Q-26-32-22-40L-6-35Q7-43 19-34L32-31Q36-18 43-12L36 3Q43 17 28 24L19 36Q4 33-4 40L-18 31Q-34 30-33 15L-42 4Z',fill:'#640b23'},shape);
 const petals=[
 ['M-38-13Q-45-31-26-36Q-18-41-8-34L4-16Q-8-18-16-8Q-26-5-38-13Z','crimson','M-38-24Q-32-35-23-35L-13-32'],
 ['M-8-34Q4-43 22-35Q38-37 39-19L21-7Q11-15-1-12Z','scarlet','M-5-34Q7-39 21-33Q32-34 36-25'],
 ['M38-25Q48-12 37 5Q46 24 25 31L7 20Q21 12 14-2Q24-13 38-25Z','velvet','M39-18Q44-9 35 4Q42 19 28 27'],
 ['M33 25Q25 40 5 36L-6 42Q-21 35-24 22L-9 10Q0 20 13 14Z','crimson','M27 31Q16 38 5 33L-5 38Q-15 34-19 27'],
 ['M-28 28Q-45 23-36 6Q-44-8-37-21L-20-8Q-26 2-12 12Z','velvet','M-33-14Q-38-4-32 6Q-40 21-28 25'],
 ['M-22-10Q-27-28-12-31Q0-35 9-22L10-9Q-3-12-10 2Z','scarlet','M-22-19Q-22-29-12-28Q-2-33 6-22'],
 ['M5-26Q23-31 28-14Q34-3 23 7L5 5Q12-4-3-9Z','crimson','M9-25Q22-26 25-13Q30-4 23 3'],
 ['M25 3Q35 20 17 25Q6 34-8 23L-3 9Q8 15 12 0Z','scarlet','M25 9Q29 19 16 22Q6 29-4 23'],
 ['M-5 24Q-23 32-30 12Q-36-2-20-10L-7 3Q-13 9-5 24Z','velvet','M-10 25Q-23 26-27 11Q-31 0-21-6'],
 ['M-14-10Q-13-23 1-20Q10-19 14-10L7-3Q-3-7-9 4Z','crimson','M-11-13Q-9-22 1-17L10-10'],
 ['M10-13Q24-5 18 9Q14 19 2 14L1 5Q10 2 6-4Z','scarlet','M13-9Q21-2 15 8Q12 14 5 12'],
 ['M7 14Q-6 25-16 12Q-22 3-13-5L-2 2Q-8 6-1 11Z','fold','M2 16Q-9 19-13 10Q-18 4-12-1']
 ];
 petals.forEach(([d,tone,rim],i)=>{
  el('path',{d,fill:`url(#rose-${tone})`},shape);
  el('path',{d:rim,fill:'none',stroke:i<5?'#f3838d':'#ed6479','stroke-width':1.15,'stroke-linecap':'round',opacity:.8},shape);
 });
 el('path',{d:'M-6-6Q4-13 9-3L3 6-6 4Q-11 1-6-6Z',fill:'url(#rose-fold)'},shape);
 el('path',{d:'M-5-5 3-7 6-2 0 2-5-1Z',fill:'#bb2947',stroke:'#ef7283','stroke-width':.8},shape);
 if(index!==null)el('path',{d:'m27-25 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z',fill:'#ffe3ba',class:'viewed-mark'},g);
 return g;
}
const back=el('g');
// Pale pink florist paper, folded around the flowers.
const papers=[['M132 182 45 273 233 466 310 573 378 442 505 284 442 169 306 227Z','#d9c9c1'],['M96 256 39 341 233 445 277 550 356 480 465 352 495 231 380 264 278 250Z','#eee0d6'],['M124 208 94 347 225 439 305 550 405 393 485 288 404 207 294 263Z','#c4b2ab'],['M99 308 164 266 289 342 414 250 476 340 364 450 326 589 253 606 221 444Z','#f0e1d7'],['M151 356 215 389 286 425 379 372 434 358 356 472 337 597 273 627 249 526 226 461Z','#d6bdb1'],['M154 338 179 411 266 473 275 605 313 628 337 485 422 360 337 402 281 413Z','#f1dfd2']];papers.forEach(([d,fill])=>el('path',{d,fill},back));
el('path',{d:'m175 400 94 80 25 130M407 377l-72 105-21 130',stroke:'#baa195','stroke-width':2,fill:'none'},back);
function sprig(x,y,rot,scale=1){const outer=el('g',{transform:`translate(${x} ${y}) rotate(${rot}) scale(${scale})`},svg);const g=el('g',{class:'sprig'},outer);el('path',{d:'M0 0Q12-80 0-160',fill:'none',stroke:'#789285','stroke-width':2},g);for(let i=0;i<6;i++){const yy=-25-i*23;el('ellipse',{cx:i%2?13:-8,cy:yy,rx:12-i*.7,ry:7,fill:i%2?'#a0b4a4':'#8aab9c',transform:`rotate(${i%2?-28:25} 0 ${yy})`},g);el('path',{d:`M4 ${yy+9} ${i%2?13:-8} ${yy}`,stroke:'#7d9687',fill:'none'},g);}}
sprig(180,340,-55,1);sprig(425,340,62,1);sprig(130,260,-47,.9);sprig(460,250,44,.85);sprig(225,171,-15,.83);sprig(367,179,20,.9);sprig(268,152,-8,.72);
// Baby's-breath sprays at the edge of the bouquet.
let seed=2010;function rand(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
[[131,202],[440,215],[140,319],[423,333],[291,148],[365,161],[196,364],[366,373]].forEach(([x,y])=>{const g=el('g',{},svg);for(let i=0;i<17;i++){let xx=x+(rand()-.5)*54,yy=y+(rand()-.5)*47;el('path',{d:`M${x} ${y+35} ${xx} ${yy}`,stroke:'#829076','stroke-width':.8},g);el('circle',{cx:xx,cy:yy,r:1.5+rand()*1.6,fill:'#eee9d1'},g);}});
const flowers=[[225,186,.81,-18],[291,177,.84,12],[357,191,.87,-11],[173,228,.79,-30],[246,238,.9,20],[321,231,.91,-5],[395,237,.83,19],[133,276,.75,-19],[199,282,.85,10],[276,290,.94,-15],[352,282,.88,24],[428,278,.75,6],[162,337,.79,18],[234,340,.87,-5],[311,345,.87,28],[385,335,.8,-14],[206,386,.75,-12],[275,398,.83,19],[346,385,.76,-19],[325,145,.64,-20]];
// Back flowers are painted first; visual order does not change card order.
const order=[19,...Array.from({length:19},(_,i)=>i)];
order.forEach(i=>{const [x,y,s,a]=flowers[i];drawRose(svg,x,y,s*1.3,a,i)});
sprig(168,391,-75,.5);sprig(401,386,75,.5);
// Satin ribbon with loose tails and a small hanging gift tag.
el('path',{d:'M253 456Q230 505 236 583L257 561 267 582Q260 510 282 467Z',fill:'#8f1730'});
el('path',{d:'M290 466Q304 525 342 592L346 563 365 572Q327 506 310 461Z',fill:'#a6213b'});
el('path',{d:'M282 460C197 402 194 481 271 476C209 515 227 530 282 475C336 525 370 482 303 466C371 426 333 403 285 455Z',fill:'#ba344d'});
el('path',{d:'M280 459Q228 429 231 455Q235 474 276 469M298 461Q344 426 339 450Q336 463 304 468',fill:'none',stroke:'#e0727d','stroke-width':2});
el('ellipse',{cx:289,cy:465,rx:15,ry:12,fill:'#8c2338',transform:'rotate(-12 289 465)'});
const tag=el('g',{transform:'translate(341 471) rotate(14)'});el('path',{d:'M0 0Q15 4 17 20',fill:'none',stroke:'#c5a086'},tag);el('path',{d:'M4 16H51V69H4Z',fill:'#f3e6d4'},tag);const t=el('text',{x:27.5,y:40,'text-anchor':'middle',fill:'#8e4651','font-size':12,'font-family':'Georgia'},tag);t.textContent='for';const t2=el('text',{x:27.5,y:55,'text-anchor':'middle',fill:'#8e4651','font-size':14,'font-family':'Georgia','font-style':'italic'},tag);t2.textContent='you';
const atmosphere=document.querySelector('#atmosphere');
const heartShape='<path d="M16 28C8 22 2 17 2 10a8 8 0 0 1 14-5 8 8 0 0 1 14 5c0 7-6 12-14 18Z"/>';
for(let i=0;i<36;i++){let h=document.createElement('div');h.className=`heart ${i%4===0?'heart-filled':''}`;h.style.cssText=`--x:${rand()*100}%;--size:${9+rand()*25}px;--duration:${14+rand()*16}s;--delay:${-rand()*30}s;--drift:${(rand()-.5)*150}px;--color:${i%3?'#ab4159':'#eb7e96'}`;h.innerHTML=`<svg viewBox="0 0 32 32" fill="${i%4===0?'currentColor':'none'}" stroke="currentColor" stroke-width="1">${heartShape}</svg>`;atmosphere.append(h);}
for(let i=0;i<64;i++){const s=document.createElement('i');s.className=i%5===0?'spark star':'spark';s.style.cssText=`--x:${rand()*100}%;--y:${rand()*100}%;--duration:${2+rand()*4}s;--delay:${-rand()*8}s`;atmosphere.append(s);}
for(let i=0;i<12;i++){const mote=document.createElement('i');mote.className='mote';mote.style.cssText=`--x:${rand()*100}%;--duration:${10+rand()*12}s;--delay:${-rand()*22}s;--drift:${(rand()-.5)*140}px`;atmosphere.append(mote);}
for(let i=0;i<7;i++){const petal=document.createElement('i');petal.className='falling-petal';petal.style.cssText=`--x:${rand()*100}%;--duration:${16+rand()*14}s;--delay:${-rand()*30}s;--drift:${(rand()-.5)*200}px`;atmosphere.append(petal);}
// A short heart trail responds to movement, with no timer loop or mobile overhead.
let lastTrail=0;document.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||dialog.open||celebration.open||matchMedia('(prefers-reduced-motion: reduce)').matches||performance.now()-lastTrail<150||atmosphere.querySelectorAll('.heart-trail').length>=8)return;lastTrail=performance.now();const h=document.createElement('span');h.className='heart-trail';h.style.left=`${e.clientX}px`;h.style.top=`${e.clientY}px`;h.innerHTML=`<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">${heartShape}</svg>`;atmosphere.append(h);h.addEventListener('animationend',()=>h.remove(),{once:true})},{passive:true});
let seen=new Set();try{const saved=JSON.parse(localStorage.getItem('hoa-thuong-seen')||'[]');if(Array.isArray(saved))seen=new Set(saved.filter(n=>Number.isInteger(n)&&n>=0&&n<wishes.length));}catch{}
const dialog=document.querySelector('#card'),celebration=document.querySelector('#celebration');let current=0,opener=null;
let celebrationShown=false,celebrationTimer=null,celebrationReturn=null;
try{celebrationShown=localStorage.getItem('hoa-thuong-surprise-v2')==='shown'}catch{}
function updateSeen(){document.querySelectorAll('.rose').forEach(r=>r.classList.toggle('visited',seen.has(+r.dataset.wish)));document.querySelector('#progress').textContent=seen.size?`Cậu đã mở ${seen.size}/${wishes.length} lời chúc · Yêu thương vẫn còn đây`:`${flowers.length} bông hồng · ${wishes.length} điều dịu dàng`;document.querySelector('#replaySurprise').hidden=seen.size!==wishes.length;try{localStorage.setItem('hoa-thuong-seen',JSON.stringify([...seen]));}catch{}}
function scheduleCelebration(delay=7500){if(seen.size!==wishes.length||celebrationShown||celebrationTimer!==null)return;document.querySelector('#completionNote').hidden=false;celebrationTimer=setTimeout(showCelebration,delay);}
function renderCard(i){current=(i+wishes.length)%wishes.length;document.querySelector('#cardTitle').textContent=wishes[current][0];document.querySelector('#cardMessage').textContent=wishes[current][1];document.querySelector('#cardNumber').textContent=`Lời chúc ${current+1} / ${wishes.length}`;seen.add(current);updateSeen();dialog.scrollTop=0;scheduleCelebration();}
function openCard(i,source){opener=source;renderCard(i);document.querySelector('#flowerTip').classList.remove('visible');if(!dialog.open)dialog.showModal();document.querySelector('#closeCard').focus();}
function closeCard(){dialog.close();if(celebrationTimer!==null){showCelebration();return}opener?.focus();}
document.querySelectorAll('.rose').forEach(r=>{const i=+r.dataset.index;r.addEventListener('click',()=>openCard(+r.dataset.wish,r));r.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openCard(+r.dataset.wish,r)}});r.addEventListener('mouseenter',()=>{const tip=document.querySelector('#flowerTip');const p=flowers[i];tip.style.left=`${(p[0]-25)/5.5}%`;tip.style.top=`${(p[1]-73)/6.1}%`;tip.classList.add('visible')});r.addEventListener('mouseleave',()=>document.querySelector('#flowerTip').classList.remove('visible'));});
document.querySelector('#surprise').addEventListener('click',e=>{let available=wishes.map((_,i)=>i).filter(i=>!seen.has(i));if(!available.length)available=wishes.map((_,i)=>i);openCard(available[Math.floor(Math.random()*available.length)],e.currentTarget)});
document.querySelector('#closeCard').addEventListener('click',closeCard);document.querySelector('#prevCard').addEventListener('click',()=>renderCard(current-1));document.querySelector('#nextCard').addEventListener('click',()=>renderCard(current+1));dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeCard()}});dialog.addEventListener('cancel',e=>{e.preventDefault();closeCard()});
dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight')renderCard(current+1);if(e.key==='ArrowLeft')renderCard(current-1);if(e.key==='Tab'){const a=[...dialog.querySelectorAll('button')],f=a[0],l=a.at(-1);if(e.shiftKey&&document.activeElement===f){e.preventDefault();l.focus()}else if(!e.shiftKey&&document.activeElement===l){e.preventDefault();f.focus()}}});
const cardSvg=document.querySelector('#cardRose');el('path',{d:'M72 145Q62 105 73 63M68 119Q35 119 41 99Q63 95 68 119M69 104Q100 102 101 81Q78 84 69 104',fill:'#78947b',stroke:'#59775e','stroke-width':2},cardSvg);drawRose(cardSvg,71,48,.58,-10);
const celebrationTitle=document.querySelector('#celebrationTitle');
let letterIndex=0; const flightWidth=Math.min(innerWidth*.85,660),flightHeight=Math.min(innerHeight*.7,560);
['Chúc mừng cậu đã nhận','gói đáng iu trọn đờiii <3'].forEach(line=>{const row=document.createElement('span');row.className='celebration-line';row.setAttribute('aria-hidden','true');line.split(' ').forEach(word=>{const wordSpan=document.createElement('span');wordSpan.className='celebration-word';Array.from(word).forEach(char=>{const letter=document.createElement('span');letter.className='celebration-letter';letter.textContent=char;letter.style.cssText=`--dx:${(rand()-.5)*flightWidth}px;--dy:${(rand()-.5)*flightHeight}px;--orbit-x:${(rand()-.5)*480}px;--orbit-y:${(rand()-.5)*430}px;--sweep-x:${(rand()-.5)*320}px;--sweep-y:${(rand()-.5)*300}px;--turn:${(rand()-.5)*300}deg;--spin-x:${180+rand()*360}deg;--spin-y:${180+rand()*540}deg;--delay:${letterIndex++*.012}s`;wordSpan.append(letter)});row.append(wordSpan,document.createTextNode(' '))});celebrationTitle.append(row)});
function showCelebration(){if(seen.size!==wishes.length)return;clearTimeout(celebrationTimer);celebrationTimer=null;if(document.querySelector('#photobooth')?.open)return;celebrationReturn=dialog.open?opener:document.activeElement;if(dialog.open)dialog.close();celebrationShown=true;document.querySelector('#completionNote').hidden=true;try{localStorage.setItem('hoa-thuong-surprise-v2','shown')}catch{}celebration.classList.remove('revealed');if(!celebration.open)celebration.showModal();requestAnimationFrame(()=>requestAnimationFrame(()=>{if(celebration.open)celebration.classList.add('revealed')}));document.querySelector('#closeCelebration').focus();}
function closeCelebration(){celebration.close();celebration.classList.remove('revealed');celebrationReturn?.focus();}
document.querySelector('#closeCelebration').addEventListener('click',closeCelebration);document.querySelector('#backToFlowers').addEventListener('click',closeCelebration);document.querySelector('#replaySurprise').addEventListener('click',showCelebration);celebration.addEventListener('cancel',e=>{e.preventDefault();closeCelebration()});
celebration.addEventListener('keydown',e=>{if(e.key==='Tab'){const buttons=[...celebration.querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
for(let i=0;i<42;i++){const particle=document.createElement('i');particle.className=i%3?'celebration-particle':'celebration-heart';particle.style.cssText=`--x:${rand()*100}%;--duration:${5+rand()*6}s;--delay:${-rand()*11}s;--drift:${(rand()-.5)*160}px;--color:${['#f2a8b6','#d95776','#f5dfae'][i%3]}`;if(i%3===0)particle.innerHTML=`<svg viewBox="0 0 32 32" fill="currentColor">${heartShape}</svg>`;document.querySelector('#confetti').append(particle)}
// One audio element continues through cards and the celebration, looping natively.
const music=document.querySelector('#backgroundMusic');let musicWanted=true;
try{musicWanted=localStorage.getItem('hoa-thuong-music')!=='off'}catch{}
music.volume=.38;
function syncMusic(){document.querySelectorAll('[data-music-toggle]').forEach(button=>{const playing=!music.paused&&!music.ended;button.classList.toggle('is-playing',playing);button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',playing?'Tắt nhạc nền':'Bật nhạc nền');button.title=playing?'Tắt nhạc nền':'Bật nhạc nền'})}
function startMusic(){if(!musicWanted||!music.paused)return;const play=music.play();if(play)play.catch(()=>syncMusic())}
document.querySelectorAll('[data-music-toggle]').forEach(button=>{button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 9h4l5-4v14l-5-4H4Z"/><path class="sound-waves" d="M16 8q4 4 0 8m3-11q7 7 0 14"/><path class="sound-muted" d="m17 9 5 6m0-6-5 6"/></svg>';button.addEventListener('click',()=>{musicWanted=music.paused;if(musicWanted)startMusic();else music.pause();try{localStorage.setItem('hoa-thuong-music',musicWanted?'on':'off')}catch{}syncMusic()})});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('[data-music-toggle]'))startMusic()},{capture:true,passive:true});document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('[data-music-toggle]'))startMusic()},{capture:true});
music.addEventListener('play',syncMusic);music.addEventListener('pause',syncMusic);music.addEventListener('error',syncMusic);syncMusic();
updateSeen();
scheduleCelebration(1000);

// Let the camera session finish before showing an earned surprise.
document.querySelector('#photobooth').addEventListener('close',()=>scheduleCelebration(800));
