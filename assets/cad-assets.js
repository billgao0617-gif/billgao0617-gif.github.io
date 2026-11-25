import * as THREE from 'three';
import { VRMLLoader } from 'three/addons/loaders/VRMLLoader.js';

const loader = new VRMLLoader();
const files = new Map();
let manifest;

const packedJourneyParts = new Set(['006','007','009','010','015','016','022']
  .map(id=>'/assets/cad/part-'+id+'.wrl'));

async function fetchAsset(url, type, timeout = 12000) {
  for (let attempt = 0; ; attempt++) {
    let retryable = true;
    try {
      const response = await fetch(url, {signal:AbortSignal.timeout?.(timeout)});
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

async function fetchCadSource(url, compressed) {
  if (compressed && packedJourneyParts.has(url) && window.DecompressionStream) {
    try {
      const packed = await fetchAsset(url+'.gz','arrayBuffer',26000);
      const stream = new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'));
      return await new Response(stream).text();
    } catch {
      // Keep the same original CAD file available if the compressed copy is missing.
    }
  }
  return fetchAsset(url,'text');
}

export async function cloneCadPart(url, {compressed = false} = {}) {
  if (!files.has(url)) {
    files.set(url, fetchCadSource(url,compressed).then(source => loader.parse(source, url)).catch(error => {
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
