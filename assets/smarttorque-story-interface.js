import * as THREE from 'three';

export function makeScreenReadout(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1152;
  const ctx = canvas.getContext('2d');
  ctx.scale(4/3,4/3);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(12, renderer.capabilities.getMaxAnisotropy());
  const material = new THREE.MeshBasicMaterial({map: texture, toneMapped: false, transparent: true});
  let previous = '';
  const type = 'Manrope, "Segoe UI", "Microsoft YaHei", sans-serif';

  function label(text, x, y, size, color = '#a4bdcb', weight = 650) {
    ctx.font = `${weight} ${size}px ${type}`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function roundedBox(x, y, width, height, radius, color) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fillStyle = color;
    ctx.fill();
  }

  return {
    material,
    paint(frame) {
      const chinese = frame.chinese;
      const state = frame.lcd;
      const completion = Math.round(frame.actionProgress * 30);
      const page = frame.screenPage;
      const key = `${chinese}/${state}/${completion}/${page ?? ''}`;
      material.opacity = frame.screenAlpha;
      if (key === previous) return;
      previous = key;
      const backdrop = ctx.createLinearGradient(0, 0, 1450, 864);
      backdrop.addColorStop(0, '#0c1c2b');
      backdrop.addColorStop(.56, '#07131e');
      backdrop.addColorStop(1, '#030910');
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, 1536, 864);
      ctx.strokeStyle = '#274354';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(108, 192);
      ctx.lineTo(1428, 192);
      ctx.stroke();
      label('SMARTTORQUE', 108, 145, 64, '#f3f8ff', 780);
      if (page === 'overview') {
        label(chinese ? '已就绪' : 'READY', 1120, 145, 62, '#bcecf5', 780);
        label(chinese ? '模式' : 'MODE', 108, 350, 78, '#a4c5d6', 720);
        label(chinese ? '自动' : 'AUTO', 108, 553, 170, '#f3f8ff', 800);
        label(chinese ? '方向' : 'DIRECTION', 824, 350, 78, '#a4c5d6', 720);
        label(chinese ? '正转' : 'FWD', 824, 553, 170, '#f3f8ff', 800);
        label(chinese ? '目标  1 圈' : 'TARGET  1 TURN', 108, 748, 67, '#c4e7f1', 730);
        texture.needsUpdate = true;
        return;
      }
      const statuses = chinese ? ['已就绪','夹持中','已完成'] : ['READY','GRIPPING','COMPLETE'];
      const status = statuses[state];
      const statusColor = state === 2 ? '#c9ffe6' : '#d6f8ff';
      roundedBox(988, 75, 433, 94, 43, state === 2 ? '#173e33' : '#173744');
      ctx.beginPath();
      ctx.arc(1036, 124, 11, 0, 2*Math.PI);
      ctx.fillStyle = statusColor;
      ctx.fill();
      label(status, 1068, 146, 60, statusColor, 800);
      label(chinese ? '语音指令' : 'VOICE COMMAND', 111, 323, 79, '#c7e9f5', 760);
      label(chinese ? '夹持' : 'GRIP', 98, 606, 265, '#f8fcff', 835);
      roundedBox(111, 725, 1310, 22, 10, '#264a5e');
      if (completion > 0) roundedBox(111, 725, Math.max(22, 1310 * completion / 30), 22, 10, statusColor);
      texture.needsUpdate = true;
    }
  };
}

export function makeWakeDisplay() {
  return new THREE.ShaderMaterial({
    uniforms: { opacity: {value: 0}, clock: {value: 0} },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 surfaceUV;
      void main() {
        surfaceUV=uv;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }`,
    fragmentShader: `
      varying vec2 surfaceUV;
      uniform float opacity;
      uniform float clock;
      float beam(float x,float y,float phase,float size) {
        float spread=exp(-8.*x*x);
        float a=spread*(.09+.10*sin(clock*8.+phase));
        float path=a*(sin(x*17.+phase-clock*14.)*.65+sin(x*32.-phase+clock*9.)*.25);
        float d=abs(y-path);
        float detail=max(fwidth(y-path),.0019);
        return (1.-smoothstep(size,size+detail*1.2,d))*.86 + exp(-d*70.)*.36;
      }
      void main() {
        vec2 uv=surfaceUV;
        float x=(uv.x-.5)*2.;
        float y=uv.y-.5;
        float edge=1.-smoothstep(.57,.96,abs(x));
        vec3 wave=beam(x,y,0.,.0032)*vec3(.14,.63,1.)
          +beam(x,y,.9,.0023)*vec3(.46,.28,.96)
          +beam(x,y,2.1,.0027)*vec3(.19,.90,.86);
        vec3 glass=vec3(.005,.015,.028)+vec3(.014,.034,.068)*exp(-9.*x*x-21.*y*y);
        gl_FragColor=vec4(glass+edge*wave,opacity);
        #include <colorspace_fragment>
      }`
  });
}

export function makeWakeWaves(tool) {
  const geometry = new THREE.PlaneGeometry(.18, .18);
  const waves = [];
  for (let i = 0; i < 3; i++) {
    const material = new THREE.ShaderMaterial({
      uniforms: { age: {value: -1}, azimuth: {value: .68 * i}, lightTheme: {value: 0} },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 planeUV;
        void main() {
          planeUV=uv;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
        }`,
      fragmentShader: `
        varying vec2 planeUV;
        uniform float age;
        uniform float azimuth;
        uniform float lightTheme;
        void main() {
          vec2 point=(planeUV-.5)*2.;
          float radius=length(point);
          float target=mix(.31,.96,1.-pow(1.-age,1.45));
          float offset=abs(radius-target);
          float edge=max(fwidth(radius),.003);
          float line=1.-smoothstep(.001,.003+edge,offset);
          float halo=exp(-offset*offset/ .00009);
          float sweep=pow(.5+.5*cos(atan(point.y,point.x)*2.+azimuth),2.);
          float fade=smoothstep(0.,.18,age)*(1.-smoothstep(.42,1.,age));
          vec3 color=mix(vec3(.19,.68,.85),vec3(.03,.32,.47),lightTheme);
          gl_FragColor=vec4(color,(line*.45+halo*.11)*sweep*fade);
          #include <colorspace_fragment>
        }`
    });
    const object = new THREE.Mesh(geometry, material);
    object.rotation.x = -Math.PI / 2;
    object.position.set(-.045, .041 + .001*i, 0);
    object.renderOrder = 3;
    object.visible = false;
    tool.add(object);
    waves.push(object);
  }
  return frame => {
    for (let i = 0; i < waves.length; i++) {
      const age = (frame.progress - .594 - .017 * i) / .077;
      const wave = waves[i];
      wave.visible = age > 0 && age < 1;
      if (wave.visible) {
        wave.material.uniforms.age.value = age;
        wave.material.uniforms.lightTheme.value = frame.light ? 1 : 0;
      }
    }
  };
}
