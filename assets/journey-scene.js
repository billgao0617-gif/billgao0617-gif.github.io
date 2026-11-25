import * as THREE from 'three';
import { cloneCadPart, isBodyPart, loadCadManifest, solidWorksMatrix } from './cad-assets.js?v=adb15ad71e35';
import { addCommercialHousing, brushedMetal, deckShoulder, displayFit, makeBodyFinish, makeStudioEnvironment, roundedDeck } from './smarttorque-story-finish.js?v=b0f44731fe7f';

const orientation = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI, 0, -Math.PI / 2));
const lerp = THREE.MathUtils.lerp;
const ease = THREE.MathUtils.smoothstep;
const fov = 30;
const lens = 2 * Math.tan(THREE.MathUtils.degToRad(fov / 2));
const driveAxis = new THREE.Vector3(1, 0, 0);
const vertical = new THREE.Vector3(0, 1, 0);
const registration = row => orientation.clone().multiply(solidWorksMatrix(row.transform));
const number = row => Number(row.url.match(/-(\d+)\.wrl$/)?.[1]);

// Millimetre-scale moves are separate from the SolidWorks placements.
// Each part ends with its original CAD transform, including the hidden mechanisms.
const entry = {
  7: [.04, .20, [-.005, -.048, -.033]],
  4: [.11, .25, [.025, -.015, .045]],
  9: [.18, .30, [-.021, .022, .052]],
  8: [.24, .38, [.054, .001, 0]],
  3: [.31, .44, [-.068, 0, 0]],
  1: [.37, .50, [-.055, .018, 0]],
  2: [.42, .56, [-.029, .039, .016]],
  5: [.51, .66, [.010, .034, .017]],
  13: [.54, .69, [-.014, .074, .045]],
  18: [.58, .72, [.008, .074, -.026]],
  10: [.66, .79, [0, .100, 0]],
  12: [.73, .85, [.003, .116, .011]],
  11: [.78, .90, [0, .067, 0]],
  22: [.80, .92, [.081, 0, 0]],
  28: [.86, .96, [.092, 0, 0]],
  27: [.91, 1, [.095, 0, 0]]
};

const material = (color, metalness = .55, roughness = .33) =>
  new THREE.MeshPhysicalMaterial({ color, metalness, roughness, side: THREE.DoubleSide });

function mesh(group, geometry, finish, x = 0, y = 0, z = 0) {
  const item = new THREE.Mesh(geometry, finish);
  item.position.set(x, y, z);
  group.add(item);
  return item;
}

function machinedBox(width, height, depth, edge = .0014) {
  const x = width / 2 - edge;
  const y = height / 2 - edge;
  const shape = new THREE.Shape().moveTo(-x, -y).lineTo(x, -y).lineTo(x, y).lineTo(-x, y).closePath();
  const middle = depth - edge * 2;
  return new THREE.ExtrudeGeometry(shape, {
    depth: middle, bevelThickness: edge, bevelSize: edge, bevelSegments: 3, steps: 1
  }).translate(0, 0, -middle / 2);
}

function lathe(group, zones, finish, x = 0, y = 0, z = 0) {
  const profile = zones.map(([radius, axis]) => new THREE.Vector2(radius, axis));
  const body = mesh(group, new THREE.LatheGeometry(profile, 64), finish, x, y, z);
  body.rotation.z = -Math.PI / 2;
  return body;
}

function lightAt(color, power, point) {
  const light = new THREE.DirectionalLight(color, power);
  light.position.set(...point);
  return light;
}

