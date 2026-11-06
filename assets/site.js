(()=>{'use strict';
const toggle=document.querySelector('.nav-toggle'),nav=document.querySelector('.site-nav');
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close site navigation':'Open site navigation');document.body.classList.toggle('menu-open',open)});nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open')}});document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open')}});}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{const filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('[data-category]').forEach(item=>{item.hidden=Boolean(filter!=='All'&&item.dataset.category!==filter)})}));
const form=document.querySelector('#contact-form');if(form)form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const f=new FormData(form);const body='Name: '+f.get('name')+'\nEmail: '+f.get('email')+'\n\n'+f.get('message');location.href='mailto:info@islandasylum.com?subject='+encodeURIComponent('Island Asylum — '+f.get('subject'))+'&body='+encodeURIComponent(body)});
const purchaseData={}; // Configure verified HTTPS destinations by ISBN: '978...': {url:'https://...',enabled:true}
const editionElements=document.querySelectorAll('[data-edition-isbn]');
const purchase=document.querySelector('#purchase');
function selectEdition(button){editionElements.forEach(el=>{el.setAttribute('aria-selected',String(el===button));el.querySelector('button')?.setAttribute('aria-pressed',String(el===button))});const isbn=button.dataset.editionIsbn;const setting=purchaseData[isbn];purchase.replaceChildren();let url=null;try{if(setting?.enabled){const parsed=new URL(setting.url);if(parsed.protocol==='https:')url=parsed.href}}catch{}if(url){const a=document.createElement('a');a.className='cta';a.textContent='Buy on Ingram ↗';a.href=url;a.rel='noopener noreferrer';a.target='_blank';purchase.append(a)}else{const p=document.createElement('p');p.className='purchase-note';p.textContent='Purchase Link Coming Soon · ISBN '+isbn;purchase.append(p)}}
if(purchase&&editionElements.length){editionElements.forEach(el=>el.querySelector('button')?.addEventListener('click',()=>selectEdition(el)));selectEdition(editionElements[0])}

const siteHeader=document.querySelector('.site-header');
if(siteHeader){let scrollQueued=false;const sync=()=>{siteHeader.classList.toggle('scrolled',window.scrollY>24);scrollQueued=false};sync();window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(sync)}},{passive:true});}
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
if(!reduceMotion.matches){
 const loadScript=url=>new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=url;el.async=true;el.onload=resolve;el.onerror=reject;document.head.append(el)});
 loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js')
 .then(()=>loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js'))
 .then(()=>{
  if(!window.gsap||!window.ScrollTrigger)return;
  const gsap=window.gsap;gsap.registerPlugin(window.ScrollTrigger);
  const head=document.querySelector('.home-lede,.books-lede');
  if(head){
   const targets=head.querySelectorAll('h1,.subline,.intro,p,.home-actions');
   gsap.from(targets,{autoAlpha:0,y:20,duration:.8,stagger:.12,ease:'power2.out',clearProps:'all'});
  }
  const items=[...document.querySelectorAll('.home-books,.home-teaser,.books-feature,.books-secondary,.books-index,.gallery-item,.feature-split,.ledger-row')];
  items.forEach((el,i)=>{
   if(window.matchMedia('(max-width: 780px)').matches)return;
   gsap.fromTo(el,{opacity:.72,y:18},{opacity:1,y:0,duration:.75,ease:'power2.out',clearProps:'all',scrollTrigger:{trigger:el,start:'top 93%',once:true}});
  });
  window.addEventListener('pagehide',()=>{window.ScrollTrigger.getAll().forEach(t=>t.kill())},{once:true});
 }).catch(()=>{/* CSS-only interaction remains usable offline */});
}

})();