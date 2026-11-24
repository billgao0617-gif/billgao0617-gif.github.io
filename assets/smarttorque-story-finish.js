import * as THREE from 'three';

export function makeStudioEnvironment(renderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(.020,.024,.031);
  const panels = [
    [[-.52, .92,.64], 1.62,.66,4.8,0xfaf7f2],
    [[ .53, .46, .99],.27,1.05,2.35,0xe7f0ff],
    [[-.22,-.54,1.08],1.58,.43,1.85,0xe4edf8],
    [[ .18,1.23,-.73],1.49,.38,4.8,0xe2ecfa],
    [[-.97,-.32,.29], .69,.50,1.45,0xf3ede5],
    [[ .84,-.19,-.82],.38,1.22,2.1,0xd8e7f9],
    [[-.23, .20,-1.15],.64,.92,1.6,0xf1e7dc]
  ];
  for (const [position,width,height,power,color] of panels) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        lamp: {value: new THREE.Color(color).multiplyScalar(power)},
        room: {value: studio.background}
      },
      toneMapped: false,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 sheetUV;
        void main() {
          sheetUV = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
        }`,
      fragmentShader: `
        varying vec2 sheetUV;
        uniform vec3 lamp, room;
        void main() {
          vec2 edge = abs(2. * sheetUV - 1.);
          float softbox = (1.-smoothstep(.63,.99,edge.x))*(1.-smoothstep(.51,.985,edge.y));
          float diffusion = 1.-.26*dot(edge,edge);
          gl_FragColor = vec4(mix(room,lamp,softbox*diffusion),1.);
        }`
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
    panel.position.set(...position);
    panel.lookAt(0,0,0);
    studio.add(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio,.010,.05,8);
  pmrem.dispose();
  studio.traverse(object => {
    object.geometry?.dispose();
    object.material?.dispose();
  });
  return environment;
}

const finishNormal = `
  vec3 finishNormal(vec3 surface, vec3 basis, float relief) {
    vec3 dx = dFdx(surface);
    vec3 dy = dFdy(surface);
    vec3 rx = cross(dy,basis);
    vec3 ry = cross(basis,dx);
    float determinant = dot(dx,rx);
    vec3 offset = sign(determinant) * (dFdx(relief)*rx + dFdy(relief)*ry);
    return normalize(max(1.e-12,abs(determinant))*basis - offset);
  }`;

export function brushedMetal(color, roughness = .24, grainAxis = 'y') {
  const material = new THREE.MeshPhysicalMaterial({
    color, metalness: .88, roughness, side: THREE.DoubleSide, clearcoat: .12, clearcoatRoughness: .32
  });
  material.customProgramCacheKey = () => 'smarttorque-brushed-metal-' + grainAxis;
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec3 machining;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nmachining=position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 machining;
        ${finishNormal}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        float crossGrain = machining.${grainAxis}*1000.;
        float footprint = fwidth(crossGrain);
        float fineGrain = sin(crossGrain*18.9+sin(crossGrain*5.31)*.55)*(1.-smoothstep(.08,.28,footprint));
        float lathe = sin(crossGrain*4.91+.7*sin(crossGrain*2.1))*(1.-smoothstep(.24,.79,footprint));
        roughnessFactor = clamp(roughnessFactor+.009*lathe+.011*fineGrain,.12,.65);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        normal = finishNormal(-vViewPosition,normal,.0000006*fineGrain+.00000095*lathe);`);
  };
  return material;
}

const paintGrain = `
  float flakeHash(vec3 cell) {
    vec3 folded = fract(cell*.1031);
    folded += dot(folded,folded.yzx+33.33);
    return fract((folded.x+folded.y)*folded.z);
  }
  float flakeNoise(vec3 p) {
    vec3 cell=floor(p);
    vec3 f=fract(p);
    f=f*f*(3.-2.*f);
    vec2 rows=mix(vec2(flakeHash(cell),flakeHash(cell+vec3(0,0,1))),
      vec2(flakeHash(cell+vec3(1,0,0)),flakeHash(cell+vec3(1,0,1))),f.x);
    vec2 farRows=mix(vec2(flakeHash(cell+vec3(0,1,0)),flakeHash(cell+vec3(0,1,1))),
      vec2(flakeHash(cell+vec3(1,1,0)),flakeHash(cell+vec3(1,1,1))),f.x);
    return mix(mix(rows.x,farRows.x,f.y),mix(rows.y,farRows.y,f.y),f.z)-.5;
  }`;

