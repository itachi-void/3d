import * as THREE from 'three';
import type { PlanetData } from './cosmicTypes';
import {
  PLANET_VERT, ROCKY_FRAG, EARTH_FRAG, VENUS_FRAG, GAS_FRAG, ICE_FRAG,
  MOON_FRAG, STAR_FRAG, ATMO_VERT, ATMO_FRAG, RING_VERT, RING_FRAG,
  ORBIT_VERT, ORBIT_FRAG,
} from './shaders/planetShaders';

function hex(s: string): THREE.Color { return new THREE.Color(s); }

function createSurfaceMaterial(planet: PlanetData, sunDir: THREE.Vector3): THREE.ShaderMaterial {
  const c1 = hex(planet.color1);
  const c2 = hex(planet.color2);
  const c3 = hex(planet.color3 ?? planet.color2);

  const commonUniforms = {
    uColor1: { value: c1 }, uColor2: { value: c2 }, uColor3: { value: c3 },
    uSunDir: { value: sunDir },
    uTime:   { value: 0 },
  };

  const fragMap: Record<string, string> = {
    rocky: ROCKY_FRAG, earth: EARTH_FRAG, venus: VENUS_FRAG,
    gas: GAS_FRAG, ice: ICE_FRAG, moon: MOON_FRAG, star: STAR_FRAG,
  };

  return new THREE.ShaderMaterial({
    vertexShader: PLANET_VERT,
    fragmentShader: fragMap[planet.surface] ?? ROCKY_FRAG,
    uniforms: {
      ...commonUniforms,
      uRoughness: { value: planet.surface === 'rocky' ? 0.85 : 0.5 },
    },
    side: THREE.FrontSide,
  });
}

