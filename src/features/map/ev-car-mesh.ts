import * as THREE from "three";

/**
 * Crossover EV — Z-up / +Y forward (Mapbox-native). Original meshes, not Tesla IP.
 * Shared by the route cinema layer and the landing product preview.
 */
export function createEvCarGroup(): THREE.Group {
  const car = new THREE.Group();

  const paint = new THREE.MeshStandardMaterial({
    color: 0xf5f5f7,
    metalness: 0.8,
    roughness: 0.2,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x222226,
    metalness: 0.7,
    roughness: 0.3,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x12121a,
    metalness: 0.95,
    roughness: 0.05,
    transparent: true,
    opacity: 0.8,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: 0xe31937,
    metalness: 0.4,
    roughness: 0.3,
    emissive: 0xe31937,
    emissiveIntensity: 1.1,
  });
  const lamp = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff3d6,
    emissiveIntensity: 1.6,
    metalness: 0.2,
    roughness: 0.2,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x0b0b0b,
    roughness: 0.9,
    metalness: 0.1,
  });
  const rim = new THREE.MeshStandardMaterial({
    color: 0xdedee2,
    metalness: 0.95,
    roughness: 0.18,
  });

  // Geometries: (width X, length Y, height Z)
  const rocker = new THREE.Mesh(new THREE.BoxGeometry(2.15, 4.8, 0.35), dark);
  rocker.position.z = 0.32;
  car.add(rocker);

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.05, 4.5, 0.75), paint);
  body.position.z = 0.75;
  car.add(body);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.4, 0.18), paint);
  hood.position.set(0, 1.45, 1.08);
  hood.rotation.x = 0.14;
  car.add(hood);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 0.3), paint);
  nose.position.set(0, 2.25, 0.8);
  car.add(nose);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.82, 2.2, 0.65), glass);
  cabin.position.set(0, -0.1, 1.35);
  car.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.62, 1.8, 0.1), dark);
  roof.position.set(0, -0.15, 1.7);
  car.add(roof);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.05, 0.08), glass);
  windshield.position.set(0, 0.95, 1.4);
  windshield.rotation.x = -0.55;
  car.add(windshield);

  const frontBar = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.12, 0.12), accent);
  frontBar.position.set(0, 2.5, 0.72);
  car.add(frontBar);

  for (const x of [-0.7, 0.7]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.16), lamp);
    head.position.set(x, 2.52, 0.78);
    car.add(head);
  }

  const rearBar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.12), accent);
  rearBar.position.set(0, -2.35, 0.95);
  car.add(rearBar);

  for (const x of [-1.1, 1.1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.4, 0.22), dark);
    skirt.position.set(x, 0, 0.36);
    car.add(skirt);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.16), dark);
    mirror.position.set(x, 0.55, 1.15);
    car.add(mirror);
  }

  const tireGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.36, 28);
  const rimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.38, 18);
  const wheels: Array<[number, number, number]> = [
    [-1.05, 1.55, 0.48],
    [1.05, 1.55, 0.48],
    [-1.05, -1.5, 0.48],
    [1.05, -1.5, 0.48],
  ];
  for (const [x, y, z] of wheels) {
    const tire = new THREE.Mesh(tireGeo, rubber);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(x, y, z);
    car.add(tire);
    const hub = new THREE.Mesh(rimGeo, rim);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(x, y, z);
    car.add(hub);
  }

  return car;
}
