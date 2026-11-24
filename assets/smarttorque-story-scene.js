import * as THREE from 'three';
import { cloneCadPart, loadCadManifest, solidWorksMatrix, isBodyPart } from './cad-assets.js?v=8d65b9b8b487';
import { addCommercialHousing, brushedMetal, makeBodyFinish, roundedDeck, deckShoulder, displayFit, makeStudioEnvironment } from './smarttorque-story-finish.js?v=7632a549065e';
import { makeScreenReadout, makeWakeDisplay, makeWakeWaves } from './smarttorque-story-interface.js?v=7ce899e23fa6';
import { Mechanism } from './mechanism.js?v=84d3a46e6944';
import { makeSideTether } from './smarttorque-side-tether.js?v=350f43e355dd';
import { evaCamera } from './smarttorque-story-timeline.js?v=f123fa489fb3';

const finish = (color, metalness, roughness) => new THREE.MeshPhysicalMaterial({
  color, metalness, roughness, side: THREE.DoubleSide
});
const sourceOrientation = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI, 0, -Math.PI / 2));
const cadName = part => part.partName ?? part.cadName;
const headNames = ['driver', 'pliers', 'scissors'];

function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}

function makeScreen(tool, steel, renderer, environment) {
  const {x,y: top,width,depth,radius} = displayFit;
  // The machined bezel seats against the very last ring of the shell.
  mesh(tool,deckShoulder([
    [top-.00095,width,depth,radius],
    [top-.00040,width-.00025,depth-.00025,radius-.00015],
    [top+.00012,width-.0011,depth-.0011,radius-.00050],
    [top+.00012,width-.0024,depth-.0024,radius-.00115],
    [top-.00027,width-.0029,depth-.0029,radius-.00140]
  ]),steel,x);
  const activeWidth=width-.00255, activeDepth=depth-.00255;
  const active = new THREE.ShapeGeometry(roundedDeck(activeWidth, activeDepth, radius-.00125));
  const positions = active.attributes.position;
  const uv = active.attributes.uv;
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(i,positions.getX(i)/activeWidth+.5, positions.getY(i)/activeDepth+.5);
  }
  const backing = finish(0x05080e, .10, .12);
  backing.ior = 1.48;
  backing.clearcoat = 1;
  backing.clearcoatRoughness = .092;
  backing.envMap = environment;
  backing.envMapIntensity = .86;
  backing.defines = {...backing.defines, USE_UV: ''};
  backing.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      float viewingAngle=abs(dot(normalize(vViewPosition),normal));
      float sheen=exp(-pow((vUv.x+.41*vUv.y-.57+viewingAngle*.12)*3.6,2.));
      float reflectivity=.35+.65*pow(1.-viewingAngle,2.);
      diffuseColor.rgb+=vec3(.016,.020,.026)*sheen*reflectivity;
      totalEmissiveRadiance+=vec3(.010,.012,.016)*sheen*(.68+.32*reflectivity);`);
  };
  mesh(tool, active, backing, x, top - .00016).rotation.x = -Math.PI / 2;
  const readout = makeScreenReadout(renderer);
  const wakeScreen = makeWakeDisplay();
  const waveform = mesh(tool,active,wakeScreen,x,top-.00005);
  waveform.rotation.x = -Math.PI / 2;
  waveform.renderOrder = 1;
  const lcd = mesh(tool, active, readout.material, x, top + .00008);
  lcd.rotation.x = -Math.PI / 2;
  lcd.renderOrder = 2;
  return frame => {
    waveform.visible = frame.wave > .001;
    if (waveform.visible) {
      wakeScreen.uniforms.opacity.value = frame.wave;
      wakeScreen.uniforms.clock.value = frame.voiceTime;
    }
    lcd.visible = frame.lcd >= 0 && frame.screenAlpha > .001;
    if (lcd.visible) readout.paint(frame);
  };
}

function machinedBlock(width,height,depth,bevel) {
  const x=width/2-bevel, y=height/2-bevel;
  const section = new THREE.Shape();
  section.moveTo(-x,-y);
  section.lineTo(x,-y);
  section.lineTo(x,y);
  section.lineTo(-x,y);
  section.closePath();
  const innerDepth=depth-2*bevel;
  return new THREE.ExtrudeGeometry(section,{
    depth: innerDepth, bevelEnabled:true, bevelSize:bevel, bevelThickness:bevel, bevelSegments:3
  }).translate(0,0,-innerDepth/2);
}

function openSolenoids(tool, frameSteel) {
  const plungers = [];
  const boreMaterial = finish(0x3d4955,.79,.31);
  const plungerMaterial = brushedMetal(0xa5adb7,.27);
  const upright = machinedBlock(.0033,.0224,.0033,.00038);
  const cap = machinedBlock(.0191,.0033,.0234,.00043);
  const piston = new THREE.CylinderGeometry(.0052,.0052,.0133,40);
  const pin = new THREE.CylinderGeometry(.00235,.00235,.010,32);
  for (const side of [-1,1]) {
    const cage = new THREE.Group();
    cage.name = 'Open electromagnet frame';
    cage.position.set(.03575,.0235,side*.01943);
    for (const x of [-.0079,.0079]) {
      for (const z of [-.01005,.01005]) mesh(cage,upright,frameSteel,x,0,z);
    }
    mesh(cage,cap,frameSteel,0,.01285);
    mesh(cage,cap,frameSteel,0,-.01265);
    mesh(cage,new THREE.BoxGeometry(.0013,.0224,.0201),boreMaterial,-.00865);
    const plunger = new THREE.Group();
    mesh(plunger,piston,plungerMaterial,0,.0013);
    mesh(plunger,pin,plungerMaterial,0,-.0093);
    cage.add(plunger);
    tool.add(cage);
    plungers.push(plunger);
  }
  return unlock => {
    for (const plunger of plungers) plunger.position.y = unlock * .003;
  };
}

function makeCarrierFinish(matrix) {
  const material = finish(0x273d53, .52, .34);
  // The lower CAD carrier remains. The commercial upper enclosure is defined by the new exterior above.
  material.onBeforeCompile = shader => {
    shader.uniforms.carrierToScene = {value: matrix};
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nuniform mat4 carrierToScene; varying float carrierElevation;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ncarrierElevation=(carrierToScene*vec4(position,1.)).y;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
      '#include <common>\nvarying float carrierElevation;').replace('#include <clipping_planes_fragment>',
      '#include <clipping_planes_fragment>\nif(carrierElevation>.021) discard;');
  };
  return material;
}

function makeTransmissionCover(source, registration, cutaway) {
  const material = source.clone();
  material.customProgramCacheKey = () => 'smarttorque-transmission-window';
  material.onBeforeCompile = shader => {
    shader.uniforms.coverToTool = {value: registration};
    shader.uniforms.cutawayAmount = cutaway;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 coverToTool; varying vec3 coverPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ncoverPosition=(coverToTool*vec4(position,1.)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float cutawayAmount; varying vec3 coverPosition;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        vec3 p=coverPosition;
        float opening=mix(.04,.121,cutawayAmount);
        if(cutawayAmount>.001 && p.z>.001 && p.x>.040 && p.x<opening && abs(p.y)<.023) discard;`);
  };
  return material;
}