export function makeBodyFinish(logo, transform, grip, preserveBody = false) {
  const material = new THREE.MeshPhysicalMaterial({
    color:0x254461,
    metalness:.26,
    roughness:.345,
    clearcoat:.32,
    clearcoatRoughness:.27,
    side:THREE.DoubleSide
  });
  material.customProgramCacheKey = () => grip ? 'smarttorque-lacquer-grip-' + preserveBody : 'smarttorque-lacquer-shell';
  material.onBeforeCompile = shader => {
    shader.uniforms.bodyToScene = {value:transform};
    shader.uniforms.brandMark = {value:logo};
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 bodyToScene; varying vec3 bodyPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nbodyPosition=(bodyToScene*vec4(position,1.)).xyz*1000.;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D brandMark;
        varying vec3 bodyPosition;
        ${finishNormal}
        ${paintGrain}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 p = bodyPosition;
        float footprint = length(fwidth(p));
        float lacquer=flakeNoise(p*3.5)*(1.-smoothstep(.11,.41,footprint));
        float powder=flakeNoise(p*1.45+vec3(13.4,8.9,7.3))*(1.-smoothstep(.31,.90,footprint));
        diffuseColor.rgb*=.997+.036*lacquer+.049*powder;
        float carbon = 0.;
        float fiber = 0.;
        float trigger = 0.;
        float mark = 0.;
        float seam = 0.;
        ${grip ? `
          ${preserveBody ? `
          vec2 logoUV=(p.xy-vec2(-82.,-13.))/vec2(39.,28.);
          if(p.z<0.) logoUV.x=1.-logoUV.x;
          if(abs(p.z)>17. && all(greaterThanEqual(logoUV,vec2(0.))) && all(lessThanEqual(logoUV,vec2(1.)))) {
            vec3 ink=texture2D(brandMark,logoUV).rgb;
            mark=1.-smoothstep(.49,.91,max(max(ink.r,ink.g),ink.b));
            diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.52,.56,.61)*(1.+.03*powder),mark);
          }` : 'if(p.y > -25. && p.x < 8.5) discard;'}
          float gripBorder = -56.-.15*(p.y+90.)+4.2*exp(-pow((p.y+64.)/19.,2.));
          carbon = (1.-smoothstep(-.38,.36,p.x-gripBorder))*smoothstep(38.,41.,-p.y);
          float gripCenter = -49.+.29*(p.y+82.);
          float around = atan(p.z,gripCenter-p.x)*(13.+.093*clamp(-p.y-48.,0.,100.));
          vec2 twill = mat2(.82,-.57,.57,.82)*vec2(around,p.y)*.91;
          vec2 tile = floor(twill);
          vec2 segment = fract(twill);
          float warp = step(2.,mod(tile.x-tile.y,4.));
          float crossFiber = mix(segment.x,segment.y,warp);
          float alongFiber = mix(twill.y,twill.x,warp);
          float core = max(0.,sin(3.14159265*crossFiber));
          float arch = pow(core,.59);
          float coverage = 1.-smoothstep(.24,.92,length(fwidth(twill)));
          float filaments = cos(6.2831853*(9.*crossFiber+.023*sin(alongFiber*13.)));
          float detail = 1.-smoothstep(.045,.13,length(fwidth(twill)));
          float yarn = mix(.018,.055,arch)*mix(.87,1.13,warp)+.0031*filaments*detail;
          float weaveJoin=smoothstep(.035,.16,min(min(segment.x,1.-segment.x),min(segment.y,1.-segment.y)));
          fiber=carbon*coverage*(core-.45)*weaveJoin;
          diffuseColor.rgb = mix(diffuseColor.rgb,vec3(mix(.033,yarn,coverage))*vec3(.91,.96,1.),carbon);
          float inlay = (1.-smoothstep(.16,.43,abs(p.x-gripBorder)))*smoothstep(40.,42.,-p.y)
            *smoothstep(-148.,-142.,p.y);
          diffuseColor.rgb = mix(diffuseColor.rgb,vec3(.23,.26,.29),inlay*.59);
          trigger = smoothstep(-26.,-24.,p.x)*smoothstep(-75.,-71.,p.y)
            *(1.-smoothstep(-33.,-31.,p.y))*(1.-smoothstep(8.5,10.5,abs(p.z)));
          diffuseColor.rgb = mix(diffuseColor.rgb,vec3(.48,.50,.52)*(.98+.022*powder),trigger);
        ` : `
          float panelSeam=-14.+1.4*smoothstep(-69.,-66.,p.x)-1.4*smoothstep(-40.,-37.,p.x);
          float span=smoothstep(-101.,-97.,p.x)*(1.-smoothstep(-11.,-7.,p.x))*smoothstep(18.,21.,abs(p.z));
          seam=span*(1.-smoothstep(.035,.32,abs(p.y-panelSeam)));
          diffuseColor.rgb*=1.-.50*seam;
          vec2 uv=(p.xy-vec2(-78.,-9.))/vec2(40.,29.);
          if(p.z<0.) uv.x=1.-uv.x;
          if(abs(p.z)>17. && all(greaterThanEqual(uv,vec2(0.))) && all(lessThanEqual(uv,vec2(1.)))) {
            vec3 ink=texture2D(brandMark,uv).rgb;
            float paper=max(max(ink.r,ink.g),ink.b);
            mark=1.-smoothstep(.49,.91,paper);
            float engraving=1.+.026*powder+.024*lacquer;
            vec3 nickel=mix(vec3(.47,.49,.52),vec3(.72,.75,.79),smoothstep(.08,.62,paper));
            diffuseColor.rgb=mix(diffuseColor.rgb,nickel*engraving,mark);
          }
        `}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor += .021*lacquer+.019*powder;
        roughnessFactor = mix(roughnessFactor,.29,carbon)-.078*fiber;
        roughnessFactor = mix(roughnessFactor,.26,max(mark,trigger));`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
        metalnessFactor=mix(mix(metalnessFactor,.12,carbon),.86,max(mark,trigger));`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        float paintRelief = (.0000028*lacquer+.000007*powder)*(1.-max(carbon,max(mark,trigger)));
        float relief = paintRelief + .000033*fiber + .000047*mark - .000025*seam;
        normal = finishNormal(-vViewPosition,normal,relief);`);
  };
  return material;
}

export function roundedDeck(width, depth, radius, tailLength = radius, tailWidth = radius) {
  const x = width / 2;
  const z = depth / 2;
  const k = .55228475;
  const shape = new THREE.Shape();
  shape.moveTo(-x + tailLength, -z);
  shape.lineTo(x - radius, -z);
  shape.bezierCurveTo(x-radius+k*radius,-z,x,-z+radius-k*radius,x,-z+radius);
  shape.lineTo(x, z - radius);
  shape.bezierCurveTo(x,z-radius+k*radius,x-radius+k*radius,z,x-radius,z);
  shape.lineTo(-x + tailLength, z);
  shape.bezierCurveTo(-x+tailLength-k*tailLength,z,-x,z-tailWidth+k*tailWidth,-x,z-tailWidth);
  shape.lineTo(-x, -z + tailWidth);
  shape.bezierCurveTo(-x,-z+tailWidth-k*tailWidth,-x+tailLength-k*tailLength,-z,-x+tailLength,-z);
  return shape;
}

export function deckShoulder(profile) {
  const positions = [];
  const indices = [];
  let count = 0;
  for (const [height, width, depth, radius, offset = 0, tailLength = radius, tailWidth = radius] of profile) {
    const points = roundedDeck(width,depth,radius,tailLength,tailWidth).getPoints(20);
    if (points.at(-1).distanceToSquared(points[0]) < 1e-16) points.pop();
    count = points.length;
    for (const point of points) positions.push(point.x+offset,height,-point.y);
  }
  for (let row = 0; row < profile.length-1; row++) {
    for (let i = 0; i < count; i++) {
      const a = row*count+i, b = row*count+(i+1)%count;
      indices.push(a,b,a+count,b,b+count,a+count);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function loft(sections, radial = 112) {
  const positions = [];
  const indices = [];
  for (const [x, radius] of sections) {
    for (let i = 0; i < radial; i++) {
      const angle = i * Math.PI * 2 / radial;
      positions.push(x,Math.cos(angle)*radius,Math.sin(angle)*radius);
    }
  }
  for (let row = 0; row < sections.length - 1; row++) {
    for (let i = 0; i < radial; i++) {
      const left = row * radial + i;
      const next = row * radial + (i+1) % radial;
      indices.push(left, next, left+radial, next, next+radial, left+radial);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export const displayFit = { x: -.050, y: .02925, width: .1084, depth: .0508, radius: .0125 };

export function addCommercialHousing(tool, bodyMaterial, noseMaterial) {
  const {x,y,width,depth,radius} = displayFit;
  // Both planes of the tail are curved: its horizontal sections wrap into
  // an oval, and successive sections roll inward toward the grip and glass.
  const sections = [
    [-.0308,.087,.038,.016,.0106,.021,.0175],
    [-.0280,.099,.044,.017,.0063,.025,.0205],
    [-.0225,.111,.049,.018,.0017,.029,.0230],
    [-.0140,.119,.053,.018,-.0010,.030,.0250],
    [-.0040,.123,.055,.018,-.0017,.029,.0250],
    [ .0070,.123,.055,.017,-.0021,.026,.0235],
    [ .0160,.120,.054,.016,-.0015,.022,.0200],
    [ .0230,.115,.0528,.014,-.0012,.017,.0165],
    [ .0265,.111,.0518,.013,-.0005,.0142,.0140],
    [y-.00095,width,depth,radius,0,radius,radius]
  ];
  const curves = sections[0].slice(1).map((_, index) =>
    new THREE.SplineCurve(sections.map(row => new THREE.Vector2(row[0],row[index+1]))));
  const profile = Array.from({length: 55},(_, index) => {
    const points = curves.map(curve => curve.getPoint(index/54));
    return [points[0].x,...points.map(point => point.y)];
  });
  profile.unshift([-.0308,.002,.002,.00065,.0106]);
  profile.push([y-.00095,.002,.002,.00065]);
  const main = new THREE.Mesh(deckShoulder(profile),bodyMaterial);
  main.geometry.translate(x,0,0);
  main.name = 'Closed satin navy housing';
  tool.add(main);
  // Covers the shoulder of the retained gear carrier, leaving its mating faces
  // and both open-frame solenoids at their original positions.
  const neck = new THREE.Mesh(loft([
    [.0206,.015],[.0207,.028],[.0224,.0304],[.025,.0313],
    [.041,.0317],[.0446,.0308],[.046,.030],[.0461,.015],[.0206,.015]
  ]), noseMaterial);
  neck.name = 'Quick-release shoulder finish';
  tool.add(neck);
}
