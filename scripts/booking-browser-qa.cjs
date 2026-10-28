const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const baseURL = process.env.BOOKING_QA_URL || 'http://127.0.0.1:5173';
const output = process.env.BOOKING_QA_OUTPUT || path.join(process.cwd(), '.booking-qa');
const sizes = [[320,568],[360,800],[375,667],[390,844],[393,852],[412,915],[430,932],[768,1024],[1024,768],[1280,800],[1440,900],[1920,1080]];
const results = [];
const titles = ['A little time, entirely yours.', 'Make it your own.', 'Your space. Your sanctuary.', 'Find your moment.', 'Let’s make you comfortable.', 'A moment to look forward to.'];
async function step(page, index) {
  await page.waitForFunction(title => document.querySelector('.booking-step-intro h2')?.textContent === title, titles[index]);
  assert.equal(await page.locator('.booking-step-intro .booking-eyebrow').count(),0,'Redundant step eyebrow remains');
  assert.equal(await page.locator('.booking-stepper li').count(),6,'Stepper metadata changed');
}
async function next(page, index) { await page.locator('.booking-footer button[type="submit"]').click(); await step(page, index); }
async function open(page) {
  await page.goto(baseURL);
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('button', { name: 'Book Your Massage', exact: true }).click();
  await step(page, 0);
  await page.waitForFunction(() => document.querySelector('.booking-dialog')?.open);
  assert.equal(await page.getByText('Online booking is coming soon.', { exact: true }).count(), 0, 'Booking fell back to the obsolete production placeholder');
  assert.equal(await page.locator('dialog[open]').count(), 1, 'Expected a single booking instance');
  assert.equal(await page.getByRole('dialog', { name: 'Create your Blissed massage booking preview', exact: true }).count(), 1, 'Dialog accessible label missing');
}
async function selectService(page, id) { await page.locator('.booking-service-option').filter({ has: page.locator(`input[value="${id}"]`) }).click(); }
async function capture(page, name) { await page.locator('.booking-dialog').evaluate(async dialog => { await Promise.allSettled([...dialog.querySelectorAll('img')].map(i=>i.decode())); }); await page.screenshot({ path: path.join(output, `${name}.png`) }); }
async function inspect(page, name) {
  const data = await page.evaluate(() => {
    const dialog = document.querySelector('.booking-dialog'), main = document.querySelector('.booking-main'), footer = document.querySelector('.booking-footer');
    const r = dialog.getBoundingClientRect(), f = footer.getBoundingClientRect();
    const outside = [...dialog.querySelectorAll('*')].filter(el => {
      if (el.closest('.booking-calendar-days') || el.matches('.booking-sr-only,.booking-choice-input')) return false;
      const style = getComputedStyle(el); if (style.display === 'none' || !el.getClientRects().length) return false;
      const box = el.getBoundingClientRect(); return box.left < r.left - 1 || box.right > r.right + 1;
    }).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent.slice(0,60) }));
    const heading=dialog.querySelector('.booking-step-intro h2');
    const headingInset=heading ? heading.getBoundingClientRect().top-main.getBoundingClientRect().top+main.scrollTop : null;
    const actions=[...dialog.querySelectorAll('.booking-primary,.booking-secondary,.booking-back,.booking-skip')].filter(e=>e.getClientRects().length).map(e=>({radius:getComputedStyle(e).borderTopLeftRadius,height:e.getBoundingClientRect().height}));
    return { viewport: [innerWidth, innerHeight], dialog: { x:r.x, y:r.y, width:r.width, height:r.height }, documentWidth:document.documentElement.scrollWidth, dialogOverflow:dialog.scrollWidth-dialog.clientWidth, mainOverflow:main.scrollWidth-main.clientWidth, mainHeight:main.clientHeight, footerBottom:f.bottom, headingInset, expectedHeadingInset:parseFloat(getComputedStyle(main).paddingTop), eyebrowCount:dialog.querySelectorAll('.booking-step-intro .booking-eyebrow').length, actions, outside, locked:document.body.style.overflow==='hidden' };
  });
  if (data.documentWidth !== data.viewport[0] || data.dialogOverflow > 2 || data.mainOverflow > 2 || data.outside.length || data.mainHeight <= 60) { await capture(page,`${name}-failure`); console.log(data); }
  assert.equal(data.documentWidth, data.viewport[0], `${name}: document overflow`); assert.ok(data.dialogOverflow <= 2, `${name}: dialog overflow`); assert.ok(data.mainOverflow <= 2, `${name}: main overflow`); assert.deepEqual(data.outside, [], `${name}: content outside dialog`);
  assert.ok(data.mainHeight > 60, `${name}: scroll region collapsed`); assert.ok(data.locked, `${name}: background not locked`);
  assert.ok(Math.abs(data.footerBottom - (data.dialog.y + data.dialog.height)) < 2, `${name}: footer not anchored`);
  assert.equal(data.eyebrowCount,0,`${name}: redundant eyebrow remains`);
  assert.ok(data.actions.every(a=>a.radius==='9999px'&&a.height>=44),`${name}: action button consistency regression`);
  if(data.headingInset!==null)assert.ok(Math.abs(data.headingInset-data.expectedHeadingInset)<2,`${name}: residual heading space`);
  if (data.viewport[0] < 768) { assert.equal(data.dialog.x, 0); assert.equal(data.dialog.y, 0); assert.equal(data.dialog.width, data.viewport[0]); assert.equal(data.dialog.height, data.viewport[1]); }
  else { assert.ok(data.dialog.x >= 31); assert.ok(data.dialog.y >= 31); }
  results.push({ name, ...data });
}
async function location(page, zip = '00001') {
  for (const [field, value] of Object.entries({ address:'1 Demo Lane',city:'Demo City',state:'NY',zip })) await page.locator(`#booking-${field}`).fill(value);
}
async function chooseTime(page) {
  const dates = page.locator('.booking-calendar-cell button:not(:disabled)');
  await dates.nth(Math.min(1, await dates.count() - 1)).click();
  await page.locator('.booking-time-grid .booking-tile').first().waitFor();
  await page.locator('.booking-time-grid .booking-tile').first().click();
}
async function personalize(page) {
  for (const [field, value] of Object.entries({ firstName:'Demo',lastName:'Guest',email:'demo@example.com',phone:'202-555-0123' })) await page.locator(`#booking-${field}`).fill(value);
  await page.locator('#booking-requests').fill('A quiet session, please.');
}
async function enlargeText(page) {
  await page.evaluate(() => {
    if (!document.getElementById('booking-qa-zoom-motion')) {
      const style = document.createElement('style'); style.id = 'booking-qa-zoom-motion'; style.textContent = '.booking-dialog,.booking-dialog *{transition:none!important;animation:none!important}'; document.head.append(style);
    }
    for (const element of document.querySelectorAll('.booking-dialog, .booking-dialog *')) element.style.removeProperty('font-size');
    const elements = [...document.querySelectorAll('.booking-dialog, .booking-dialog *')].map(el => [el, parseFloat(getComputedStyle(el).fontSize)]);
    for (const [el, size] of elements) el.style.setProperty('font-size', `${size * 2}px`, 'important');
  });
}
(async () => {
 await fs.mkdir(output, {recursive:true});
 const browser = await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {})});
 try {
  for (const [width,height] of process.env.BOOKING_QA_EXTENDED_ONLY ? [] : sizes) {
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}); const errors=[]; page.on('pageerror',error=>errors.push(error.message));
   await open(page); await inspect(page,`${width}-experience`); if ([320,390,430,768,1440].includes(width)) await capture(page,`${width}-01-experience`);
   if(width===320) { await page.locator('.booking-footer button[type=submit]').click(); await page.getByText(/Choose a massage experience to continue\./).waitFor(); }
   await selectService(page,'reset'); assert.equal(await page.locator('input[name=duration]:checked').count(),1);
   await page.locator('.booking-duration .booking-tile').filter({hasText:'90'}).click();
   await next(page,1); await page.locator('.booking-enhancement').filter({has:page.locator('input[type=checkbox]')}).first().locator('label').first().click();
   await inspect(page,`${width}-enhancements`); if([320,390,430,768,1440].includes(width)) await capture(page,`${width}-02-enhancements`);
   await next(page,2); await inspect(page,`${width}-location`); if([320,390,430,768,1440].includes(width)) await capture(page,`${width}-03-location`);
   if(width===320) {
    await page.locator('#booking-step-form').evaluate(form=>{form.dataset.nativeInvalidCount='0';form.addEventListener('invalid',()=>form.dataset.nativeInvalidCount=String(Number(form.dataset.nativeInvalidCount)+1),true);});
    await nextInvalidLocation(page);
    await page.waitForFunction(()=>document.activeElement.id==='booking-address');
    assert.equal(await page.locator('#booking-step-form').evaluate(form=>form.noValidate),true);
    assert.equal(await page.locator('.booking-footer button[type=submit]').evaluate(button=>button.formNoValidate),true);
    await capture(page,'320-location-inline-errors');
    await page.locator('#booking-address').fill('1 Demo Lane');
    assert.equal(await page.locator('#booking-address').getAttribute('aria-invalid'),null);
    assert.equal(await page.locator('#booking-city').getAttribute('aria-invalid'),'true');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'booking-address','Correcting one field stole focus');
    assert.equal(await page.locator('#booking-step-form').getAttribute('data-native-invalid-count'),'0','Native validation interrupted location');
    await location(page,'00002');await page.locator('.booking-footer button[type=submit]').click();await page.locator('.booking-coverage--ineligible').waitFor();
    await page.locator('#booking-zip').fill('12345');await page.locator('.booking-footer button[type=submit]').click();await page.locator('.booking-coverage--unknown').waitFor();
   }
   await location(page); await next(page,3); await chooseTime(page); await inspect(page,`${width}-datetime`); if([320,390,430,768,1440].includes(width)) await capture(page,`${width}-04-datetime`);
   if(width===390){
    await page.getByText('Explore preview scenarios',{exact:true}).click();await page.locator('#booking-scenario').selectOption('empty');await page.getByRole('heading',{name:'A quieter day on the calendar.'}).waitFor();assert.equal(await page.locator('input[name=appointment-time]:checked').count(),0);
    await page.locator('#booking-scenario').selectOption('error');await page.getByRole('heading',{name:'A small pause.'}).waitFor();await page.getByRole('button',{name:'Try again',exact:true}).click();await page.getByRole('heading',{name:'A small pause.'}).waitFor();
    await page.locator('#booking-scenario').selectOption('normal');await page.locator('.booking-time-grid .booking-tile').first().click();
   }
   await next(page,4); await inspect(page,`${width}-personalize`); if([320,390,430,768,1440].includes(width)) await capture(page,`${width}-05-personalize`);
   if(width===320){
    await page.locator('.booking-footer button[type=submit]').click();await page.locator('#booking-firstName[aria-invalid=true]').waitFor();await page.waitForFunction(()=>document.activeElement.id==='booking-firstName');
    await page.locator('#booking-firstName').fill('Demo');assert.equal(await page.locator('#booking-lastName').getAttribute('aria-invalid'),'true');assert.equal(await page.evaluate(()=>document.activeElement.id),'booking-firstName');
    await personalize(page);await page.locator('#booking-email').fill('invalid');await page.locator('.booking-footer button[type=submit]').click();await page.waitForFunction(()=>document.activeElement.id==='booking-email');
    await page.locator('#booking-email').fill('d');assert.equal(await page.locator('#booking-email').getAttribute('aria-invalid'),'true');assert.equal(await page.evaluate(()=>document.activeElement.id),'booking-email');await capture(page,'320-email-inline-error');
    assert.equal(await page.locator('#booking-step-form').getAttribute('data-native-invalid-count'),'0','Native email tooltip interrupted validation');
    await page.locator('#booking-email').fill('demo@example.com');assert.equal(await page.locator('#booking-email').getAttribute('aria-invalid'),null);
   }
   await personalize(page); await next(page,5); await inspect(page,`${width}-review`);if([320,390,430,768,1440].includes(width))await capture(page,`${width}-06-review`);
   assert.ok((await page.locator('.booking-summary--detailed').textContent()).includes('Demo Guest'));assert.ok((await page.locator('.booking-price').last().textContent()).includes('Price to be confirmed'));
   if(width===390){
    await page.getByRole('button',{name:'Edit personal details',exact:true}).click();await step(page,4);assert.equal(await page.locator('#booking-email').inputValue(),'demo@example.com');await page.locator('#booking-requests').fill('Softer music, please.');await next(page,5);assert.ok((await page.locator('.booking-summary--detailed').textContent()).includes('Softer music'));
    await page.getByRole('button',{name:'Edit experience',exact:true}).click();await step(page,0);await selectService(page,'prenatal');await next(page,1);await page.getByRole('button',{name:'Skip for now',exact:true}).click();await step(page,2);await next(page,3);assert.equal(await page.locator('input[name=appointment-time]:checked').count(),0);await page.locator('.booking-time-grid .booking-tile').first().click();await next(page,4);assert.equal(await page.locator('input[name=pressure]').count(),0);await next(page,5);
   }
   await page.getByRole('button',{name:'Preview Confirmation',exact:false}).click();await page.locator('#booking-complete-title').waitFor();await inspect(page,`${width}-completion`);if([320,390,1440].includes(width))await capture(page,`${width}-07-completion`);
   assert.ok((await page.locator('.booking-completion').textContent()).includes('Your appointment has not been reserved.'));
   await page.getByRole('button',{name:'Back to Blissed',exact:false}).click();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Book Your Massage');assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
   assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${width} × ${height}: all six steps and completion`);
  }
  // Contextual CTA routing, fresh journeys, focus wrapping, and discard behavior.
  const desktop=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await desktop.goto(baseURL);
  for(const trigger of [desktop.locator('.desktop-nav').getByRole('button',{name:'Book a Massage',exact:true}),desktop.getByRole('button',{name:'Book your session',exact:true}),desktop.getByRole('button',{name:'Request Event Availability',exact:true})]){
   await trigger.click();await step(desktop,0);assert.equal(await desktop.locator('dialog[open]').count(),1);assert.equal(await desktop.locator('.booking-notice').count(),0);await desktop.keyboard.press('Escape');await desktop.waitForFunction(()=>!document.querySelector('dialog[open]'));assert.equal(await trigger.evaluate(el=>el===document.activeElement),true);assert.notEqual(await desktop.evaluate(()=>document.body.style.overflow),'hidden');
  }
  await desktop.close();
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await page.goto(baseURL);
  for(const [index,id] of ['reset','deep-restore','active-recovery','prenatal','your-way'].entries()){
   await page.locator('.service-card').nth(index).getByRole('button').click();await step(page,0);assert.equal(await page.locator('input[name=experience]:checked').inputValue(),id);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  }
  await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.locator('.mobile-menu').getByRole('button',{name:'Book a Massage',exact:true}).click();await step(page,0);assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');assert.equal(await page.locator('input[name=experience]:checked').count(),0);
  for(let i=0;i<25;i++){await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)));}
  await selectService(page,'reset');await next(page,1);await page.locator('.booking-enhancement label').first().click();await page.getByRole('button',{name:'Close booking preview',exact:true}).click();await page.getByRole('heading',{name:'Leave your preview?',exact:true}).waitFor();await page.getByRole('button',{name:'Keep planning',exact:true}).click();await step(page,1);assert.equal(await page.locator('input[type=checkbox]:checked').count(),1);await page.keyboard.press('Escape');await page.getByRole('button',{name:'Discard preview',exact:true}).click();
  await open(page);assert.equal(await page.locator('input[name=experience]:checked').count(),0);await page.getByRole('button',{name:'Close booking preview',exact:true}).click();
  // Text-only enlargement through all steps at the smallest phone, tall phone, and desktop.
  for(const [width,height] of [[320,568],[390,844],[1440,900]]){
   await page.setViewportSize({width,height});await open(page);await selectService(page,'reset');await enlargeText(page);await inspect(page,`${width}-200%-experience`);await capture(page,`${width}-200-text`);
   await next(page,1);await enlargeText(page);await inspect(page,`${width}-200%-enhancements`);
   await next(page,2);await location(page);await enlargeText(page);await inspect(page,`${width}-200%-location`);
   await next(page,3);await chooseTime(page);await enlargeText(page);await inspect(page,`${width}-200%-datetime`);
   await next(page,4);await personalize(page);await enlargeText(page);await inspect(page,`${width}-200%-personalize`);
   await next(page,5);await enlargeText(page);await inspect(page,`${width}-200%-review`);
   await page.getByRole('button',{name:'Preview Confirmation',exact:false}).click();await page.locator('#booking-complete-title').waitFor();await enlargeText(page);await inspect(page,`${width}-200%-completion`);
   await page.getByRole('button',{name:'Back to Blissed',exact:false}).click();
  }
  // Keyboard-operated selection and calendar focus movement, with ordinary motion enabled.
  await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:390,height:844});await open(page);
  await page.locator('input[name=experience][value=reset]').focus();await page.keyboard.press('Space');await page.locator('.booking-footer button[type=submit]').focus();await page.keyboard.press('Enter');await step(page,1);
  await page.locator('.booking-footer button[type=submit]').focus();await page.keyboard.press('Enter');await step(page,2);await location(page);await next(page,3);
  await page.locator('.booking-calendar-cell button:not(:disabled)').first().focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await page.locator('.booking-time-grid .booking-tile').first().waitFor();await page.locator('input[name=appointment-time]').first().focus();await page.keyboard.press('Space');await next(page,4);await personalize(page);await next(page,5);
  await page.getByRole('button',{name:'Preview Confirmation',exact:false}).focus();await page.keyboard.press('Enter');await page.locator('#booking-complete-title').waitFor();
  results.push({name:'interaction-checks',desktopNavigation:true,servicesOverview:true,events:true,mobileNavigation:true,contextualServices:5,focusTrap:true,discardAndFreshReopen:true,keyboardSelectionAndCalendar:true,reducedMotion:true});
  // A reduced visual viewport while editing keeps the focused field and footer usable.
  await page.getByRole('button',{name:'Back to Blissed',exact:false}).click();await open(page);await selectService(page,'reset');await next(page,1);await next(page,2);await page.locator('#booking-address').focus();await page.setViewportSize({width:390,height:450});await page.waitForTimeout(100);await inspect(page,'390-keyboard-resize');assert.ok(await page.locator('.booking-dialog').evaluate(e=>e.hasAttribute('data-keyboard-open')));await capture(page,'390-keyboard-resize');
  await page.close();
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));console.log(`PASS interaction checks. Artifacts: ${output}`);
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
async function nextInvalidLocation(page){await page.locator('.booking-footer button[type=submit]').click();await page.locator('#booking-address[aria-invalid=true]').waitFor();}
