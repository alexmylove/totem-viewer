import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const status=document.querySelector('#status'),controls=document.querySelector('#controls');
const params=new URLSearchParams(location.search);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));document.body.prepend(renderer.domElement);
const scene=new THREE.Scene(),pivot=new THREE.Group();scene.add(pivot);
const camera=new THREE.PerspectiveCamera(35,1,.01,100);
const gltf=await new GLTFLoader().loadAsync('./totem-layers.glb');pivot.add(gltf.scene);
const mixer=new THREE.AnimationMixer(gltf.scene);
for(const clip of gltf.animations)mixer.clipAction(clip).setLoop(THREE.LoopRepeat,Infinity).play();
status.hidden=true;controls.hidden=params.get('controls')==='0';
let paused=false,visible=true,raf=0,last=0,x=0,y=0,tx=0,ty=0;
function render(dt=0){const factor=1-Math.exp(-9*dt);x+=(tx-x)*factor;y+=(ty-y)*factor;pivot.rotation.set(y*.10,x*.13,0);if(!paused&&!reduced.matches)mixer.update(dt);renderer.render(scene,camera);}
function frame(t){raf=0;if(!visible||document.hidden)return;if(!last)last=t;const dt=(t-last)/1000;if(dt>=1/30){render(Math.min(dt,.1));last=t;}if(!reduced.matches&&(!paused||Math.abs(x-tx)+Math.abs(y-ty)>.001))raf=requestAnimationFrame(frame);}
function start(){if(!raf&&!reduced.matches&&visible&&!document.hidden){last=0;raf=requestAnimationFrame(frame);}}
function sync(){cancelAnimationFrame(raf);raf=0;last=0;if(reduced.matches){x=y=tx=ty=0;mixer.setTime(0);render();}else start();}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.position.z=Math.max(1.3,1.85/camera.aspect)/Math.tan(THREE.MathUtils.degToRad(17.5));camera.updateProjectionMatrix();render();}
window.addEventListener('resize',resize);
window.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch')return;tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2;start();});
function reset(){tx=ty=0;start();}
document.documentElement.addEventListener('pointerleave',reset);window.addEventListener('blur',reset);
document.querySelector('#reset').onclick=reset;
document.querySelector('#pause').onclick=e=>{paused=!paused;e.currentTarget.textContent=paused?'Продолжить':'Пауза';e.currentTarget.setAttribute('aria-pressed',String(paused));start();};
document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
if('IntersectionObserver'in window)new IntersectionObserver(e=>{visible=e[0].isIntersecting;sync();}).observe(renderer.domElement);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);raf=0;status.hidden=false;status.textContent='Графический контекст потерян. Обновите страницу.';});
resize();sync();
