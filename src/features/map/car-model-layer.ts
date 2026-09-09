import mapboxgl from "mapbox-gl";
import * as THREE from "three";
import type { LngLat } from "@/features/map/route-geometry";

const LAYER_ID = "tesla-explorer-ev-car";

export type CarModelPose = {
  lngLat: LngLat;
  headingDeg: number;
};

/** Stylized crossover EV (Model Y vibe) — original meshes, not Tesla IP. */
export function createEvCarGroup(): THREE.Group {
  const car = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2,
    metalness: 0.55,
    roughness: 0.35,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xe31937,
    metalness: 0.4,
    roughness: 0.4,
    emissive: 0xe31937,
    emissiveIntensity: 0.35,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.2,
    roughness: 0.7,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 4.4), bodyMat);
  body.position.y = 0.55;
  car.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.2), glassMat);
  cabin.position.set(0, 1.05, -0.15);
  car.add(cabin);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 1.1), bodyMat);
  hood.position.set(0, 0.78, 1.45);
  car.add(hood);

  const lightBar = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.08, 0.12),
    accentMat,
  );
  lightBar.position.set(0, 0.55, 2.2);
  car.add(lightBar);

  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16);
  const wheelPositions: Array<[number, number, number]> = [
    [-0.95, 0.38, 1.35],
    [0.95, 0.38, 1.35],
    [-0.95, 0.38, -1.35],
    [0.95, 0.38, -1.35],
  ];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    car.add(wheel);
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
    0,
  );
  return {
    translateX: merc.x,
    translateY: merc.y,
    translateZ: merc.z ?? 0,
    rotateX: Math.PI / 2,
    rotateY: 0,
    // Mapbox bearing clockwise from north; model +Z forward after rotateX.
    rotateZ: (-pose.headingDeg * Math.PI) / 180,
    scale: merc.meterInMercatorCoordinateUnits() * 1.2,
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

      const light = new THREE.DirectionalLight(0xffffff, 1.15);
      light.position.set(0, -70, 100).normalize();
      scene.add(light);
      const light2 = new THREE.DirectionalLight(0xffffff, 0.6);
      light2.position.set(0, 70, 100).normalize();
      scene.add(light2);
      scene.add(new THREE.AmbientLight(0xffffff, 0.4));

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
