import mapboxgl from "mapbox-gl";
import * as THREE from "three";
import type { LngLat } from "@/features/map/route-geometry";

const LAYER_ID = "tesla-explorer-ev-car";

/** Visual scale in meters — large enough to read at chase-cam zoom. */
export const CAR_METERS_SCALE = 4.2;

/**
 * Mapbox custom-layer yaw after Rx(π/2).
 * Our mesh noses +Z; at yaw 0 that reads as east on the map — subtract 90° so
 * bearing 0° (north) points the nose north, not sideways down the road.
 */
export function modelYawRadFromBearing(headingDeg: number): number {
  return (((-headingDeg - 90) % 360) * Math.PI) / 180;
}

export type CarModelPose = {
  lngLat: LngLat;
  headingDeg: number;
};

/**
 * Detailed crossover EV (Model Y vibe) — original procedural meshes, not Tesla IP.
 * Built from many parts so it reads as a car in third-person chase cam, not a box.
 */
export function createEvCarGroup(): THREE.Group {
  const car = new THREE.Group();

  const paint = new THREE.MeshStandardMaterial({
    color: 0xe8e8ea,
    metalness: 0.72,
    roughness: 0.28,
  });
  const darkPaint = new THREE.MeshStandardMaterial({
    color: 0x2a2a2c,
    metalness: 0.65,
    roughness: 0.35,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x0a0a12,
    metalness: 0.95,
    roughness: 0.05,
    transparent: true,
    opacity: 0.72,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: 0xe31937,
    metalness: 0.5,
    roughness: 0.35,
    emissive: 0xe31937,
    emissiveIntensity: 0.55,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.15,
    roughness: 0.85,
  });
  const rim = new THREE.MeshStandardMaterial({
    color: 0xc8c8cc,
    metalness: 0.9,
    roughness: 0.25,
  });
  const chrome = new THREE.MeshStandardMaterial({
    color: 0xd0d0d4,
    metalness: 0.95,
    roughness: 0.15,
  });

  // Lower body / rocker
  const rocker = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.28, 4.55), darkPaint);
  rocker.position.y = 0.28;
  car.add(rocker);

  // Main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.62, 4.35), paint);
  body.position.y = 0.68;
  car.add(body);

  // Hood slope (two plates)
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.14, 1.25), paint);
  hood.position.set(0, 0.98, 1.35);
  hood.rotation.x = -0.12;
  car.add(hood);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.22, 0.55), paint);
  nose.position.set(0, 0.72, 2.15);
  car.add(nose);

  // Cabin / greenhouse
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.58, 2.05), glass);
  cabin.position.set(0, 1.22, -0.2);
  car.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.08, 1.7), darkPaint);
  roof.position.set(0, 1.54, -0.25);
  car.add(roof);

  // Windshield angle
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.06, 0.95), glass);
  windshield.position.set(0, 1.28, 0.85);
  windshield.rotation.x = -0.55;
  car.add(windshield);

  // Rear hatch
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 0.12), glass);
  hatch.position.set(0, 1.15, -1.25);
  hatch.rotation.x = 0.25;
  car.add(hatch);

  // Front light bar (signature)
  const lightBar = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.07, 0.1), accent);
  lightBar.position.set(0, 0.62, 2.38);
  car.add(lightBar);

  // Rear light bar
  const rearLight = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), accent);
  rearLight.position.set(0, 0.85, -2.25);
  car.add(rearLight);

  // Side skirts
  for (const x of [-1.05, 1.05]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 3.2), darkPaint);
    skirt.position.set(x, 0.32, 0);
    car.add(skirt);
  }

  // Mirrors
  for (const x of [-1.05, 1.05]) {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.22), darkPaint);
    mirror.position.set(x, 1.05, 0.55);
    car.add(mirror);
    const glassMirror = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.1, 0.04),
      chrome,
    );
    glassMirror.position.set(x * 1.08, 1.05, 0.45);
    car.add(glassMirror);
  }

  // Wheels + rims
  const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24);
  const rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.34, 16);
  const wheelPositions: Array<[number, number, number]> = [
    [-0.98, 0.42, 1.45],
    [0.98, 0.42, 1.45],
    [-0.98, 0.42, -1.4],
    [0.98, 0.42, -1.4],
  ];
  for (const [x, y, z] of wheelPositions) {
    const tire = new THREE.Mesh(tireGeo, rubber);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(x, y, z);
    car.add(tire);
    const hub = new THREE.Mesh(rimGeo, rim);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(x, y, z);
    car.add(hub);
  }

  // Subtle front fascia splitter
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.35), darkPaint);
  splitter.position.set(0, 0.22, 2.25);
  car.add(splitter);

  return car;
}