function makeFasteningScene(scene) {
  const panel = new THREE.Group();
  panel.name = 'Flush station-panel joint';
  const skin = brushedMetal(0x596b7b,.42,'z');
  const insert = finish(0x4e5a66,.73,.34);
  const hardware = brushedMetal(0xb1bcc7,.30,'x');
  const threadRoot = finish(0x88939c,.77,.35);
  const axis = -Math.PI/2;

  // The machined access plate lies against the hull, with the drive axis normal to both.
  mesh(panel,machinedBlock(.021,.148,.169,.0017),skin,.012,.009,-.021);
  mesh(panel,machinedBlock(.0018,.064,.077,.00040),insert,.0009,0,0);
  const recessedSeat = mesh(panel,new THREE.CylinderGeometry(.0121,.0121,.00012,56),threadRoot,-.00001);
  recessedSeat.rotation.z=axis;
  const screw = new THREE.Group();
  screw.name = 'External hex fastener';
  mesh(screw,new THREE.CylinderGeometry(.0105,.0105,.0067,6),hardware,-.00335).rotation.z=axis;
  mesh(screw,new THREE.CylinderGeometry(.0105,.0090,.00125,6),hardware,-.00700).rotation.z=axis;
  mesh(screw,new THREE.CylinderGeometry(.0044,.0044,.023,40),threadRoot,.0114).rotation.z=axis;
  const spiral = new THREE.CatmullRomCurve3(Array.from({length:113},(_,index) => {
    const progress=index/112;
    const angle=progress*8*Math.PI;
    return new THREE.Vector3(.0217*progress,.0046*Math.cos(angle),.0046*Math.sin(angle));
  }));
  mesh(screw,new THREE.TubeGeometry(spiral,112,.00048,6,false),hardware);
  panel.add(screw);
  scene.add(panel);
  return (amount,seating,spin) => {
    panel.visible = amount > .001;
    panel.position.x = .181+.25*(1-amount);
    screw.position.x = -.013 + .0125*seating;
    screw.rotation.x = spin + .18;
  };
}