function makeBench(scene, steel, slate, socketEnd, gripBox) {
  const bench = new THREE.Group();
  const skirt = brushedMetal(0x626f78, .38, 'x');
  const anodized = material(0x1d2d3c, .52, .32);
  const rubber = material(0x14232e, .12, .53);
  const glow = new THREE.MeshStandardMaterial({color: 0x579baa, emissive: 0x78e0f5, emissiveIntensity: .12});
  const floorY = gripBox.min.y - .041;
  const baseX = .056;
  mesh(bench, machinedBox(.42, .013, .212, .0022), skirt, baseX, floorY - .006, 0);
  mesh(bench, machinedBox(.428, .006, .219, .0015), anodized, baseX, floorY - .016, 0);
  const groove = machinedBox(.398, .00065, .0013, .00022);
  for (let i = -4; i <= 4; i++) mesh(bench, groove, rubber, baseX, floorY + .0006, .019 * i);
  const gripCenter = gripBox.getCenter(new THREE.Vector3()).x + .010;
  mesh(bench, machinedBox(.067, .012, .088), slate, gripCenter, floorY + .006);
  mesh(bench, machinedBox(.052, .034, .052), steel, gripCenter, floorY + .017);
  mesh(bench, machinedBox(.056, .008, .059), rubber, gripCenter, gripBox.min.y - .005);

  const tower = new THREE.Group();
  tower.position.x = socketEnd + .029;
  bench.add(tower);
  mesh(tower, machinedBox(.083, .015, .127), slate, .005, floorY + .008);
  mesh(tower, machinedBox(.048, -floorY-.004, .091), anodized, .018, floorY / 2);
  mesh(tower, machinedBox(.056, .026, .099), skirt, .018, floorY + .038);
  lathe(tower, [[0,-.029],[.014,-.029],[.016,-.026],[.021,-.018],[.021,-.016],
    [.038,-.015],[.045,-.010],[.046,-.005],[.046,.025],[.042,.030],[0,.030]], steel);
  lathe(tower, [[.044,.005],[.049,.007],[.049,.019],[.044,.020]], slate);
  for (const side of [-1, 1]) {
    const lock = new THREE.Group();
    mesh(lock, machinedBox(.049, .033, .018), steel, .005);
    mesh(lock, machinedBox(.031, .021, .005), rubber, -.004, 0, -side * .008);
    mesh(lock, machinedBox(.019, .002, .0028, .0005), glow, .013, .016, side * .004);
    tower.add(lock);
    lock.userData.side = side;
  }
  const terminals = tower.children.slice(-2);
  const screw = new THREE.CylinderGeometry(.0038, .0038, .0025, 12);
  for (const x of [-.066,.188]) {
    for (const z of [-.083,.083]) mesh(bench, screw, steel, x, floorY + .0018, z);
  }
  scene.add(bench);
  return {
    focus: new THREE.Vector3(socketEnd + .032, .019, .039),
    pose(appearance, close, exit, inspection) {
      bench.visible = appearance > .135 && exit < .997;
      bench.position.set(.62*exit,-.220*(1-appearance)-.092*exit,0);
      tower.position.x = socketEnd + .029 + .14 * (1 - appearance);
      for (const lock of terminals) lock.position.z = lock.userData.side * lerp(.101, .046, close);
      glow.emissiveIntensity = .12 + inspection * 1.85 + close * .36;
      this.focus.y = .019 + bench.position.y;
      this.focus.x = socketEnd+.032+bench.position.x;
    }
  };
}

