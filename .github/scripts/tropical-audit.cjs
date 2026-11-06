const {chromium}=require('playwright');
const fs=require('fs');
const path=require('path');
const BASE='http://127.0.0.1:8765/jack-angello/';
const routes=['','books/','art/','events/','artist/','author/','contact/','media/','books/cashing-in-on-racial-color/','books/minorities-inc/','books/black-power-white-cower-inc/','books/virgins-and-villains/','art/trunk-bay/','art/evening-sail/','art/st-john-overlook/','art/the-fisherman/','art/cinnamon-bay/','404.html'];
const widths=[1440,1024,768,390,375];
const errors=[];const broken=new Set();fs.mkdirSync('screenshots',{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined,args:['--no-sandbox']});
 try{
  for(const width of widths){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',deviceScaleFactor:1});
   for(const route of routes){
    const page=await context.newPage();
    page.on('pageerror',err=>errors.push(route+' '+width+' JS: '+err.message));
    const res=await page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:30000});
    if(!res || res.status()>=400)errors.push(route+' '+width+' HTTP '+(res?.status()??'no response'));
    await page.waitForTimeout(300);
    const data=await page.evaluate(()=>{
      document.querySelectorAll('img[loading="lazy"]').forEach(x=>x.loading='eager');
      return {overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,head:!!document.querySelector('.site-header'),footer:!!document.querySelector('.colophon'),css:getComputedStyle(document.querySelector('.site-header')||document.body).backgroundColor,images:[...document.images].map(x=>({url:x.getAttribute('src'),complete:x.complete,wide:x.naturalWidth})),links:[...document.querySelectorAll('a[href^="/jack-angello/"]')].map(x=>x.getAttribute('href'))};
    });
    if(data.overflow>3)errors.push(route+' '+width+' overflow '+data.overflow+'px');
    if(!data.head||!data.footer)errors.push(route+' '+width+' shared shell missing');
    await page.waitForTimeout(350);
    for(const img of data.images){
      if(!img.url?.includes('/assets/'))continue;
      const result=await page.locator('img[src="'+img.url+'"]').first().evaluate(x=>({complete:x.complete,natural:x.naturalWidth}));
      if(result.complete&&result.natural===0)errors.push(route+' '+width+' broken image '+img.url);
    }
    if(width===1440)for(const l of data.links)broken.add(l);
    if((width===1440||width===390)&&['','books/','art/','events/','artist/','author/','contact/','books/cashing-in-on-racial-color/','art/trunk-bay/'].includes(route)){let label=route.replaceAll('/','-')||'home';await page.screenshot({path:'screenshots/'+label+'-'+width+'.png',fullPage:true});}
    if(width===390&&['','books/','art/','contact/'].includes(route)){
      const toggle=page.locator('.nav-toggle');
      if(await toggle.isVisible()){
       await toggle.click();
       if(await toggle.getAttribute('aria-expanded')!=='true')errors.push(route+' mobile menu did not open');
       await toggle.click();
       if(await toggle.getAttribute('aria-expanded')!=='false')errors.push(route+' mobile menu did not close');
      }
    }
    console.log('PASSVIEW',width,route||'home','overflow',data.overflow,'images',data.images.length);
    await page.close();
   }
   await context.close();
  }
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const request=ctx.request;
  for(const l of broken){const r=await request.get('http://127.0.0.1:8765'+l);if(r.status()>=400)errors.push('Broken internal route '+l+' HTTP '+r.status());}
  const bg=await request.get(BASE+'assets/tropical-sunset.webp');if(bg.status()!==200)errors.push('Background asset HTTP '+bg.status());
  const home=await ctx.newPage();await home.goto(BASE);if(await home.locator('.home-book img').count()!==3)errors.push('Home featured book covers != 3');
  const books=await ctx.newPage();await books.goto(BASE+'books/');if(await books.locator('.books-feature-cover img').count()!==3)errors.push('Books featured covers != 3');
  await books.locator('#catalog-search').fill('9781961227071');if(await books.locator('[data-book-row]:visible').count()!==1)errors.push('ISBN search failed');
  await ctx.close();
  console.log('AUDIT_RESULT',JSON.stringify({widths,routes:routes.length,links:broken.size,errors},null,2));
 }finally{await browser.close()}
 if(errors.length)process.exit(1);
})().catch(e=>{console.error('AUDIT_CRASH',e);process.exit(1)});
