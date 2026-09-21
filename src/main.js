import './style.css';
import { createScene } from './scene.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const names = ['THE OBJECT', 'THE ARCHITECTURE', 'THE SURFACE', 'THE OPTICS', 'THE TEXTURE', 'YOUR PERSPECTIVE'];
const chapters = [...document.querySelectorAll('.chapter')];
let paused = reduced, active = 0, inspect = false, scene;
function progress() {
  const h = innerHeight;
  const tops = chapters.map(el => el.offsetTop);
  let index = 0;
  for (let i=0;i<tops.length;i++) if(scrollY >= tops[i]-h*.35) index=i;
  active=index;
  const fractional= Math.max(0, Math.min(5, (scrollY / Math.max(1,document.documentElement.scrollHeight-innerHeight-65))*5));
  if(scene&&!inspect) scene.setProgress(fractional, paused);
  document.querySelector('#chapter-number').textContent=String(index).padStart(2,'0');
  document.querySelector('#chapter-title').textContent=names[index];
  document.querySelectorAll('.chapter-dots a').forEach((el,i)=>el.classList.toggle('active',i===index));
  document.body.classList.toggle('dark-mode', index===2);
  chapters.forEach((el,i)=>el.classList.toggle('in-view',Math.abs(index-i)<1));
}
document.querySelector('#motion-toggle').addEventListener('click',e=>{
  paused=!paused; e.currentTarget.setAttribute('aria-pressed',String(paused));
  e.currentTarget.innerHTML=paused?'Resume motion <span>▷</span>':'Pause motion <span>Ⅱ</span>';
  scene?.setPaused(paused);progress();
});
function setInspect(value){inspect=value;document.body.classList.toggle('inspecting',value);document.querySelector('#inspect-hint').hidden=!value;scene?.setInteractive(value);if(!value)progress();}
document.querySelector('#inspect-button').onclick=()=>setInspect(true);
document.querySelector('#exit-inspect').onclick=()=>setInspect(false);
document.querySelector('#reset-button').onclick=()=>{setInspect(false);scene?.reset();};
document.addEventListener('keydown',e=>{if(e.key==='Escape')setInspect(false);});
document.querySelector('#studio-toggle').onclick=()=>scene?.toggleStudio();
document.querySelectorAll('[data-light]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-light]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));scene?.setLightColor(button.dataset.light);});
addEventListener('scroll',progress,{passive:true});addEventListener('resize',progress);progress();
try {
  scene = await createScene(document.querySelector('#webgl'), {
    reduced,
    onProgress:f=>document.querySelector('#loading-percent').textContent=`${String(Math.round(f*100)).padStart(2,'0')}%`
  });
  document.body.classList.add('ready');
  document.querySelector('#loading').classList.add('loaded');
  window.__DUALSENSE__=scene;
  progress();
  const params=new URLSearchParams(location.search);
  if(params.has('lab')){document.body.classList.add('lab-mode'); scene.setLab(params.get('view')||'front');}
}catch(error){console.error(error);document.querySelector('#loading').hidden=true;document.querySelector('#render-error').hidden=false;document.querySelector('#error-detail').textContent=`The 3D model could not load. ${error.message}`;}
