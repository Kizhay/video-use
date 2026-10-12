// Идея из галереи prompt-motion.com «Shape morphing through UI states» (автор @twoclipping): ОДНА фигура никогда не режется,
// а превращается: кнопка → загрузка → галочка → карточка → переключатель → график → уведомление → снова кнопка.
// Код здесь свой, под вертикальный ролик для продавцов; все числа условные.
export default function setup(ctx){
  const {gsap,W,H}=ctx, ui=ctx.ui, tl=gsap.timeline({paused:true});
  const BG='#ECE9E4', INK='#111111', ACC='#2F6BFF', DIM='#8B8780', WHITE='#FFFFFF';
  const root=document.createElement('div');
  Object.assign(root.style,{position:'absolute',left:'0',top:'0',width:W+'px',height:H+'px',background:BG,fontFamily:'Montserrat',overflow:'hidden'});
  ui.appendChild(root);
  const mk=(parent,st,html='')=>{const d=document.createElement('div');d.innerHTML=html;
    Object.assign(d.style,{position:'absolute',...st});parent.appendChild(d);return d;};
  const cx=540, cy=900;
  mk(root,{left:'40px',top:'50px',fontSize:'26px',fontWeight:600,color:DIM,letterSpacing:'4px'},'ПРИМЕР · УСЛОВНЫЕ ЧИСЛА');
  const shape=mk(root,{left:cx+'px',top:cy+'px',transform:'translate(-50%,-50%)',width:'560px',height:'150px',borderRadius:'75px',background:INK,overflow:'hidden',boxShadow:'0 30px 60px rgba(0,0,0,.12)'});
  const layer=(html,st={})=>mk(shape,{left:'0',top:'0',width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',opacity:0,fontWeight:800,...st},html);
  // 1 кнопка
  const L_btn=layer('<span style="color:#fff;font-size:48px">Найти копии</span>');
  // 2 загрузка
  const L_load=layer(`<svg width="90" height="90" viewBox="0 0 90 90"><circle cx="45" cy="45" r="34" fill="none" stroke="#444" stroke-width="9"/><circle id="sp" cx="45" cy="45" r="34" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-dasharray="70 400"/></svg>`);
  const sp=L_load.querySelector('#sp');
  // 3 галочка
  const L_ok=layer(`<svg width="90" height="90" viewBox="0 0 90 90"><path id="ck" d="M22 47 L39 63 L69 29" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  const ck=L_ok.querySelector('#ck'); ck.style.strokeDasharray=80; ck.style.strokeDashoffset=80;
  // 4 карточка со счётчиком
  const L_card=layer(`<div style="text-align:center;color:${INK}"><div style="font-size:30px;color:${DIM};letter-spacing:4px">НАЙДЕНО</div><div id="n" style="font-size:150px;font-weight:900;line-height:1.05;font-variant-numeric:tabular-nums">0</div><div style="font-size:48px">копий вашего товара</div></div>`);
  const nEl=L_card.querySelector('#n');
  // 5 переключатель
  const L_tog=layer(`<div style="position:relative;width:100%;height:100%"><div id="tk" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:260px;height:130px;border-radius:65px;background:#D6D2CB"></div><div id="kn" style="position:absolute;top:50%;width:106px;height:106px;border-radius:53px;background:#fff;box-shadow:0 6px 16px rgba(0,0,0,.2);transform:translateY(-50%)"></div><div style="position:absolute;left:0;right:0;bottom:36px;text-align:center;font-size:40px;white-space:nowrap;color:${INK}">Подавать жалобы сами</div></div>`);
  const tk=L_tog.querySelector('#tk'), kn=L_tog.querySelector('#kn');
  // 6 график
  const L_ch=layer(`<svg width="840" height="520" viewBox="0 0 840 520" style="position:absolute;left:0;top:0"><path id="ln" d="M60 400 C150 380 190 330 270 340 S400 250 470 210 S620 130 780 70" fill="none" stroke="${ACC}" stroke-width="12" stroke-linecap="round"/><circle id="pt" cx="470" cy="210" r="14" fill="${INK}"/></svg><div style="position:absolute;left:50px;top:36px;font-size:36px;color:${INK}">Копий в выдаче</div><div id="tip" style="position:absolute;left:380px;top:110px;background:${INK};color:#fff;border-radius:16px;padding:12px 20px;font-size:32px;font-weight:700;white-space:nowrap">−72% за 2 мес.</div>`,{display:'block'});
  const ln=L_ch.querySelector('#ln'), pt=L_ch.querySelector('#pt'), tip=L_ch.querySelector('#tip');
  const lnLen=700; ln.style.strokeDasharray=lnLen; ln.style.strokeDashoffset=lnLen; gsap.set([pt,tip],{opacity:0});
  // 7 уведомление
  const L_toast=layer(`<span style="color:#fff;font-size:44px;display:flex;align-items:center;gap:24px"><svg width="56" height="56" viewBox="0 0 90 90"><circle cx="45" cy="45" r="42" fill="${ACC}"/><path d="M24 47 L39 61 L66 30" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>Жалобы поданы</span>`);

  // курсор
  const cur=mk(root,{left:'0',top:'0',width:'60px',height:'60px',zIndex:5,opacity:0},`<svg width="60" height="60" viewBox="0 0 24 24"><path d="M5 3 L19 12 L12 13.5 L9 20 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`);
  const ring=mk(root,{left:'0',top:'0',width:'90px',height:'90px',borderRadius:'45px',border:'6px solid '+ACC,opacity:0,zIndex:4,transform:'translate(-50%,-50%)'});
  const click=(t,x,y)=>{tl.set(ring,{left:x,top:y,scale:.3,opacity:.9},t).to(ring,{scale:1.2,opacity:0,duration:.45,ease:'power2.out'},t);
                        tl.to(cur,{scale:.86,duration:.08,ease:'power2.out'},t-.04).to(cur,{scale:1,duration:.18,ease:'power2.out'},t+.04);};
  const swap=(a,b,t)=>{ // содержимое меняется с коротким размытием, фигура при этом едет
    if(a) tl.to(a,{opacity:0,filter:'blur(10px)',duration:.18,ease:'power2.in'},t);
    if(b){ tl.set(b,{filter:'blur(10px)'},t); tl.to(b,{opacity:1,filter:'blur(0px)',duration:.28,ease:'power3.out'},t+.14);} };
  const morph=(t,o,d=.55)=>tl.to(shape,{...o,duration:d,ease:'expo.out'},t);

  // 0 — кнопка
  tl.set(L_btn,{opacity:1},0);
  tl.from(shape,{scale:.6,opacity:0,duration:.5,ease:'expo.out'},0.1);
  tl.set(cur,{x:760,y:1250,opacity:1},0.6).to(cur,{x:cx+90,y:cy+30,duration:.7,ease:'power3.inOut'},0.6);
  click(1.45,cx+60,cy+30);
  // 1 — загрузка
  swap(L_btn,L_load,1.5); morph(1.5,{width:160,height:160,borderRadius:80,background:INK});
  tl.to(sp,{rotation:720,svgOrigin:'45 45',duration:1.6,ease:'none'},1.6);
  tl.to(cur,{x:cx+300,y:cy+330,opacity:0,duration:.5,ease:'power2.inOut'},1.6);
  // 2 — галочка
  swap(L_load,L_ok,3.1); morph(3.1,{background:ACC});
  tl.to(ck,{strokeDashoffset:0,duration:.35,ease:'power2.out'},3.35);
  // 3 — карточка
  swap(L_ok,L_card,4.0); morph(4.0,{width:820,height:480,borderRadius:48,background:WHITE},.7);
  const o={v:0}; tl.to(o,{v:12,duration:.9,ease:'power3.out',onUpdate:()=>{nEl.textContent=Math.round(o.v);}},4.35);
  // 4 — переключатель
  swap(L_card,L_tog,6.0); morph(6.0,{width:560,height:380,borderRadius:56,background:WHITE},.7);
  gsap.set(kn,{left:'calc(50% - 125px)'}); gsap.set(tk,{background:'#D6D2CB'});
  tl.set(cur,{x:cx+200,y:cy+330,opacity:0},6.3).to(cur,{opacity:1,x:cx+95,y:cy-10,duration:.6,ease:'power3.inOut'},6.3);
  click(7.0,cx+40,cy-10);
  tl.to(kn,{left:'calc(50% + 19px)',duration:.4,ease:'power3.out'},7.0).to(tk,{background:ACC,duration:.3},7.0);
  // 5 — график
  swap(L_tog,L_ch,7.9); morph(7.9,{width:840,height:520,borderRadius:48,background:WHITE},.7);
  tl.to(ln,{strokeDashoffset:0,duration:1.1,ease:'power2.inOut'},8.3);
  tl.to(pt,{opacity:1,duration:.2},9.0); tl.to(tip,{opacity:1,y:-6,duration:.3,ease:'power3.out'},9.1);
  tl.to(cur,{x:cx+0,y:cy-100,duration:.7,ease:'power3.inOut'},8.4).to(cur,{opacity:0,duration:.2},9.6);
  // 6 — уведомление
  swap(L_ch,L_toast,9.9); morph(9.9,{width:720,height:150,borderRadius:75,background:INK},.7);
  // 7 — снова кнопка (первый кадр = последний)
  swap(L_toast,L_btn,11.2); morph(11.2,{width:560,height:150,borderRadius:75,background:INK},.7);
  return {tl};
}
