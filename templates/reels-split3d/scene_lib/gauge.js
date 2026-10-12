import { panel, el, ACC, INK, DIM, RED } from './_k.js';
// Спидометр ДРР: дуга рисуется, стрелка уезжает в красное, число считается
export default function setup(ctx){
  const {gsap}=ctx, p=panel(ctx), tl=gsap.timeline({paused:true});
  el(p,'пример · условные числа',{left:'40px',top:'34px',fontSize:'26px',fontWeight:600,color:DIM,letterSpacing:'4px',textTransform:'uppercase'});
  const NS='http://www.w3.org/2000/svg', s=document.createElementNS(NS,'svg');
  s.setAttribute('width','1080');s.setAttribute('height','700');s.style.cssText='position:absolute;left:0;top:40px';
  const arc=(a0,a1,col)=>{const r=330,cx=540,cy=480,pt=a=>[cx+r*Math.cos(a),cy-r*Math.sin(a)];
    const [x0,y0]=pt(a0),[x1,y1]=pt(a1);const e=document.createElementNS(NS,'path');
    e.setAttribute('d',`M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`);e.setAttribute('stroke',col);e.setAttribute('stroke-width','46');e.setAttribute('fill','none');e.setAttribute('stroke-linecap','round');s.appendChild(e);return e;};
  const a1=arc(Math.PI,Math.PI*0.5+0.05,'#2B3144'), a2=arc(Math.PI*0.5-0.05,0,'#2B3144');
  const g1=arc(Math.PI,Math.PI*0.5+0.05,ACC), g2=arc(Math.PI*0.5-0.05,0,RED);
  const needle=document.createElementNS(NS,'g');needle.innerHTML='<line x1="540" y1="480" x2="540" y2="190" stroke="#F4F5F7" stroke-width="14" stroke-linecap="round"/><circle cx="540" cy="480" r="26" fill="#F4F5F7"/>';
  s.appendChild(needle);p.appendChild(s);
  [g1,g2].forEach(e=>{const L=e.getTotalLength();e.style.strokeDasharray=L;e.style.strokeDashoffset=L;});
  const num=el(p,'8%',{left:'0',width:'1080px',textAlign:'center',top:'590px',fontSize:'170px',fontWeight:900,fontVariantNumeric:'tabular-nums'});
  const lab=el(p,'ДРР',{left:'0',width:'1080px',textAlign:'center',top:'775px',fontSize:'52px',fontWeight:800,color:DIM,letterSpacing:'8px'});
  const o={v:0,a:-80};
  gsap.set(needle,{svgOrigin:'540 480',rotation:-80});
  tl.from([a1,a2,num,lab],{opacity:0,duration:.3},0.1);
  tl.to(g1,{strokeDashoffset:0,duration:.5,ease:'power2.out'},.2);
  tl.to(g2,{strokeDashoffset:0,duration:.5,ease:'power2.out'},.55);
  tl.to(needle,{rotation:62,duration:1.5,ease:'power3.inOut'},.5);
  tl.to(o,{v:41,duration:1.5,ease:'power3.inOut',onUpdate:()=>{num.textContent=Math.round(o.v)+'%';num.style.color=o.v>25?RED:INK;}},.5);
  tl.to([a1,a2,g1,g2,needle,num,lab],{opacity:0,duration:.25,ease:'power2.in'},2.7);
  return {tl};
}
