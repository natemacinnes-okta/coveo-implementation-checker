let createWheel = (data)=>{
  let r = 45, C = 2*Math.PI*r;
  let v = ( data.value / (data.max || 100) );
  let cssClass = 'bad';
  if (v >= 0.75) {
    cssClass = 'good';
  }
  else if ( v >= 0.5 ) {
    cssClass = 'warn';
  }
  v = C * v;

  return `<div class="wheel ${cssClass}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle class="back-ring" cx="50" cy="50" r="${r}" stroke-width="8"></circle>
      <circle class="value" fill="none" cx="50" cy="50" r="${r}" stroke-width="8" stroke-dasharray="${v} ${C}" ></circle>
      <text
        text-anchor="middle"
        font-size="50" font-family="Lato"
        transform="rotate(90 50,50)"
        lengthAdjust="spacingAndGlyphs" x="50" y="68">${data.value}</text>
    </svg>
    <div class="wheel-title">${data.title || ''}</div>
    </div>`;
};