function makeChamber(scene, steel, gripBox) {
  const enclosure = new THREE.Group();
  scene.add(enclosure);
  const body = brushedMetal(0x546577,.28,'x');
  const frame = brushedMetal(0x8295a6,.32,'x');
  const seal = material(0x172636,.14,.44);
  const led = new THREE.MeshStandardMaterial({color: 0xb4daee, emissive: 0x65c4f9, emissiveIntensity: .28});
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x7bb2ce, metalness: .18, roughness: .24, transparent: true,
    opacity: .13, depthWrite: false, side: THREE.DoubleSide
  });
  const left = -.137, right = .237, top = .145, floor = gripBox.min.y - .024;
  const center = (left + right) / 2, openingHeight = top - floor, middle = (top + floor) / 2;
  const openingWidth = right - left;
  const front = .081, back = -.094;
  mesh(enclosure, machinedBox(.413,.031,.204,.004),body,center,floor-.016,-.004);
  const hingeZ = -.104;
  const lid = new THREE.Group();
  lid.position.set(0,top+.006,hingeZ);
  enclosure.add(lid);
  mesh(lid, machinedBox(.404,.015,.198,.002),body,center,0,-.004-hingeZ);
  mesh(lid, machinedBox(.384,.003,.181,.001),seal,center,-.008,-.004-hingeZ);
  for(const x of [center-.041,center+.041]) {
    mesh(lid,machinedBox(.013,.020,.012,.0015),frame,x,.015,.163);
  }
  mesh(lid,machinedBox(.095,.009,.009,.002),steel,center,.027,.163);
  for(const x of [left+.034,right-.034]) {
    mesh(enclosure,new THREE.CylinderGeometry(.009,.009,.043,24),steel,x,top+.005,hingeZ).rotation.z = Math.PI/2;
  }
  mesh(enclosure, machinedBox(.407,openingHeight,.011),seal,center,middle,back);
  const pillar = machinedBox(.016,openingHeight,.016,.002);
  for(const x of [left,right]) {
    for(const z of [back,front]) mesh(enclosure,pillar,frame,x,middle,z);
    const sideWindow = mesh(enclosure,new THREE.PlaneGeometry(.164,openingHeight-.020),glass,x,middle,-.006);
    sideWindow.rotation.y = Math.PI / 2;
  }
  for(const y of [floor,top]) mesh(enclosure,machinedBox(openingWidth,.013,.014,.002),steel,center,y,front);
  for(const x of [left+.016,right-.016]) {
    mesh(enclosure,machinedBox(.003,openingHeight-.029,.003,.0006),led,x,middle,back+.015);
  }
  for(let i = 0; i < 7; i++) {
    mesh(lid,machinedBox(.077,.002,.014,.0005),frame,right-.045,.008,-.049-hingeZ+.013*i);
  }
  const standX = gripBox.getCenter(new THREE.Vector3()).x+.010;
  mesh(enclosure,machinedBox(.064,.019,.063),seal,standX,floor+.013);
  const door = new THREE.Group();
  door.position.set(left+.004,middle,front+.006);
  enclosure.add(door);
  const doorWidth = openingWidth-.008;
  const rail = machinedBox(doorWidth,.012,.013,.002);
  for(const sign of [-1,1]) mesh(door,rail,frame,doorWidth/2,sign*(openingHeight/2-.002),0);
  const jamb = machinedBox(.013,openingHeight,.014,.002);
  for(const x of [.005,doorWidth-.003]) mesh(door,jamb,frame,x,0,0);
  const face = mesh(door,new THREE.PlaneGeometry(doorWidth-.015,openingHeight-.015),glass,doorWidth/2,0,.002);
  face.renderOrder = 5;
  const latchX = doorWidth-.019;
  mesh(door,machinedBox(.013,.062,.019),seal,latchX,0,.008);
  mesh(door,machinedBox(.009,.047,.009),steel,latchX,0,.022);
  mesh(door,machinedBox(.004,.010,.005,.00065),led,latchX,.033,.015);
  for(const y of [-.072,.072]) {
    mesh(enclosure,new THREE.CylinderGeometry(.009,.009,.030,32),steel,left, middle+y,front+.006);
  }
  const conditionedLight = new THREE.PointLight(0x9cdbff,0,.72,1.65);
  conditionedLight.position.set(.060,top-.034,-.054);
  enclosure.add(conditionedLight);
  const exposureColors = [0x9cdbff,0xbd92f3,0x6ad4ff,0xffa66b].map(hex => new THREE.Color(hex));
  const exposureColor = new THREE.Color();
  const radiation = new THREE.Group();
  const beamColor = new THREE.MeshBasicMaterial({
    color:0xdbb7ff, transparent:true, opacity:0, depthWrite:false, toneMapped:false
  });
  const glowColor = new THREE.MeshBasicMaterial({
    color:0x9361ee, transparent:true, opacity:0, depthWrite:false,
    blending:THREE.AdditiveBlending, toneMapped:false
  });
  const fieldColor = new THREE.MeshBasicMaterial({
    color:0xa56cf6, side:THREE.DoubleSide, transparent:true, opacity:0, depthWrite:false
  });
  const scanHeight = openingHeight-.038;
  const beam = new THREE.CylinderGeometry(.00125,.00125,scanHeight,8);
  const halo = new THREE.CylinderGeometry(.0038,.0038,scanHeight,10);
  for (const z of [-.064,-.025,.021,.063]) {
    mesh(radiation,beam,beamColor,0,middle,z).renderOrder = 7;
    mesh(radiation,halo,glowColor,0,middle,z).renderOrder = 6;
  }
  const field = mesh(radiation,new THREE.PlaneGeometry(.139,scanHeight),fieldColor,0,middle,0);
  field.rotation.y = Math.PI/2;
  field.renderOrder = 6;
  const scanLight = new THREE.PointLight(0x9a5eff,0,.20,1.45);
  scanLight.position.set(0,.026,.018);
  radiation.add(scanLight);
  enclosure.add(radiation);
  return {
    liftClearance: top+.020-gripBox.min.y,
    pose(state) {
      const {chamber:amount, door:closed=0, conditioning=0, exposureKind:phase=0} = state;
      const blend = state.exposureMix ?? 1;
      enclosure.visible = amount > .07;
      enclosure.position.y = -.72*(1-amount);
      lid.rotation.x = -1.88*(state.hatch ?? 0);
      door.rotation.y = -1.37*(1-closed);
      exposureColor.copy(exposureColors[Math.max(0,phase-1)]).lerp(exposureColors[phase],blend);
      if (closed > .96) led.emissive.copy(exposureColor);
      else led.emissive.setHex(0xffb56a);
      led.emissiveIntensity = .54 + 1.9*conditioning;
      conditionedLight.color.copy(exposureColor);
      conditionedLight.intensity = .013*conditioning;
      glass.color.copy(exposureColor);
      glass.opacity = .093 + .11*conditioning;
      const scan = (phase === 1 ? blend : phase === 2 ? 1-blend : 0)*conditioning;
      radiation.visible = scan > .01;
      radiation.position.x = lerp(left+.014,right-.014,state.scan ?? 0);
      beamColor.opacity = .90*scan;
      glowColor.opacity = .55*scan;
      fieldColor.opacity = .18*scan;
      scanLight.intensity = .014*scan;
    }
  };
}

