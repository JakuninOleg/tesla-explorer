import mapboxgl from "mapbox-gl";
import * as THREE from "three";
import type { LngLat } from "@/features/map/route-geometry";

const LAYER_ID = "tesla-explorer-ev-car";

/** Visual scale in meters — readable in tight chase cam. */
export const CAR_METERS_SCALE = 5.2;

export type CarModelPose = {
  lngLat: LngLat;
  headingDeg: number;
};

export type ModelOrientation = {
  /** Lay Y-up Three mesh onto the map plane (Mapbox custom-layer convention). */
  rotateX: number;
  /** Yaw around model up — MUST be here, not rotateZ (Z is nose → roll/roof). */
  rotateY: number;
  rotateZ: number;
};

/**
 * Mapbox layer multiplies Rz → Ry → Rx on the mesh.
 * Our car is Y-up / +Z forward, so bearing belongs on Ry (yaw), never Rz (roll).
 */
export function modelOrientationFromBearing(headingDeg: number): ModelOrientation {
  return {
    rotateX: Math.PI / 2,
    rotateY: (-headingDeg * Math.PI) / 180,
    rotateZ: 0,
  };
}

/** @deprecated use modelOrientationFromBearing */
export function modelYawRadFromBearing(headingDeg: number): number {
  return modelOrientationFromBearing(headingDeg).rotateY;
}

/**
 * Crossover EV (Model Y vibe) — original meshes, not Tesla IP.
 * Convention: +Y up, +Z forward (nose), +X right.
 */
export function createEvCarGroup(): THREE.Group {
  const car = new THREE.Group();

  const paint = new THREE.MeshStandardMaterial({
    color: 0xf4f4f6,
    metalness: 0.78,
    roughness: 0.22,
  });
  const darkPaint = new THREE.MeshStandardMaterial({
    color: 0x1c1c1e,
    metalness: 0.7,
    roughness: 0.3,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x101018,
    metalness: 0.95,
    roughness: 0.05,
    transparent: true,
    opacity: 0.78,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: 0xe31937,
    metalness: 0.45,
    roughness: 0.3,
    emissive: 0xe31937,
    emissiveIntensity: 0.85,
  });
  const headlight = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.2,
    roughness: 0.15,
    emissive: 0xfff5e6,
    emissiveIntensity: 1.4,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.1,
    roughness: 0.9,
  });
  const rim = new THREE.MeshStandardMaterial({
    color: 0xd8d8dc,
    metalness: 0.92,
    roughness: 0.2,
  });

  const rocker = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.32, 4.7), darkPaint);
  rocker.position.y = 0.3;
  car.add(rocker);

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.7, 4.4), paint);
  body.position.y = 0.72;
  car.add(body);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.16, 1.35), paint);
  hood.position.set(0, 1.05, 1.4);
  hood.rotation.x = -0.14;
  car.add(hood);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.28, 0.55), paint);
  nose.position.set(0, 0.78, 2.22);
  car.add(nose);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.62, 2.15), glass);
  cabin.position.set(0, 1.28, -0.15);
  car.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.75), darkPaint);
  roof.position.set(0, 1.62, -0.2);
  car.add(roof);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 1.0), glass);
  windshield.position.set(0, 1.35, 0.9);
  windshield.rotation.x = -0.58;
  car.add(windshield);

  const hatch = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.55, 0.14), glass);
  hatch.position.set(0, 1.22, -1.28);
  hatch.rotation.x = 0.28;
  car.add(hatch);

  // Bright nose cue — easy to read direction of travel
  const lightBar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.12), accent);
  lightBar.position.set(0, 0.68, 2.45);
  car.add(lightBar);

  for (const x of [-0.65, 0.65]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.1), headlight);
    lamp.position.set(x, 0.7, 2.48);
    car.add(lamp);
  }

  const rearLight = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.1, 0.1), accent);
  rearLight.position.set(0, 0.9, -2.32);
  car.add(rearLight);

  for (const x of [-1.08, 1.08]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 3.3), darkPaint);
    skirt.position.set(x, 0.34, 0);
    car.add(skirt);
  }

  for (const x of [-1.08, 1.08]) {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.24), darkPaint);
    mirror.position.set(x, 1.1, 0.55);
    car.add(mirror);
  }

  const tireGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.34, 28);
  const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.36, 18);
  const wheelPositions: Array<[number, number, number]> = [
    [-1.02, 0.45, 1.5],
    [1.02, 0.45, 1.5],
    [-1.02, 0.45, -1.45],
    [1.02, 0.45, -1.45],
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

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.06, 0.4), darkPaint);
  splitter.position.set(0, 0.24, 2.3);
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
  const merc = mapboxgl.MercatorCoordinate.fromLngLat(
    { lng: pose.lngLat[0], lat: pose.lngLat[1] },
    0.15,
  );
  const orient = modelOrientationFromBearing(pose.headingDeg);
  return {
    translateX: merc.x,
    translateY: merc.y,
    translateZ: merc.z ?? 0,
    rotateX: orient.rotateX,
    rotateY: orient.rotateY,
    rotateZ: orient.rotateZ,
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
 * Mapbox custom layer — Three.js EV on the shared WebGL canvas.
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

      const key = new THREE.DirectionalLight(0xffffff, 1.55);
      key.position.set(40, -80, 120).normalize();
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffe8d0, 0.85);
      fill.position.set(-50, 60, 80).normalize();
      scene.add(fill);
      scene.add(new THREE.AmbientLight(0xffffff, 0.55));

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
