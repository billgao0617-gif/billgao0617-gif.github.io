import * as THREE from 'three';
const previewPacks = [1,2,3,4].map(index => '/assets/cad/preview-geometry-'+index+'.v1.gz');
let legacyLoader, previews, prototype;
const files = new Map();
let manifest;

async function fetchAsset(url, type) {
  for (let attempt = 0; ; attempt++) {
    let retryable = true;
    try {
      const response = await fetch(url, {signal:AbortSignal.timeout?.(32000)});
      if (!response.ok) {
        retryable = response.status === 408 || response.status === 429 || response.status >= 500;
        throw new Error(`Could not load ${url} (${response.status})`);
      }
      return await response[type]();
    } catch (error) {
      if (attempt || !retryable) throw error;
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  }
}

export function loadCadManifest() {
  return manifest ??= fetchAsset('/assets/cad/manifest.json', 'json').catch(error => {
    manifest = undefined;
    throw error;
  });
}

async function loadPack(url) {
  const compressed = await fetchAsset(url,'arrayBuffer');
  const bytes = await new Response(new Blob([compressed]).stream()
    .pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  // A little-endian header length precedes the JSON mesh table and typed arrays.
  const headerLength = new DataView(bytes).getUint32(0,true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,4,headerLength)));
  return {header,bytes,first:4+headerLength};
}

export function warmCadPreview() {
  if (!window.DecompressionStream) return Promise.resolve([]);
  return previews ??= Promise.all(previewPacks.map(url => loadPack(url).catch(() => null)));
}

// The packs reuse the CAD vertex positions, with indexed triangles and compact normals.
function unpackShape(pack,url) {
  const shape = new THREE.Group();
  for (const [matrix,[positionCount,normalCount,uvCount,indexCount],offset] of pack.header[url]) {
    const start = pack.first+offset;
    const norms = start+4*positionCount;
    const uvs = norms+2*normalCount;
    const indices = uvs+4*uvCount;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pack.bytes.slice(start,norms)),3));
    if (normalCount) {
      const normal = new Int16Array(pack.bytes.slice(norms,uvs));
      geometry.setAttribute('normal',new THREE.BufferAttribute(Float32Array.from(normal,value=>value/32767),3));
    }
    if (uvCount) geometry.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(pack.bytes.slice(uvs,indices)),2));
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(pack.bytes.slice(indices,indices+2*indexCount)),1));
    const mesh = new THREE.Mesh(geometry);
    mesh.applyMatrix4(new THREE.Matrix4().fromArray(matrix));
    shape.add(mesh);
  }
  return shape;
}

async function loadShape(url) {
  const packs = await warmCadPreview();
  let pack = packs.find(item => item?.header[url]);
  if (!pack && packs.length && packs.every(Boolean)) {
    prototype ??= loadPack('/assets/cad/prototype-geometry.v1.gz').catch(() => null);
    const details = await prototype;
    if (details?.header[url]) pack = details;
  }
  if (pack) return unpackShape(pack,url);
  legacyLoader ??= import('three/addons/loaders/VRMLLoader.js').then(({VRMLLoader}) => new VRMLLoader());
  const [source,loader] = await Promise.all([fetchAsset(url,'text'),legacyLoader]);
  return loader.parse(source,url);
}

export async function cloneCadPart(url) {
  if (!files.has(url)) {
    files.set(url,loadShape(url).catch(error => {
      files.delete(url);
      throw error;
    }));
  }
  // A placement can replace materials without touching the cached geometries.
  return (await files.get(url)).clone(true);
}

export function solidWorksMatrix(values) {
  if (!values) return new THREE.Matrix4();
  const s = values[12] || 1;
  return new THREE.Matrix4().set(
    values[0]*s, values[3]*s, values[6]*s, values[9],
    values[1]*s, values[4]*s, values[7]*s, values[10],
    values[2]*s, values[5]*s, values[8]*s, values[11],
    0, 0, 0, 1
  );
}

export function isBodyPart(part) {
  return /^(电钻|编码|Arduino|语音|LCD|齿轮舵机座|力矩盘|舵机|盖板|电磁铁|M3x6\+6)/.test(part.partName);
}

export function curvedRetentionSeat() {
  // The 30 mm saddle on retention-0 shares the drive axis with the
  // 45.3–58.3 mm annular band on the interchangeable CAD adapters.
  const angle = -.20;
  const tangent = new THREE.Vector3(0, Math.cos(angle), -Math.sin(angle));
  const radial = new THREE.Vector3(0, Math.sin(angle), Math.cos(angle));
  const axial = new THREE.Vector3(1, 0, 0);
  const origin = new THREE.Vector3(.0518, 0, 0).addScaledVector(radial, -.000622);
  return new THREE.Matrix4().makeBasis(tangent, radial, axial).setPosition(origin);
}
