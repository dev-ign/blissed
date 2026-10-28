const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const out=process.env.VISUAL_QA_OUTPUT||path.join(process.cwd(),'.visual-qa');
const baseURL=process.env.BOOKING_QA_URL||'http://127.0.0.1:5173';
const sizes=[[320,568],[360,800],[375,667],[390,844],[393,852],[430,932],[768,1024],[1024,768],[1280,800],[1440,900],[1920,1080]];
async function ready(p){await p.goto(baseURL);await p.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled([...document.images].map(i=>{i.loading='eager';return i.decode()}));});}
async function geometry(p){return p.evaluate(()=>{
 const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y+scrollY,width:r.width,height:r.height}};
 const heading=document.querySelector('.hero h1'),hero=document.querySelector('.hero'),content=document.querySelector('.hero-content');
 const range=document.createRange();range.selectNodeContents(heading);const lines=[...range.getClientRects()].filter(r=>r.width>0).map(r=>({left:r.left,right:r.right,top:r.top+scrollY,bottom:r.bottom+scrollY}));
 return{viewport:[innerWidth,innerHeight],scrollWidth:document.documentElement.scrollWidth,hero:rect(hero),heroContent:rect(content),heading:rect(heading),headingLines:lines,
  alignment:Object.fromEntries(['.hero-content','.services-intro','.events-content','.about-content','.service-card-content','.footer-col'].map(s=>[s,getComputedStyle(document.querySelector(s)).textAlign])),
  actions:[...document.querySelectorAll('.booking-button')].filter(e=>e.getClientRects().length).map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{text:e.textContent,radius:s.borderTopLeftRadius,height:r.height,bg:s.backgroundColor,color:s.color,width:r.width}}),
  chapters:[...document.querySelectorAll('.story-step')].map(e=>({key:e.dataset.scene,height:e.getBoundingClientRect().height,focal:getComputedStyle(e.querySelector('img')).objectPosition,copy:rect(e.querySelector('.story-step-copy'))})),
  cards:[...document.querySelectorAll('.service-card')].map(e=>{const r=e.getBoundingClientRect(),c=e.querySelector('.service-card-content').getBoundingClientRect();return{title:e.querySelector('h3').textContent,clipped:c.top<r.top-.5||c.bottom>r.bottom+.5}}),
  overflow:[...document.querySelectorAll('body *')].filter(e=>{if(e.closest('.story-image-wrap,.story-backgrounds')||e.matches('.hero-image,.skip-link'))return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.visibility!=='hidden'&&e.getClientRects().length&&(r.left<-.5||r.right>innerWidth+.5)}).map(e=>({tag:e.tagName,class:e.className})),
 };
});}
function verify(r){const w=r.viewport[0];assert.equal(r.scrollWidth,w,'Horizontal document overflow');assert.deepEqual(r.overflow,[],'Element outside horizontal viewport');assert.ok(r.heroContent.y+r.heroContent.height<=r.hero.y+r.hero.height+1,'Hero copy clipped');assert.ok(r.headingLines.every(x=>x.left>=-3&&x.right<=w+3),'Hero heading clipped');assert.ok(r.actions.every(a=>a.radius==='9999px'&&a.height>=43.9),'Action shape or target regression');assert.ok(r.cards.every(c=>!c.clipped),'Service card content clipped');if(w<768){for(const s of ['.hero-content','.services-intro','.events-content','.about-content'])assert.equal(r.alignment[s],'center');assert.notEqual(r.alignment['.service-card-content'],'center');assert.notEqual(r.alignment['.footer-col'],'center');assert.deepEqual(r.chapters.map(c=>c.focal),['62% 50%','52% 50%','34% 50%']);assert.ok(r.chapters.every(c=>c.height>=r.viewport[1]));}}
(async()=>{await fs.mkdir(out,{recursive:true});const b=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});const results=[];
 try{
 for(const[width,height]of sizes){const p=await b.newPage({viewport:{width,height}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await ready(p);const r=await geometry(p);try{verify(r);}catch(e){await p.screenshot({path:`${out}/failure-${width}.png`,fullPage:true});console.log(JSON.stringify(r,null,2));throw e;}assert.deepEqual(errors,[]);results.push(r);
 // Capture the static equivalent so full-page screenshots never freeze unrevealed content.
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.screenshot({path:`${out}/after-hero-${width}.png`});await p.screenshot({path:`${out}/after-page-${width}.png`,fullPage:true});
 if([390,1440].includes(width))for(const s of ['.services','.about','.footer'])await p.locator(s).screenshot({path:`${out}/after-${s.slice(1)}-${width}.png`,style:'.site-header,.skip-link{visibility:hidden!important}'});
 await p.close();console.log(`PASS homepage ${width} × ${height}`);}
 const p=await b.newPage({viewport:{width:1440,height:900}});await ready(p);const nav=p.locator('.desktop-nav a').first();const before=await nav.boundingBox();await nav.hover();await p.waitForTimeout(230);const after=await nav.boundingBox();assert.deepEqual(after,before,'Navigation moves on hover');assert.equal(await nav.evaluate(e=>getComputedStyle(e).color),'rgb(17, 110, 106)');assert.equal(await nav.evaluate(e=>getComputedStyle(e,'::after').transform),'matrix(1, 0, 0, 1, 0, 0)');
 await p.locator('.hero-actions a').hover();await p.waitForTimeout(230);assert.equal(await p.locator('.hero-actions a > span').last().evaluate(e=>getComputedStyle(e).transform),'matrix(1, 0, 0, 1, 3, 0)');
 await p.locator('.desktop-nav a').nth(1).click();await p.waitForFunction(()=>document.querySelector('.desktop-nav a[href="#services"]').getAttribute('aria-current')==='location');
 await p.emulateMedia({reducedMotion:'reduce'});await p.locator('.hero-actions a').hover();await p.waitForFunction(()=>getComputedStyle(document.querySelector('.hero-actions a > span:last-child')).transform==='none');
 results.push({interaction:'navigation underline, hash-active state, arrow, reduced motion',pass:true});await p.close();
 for(const[width,height]of[[320,568],[390,844],[1440,900]]){const p=await b.newPage({viewport:{width,height},reducedMotion:'reduce'});await ready(p);await p.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});await p.evaluate(()=>{const nodes=[...document.querySelectorAll('body *')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const[e,size]of nodes)e.style.setProperty('font-size',`${size*2}px`,'important');});const r=await geometry(p);verify(r);results.push({mode:'200% text',...r});await p.screenshot({path:`${out}/after-200-text-${width}.png`,fullPage:true});await p.close();console.log(`PASS homepage 200% text ${width}`);}
 await fs.writeFile(`${out}/homepage-results.json`,JSON.stringify(results,null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
