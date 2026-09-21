import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { applyControllerMaterials } from './materials.js';

const mix=THREE.MathUtils.lerp, clamp=THREE.MathUtils.clamp;
const smooth=t=>t*t*(3-2*t);
const presets=[
  {rot:[.22,-.35,-.22],pos:[1.15,-.25,0],scale:1.17,explode:0},
  {rot:[.30,-.60,-.13],pos:[1.4,-.1,0],scale:.95,explode:1},
  {rot:[.13,.37,-.08],pos:[1.3,-.18,0],scale:1.22,explode:0},
  {rot:[.15,-.32,-.21],pos:[.5,-.55,0],scale:1.62,explode:0},
  {rot:[-.24,Math.PI-.35,.23],pos:[1.2,-.13,0],scale:1.21,explode:0},
  {rot:[.1,Math.PI*2-.28,-.12],pos:[1.3,-.15,0],scale:1.14,explode:0}
];

export async function createScene(container,{reduced=false,onProgress=()=>{}}={}){
  const scene=new THREE.Scene();
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  const camera=new THREE.OrthographicCamera(-6,6,3.5,-3.5,.1,100);camera.position.set(0,0,16);camera.lookAt(0,0,0);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enabled=false;controls.enableDamping=true;controls.dampingFactor=.07;controls.minZoom=.6;controls.maxZoom=3;controls.enablePan=false;
  const pmrem=new THREE.PMREMGenerator(renderer);
  const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.025);scene.environment=environment.texture;scene.environmentIntensity=.8;room.dispose();
  RectAreaLightUniformsLib.init();
  const key=new THREE.RectAreaLight(0xfffaf1,5.0,5,7);key.position.set(-4,5,8);key.lookAt(0,0,0);scene.add(key);
  const fill=new THREE.RectAreaLight(0xe6eeff,2.6,4,5);fill.position.set(5,0,5);fill.lookAt(0,0,0);scene.add(fill);
  const edge=new THREE.RectAreaLight(0xffffff,4,2,6);edge.position.set(2,5,-3);edge.lookAt(0,0,0);scene.add(edge);
  const ambient=new THREE.HemisphereLight(0xffffff,0x777b72,1);scene.add(ambient);
  const shadowLight=new THREE.DirectionalLight(0xffffff,2);shadowLight.position.set(-3,7,7);shadowLight.castShadow=true;shadowLight.shadow.mapSize.set(2048,2048);shadowLight.shadow.camera.left=-8;shadowLight.shadow.camera.right=8;shadowLight.shadow.camera.top=8;shadowLight.shadow.camera.bottom=-8;shadowLight.shadow.bias=-.0004;shadowLight.shadow.normalBias=.02;shadowLight.shadow.radius=4;scene.add(shadowLight);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.13}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.3;floor.receiveShadow=true;scene.add(floor);
  const loader=new GLTFLoader();
  const gltf=await loader.loadAsync('/models/dualsense.glb',e=>onProgress(e.total?e.loaded/e.total:.6));
  const model=gltf.scene;const pivot=new THREE.Group();pivot.add(model);scene.add(pivot);
  const materialState=applyControllerMaterials(model,{grip:true});
  const parts=[];
  model.traverse(mesh=>{if(!mesh.isMesh)return;mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;const part=mesh.userData.part||mesh.name;const control=mesh.userData.control||'';const direction=new THREE.Vector3();
    if(part==='back-shell')direction.set(0,-.1,-1.4);
    else if(part==='white-shell-left')direction.set(-.45,.18,.75);
    else if(part==='white-shell-right')direction.set(.45,.18,.75);
    else if(control==='touchpad'||part.includes('lightbar'))direction.set(0,.55,1.25);
    else if(['triangle','circle','cross','square'].includes(control))direction.set(.5,.13,1.9);
    else if(['up','down','left','right'].includes(control))direction.set(-.5,.13,1.9);
    else if(control.includes('stick')||part.includes('stick-well'))direction.set(control.includes('left')||part.includes('left')?-.22:.22,-.05,1.35);
    else if(['l1','r1','l2','r2'].includes(control))direction.set(control[0]==='l'?-.35:.35,.6,control[1]==='1'?.35:-.55);
    else if(control==='ps'||control==='mute')direction.set(0,-.1,1.0);
    else if(part==='black-front-shell')direction.set(0,0,.08);
    else direction.set(0,0,.15);
    parts.push({mesh,base:mesh.position.clone(),direction,part,control});
  });
  const lightbarMeshes=[];model.traverse(o=>{if(o.isMesh&&(/light|led/i.test(o.name)||o.userData.part?.includes('light')))lightbarMeshes.push(o);});
  let goal=0,current=0,paused=reduced,interactive=false,lab=null,studio=0,time=0,frame=0,visible=true;
  let pointer={x:0,y:0};
  const lightColor=new THREE.Color('#246bff');
  function setLightColor(color){const off=color==='off';materialState.setLightColor?.(off?'#d6dae0':color);materialState.setLightIntensity?.(off?0:1.4);lightbarMeshes.forEach(m=>{const list=Array.isArray(m.material)?m.material:[m.material];list.forEach(mat=>{if(mat.emissive){mat.emissive.set(off?'#000000':color);mat.emissiveIntensity=off?0:1.4;}})});if(!off)lightColor.set(color);}
  setLightColor('#246bff');
  function resize(){const mobile=innerWidth<761;const vh=mobile?8.7:6.6;const aspect=innerWidth/innerHeight;camera.left=-vh*aspect/2;camera.right=vh*aspect/2;camera.top=vh/2;camera.bottom=-vh/2;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(lab)setLab(lab);}
  function applyPose(p,instant=false){const mobile=innerWidth<761;const i=Math.min(4,Math.floor(p)),f=smooth(p-i);const a=presets[i],b=presets[i+1];const scale=mix(a.scale,b.scale,f)*(mobile?.55:1);
    pivot.rotation.set(mix(a.rot[0],b.rot[0],f),mix(a.rot[1],b.rot[1],f),mix(a.rot[2],b.rot[2],f));
    const hover=paused||instant?0:Math.sin(time*.65)*.035;
    pivot.position.set(mobile?0:mix(a.pos[0],b.pos[0],f),mobile?(p<.4?-.55:-1.5):mix(a.pos[1],b.pos[1],f)+hover,0);
    pivot.scale.setScalar(scale);
    if(!paused&&!instant){pivot.rotation.x+=pointer.y*.035;pivot.rotation.y+=pointer.x*.045;}
    const explode=mix(a.explode,b.explode,f);parts.forEach(({mesh,base,direction})=>mesh.position.copy(base).addScaledVector(direction,explode));
    const darkness=Math.max(0,1-Math.abs(p-2)/.75);const bg=new THREE.Color('#e9e8e3').lerp(new THREE.Color('#202723'),darkness);
    document.body.style.backgroundColor='#'+bg.getHexString();
    key.intensity=studio?3.1:5.0;fill.intensity=studio?5.0:2.6;scene.environmentIntensity=mix(.8,.55,darkness);floor.material.opacity=mix(.13,.24,darkness);
  }
  function setLab(view='front'){
    lab=view;interactive=false;controls.enabled=false;camera.position.set(0,0,16);camera.up.set(0,1,0);camera.lookAt(0,0,0);camera.zoom=1;
    scene.background=new THREE.Color('#ffffff');floor.visible=false;pivot.position.set(0,0,0);pivot.scale.setScalar(1);pivot.rotation.set(.12,0,0);
    parts.forEach(({mesh,base})=>mesh.position.copy(base));setLightColor('off');
    const vh=4.45,aspect=innerWidth/innerHeight;camera.left=-vh*aspect/2;camera.right=vh*aspect/2;camera.top=vh/2;camera.bottom=-vh/2;
    if(view==='rear')pivot.rotation.set(-.1,Math.PI,0);
    if(view==='side')pivot.rotation.set(0,Math.PI/2,.08);
    if(view==='buttons'){camera.zoom=3.3;pivot.position.set(-1.65,-.7,0);pivot.rotation.set(0,0,0);}
    if(view==='bridge'){camera.zoom=2.3;pivot.position.set(0,.05,0);pivot.rotation.set(.05,0,0);}
    if(view==='shell'){camera.zoom=2.7;pivot.position.set(1.75,.45,0);pivot.rotation.set(.08,0,0);}
    if(view==='grip'){camera.zoom=3;pivot.rotation.set(-.2,Math.PI-.5,-.18);pivot.position.set(-1.6,.8,0);}
    camera.updateProjectionMatrix();renderer.toneMappingExposure=1.08;scene.environmentIntensity=.8;render();
  }
  function render(){renderer.render(scene,camera);}
  const clock=new THREE.Clock();
  function tick(){frame=requestAnimationFrame(tick);if(!visible)return;const dt=Math.min(clock.getDelta(),.05);time+=dt;if(!lab&&!interactive){current=paused?Math.round(goal):mix(current,goal,1-Math.exp(-dt*5));applyPose(current);}if(interactive)controls.update();render();}
  addEventListener('resize',resize);addEventListener('pointermove',e=>{pointer={x:e.clientX/innerWidth-.5,y:e.clientY/innerHeight-.5};},{passive:true});
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;clock.getDelta();});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.querySelector('#render-error').hidden=false;document.querySelector('#error-detail').textContent='The graphics context was interrupted. Reload to restore the model.';});
  resize();applyPose(0,true);await renderer.compileAsync(scene,camera);onProgress(1);tick();
  return {
    setProgress(value,snap=false){goal=clamp(value,0,5);if(snap)current=Math.round(goal);},
    setPaused(value){paused=value;},
    setInteractive(value){interactive=value;controls.enabled=value;if(value){controls.target.copy(pivot.position);camera.position.set(0,0,16);camera.lookAt(controls.target);}else{camera.position.set(0,0,16);camera.lookAt(0,0,0);camera.zoom=1;camera.updateProjectionMatrix();}},
    reset(){camera.position.set(0,0,16);camera.zoom=1;camera.lookAt(0,0,0);camera.updateProjectionMatrix();current=goal;},
    setLightColor,toggleStudio(){studio=1-studio;},setLab,
    getInfo(){return {parts:parts.length,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,progress:current,lab,materials:materialState.diagnostics};},
    tune({exposure,environment,keyIntensity,fillIntensity,rotation,position,zoom}={}){if(exposure!=null)renderer.toneMappingExposure=exposure;if(environment!=null)scene.environmentIntensity=environment;if(keyIntensity!=null)key.intensity=keyIntensity;if(fillIntensity!=null)fill.intensity=fillIntensity;if(rotation)pivot.rotation.set(...rotation);if(position)pivot.position.set(...position);if(zoom!=null){camera.zoom=zoom;camera.updateProjectionMatrix();}render();},
    model,scene,camera,renderer,parts,materialState,
    dispose(){cancelAnimationFrame(frame);controls.dispose();renderer.dispose();environment.dispose();pmrem.dispose();materialState.dispose?.();}
  };
}