export async function buildStoryScene(host, {overview = false} = {}) {
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, .01, 8);
  const aim = new THREE.Vector3();
  const tool = new THREE.Group();
  scene.add(tool);
  const environment = makeStudioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.13;
  const fill = new THREE.HemisphereLight(0xe8f1fa,0x88827e,.55);
  scene.add(fill);
  const photoKey = new THREE.DirectionalLight(0xffedce,0);
  photoKey.position.set(-.55,.90,-.75);
  scene.add(photoKey);
  for (const [color, energy, x, y, z] of [
    [0xf9f4ea,1.68,-.49,.85,.62],
    [0xd2e2f7,1.35,.52,.48,-.65],
    [0xeaf2fb,.42,-.08,-.20,.85]
  ]) {
    const light = new THREE.DirectionalLight(color, energy);
    light.position.set(x, y, z);
    scene.add(light);
  }

  try {
    const [manifest,title] = await Promise.all([
      loadCadManifest(),
      new THREE.TextureLoader().loadAsync('/assets/editorial/smarttorque-wordmark.webp'),
      document.fonts.load('760 40px Manrope')
    ]);
    title.colorSpace = THREE.SRGBColorSpace;
    title.anisotropy = Math.min(12,renderer.capabilities.getMaxAnisotropy());
    const assemblies = {driver: manifest.driver, pliers: manifest.pliers, scissors: manifest.main};
    const drill = manifest.main.find(part => /^电钻/.test(cadName(part)));
    const bodyTransform = sourceOrientation.clone().multiply(solidWorksMatrix(drill.transform));
    const navy = finish(0x254461,.26,.33);
    navy.clearcoat = .31;
    navy.clearcoatRoughness = .25;
    const bodyFinish = makeBodyFinish(title, bodyTransform, true);
    const exteriorFinish = makeBodyFinish(title, new THREE.Matrix4(), false);
    const steel = brushedMetal(0xc3c7cc,.25,'x');
    const gold = brushedMetal(0xc59a57,.265);
    const graphite = finish(0x2b3542, .51, .36);
    const headSteel = brushedMetal(0xb6c2cc,.27);
    const driverCollar = brushedMetal(0xa8adb5,.265);
    const cutaway = {value:0};
    const poseFastening = overview ? null : makeFasteningScene(scene);
    const drawLocks = openSolenoids(tool,steel);
    const gear = new THREE.Group();
    const socket = new THREE.Group();
    tool.add(gear);
    addCommercialHousing(tool, exteriorFinish, navy);
    const drawScreen = makeScreen(tool, steel, renderer, environment.texture);
    const drawWaves = overview ? null : makeWakeWaves(tool);
    const loadedHeads = overview ? ['driver'] : headNames;
    const heads = {};
    const motions = {};
    const sharedGeometry = new Set();
    const shellRows = manifest.main.filter(part => part.visible && /^(电钻|力矩盘|齿轮舵机座|编码)/.test(cadName(part)));
    const addPart = async (record, parent, transform, material) => {
      const geometry = await cloneCadPart(record.url);
      geometry.traverse(child => {
        if (!child.isMesh) return;
        sharedGeometry.add(child.geometry);
        child.material = material;
      });
      const object = new THREE.Group();
      object.add(geometry);
      object.name = cadName(record);
      object.applyMatrix4(transform);
      parent.add(object);
      return object;
    };
    await Promise.all(shellRows.map(part => {
      const transform = sourceOrientation.clone().multiply(solidWorksMatrix(part.transform));
      let material = navy;
      if (/^电钻/.test(cadName(part))) material = bodyFinish;
      if (/^力矩盘/.test(cadName(part))) material = gold;
      if (/^齿轮舵机座/.test(cadName(part))) material = makeCarrierFinish(transform);
      if (/^编码轴/.test(cadName(part))) material = steel;
      if (/^编码器.*齿轮/.test(cadName(part))) material = gold;
      if (/^编码器$/.test(cadName(part))) material = graphite;
      return addPart(part, /^力矩盘/.test(cadName(part)) ? gear : tool, transform, material);
    }));

    await Promise.all(loadedHeads.map(async key => {
      const assembly = assemblies[key];
      const anchor = assembly.find(part => /^电钻/.test(cadName(part)));
      const alignment = bodyTransform.clone().multiply(solidWorksMatrix(anchor.transform).invert());
      const group = new THREE.Group();
      heads[key] = group;
      tool.add(group);
      // Keep each attachment's native CAD coordinate system inside the
      // registered group so the prototype's existing jaw solver is reusable.
      const nativeAssembly = new THREE.Group();
      const components = await Promise.all(assembly.filter(part => part.visible !== false && !isBodyPart(part)).map(async part => {
        const transform = solidWorksMatrix(part.transform);
        if (key === 'driver' && part.url.endsWith('/part-027.wrl')) {
          await addPart(part,socket,alignment.clone().multiply(transform),headSteel);
          return null;
        }
        const cover = /固定头|快拆座/.test(cadName(part));
        let material = part.url.endsWith('/part-028.wrl') ? driverCollar : cover ? graphite : headSteel;
        if (key === 'pliers' && cover) {
          material = makeTransmissionCover(graphite,alignment.clone().multiply(transform),cutaway);
        }
        const object = await addPart(part,nativeAssembly,transform,material);
        if (!/上剪|下剪|上钳|下钳|^推杆/.test(cadName(part))) return null;
        const geometry = object.children[0];
        // Read the local dimensions before adding the registration matrix.
        const nativeBounds = new THREE.Box3();
        geometry.traverse(child => {
          if (!child.isMesh) return;
          child.geometry.computeBoundingBox();
          nativeBounds.union(child.geometry.boundingBox);
        });
        return {
          partName:cadName(part), object, geometry, nativeBounds, start:object.position.clone(),
          geometryRestQuaternion:geometry.quaternion.clone(), geometryRestPosition:geometry.position.clone()
        };
      }));
      if (key !== 'driver') {
        const motion = new Mechanism();
        motion.setParts(components.filter(Boolean),key);
        motions[key] = motion;
      }
      nativeAssembly.applyMatrix4(alignment);
      group.add(nativeAssembly);
      if (key === 'driver') group.add(socket);
    }));

    const curved = manifest.retention.find(part => part.id === 'retention-0');
    const curvedRing = await addPart(curved,tool,new THREE.Matrix4(),steel);
    const cord = finish(0x7797a8,.09,.51);
    cord.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>',
        '#include <common>\nvarying vec2 braidUv;').replace('#include <begin_vertex>',
        '#include <begin_vertex>\nbraidUv=uv;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
        '#include <common>\nvarying vec2 braidUv;').replace('#include <color_fragment>', `#include <color_fragment>
          float warp=cos(6.283185*(braidUv.x*104.+braidUv.y*4.));
          float weave=cos(6.283185*(braidUv.x*104.-braidUv.y*4.));
          float detail=1.-smoothstep(.25,.76,fwidth(braidUv.x*104.));
          diffuseColor.rgb*=1.+.19*detail*warp*weave;`);
    };
    const tether = makeSideTether(tool,curvedRing,steel,brushedMetal(0x93a9b6,.26),cord);
    const pullDirection = new THREE.Vector3();
    let lightTheme;

    host.appendChild(renderer.domElement);
    return {
      resize(width, height) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      },
      render(frame) {
        if (lightTheme !== frame.light) {
          lightTheme = frame.light;
          scene.environmentIntensity = frame.light ? 1.20 : 1.13;
          renderer.toneMappingExposure = frame.light ? 1.08 : 1.06;
          fill.intensity = frame.light ? .68 : .55;
          cord.color.setHex(frame.light ? 0x395a6f : 0x95b5c7);
          headSteel.color.setHex(frame.light ? 0x8e9ba8 : 0xb7c3d0);
          headSteel.roughness = frame.light ? .38 : .26;
          driverCollar.color.setHex(frame.light ? 0x788794 : 0xa8adb5);
        }
        for (const key of loadedHeads) {
          const offset = frame.heads[key];
          heads[key].visible = offset < .34;
          heads[key].position.x = offset;
        }
        cutaway.value = frame.cutaway;
        if (poseFastening) {
          poseFastening(frame.fastener,frame.seating,frame.fastenerSpin);
          motions.pliers.applyJawOpening(frame.open.pliers);
          motions.scissors.applyJawOpening(frame.open.scissors);
        }
        drawLocks(frame.unlock);
        gear.rotation.x = frame.driveGear;
        socket.rotation.x = frame.driverSpin;
        drawScreen(frame);
        drawWaves?.(frame);
        tether.pose(frame);
        photoKey.intensity = .62*frame.dock + 1.62*frame.highlight;
        const dock = frame.dock;
        // Roll a full revolution about the tool's drive axis; the camera
        // then arrives on the opposite side for the left-facing photograph.
        tool.rotation.set(frame.roll*(1-dock) + 2*Math.PI*frame.spin, 0, frame.pitch*(1-dock));
        pullDirection.copy(tether.tangent).applyEuler(tool.rotation);
        tool.position.copy(pullDirection).multiplyScalar(frame.pull*(1-dock));
        tool.position.x += frame.advance;
        const yaw = THREE.MathUtils.lerp(frame.yaw,evaCamera.yaw,frame.sideView);
        const elevation = THREE.MathUtils.lerp(frame.elevation,evaCamera.elevation,dock);
        const distance = THREE.MathUtils.lerp(frame.distance,evaCamera.distance,dock);
        const dockFov = THREE.MathUtils.radToDeg(2*Math.atan(frame.height/(2*evaCamera.focal*frame.evaScale)));
        camera.fov = THREE.MathUtils.lerp(31,dockFov,dock);
        aim.copy(frame.aim).multiplyScalar(1-dock);
        camera.position.set(distance*Math.sin(yaw)*Math.cos(elevation),
          distance*Math.sin(elevation),distance*Math.cos(yaw)*Math.cos(elevation)).add(aim);
        camera.lookAt(aim);
        camera.rotateZ(evaCamera.bank*dock);
        const shiftX=THREE.MathUtils.lerp(frame.shiftX,frame.evaX,dock);
        // The grip swings above the drive axis halfway through the roll.
        const rollRoom = frame.height * .16 * Math.sin(Math.PI*frame.spin);
        const shiftY=THREE.MathUtils.lerp(frame.shiftY,frame.evaY,dock) + rollRoom;
        camera.setViewOffset(frame.width,frame.height,-shiftX,-shiftY,frame.width,frame.height);
        renderer.render(scene, camera);
      },
      release() {
        // CAD mesh buffers are shared with the explorer, so leave those in the cache.
        environment.dispose();
        const materials = new Set();
        const privateGeometry = new Set();
        scene.traverse(object => {
          if (object.material) materials.add(object.material);
          if (object.geometry && !sharedGeometry.has(object.geometry)) privateGeometry.add(object.geometry);
        });
        for (const material of materials) {
          material.map?.dispose();
          material.dispose();
        }
        for (const geometry of privateGeometry) geometry.dispose();
        title.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  } catch (error) {
    environment.dispose();
    renderer.dispose();
    throw error;
  }
}
