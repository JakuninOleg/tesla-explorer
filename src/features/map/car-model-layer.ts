import mapboxgl from "mapbox-gl";
import * as THREE from "three";
import { createEvCarGroup } from "@/features/map/ev-car-mesh";
import type { LngLat } from "@/features/map/route-geometry";

export { createEvCarGroup } from "@/features/map/ev-car-mesh";

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
