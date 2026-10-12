import { panel, el, ACC, INK, DIM } from './_k.js';
// Кинетическая типографика: счётчик цифры, подчёркивание рисуется, слова-ярлыки выезжают с разным временем входа/выхода
export default function setup(ctx){
  const {gsap}=ctx, p=panel(ctx), tl=gsap.timeline({paused:true});
  const cap=el(p,'пример',{left:'40px',top:'34px',fontSize:'26px',fontWeight:600,color:DIM,letterSpacing:'4px',textTransform:'uppercase'});
  const lab=el(p,'ЗА 2 МЕСЯЦА',{left:'0',width:'1080px',textAlign:'center',top:'170px',fontSize:'54px',fontWeight:800,color:DIM,letterSpacing:'6px'});
  const num=el(p,'0',{left:'0',width:'1080px',textAlign:'center',top:'330px',fontSize:'165px',fontWeight:900,color:ACC,fontVariantNumeric:'tabular-nums'});
  const bar=el(p,'',{left:'180px',top:'585px',width:'720px',height:'12px',background:ACC,borderRadius:'6px',transformOrigin:'0 50%'});
  const sub=el(p,'копий заблокировано',{left:'0',width:'1080px',textAlign:'center',top:'650px',fontSize:'66px',fontWeight:800});
  const o={v:0};
  tl.from(lab,{y:40,opacity:0,duration:.45,ease:'power3.out'},.3);
  tl.from(num,{scale:.8,opacity:0,duration:.4,ease:'power3.out'},.5);
  tl.to(o,{v:1000000,duration:1.6,ease:'power3.out',onUpdate:()=>{num.textContent=Math.round(o.v).toLocaleString('ru-RU').replace(/ /g,' ')+(o.v>=999999?'+':'');}},.55);
  tl.from(bar,{scaleX:0,duration:.5,ease:'expo.out'},2.0);
  tl.from(sub,{y:50,opacity:0,duration:.45,ease:'power3.out'},2.2);
  tl.to([lab,num,bar,sub,cap],{opacity:0,y:-30,duration:.25,ease:'power2.in',stagger:.05},3.95);
  return {tl};
}
