// общий кит демо-вставок: тёмная панель, один акцент, одна гарнитура
export const ACC='#FFD60A', RED='#FF3B4E', INK='#F4F5F7', DIM='#8A90A0', PANEL='#0E1016';
export function panel(ctx){
  const d=document.createElement('div');
  Object.assign(d.style,{position:'absolute',left:'0',top:'0',width:ctx.W+'px',height:ctx.H+'px',
    background:'radial-gradient(900px 700px at 50% 35%,#1B2030 0%,#0E1016 70%)',fontFamily:'Montserrat',color:INK,overflow:'hidden'});
  ctx.ui.appendChild(d); return d;
}
export function el(p,html,st={}){
  const d=document.createElement('div'); d.innerHTML=html;
  Object.assign(d.style,{position:'absolute',left:'0',top:'0',whiteSpace:'nowrap',...st}); p.appendChild(d); return d;
}
