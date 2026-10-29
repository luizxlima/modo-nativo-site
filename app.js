document.documentElement.classList.add('js');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(e=>observer.observe(e));
const progress=document.getElementById('progress');function onScroll(){const d=document.documentElement;progress.style.width=(d.scrollTop/(d.scrollHeight-d.clientHeight)*100||0)+'%'}addEventListener('scroll',onScroll,{passive:true});onScroll();
document.querySelectorAll('.wave').forEach(w=>{for(let i=0;i<31;i++){let b=document.createElement('b');b.style.height=(8+Math.sin(i*2.3)**2*24)+'px';b.style.animationDelay=(-i*.11)+'s';w.append(b)}});
document.querySelectorAll('.tilt').forEach(el=>el.addEventListener('pointermove',e=>{if(reduce||e.pointerType==='touch')return;let r=el.getBoundingClientRect();el.style.setProperty('--x',e.clientX-r.left+'px');el.style.setProperty('--y',e.clientY-r.top+'px')}));
const steps=[['Entenda o contexto.','Conheça as frases e o vocabulário que você vai praticar. O inglês começa a fazer sentido em situações do dia a dia.','etapa-1-leia-v2.webp','Leia'],['Ouça com atenção.','Escute os sons, o ritmo e a entonação. Antes de repetir, dê aos seus ouvidos a chance de reconhecer a frase.','etapa-2-ouca-v2.webp','Ouça'],['Coloque sua voz em ação.','Repita em voz alta e pratique a pronúncia. A plataforma oferece correção para ajudar você a continuar treinando.','etapa-3-fale-v2.webp','Fale'],['Transforme frases em prática.','Escreva usando o que acabou de aprender e receba correção para entender o que pode melhorar.','etapa-4-escreva-v2.webp','Escreva'],['Relembre para avançar.','Retome o que estudou com revisão espaçada. Volte às frases e fortaleça o aprendizado no seu ritmo.','etapa-5-revisao-v2.webp','Revise']];
const tabs=[...document.querySelectorAll('[data-step]')];function selectStep(i){tabs.forEach((t,j)=>{t.setAttribute('aria-selected',j===i);t.tabIndex=j===i?0:-1});document.getElementById('step-num').textContent='PASSO 0'+(i+1);document.getElementById('step-title').textContent=steps[i][0];document.getElementById('step-description').textContent=steps[i][1];const img=document.getElementById('step-image');img.src='assets/'+steps[i][2];img.alt='Etapa '+steps[i][3]+' da plataforma';document.getElementById('lesson-panel').setAttribute('aria-labelledby','tab-'+i)}tabs.forEach((t,i)=>{t.addEventListener('click',()=>selectStep(i));t.addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?4:(i+(e.key==='ArrowRight'?1:4))%5;selectStep(j);tabs[j].focus()}})});selectStep(0);
const listen=document.getElementById('listen'),status=document.getElementById('audio-status');listen.addEventListener('click',()=>{if(!('speechSynthesis'in window)){status.textContent='Exemplo: “You can do this.” — Você consegue.';return}speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance('You can do this.');utterance.lang='en-US';utterance.rate=.8;utterance.onstart=()=>{listen.closest('.listen').classList.add('playing');status.textContent='Ouça e depois repita em voz alta.'};const done=()=>{listen.closest('.listen').classList.remove('playing');status.textContent='Sua vez: “You can do this.”'};utterance.onend=done;utterance.onerror=()=>{done();status.textContent='Áudio indisponível neste navegador.'};speechSynthesis.speak(utterance)});
document.querySelectorAll('.checkout').forEach(a=>{const url=new URL(a.href);const query=new URLSearchParams(location.search);for(const [key,value]of query){if(/^utm_/.test(key)||['src','sck'].includes(key))url.searchParams.set(key,value)}a.href=url.href});
const reviewsTrack=document.getElementById('reviews-track');
if(reviewsTrack){const duplicate=reviewsTrack.firstElementChild.cloneNode(true);duplicate.setAttribute('aria-hidden','true');reviewsTrack.append(duplicate);}
// A single, frame-limited pointer effect covers the whole page.
const light=document.createElement('div');light.className='site-cursor-light';light.setAttribute('aria-hidden','true');document.body.append(light);
const cards=document.querySelectorAll('.review-card,.bonus,.pain-item,.float-card,.practice-panel,.demo,.price-card,.fit-grid article,.faq-list details');
cards.forEach(card=>card.classList.add('cursor-card'));
let pointerX=0,pointerY=0,lightFrame=0,activeCard=null,pointerActive=false;
function paintLight(){
 lightFrame=0;
 if(!pointerActive)return;
 light.style.setProperty('--cursor-x',pointerX+'px');light.style.setProperty('--cursor-y',pointerY+'px');
 const target=document.elementFromPoint(pointerX,pointerY);
 const card=target?.closest('.cursor-card')||null;
 if(card!==activeCard){activeCard?.classList.remove('cursor-lit');activeCard=card;card?.classList.add('cursor-lit');}
 if(card){const r=card.getBoundingClientRect();card.style.setProperty('--light-x',(pointerX-r.left)+'px');card.style.setProperty('--light-y',(pointerY-r.top)+'px');}
}
function queueLight(){if(!lightFrame)lightFrame=requestAnimationFrame(paintLight);}
document.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;pointerX=e.clientX;pointerY=e.clientY;pointerActive=true;light.classList.add('active');queueLight();},{passive:true});
addEventListener('scroll',queueLight,{passive:true});
function hideLight(){pointerActive=false;light.classList.remove('active');activeCard?.classList.remove('cursor-lit');activeCard=null;}
document.documentElement.addEventListener('pointerleave',hideLight);addEventListener('blur',hideLight);
