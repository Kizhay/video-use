import { panel, el, ACC, INK, DIM, RED } from './_k.js';
// Калькулятор прибыли: строки складываются сверху вниз, итог выезжает и меняет цвет
export default function setup(ctx){
  const {gsap}=ctx, p=panel(ctx), tl=gsap.timeline({paused:true});
  el(p,'пример · условные числа',{left:'40px',top:'34px',fontSize:'26px',fontWeight:600,color:DIM,letterSpacing:'4px',textTransform:'uppercase'});
  const rows=[['Цена',1500,INK],['Комиссия',-270,RED],['Логистика',-190,RED],['Себестоимость',-600,RED]];
  const items=[];
  rows.forEach(([n,v,c],i)=>{
    const y=110+i*125;
    const r=el(p,`<span style="font-size:48px;font-weight:700;color:${DIM}">${n}</span><span style="position:absolute;right:0;font-size:64px;font-weight:900;color:${c};font-variant-numeric:tabular-nums">${v>0?'':'−'}${Math.abs(v)} ₽</span>`,{left:'90px',width:'900px',top:y+'px'});
    tl.from(r,{x:-60,opacity:0,duration:.4,ease:'power3.out'},.2+i*.5);items.push(r);
  });
  const line=el(p,'',{left:'90px',top:'640px',width:'900px',height:'8px',background:INK,transformOrigin:'0 50%',borderRadius:'4px'});
  const tot=el(p,`<span style="font-size:54px;font-weight:800">Прибыль</span><span id="t" style="position:absolute;right:0;font-size:110px;font-weight:900;color:${ACC};font-variant-numeric:tabular-nums;top:-30px">440 ₽</span>`,{left:'90px',width:'900px',top:'700px'});
  tl.from(line,{scaleX:0,duration:.35,ease:'expo.out'},2.3);
  tl.from(tot,{y:40,opacity:0,scale:.92,duration:.45,ease:'back.out(1.4)'},2.55);
  tl.to([...items,line,tot],{opacity:0,y:-30,duration:.25,ease:'power2.in',stagger:.03},3.55);
  return {tl};
}