function makeInterface(scene, steel, slate, socketEnd, pliersEnd) {
  const rig = new THREE.Group();
  scene.add(rig);
  const tint = new THREE.MeshPhysicalMaterial({color: 0x204756, metalness: .34, roughness: .31, transparent: true, opacity: .26, depthWrite: false});
  const plateGeometry = machinedBox(.143, .106, .008, .0017).rotateY(Math.PI / 2);
  mesh(rig, plateGeometry, tint);
  const shell = new THREE.LineSegments(new THREE.EdgesGeometry(plateGeometry, 30), new THREE.LineBasicMaterial({color: 0x6dd6ed, transparent: true, opacity: .50}));
  rig.add(shell);
  const axis = new THREE.Group();
  const optical = new THREE.MeshBasicMaterial({color: 0x7bdef1, transparent: true, opacity: 0});
  const dash = new THREE.CylinderGeometry(.00038, .00038, .005, 8).rotateZ(Math.PI / 2);
  for (let i = 0; i < 18; i++) mesh(axis, dash, optical, -.004 - .008 * i);
  rig.add(axis);
  const reticle = new THREE.Group();
  reticle.rotation.y = Math.PI / 2;
  const stroke = new THREE.TorusGeometry(.025, .00042, 6, 52, Math.PI * .32);
  for (let i = 0; i < 4; i++) mesh(reticle, stroke, optical).rotation.z = i * Math.PI / 2 + .25;
  rig.add(reticle);
  const pin = lathe(rig, [[0,-.028],[.009,-.028],[.01,-.023],[.01,-.005],[.019,-.005],[.021,-.002],[.021,.002],[0,.002]], slate);
  mesh(rig,new THREE.CylinderGeometry(.010, .010, .009, 6), steel, -.028).rotation.z = Math.PI / 2;
  const bolt = rig.children.at(-1);
  const gripTarget = new THREE.Group();
  mesh(gripTarget, machinedBox(.055, .013, .026), steel, -.024);
  mesh(gripTarget, machinedBox(.012, .036, .053), slate, -.006);
  rig.add(gripTarget);
  return {
    joint: new THREE.Vector3(),
    pose(appearance, dock, task, light) {
      const grip = task > .5;
      const target = lerp(socketEnd, pliersEnd, task);
      rig.visible = appearance > .002;
      rig.position.x = target + .033 + .113 * (1 - appearance) - .007 * dock;
      pin.visible = bolt.visible = !grip;
      gripTarget.visible = grip;
      tint.opacity = lerp(.16, .51, dock);
      optical.opacity = appearance * (.82 - .59 * dock);
      optical.color.setHex(light ? 0x155d79 : 0xa0eaff);
      shell.material.color.copy(optical.color);
      shell.material.opacity = appearance * (.80 - .42 * dock);
      reticle.rotation.z = -.44 * (1 - appearance);
      this.joint.set(rig.position.x - .028, 0, 0);
    }
  };
}

