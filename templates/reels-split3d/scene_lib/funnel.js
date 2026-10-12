import { panel, el, ACC, INK, DIM, RED } from './_k.js';
// Воронка: ширина полос сужается по значениям, каждая полоса вырастает из предыдущей
export default function setup(ctx){
  const {gsap}=ctx, p=panel(ctx), tl=gsap.timeline({paused:true});
  el(p,'пример · условные числа',{left:'40px',top:'34px',fontSize:'26px',fontWeight:600,color:DIM,letterSpacing:'4px',textTransform:'uppercase'});
  const rows=[['Показы',10000,'#3A4157'],['Клики',1800,'#4A5370'],['Заказы',360,'#6C7396'],['Выкупы',252,ACC]];
  const all=[];
  rows.forEach(([n,v,c],i)=>{
    const w=[900,740,580,440][i], y=120+i*165;
    const b=el(p,'',{left:(540-w/2)+'px',top:y+'px',width:w+'px',height:'125px',background:c,borderRadius:'24px',transformOrigin:'50% 0'});
    const t=el(p,`<span style="font-weight:800;font-size:46px;color:${i==3?'#111':INK}">${n}</span> <span style="font-weight:900;font-size:60px;color:${i==3?'#111':INK};margin-left:18px;font-variant-numeric:tabular-nums">${v.toLocaleString('ru-RU')}</span>`,
      {left:'0',width:'1080px',textAlign:'center',top:(y+28)+'px'});
    tl.from(b,{scaleY:0,opacity:0,duration:.4,ease:'power3.out'},.25+i*.55);
    tl.from(t,{y:20,opacity:0,duration:.35,ease:'power3.out'},.4+i*.55);
    all.push(b,t);
  });
  const pc=el(p,'выкуп 70%',{left:'0',width:'1080px',textAlign:'center',top:'790px',fontSize:'40px',fontWeight:800,color:ACC});
  tl.from(pc,{opacity:0,y:20,duration:.3},2.7);
  tl.to([...all,pc],{opacity:0,y:-30,duration:.25,ease:'power2.in',stagger:.03},3.7);
  return {tl};
}
