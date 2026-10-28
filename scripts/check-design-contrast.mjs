import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const css=readFileSync('src/styles.css','utf8');
const colors=Object.fromEntries([...css.matchAll(/--(color-[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map(m=>[m[1],m[2]]));
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function luminance(hex){const values=rgb(hex).map(v=>{const n=v/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return values.reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);}
function ratio(a,b){const [lo,hi]=[luminance(a),luminance(b)].sort((x,y)=>x-y);return(hi+.05)/(lo+.05);}
const pairs=[
 ['Primary action','color-primary-foreground','color-brand-primary',4.5],['Hover action','color-primary-foreground','color-brand-primary-hover',4.5],['Pressed action','color-primary-foreground','color-brand-primary-active',4.5],
 ['Primary text','color-text-primary','color-surface-elevated',4.5],['Secondary text','color-text-secondary','color-surface-elevated',4.5],['Muted text','color-text-muted','color-surface-elevated',4.5],['Muted on cream','color-text-muted','color-cream',4.5],
 ['Warm eyebrow on ivory','color-warm-accent','color-surface-elevated',4.5],['Warm eyebrow on cream','color-warm-accent','color-cream',4.5],
 ['Dark-section copy','color-on-dark-muted','color-emerald',4.5],['Footer copy','color-on-dark-muted','color-emerald-deep',4.5],['About tagline','color-blush','color-emerald',4.5],
 ['Selected text','color-text-primary','color-brand-primary-subtle',4.5],['Disabled text','color-control-disabled-text','color-control-disabled',4.5],['Disabled dialog text','color-text-muted','color-control-disabled',4.5],
 ['Input boundary','color-border-control','color-surface-elevated',3],['Focus on light','color-focus-ring','color-surface-primary',3],['Focus inner ring on dark','color-surface-elevated','color-emerald-deep',3],['Selection border','color-brand-primary','color-brand-primary-subtle',3],
];
const results=pairs.map(([name,fg,bg,min])=>{const value=ratio(colors[fg],colors[bg]);return{name,foreground:colors[fg],background:colors[bg],ratio:Number(value.toFixed(3)),minimum:min,pass:value>=min};});
// The lightest About gradient endpoint plus the translucent benefit surface.
const benefit=rgb(colors['color-emerald']).map(v=>Math.round(v*.96+255*.04));
const benefitHex='#'+benefit.map(v=>v.toString(16).padStart(2,'0')).join('');
const benefitRatio=ratio(colors['color-on-dark-muted'],benefitHex);
results.push({name:'Benefit supporting copy',foreground:colors['color-on-dark-muted'],background:benefitHex,ratio:Number(benefitRatio.toFixed(3)),minimum:4.5,pass:benefitRatio>=4.5});
if(process.env.CONTRAST_QA_OUTPUT)writeFileSync(process.env.CONTRAST_QA_OUTPUT,JSON.stringify(results,null,2));
for(const r of results)console.log(`${r.pass?'PASS':'FAIL'} ${r.name}: ${r.ratio}:1 (target ${r.minimum}:1)`);
assert.ok(results.every(r=>r.pass),'A semantic color pair does not meet its AA target');