function faceGraphic() {
  const surface = document.createElement('canvas');
  surface.width = 768;
  surface.height = 360;
  const ctx = surface.getContext('2d');
  const gradient = ctx.createLinearGradient(0,0,715,360);
  gradient.addColorStop(0, '#123342');
  gradient.addColorStop(1, '#061019');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,768,360);
  ctx.fillStyle = '#def4f9';
  ctx.font = '650 47px Manrope, sans-serif';
  ctx.fillText('SMARTTORQUE', 46, 94);
  ctx.fillStyle = '#81c7d5';
  ctx.fillRect(47,126,674,2);
  ctx.font = '740 100px Manrope, sans-serif';
  ctx.fillText('READY', 38, 270);
  const texture = new THREE.CanvasTexture(surface);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeIntegratedHousing(tool, logo, glass) {
  const shell = new THREE.Group();
  const display = new THREE.Group();
  const shellFinish = makeBodyFinish(logo,new THREE.Matrix4(),false);
  const shoulderFinish = material(0x263e56,.45,.29);
  const rimFinish = brushedMetal(0xb9c6ce,.27,'x');
  const panelFinish = glass.clone();
  const shellFinishes = [shellFinish,shoulderFinish];
  const displayFinishes = [rimFinish,panelFinish];
  addCommercialHousing(shell,shellFinish,shoulderFinish);
  const {x,y,width,depth,radius} = displayFit;
  mesh(display,deckShoulder([
    [y-.0010,width,depth,radius],
    [y+.0001,width-.0012,depth-.0012,radius-.00045],
    [y+.0001,width-.0027,depth-.0027,radius-.00125]
  ]),rimFinish,x);
  const panel = mesh(display,new THREE.ShapeGeometry(roundedDeck(width-.00275,depth-.00275,radius-.00128)),panelFinish,x,y+.00015);
  panel.rotation.x = -Math.PI/2;
  const outline = roundedDeck(width-.00245,depth-.00245,radius-.00113).getPoints(12);
  outline.pop();
  const seamCurve = new THREE.CatmullRomCurve3(outline.map(point =>
    new THREE.Vector3(x+point.x,y+.00075,-point.y)),true);
  const seamFinish = new THREE.MeshBasicMaterial({
    color:0xa7ecf9,transparent:true,opacity:0,depthWrite:false,toneMapped:false
  });
  const seam = mesh(display,new THREE.TubeGeometry(seamCurve,120,.00042,6,true),seamFinish);
  seam.renderOrder = 8;
  tool.add(shell,display);
  return function pose(mix,scan) {
    const seat = ease(mix,.21,.85);
    const glassSeat = ease(mix,.52,1);
    const shellOpacity = ease(mix,.115,.265);
    const displayOpacity = ease(mix,.405,.56);
    shell.visible = shellOpacity > .003;
    display.visible = displayOpacity > .003;
    for (const finish of shellFinishes) {
      finish.transparent = shellOpacity < 1;
      finish.opacity = shellOpacity;
    }
    for (const finish of displayFinishes) {
      finish.transparent = displayOpacity < 1;
      finish.opacity = displayOpacity;
    }
    shell.position.set(.039*(1-seat),.072*(1-seat),.050*(1-seat));
    shell.rotation.set(.13*(1-seat),-.23*(1-seat),-.092*(1-seat));
    display.position.set(-.030*(1-glassSeat),.099*(1-glassSeat),-.042*(1-glassSeat));
    display.rotation.set(-.13*(1-glassSeat),.17*(1-glassSeat),.080*(1-glassSeat));
    seam.visible = scan > .001 && scan < .999;
    if (seam.visible) {
      seam.geometry.setDrawRange(0,Math.max(1,Math.ceil(120*scan))*36);
      seamFinish.opacity = .77*(1-ease(scan,.62,1));
    }
  };
}

