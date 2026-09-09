import mapboxgl from "mapbox-gl";
import * as THREE from "three";
import type { LngLat } from "@/features/map/route-geometry";

const LAYER_ID = "tesla-explorer-ev-car";

/** Meters — large enough to read in chase cam. */
export const CAR_METERS_SCALE = 6.5;

export type CarModelPose = {
  lngLat: LngLat;
  headingDeg: number;
};

/**
 * Mapbox custom-layer orientation for a **Z-up** mesh (height = +Z, nose = +Y).
 * Only rotateZ for bearing — matches Mapbox's 3D-model example (no Rx tilt = no roof/roll bugs).
 */
export function modelOrientationFromBearing(headingDeg: number): {
  rotateX: number;
  rotateY: number;
  rotateZ: number;
} {
  return {
    rotateX: 0,
    rotateY: 0,
    // CW Mapbox bearing → CCW around +Z (up)
    rotateZ: (-headingDeg * Math.PI) / 180,
  };
}

/** @deprecated */
export function modelYawRadFromBearing(headingDeg: number): number {
  return modelOrientationFromBearing(headingDeg).rotateZ;
}

/**
 * Crossover EV — Z-up / +Y forward (Mapbox-native). Original meshes, not Tesla IP.
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

  // Wheels: cylinder along X
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
    0.25,
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

      const key = new THREE.DirectionalLight(0xffffff, 1.7);
      key.position.set(50, -90, 140).normalize();
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffe6cc, 0.9);
      fill.position.set(-60, 70, 90).normalize();
      scene.add(fill);
      scene.add(new THREE.AmbientLight(0xffffff, 0.65));

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

/** Bright DOM chase marker — always visible even if WebGL car fails. */
export function createCarDomMarker(): HTMLDivElement {
  const el = document.createElement("div");
  el.dataset.testid = "route-car-marker";
  el.setAttribute("aria-label", "Car");
  el.style.width = "40px";
  el.style.height = "40px";
  el.style.position = "relative";
  el.style.pointerEvents = "none";

  const body = document.createElement("div");
  body.style.position = "absolute";
  body.style.left = "2px";
  body.style.top = "10px";
  body.style.width = "36px";
  body.style.height = "20px";
  body.style.borderRadius = "6px";
  body.style.background = "#f2f2f4";
  body.style.border = "2px solid #e31937";
  body.style.boxShadow = "0 0 16px rgba(227,25,55,0.85)";

  const nose = document.createElement("div");
  nose.style.position = "absolute";
  nose.style.left = "50%";
  nose.style.top = "0";
  nose.style.width = "0";
  nose.style.height = "0";
  nose.style.marginLeft = "-7px";
  nose.style.borderLeft = "7px solid transparent";
  nose.style.borderRight = "7px solid transparent";
  nose.style.borderBottom = "10px solid #e31937";

  el.appendChild(nose);
  el.appendChild(body);
  return el;
}

export function setCarDomMarkerHeading(
  el: HTMLDivElement,
  headingDeg: number,
): void {
  // CSS: 0° points up; Mapbox bearing 0 = north — match.
  el.style.transform = `rotate(${headingDeg}deg)`;
}

export { LAYER_ID as CAR_MODEL_LAYER_ID };
