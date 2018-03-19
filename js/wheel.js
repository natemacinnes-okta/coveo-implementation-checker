let createWheel = (id)=>{
  let el = document.getElementById(id);

  let r = 45, C = 2*Math.PI*r;
  let v = ( el.dataset.value / (el.dataset.max || 100) );
  let cssClass = 'bad';
  if (v >= .75) {
    cssClass = 'good';
  }
  else if ( v >= .5 ) {
    cssClass = 'warn';
  }
  el.classList.add(cssClass);
  v = C * v;

  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle fill="none" stroke="#E4EAED" cx="50" cy="50" r="${r}" stroke-width="8"></circle>
      <circle class="value" fill="none" cx="50" cy="50" r="${r}" stroke-width="8" stroke-dasharray="${v} ${C}" ></circle>
      <text
        text-anchor="middle"
        font-size="50" font-family="Lato"
        transform="rotate(90 50,50)"
        lengthAdjust="spacingAndGlyphs" x="50" y="68">${el.dataset.value}</text>
    </svg>
    <div class="wheel-title">${el.dataset.title || ''}</div>`;
};


setTimeout( ()=>{
  createWheel('g1');
  createWheel('g2');
  createWheel('g3');

  createWheel('g4');
  createWheel('g5');
  createWheel('g6');
});

console.log(Math.PI);