function createAtmosphere(planet: PlanetData): THREE.Mesh | null {
  if (!planet.atmosphere) return null;
  const { color, scale, opacity } = planet.atmosphere;
  const geo = new THREE.SphereGeometry(planet.radius * scale, 48, 48);
  const mat = new THREE.ShaderMaterial({
    vertexShader: ATMO_VERT,
    fragmentShader: ATMO_FRAG,
    uniforms: { uColor: { value: hex(color) }, uOpacity: { value: opacity } },
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

function createRings(planet: PlanetData): THREE.Mesh | null {
  if (!planet.rings) return null;
  const { innerR, outerR, color, opacity } = planet.rings;
  const r = planet.radius;
  const geo = new THREE.RingGeometry(r * innerR, r * outerR, 128, 4);
  // Fix UVs so they map distance from center
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, v.x / (r * outerR) * 0.5 + 0.5, v.y / (r * outerR) * 0.5 + 0.5);
  }
  const mat = new THREE.ShaderMaterial({
    vertexShader: RING_VERT,
    fragmentShader: RING_FRAG,
    uniforms: {
      uColor: { value: hex(color) },
      uOpacity: { value: opacity },
      uInnerR: { value: innerR / (outerR + innerR) },
      uOuterR: { value: outerR / (outerR + innerR) },
      uSunDir: { value: new THREE.Vector3(1, 0.5, 0) },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function createOrbitLine(orbitRadius: number, inclination: number): THREE.Line {
  const points: THREE.Vector3[] = [];
  const N = 200;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.ShaderMaterial({
    vertexShader: ORBIT_VERT,
    fragmentShader: ORBIT_FRAG,
    uniforms: {
      uOpacity: { value: 0.12 },
      uColor: { value: new THREE.Color(0x8899cc) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const line = new THREE.Line(geo, mat);
  line.rotation.x = (inclination * Math.PI) / 180;
  return line;
}

export interface BuiltBody {
  id: string;
  data: PlanetData;
  group: THREE.Group;      // the full body (mesh + atmo + rings)
  orbitGroup: THREE.Group; // rotates for orbital animation
  pivotGroup: THREE.Group; // parent (at orbit origin)
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  children: BuiltBody[];
}

export function buildBody(planet: PlanetData, sunDir: THREE.Vector3, parentGroup: THREE.Group): BuiltBody {
  // Orbit pivot (at parent center)
  const pivotGroup = new THREE.Group();
  pivotGroup.rotation.x = (planet.orbitInclination * Math.PI) / 180;
  parentGroup.add(pivotGroup);

  // Orbit line (only for planets, not star)
  if (planet.orbitRadius > 0 && planet.type !== 'moon') {
    const orbit = createOrbitLine(planet.orbitRadius, 0);
    pivotGroup.add(orbit);
  }

  // Orbit arm (positions body at orbit radius, rotated by startAngle)
  const orbitGroup = new THREE.Group();
  orbitGroup.rotation.y = planet.startAngle;
  pivotGroup.add(orbitGroup);

  // Body group (positioned at orbit distance from parent)
  const group = new THREE.Group();
  group.position.x = planet.orbitRadius;
  group.rotation.z = (planet.axialTilt * Math.PI) / 180;
  orbitGroup.add(group);

  // Surface mesh
  const geo = new THREE.SphereGeometry(planet.radius, 64, 64);
  const mat = createSurfaceMaterial(planet, sunDir);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.id = planet.id;
  mesh.userData.name = planet.name;
  group.add(mesh);

  // Star corona glow
  if (planet.surface === 'star') {
    const coronaGeo = new THREE.SphereGeometry(planet.radius * 1.18, 32, 32);
    const coronaMat = new THREE.ShaderMaterial({
      vertexShader: ATMO_VERT,
      fragmentShader: ATMO_FRAG,
      uniforms: {
        uColor: { value: new THREE.Color(planet.color1) },
        uOpacity: { value: 0.55 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    group.add(new THREE.Mesh(coronaGeo, coronaMat));

    // Point light at sun
    const light = new THREE.PointLight(0xfff4e0, 4.5, 800);
    group.add(light);
    const ambient = new THREE.AmbientLight(0x111133, 0.12);
    parentGroup.add(ambient);
  }

  // Atmosphere
  const atmo = createAtmosphere(planet);
  if (atmo) group.add(atmo);

  // Rings
  const rings = createRings(planet);
  if (rings) group.add(rings);

  // Emissive point for stars at distance
  if (planet.emissive) {
    mesh.userData.emissive = true;
  }

  // Build children (moons)
  const children: BuiltBody[] = [];
  for (const moon of planet.moons ?? []) {
    children.push(buildBody(moon, sunDir, group));
  }

  // Store reference data
  pivotGroup.userData.bodyId = planet.id;
  mesh.userData.planetData = planet;

  return { id: planet.id, data: planet, group, orbitGroup, pivotGroup, mesh, material: mat, children };
}

export function animateBody(body: BuiltBody, time: number): void {
  // Update material time
  body.material.uniforms.uTime.value = time;

  // Orbital rotation
  if (body.data.orbitPeriod > 0) {
    const speed = (2 * Math.PI) / (body.data.orbitPeriod * 60); // 1 Earth year = 60s
    body.orbitGroup.rotation.y = body.data.startAngle + time * speed;
  }

  // Self rotation (faster for faster-rotating planets)
  const selfRotSpeed = body.data.type === 'star' ? 0.03 : 0.15;
  body.mesh.rotation.y = time * selfRotSpeed;

  // Recurse moons
  for (const child of body.children) {
    animateBody(child, time);
  }
}

export function collectAllMeshes(body: BuiltBody, out: THREE.Mesh[] = []): THREE.Mesh[] {
  out.push(body.mesh);
  for (const child of body.children) collectAllMeshes(child, out);
  return out;
}

export function findBodyById(body: BuiltBody, id: string): BuiltBody | null {
  if (body.id === id) return body;
  for (const child of body.children) {
    const found = findBodyById(child, id);
    if (found) return found;
  }
  return null;
}

export function getWorldPosition(body: BuiltBody): THREE.Vector3 {
  const pos = new THREE.Vector3();
  body.mesh.getWorldPosition(pos);
  return pos;
}