export async function buildJourneyScene(host) {
  const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'high-performance'});
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const environment = makeStudioEnvironment(renderer);
  const scene = new THREE.Scene();
  scene.environment = environment.texture;
  const shared = new Set();
  const camera = new THREE.PerspectiveCamera(fov, 1, .01, 10);
  const target = new THREE.Vector3();
  const projection = new THREE.Vector3();
  const tool = new THREE.Group();
  scene.add(tool);
  const ambient = new THREE.HemisphereLight(0xe9f2fd, 0x6a7f86, .82);
  const key = lightAt(0xfff3e1, 2.17, [-.55, .91, .72]);
  const rim = lightAt(0xc9e8ff, 1.95, [.55, .66, -.77]);
  const reflection = lightAt(0xe0f3ff, .49, [.12, -.16, .82]);
  scene.add(ambient,key,rim,reflection);
  let logo, readout;

  function release() {
    const finishes = new Set();
    scene.traverse(object => {
      if (object.geometry && !shared.has(object.geometry)) object.geometry.dispose();
      if (object.material) finishes.add(object.material);
    });
    for (const finish of finishes) finish.dispose();
    logo?.dispose();
    readout?.dispose();
    environment.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  try {
    const [manifest,wordmark] = await Promise.all([
      loadCadManifest(), new THREE.TextureLoader().loadAsync('/assets/editorial/smarttorque-wordmark.webp')
    ]);
    logo = wordmark;
    logo.colorSpace = THREE.SRGBColorSpace;
    logo.anisotropy = Math.min(12,renderer.capabilities.getMaxAnisotropy());
    const records = manifest.driver.filter(row => row.visible);
    const bodyRow = records.find(row => number(row) === 6);
    const steel = brushedMetal(0xb9c6ce, .27, 'x');
    const gold = brushedMetal(0xc99d54, .28);
    const dark = material(0x26313d, .60, .35);
    const caseFinish = material(0x304557, .43, .33);
    const pcb = material(0x254a49, .34, .38);
    const glass = material(0x0a1019, .47, .20);
    glass.clearcoat = 1;
    const housing = makeBodyFinish(logo, registration(bodyRow), true, true);
    const housingTrim = new THREE.Plane(new THREE.Vector3(0,-1,0),1);
    housing.clippingPlanes = [housingTrim];
    const finishes = {
      1: gold, 2: dark, 3: steel, 4: caseFinish, 5: steel, 6: housing,
      7: caseFinish, 8: gold, 9: gold, 10: dark, 12: glass, 13: pcb, 18: pcb, 22: caseFinish
    };
    const solids = [];
    const lines = [];
    const trace = new THREE.LineBasicMaterial({color:0xa5f0fc,transparent:true,opacity:0,depthWrite:false});
    const addPart = async (row, container, finish) => {
      const shape = await cloneCadPart(row.url);
      const useOutline = [5,6,7,8,10,12,27,28].includes(number(row));
      const edges = [];
      shape.traverse(child => {
        if (!child.isMesh) return;
        shared.add(child.geometry);
        child.material = finish;
        solids.push(child);
        if (useOutline) {
          const line = new THREE.LineSegments(new THREE.EdgesGeometry(child.geometry,25),trace);
          line.position.copy(child.position);
          line.quaternion.copy(child.quaternion);
          line.scale.copy(child.scale);
          edges.push([child.parent,line]);
          lines.push(line);
        }
      });
      for (const [parent,line] of edges) parent.add(line);
      shape.applyMatrix4(registration(row));
      const bounds = new THREE.Box3().setFromObject(shape);
      const center = bounds.getCenter(new THREE.Vector3());
      const part = new THREE.Group();
      part.position.copy(center);
      shape.position.sub(center);
      part.add(shape);
      container.add(part);
      return { id: number(row), part, shape, bounds, center };
    };
    const driver = new THREE.Group();
    const pliers = new THREE.Group();
    tool.add(driver,pliers);
    const [parts,jaws] = await Promise.all([
      Promise.all(records.map(row => {
        const id = number(row);
        return addPart(row,id === 27 || id === 28 ? driver : tool,finishes[id] ?? steel);
      })),
      Promise.all(manifest.pliers.filter(row => row.visible && !isBodyPart(row) && number(row) !== 22)
        .map(row => addPart(row,pliers,number(row) === 24 ? caseFinish : steel)))
    ]);
    const solidFinishes = new Set(solids.map(part => part.material));
    const drawingBounds = new THREE.Box3();
    for (const part of parts) drawingBounds.union(part.bounds);
    const drawingCenter = drawingBounds.getCenter(new THREE.Vector3());
    const drawingWidth = drawingBounds.max.x-drawingBounds.min.x;
    const order = new Map();
    for (const part of parts) {
      if (!entry[part.id]) continue;
      const variant = order.get(part.id) ?? 0;
      order.set(part.id, variant + 1);
      const [start,end,xyz] = entry[part.id];
      part.entrance = new THREE.Vector3(...xyz);
      if (part.id === 5) part.entrance.z = Math.sign(part.center.z) * .032;
      if (part.id === 11) part.entrance.z = Math.sign(part.center.z) * .013;
      part.start = start + (part.id === 11 ? variant * .026 : variant * .013);
      part.end = end + (part.id === 11 ? variant * .028 : variant * .013);
      if (part.id === 11) part.end = .86 + variant * .035;
    }
    const markerParts = new Map(parts.map(part => [part.id,part]));
    const display = markerParts.get(12);
    const displaySize = display.bounds.getSize(new THREE.Vector3());
    readout = faceGraphic();
    const readoutMaterial = new THREE.MeshBasicMaterial({map: readout, toneMapped: false, transparent: true});
    const lcd = mesh(display.part, new THREE.PlaneGeometry(displaySize.x*.76,displaySize.z*.75), readoutMaterial,
      0,displaySize.y*.5+.00040,0);
    lcd.rotation.x = -Math.PI / 2;
    const socketEnd = markerParts.get(27).bounds.max.x;
    const pliersEnd = Math.max(...jaws.map(part => part.bounds.max.x));
    const gripBox = markerParts.get(6).bounds;
    const poseIntegrated = makeIntegratedHousing(tool,logo,glass);
    const covers = new Set([7,10,11,12]);
    const electronics = new Set([2,4,9,13,18]);
    const bench = makeBench(scene,steel,dark,socketEnd,gripBox);
    const chamber = makeChamber(scene,steel,gripBox);
    const interfaceRig = makeInterface(scene,steel,dark,socketEnd,pliersEnd);
    let width = 1;
    let height = 1;
    let previousLight;
    let showOutline, showSolids, lastSolid;
    host.append(renderer.domElement);
    return {
      resize(w,h) {
        width = w;
        height = h;
        camera.aspect = w / h;
        renderer.setSize(w,h,false);
      },
      render(frame, marker) {
        if (renderer.getContext().isContextLost()) return false;
        if (previousLight !== frame.light) {
          previousLight = frame.light;
          scene.environmentIntensity = frame.light ? 1.13 : 1.30;
          renderer.toneMappingExposure = frame.light ? 1.02 : 1.10;
          ambient.intensity = frame.light ? .83 : .60;
        }
        const task = frame.task;
        const wire = frame.wire ?? 0;
        const solid = frame.solid ?? 1;
        if (showOutline !== (wire > .004)) {
          showOutline = wire > .004;
          for (const line of lines) line.visible = showOutline;
        }
        if (showSolids !== (solid > .004)) {
          showSolids = solid > .004;
          for (const part of solids) part.visible = showSolids;
        }
        if (lastSolid !== solid) {
          lastSolid = solid;
          for (const finish of solidFinishes) {
            finish.opacity = solid;
            finish.transparent = solid < 1;
          }
        }
        trace.color.setHex(frame.light ? 0x24566a : 0xadf1fc);
        trace.opacity = wire*.83;
        const switchTravel = ease(task,.03,.53);
        driver.position.x = .145 * switchTravel;
        driver.position.y = .044 * switchTravel;
        const plierTravel = 1 - ease(task,.45,.985);
        pliers.position.set(.145 * plierTravel,-.044 * plierTravel,0);
        driver.visible = task < .53;
        pliers.visible = task > .43;
        const phase = frame.progress;
        const iteration = frame.iteration ?? 0;
        const peel = ease(iteration,.015,.69);
        const tuck = ease(iteration,.16,.63);
        const lift = (frame.toolLift ?? 0)*chamber.liftClearance;
        tool.position.y = lift;
        poseIntegrated(iteration,frame.seam ?? 0);
        housingTrim.constant = lerp(.160,-.025,ease(iteration,.43,.84))+lift;
        for (const part of parts) {
          if (!part.entrance) continue;
          const seat = ease(frame.assembly,part.start,part.end);
          const separated = (frame.explode ?? 1)*(1-seat);
          part.part.position.copy(part.center).addScaledVector(part.entrance,separated);
          if (covers.has(part.id)) {
            part.part.visible = peel < .995;
            part.part.position.y += .103*peel;
            part.part.position.z -= .135*peel*peel;
            part.part.position.x -= .048*peel*peel;
          } else if (electronics.has(part.id)) {
            part.part.visible = tuck < .98;
            part.part.position.y -= .033*tuck;
            part.part.position.z *= 1-tuck*.81;
          }
          if (part.id === 11) {
            const turn = (frame.explode ?? 1)*(1 - ease(seat,.54,.96)) * Math.PI;
            part.part.quaternion.setFromAxisAngle(vertical,turn);
          }
          if (part.id === 27) {
            const testTurn = Math.sin(frame.inspection * Math.PI) * 1.32 + 1.67*(frame.driveCheck ?? 0) +
              2*Math.PI*(frame.debugSpin ?? 0);
            part.part.quaternion.setFromAxisAngle(driveAxis,testTurn);
          }
          if (part.id === 5) part.part.position.y += .007*(frame.releaseCheck ?? 0);
        }
        bench.pose(frame.bench,frame.clamp,Math.max(frame.benchExit ?? 0,frame.interface,frame.chamber),frame.inspection);
        chamber.pose(frame);
        interfaceRig.pose(frame.interface,frame.dock,task,frame.light);
        lcd.visible = frame.assembly > .953;
        readoutMaterial.opacity = ease(frame.assembly,.953,1)*(1-.44*frame.chamber+.44*(frame.lcdCheck ?? 0))*(.92+.08*(frame.debug ?? 0));
        reflection.intensity = .43 + .52*frame.glint + .33*(frame.conditioning ?? 0);
        const intoBench = ease(phase,6.93,7.43)*(1-ease(phase,14.77,15.38));
        const intoFit = ease(phase,20.89,21.44);
        const release = ease(phase,21.16,21.72);
        const mobile = width < 580;
        const drawing = frame.drawingView ?? 0;
        const compare = frame.compare ?? 0;
        const viewYaw = lerp(lerp(lerp(lerp(.30,0,drawing),.23,intoBench),.48,frame.chamber),.55,intoFit);
        const viewElevation = lerp(lerp(lerp(lerp(.41,0,drawing),.25,intoBench),.22,frame.chamber),.33,intoFit);
        const yaw = lerp(lerp(viewYaw,.36,compare),2.72,release);
        const elevation = lerp(lerp(viewElevation,.36,compare),.41,release);
        const closing = 1-(frame.explode ?? 1)*(1-ease(frame.assembly,.72,1));
        const view = lerp(lerp(.65,.49,closing),.61,intoBench);
        const clearance = Math.sin(Math.PI*iteration)*(1-compare);
        const exitFraming = ease(frame.hatch ?? 0,.08,.88)*frame.chamber;
        const spread = lerp(.458,.315,closing) + .098 * (intoBench - intoFit) + .087 * intoFit;
        const fit = spread / (lens * camera.aspect * (mobile ? .81 : .77));
        camera.fov = lerp(fov,7,drawing);
        const scale = lens/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
        const sceneDistance = Math.max(view,fit) *
          (1-.051*frame.inspection-.085*release+.33*frame.chamber+.23*clearance+.75*exitFraming);
        // The source sketch is contained in a 1600×900 plate. Its CAD silhouette spans 806 pixels.
        const plateScale = Math.min(width/1600,height/900);
        const drawingDistance = height*drawingWidth/(lens*806*plateScale);
        const distance = lerp(sceneDistance,drawingDistance,drawing)*scale;
        const objectCenterX = lerp(.077,.030,closing);
        const objectCenterY = lerp(.043,-.018,closing);
        target.set(lerp(lerp(objectCenterX,.085,intoBench),.087,intoFit),lerp(lerp(objectCenterY,-.045,intoBench),-.015,intoFit),0);
        target.x = lerp(target.x,.044,frame.chamber);
        const bodyCenter = lerp(target.y,-.031,frame.chamber)-.015*drawing+.029*clearance+lift;
        const chamberCenter = .076+.16*lift-.14*(1-frame.chamber);
        target.y = lerp(bodyCenter,chamberCenter,exitFraming);
        target.x = lerp(target.x,drawingCenter.x,drawing);
        target.y = lerp(target.y,drawingCenter.y,drawing);
        camera.position.set(distance*Math.sin(yaw)*Math.cos(elevation),
          distance*Math.sin(elevation),distance*Math.cos(yaw)*Math.cos(elevation)).add(target);
        camera.lookAt(target);
        camera.rotateZ(lerp(-.05,.04,intoFit)*(1-release)*(1-drawing)+.09*release);
        camera.setViewOffset(width,height,13*plateScale*drawing,-6.5*plateScale*drawing,width,height);
        camera.updateMatrixWorld();
        if (frame.dock > .001) {
          projection.copy(interfaceRig.joint).project(camera);
          const shiftX = (frame.anchorX - (projection.x+1)/2) * width * frame.dock;
          const shiftY = (frame.anchorY - (1-projection.y)/2) * height * frame.dock;
          camera.setViewOffset(width,height,-shiftX,-shiftY,width,height);
        }
        renderer.render(scene,camera);
        const selected = markerParts.get(frame.mark);
        if (selected && selected.part.visible) {
          projection.setFromMatrixPosition(selected.part.matrixWorld).project(camera);
          marker.x = (projection.x + 1) / 2;
          marker.y = (1 - projection.y) / 2;
          return true;
        }
        if (frame.interface > .6 && frame.dock < .28) {
          projection.copy(interfaceRig.joint).project(camera);
          marker.x = (projection.x + 1) / 2;
          marker.y = (1 - projection.y) / 2;
          return true;
        }
        if (frame.inspectMark) {
          projection.copy(bench.focus).project(camera);
          marker.x = (projection.x + 1) / 2;
          marker.y = (1 - projection.y) / 2;
          return true;
        }
        return false;
      },
      release
    };
  } catch (error) {
    release();
    throw error;
  }
}
