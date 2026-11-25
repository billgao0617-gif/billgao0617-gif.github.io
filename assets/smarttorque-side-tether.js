import * as THREE from 'three';
import { curvedRetentionSeat } from './cad-assets.js?v=adb15ad71e35';
import { evaCamera } from './smarttorque-story-timeline.js?v=c19916e3a44c';

function piece(group, geometry, material, x=0, y=0, z=0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  group.add(object);
  return object;
}

function pointAtPhotoDepth(x, y, reference) {
  const {yaw,elevation,distance,bank,focal} = evaCamera;
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(distance*Math.sin(yaw)*Math.cos(elevation),
    distance*Math.sin(elevation),distance*Math.cos(yaw)*Math.cos(elevation));
  camera.lookAt(0,0,0);
  camera.rotateZ(bank);
  const depth = reference.clone().sub(camera.position).applyQuaternion(camera.quaternion.clone().invert()).z;
  return new THREE.Vector3((x-evaCamera.x)*-depth/focal,(evaCamera.y-y)*-depth/focal,depth)
    .applyQuaternion(camera.quaternion).add(camera.position);
}

export function makeSideTether(tool, ring, metal, lockMetal, cordMaterial) {
  const seat = new THREE.Vector3();
  const installed = new THREE.Quaternion();
  curvedRetentionSeat().decompose(seat, installed, new THREE.Vector3());
  const side = new THREE.Vector3(0,1,0).applyQuaternion(installed);
  const waiting = seat.clone().addScaledVector(side,.102).add(new THREE.Vector3(.021,-.142,.008));
  const aligned = seat.clone().addScaledVector(side,.037);
  const entryTilt = installed.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-.46));
  const clip = new THREE.Group();
  tool.add(clip);

  // The open mouth is 21 mm clear. The CAD crossbar is 10 mm thick.
  // Keeping the hook perpendicular to the bar lets it enter through that mouth.
  const outline = new THREE.CatmullRomCurve3([
    [0,-.012,-.013], [0,-.006,-.016], [0,.010,-.015], [0,.020,-.009],
    [0,.024,0], [0,.020,.010], [0,.010,.016], [0,-.006,.016], [0,-.012,.012]
  ].map(([x,y,z]) => new THREE.Vector3(x,y,z)));
  piece(clip,new THREE.TubeGeometry(outline,64,.00215,10,false),metal);
  const gateHinge = new THREE.Group();
  gateHinge.position.set(0,-.012,.012);
  clip.add(gateHinge);
  const gate = piece(gateHinge,new THREE.CapsuleGeometry(.0021,.0208,5,12),lockMetal,0,0,-.0125);
  gate.rotation.x = -Math.PI/2;
  piece(clip,new THREE.CylinderGeometry(.0035,.0029,.009,20),lockMetal,0,.028,0);

  // Keep the gate fully open throughout the crossing. When it swings shut,
  // the bar sits inside the hook, beyond the gate's sweep.
  const bar = new THREE.Vector3(0,.0485,0).applyQuaternion(installed).add(seat);
  const hookPose = installed.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-.28));
  const hookEntry = bar.clone().addScaledVector(side,.050);
  clip.quaternion.copy(hookPose);

  const dockSwivel = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-.98);
  const dockHook = hookPose.clone().multiply(dockSwivel);
  const outlet = new THREE.Vector3(0,.0305,0).applyQuaternion(dockHook).add(bar);
  const outletTangent = new THREE.Vector3(0,1,0).applyQuaternion(dockHook);
  // This short section meets the live hook and the photographed sleeve at its pixel anchor.
  const sleeve = pointAtPhotoDepth(evaCamera.ferruleX,evaCamera.ferruleY,outlet);
  const dockLeadPath = new THREE.CubicBezierCurve3(outlet,
    outlet.clone().addScaledVector(outletTangent,.008).add(new THREE.Vector3(0,-.033,0)),
    sleeve.clone().add(new THREE.Vector3(-.0035,.013,0)),sleeve);
  const dockLead = piece(tool,new THREE.TubeGeometry(dockLeadPath,30,.0027,12,false),cordMaterial);

  const cordPath = new THREE.CubicBezierCurve3(new THREE.Vector3(0,.030,0),
    new THREE.Vector3(-.014,.101,.021),
    new THREE.Vector3(-.123,.119,-.045),
    new THREE.Vector3(-.225,.162,-.113));
  const steps = 96;
  const sides = 12;
  const cordGeometry = new THREE.TubeGeometry(cordPath,steps,.0017,sides,false);
  const studioCord = cordMaterial.clone();
  studioCord.color = cordMaterial.color;
  studioCord.onBeforeCompile = cordMaterial.onBeforeCompile;
  studioCord.transparent = true;
  studioCord.depthWrite = false;
  const cord = piece(clip,cordGeometry,studioCord);
  cord.name = 'Braided line joined to hook ferrule';

  return {
    tangent: cordPath.getTangentAt(.08).applyQuaternion(hookPose),
    pose(frame) {
      ring.visible = frame.ringVisible;
      ring.position.lerpVectors(waiting,aligned,frame.ringRise).lerp(seat,frame.ring);
      ring.quaternion.slerpQuaternions(entryTilt,installed,frame.ringRise);
      clip.visible = frame.clipVisible;
      clip.position.lerpVectors(hookEntry,bar,frame.clip);
      gateHinge.rotation.x = -frame.gate * Math.PI/2;
      clip.quaternion.slerpQuaternions(hookPose,dockHook,frame.dock);
      const line = frame.tether * (1-frame.dock);
      studioCord.opacity = 1-THREE.MathUtils.smoothstep(frame.dock,.13,.61);
      cord.visible = line > .002 && studioCord.opacity > .002;
      cordGeometry.setDrawRange(0,Math.ceil(steps*line)*sides*6);
      dockLead.visible = frame.dock > .975;
      dockLead.geometry.setDrawRange(0,Math.ceil(30*Math.max(0,(frame.dock-.975)/.025))*12*6);
    }
  };
}