type Transform = {
  translateX: number;
  translateY: number;
  translateZ: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
};

function transformFromPose(pose: CarModelPose): Transform {
  // Slight altitude so the mesh sits above the road surface.
  const merc = mapboxgl.MercatorCoordinate.fromLngLat(
    { lng: pose.lngLat[0], lat: pose.lngLat[1] },
    0.8,
  );
  return {
    translateX: merc.x,
    translateY: merc.y,
    translateZ: merc.z ?? 0,
    rotateX: Math.PI / 2,
    rotateY: 0,
    rotateZ: modelYawRadFromBearing(pose.headingDeg),
    scale: merc.meterInMercatorCoordinateUnits() * CAR_METERS_SCALE,
  };
}

type CarLayerState = {
  camera: THREE.Camera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  car: THREE.Group;
  map: mapboxgl.Map;
  pose: CarModelPose | null;
  transform: Transform | null;
};

/**
 * Mapbox custom layer that renders a Three.js EV on the shared WebGL canvas.
 * @see https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model/
 */
export function createCarModelLayer(
  initialPose: CarModelPose | null,
): mapboxgl.CustomLayerInterface & {
  setPose: (pose: CarModelPose | null) => void;
} {
  const state: Partial<CarLayerState> = {
    pose: initialPose,
    transform: initialPose ? transformFromPose(initialPose) : null,
  };

  const layer: mapboxgl.CustomLayerInterface & {
    setPose: (pose: CarModelPose | null) => void;
  } = {
    id: LAYER_ID,
    type: "custom",
    renderingMode: "3d",

    onAdd(map, gl) {
      const camera = new THREE.Camera();
      const scene = new THREE.Scene();

      const light = new THREE.DirectionalLight(0xffffff, 1.35);
      light.position.set(0, -70, 100).normalize();
      scene.add(light);
      const light2 = new THREE.DirectionalLight(0xfff2e0, 0.75);
      light2.position.set(0, 70, 100).normalize();
      scene.add(light2);
      scene.add(new THREE.AmbientLight(0xffffff, 0.45));

      const car = createEvCarGroup();
      scene.add(car);

      const renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;

      state.camera = camera;
      state.scene = scene;
      state.renderer = renderer;
      state.car = car;
      state.map = map;
      car.visible = Boolean(state.pose);
    },

    render(_gl, matrix) {
      if (
        !state.camera ||
        !state.scene ||
        !state.renderer ||
        !state.car ||
        !state.transform
      ) {
        return;
      }

      state.car.visible = true;
      const t = state.transform;
      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        t.rotateX,
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        t.rotateY,
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        t.rotateZ,
      );

      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(t.translateX, t.translateY, t.translateZ)
        .scale(new THREE.Vector3(t.scale, -t.scale, t.scale))
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      state.camera.projectionMatrix = m.multiply(l);
      state.renderer.resetState();
      state.renderer.render(state.scene, state.camera);
      state.map?.triggerRepaint();
    },

    setPose(pose) {
      state.pose = pose;
      state.transform = pose ? transformFromPose(pose) : null;
      if (state.car) {
        state.car.visible = Boolean(pose);
      }
      state.map?.triggerRepaint();
    },
  };

  return layer;
}

export function removeCarModelLayer(map: mapboxgl.Map) {
  if (map.getLayer(LAYER_ID)) {
    map.removeLayer(LAYER_ID);
  }
}

export { LAYER_ID as CAR_MODEL_LAYER_ID };
