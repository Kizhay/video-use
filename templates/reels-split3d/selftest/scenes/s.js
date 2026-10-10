export default function setup({ gsap, ui }) {
  const card = document.createElement('div');
  Object.assign(card.style, { position: 'absolute', left: '90px', top: '200px', width: '900px', height: '300px',
    background: '#fff', borderRadius: '28px', boxShadow: '0 20px 60px rgba(0,0,0,.3)', font: '900 90px MB', color: '#005BFF',
    display: 'flex', alignItems: 'center', justifyContent: 'center' });
  card.textContent = 'GSAP ok'; ui.appendChild(card);
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(card, { y: -400, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 3.2)
    .to(card, { rotation: 360, duration: 3, ease: 'power2.inOut' }, 4);
  return { tl };
}
