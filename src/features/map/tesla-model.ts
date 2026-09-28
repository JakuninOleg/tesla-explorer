import * as THREE from "three";

/** iSteven's model is Y-up, nose +Z. The map layer is Z-up, nose +Y. */
export function prepareTeslaModel(source: THREE.Group): THREE.Group {
  source.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(source);
  const center = bounds.getCenter(new THREE.Vector3());
  const length = bounds.max.z - bounds.min.z;
  if (!Number.isFinite(length) || length <= 0) throw new Error("Invalid vehicle geometry");
  const offset = new THREE.Group();
  offset.add(source);
  source.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
  offset.rotation.y = Math.PI;
  const car = new THREE.Group();
  car.add(offset);
  car.rotation.x = Math.PI / 2;
  car.scale.setScalar(1 / length);
  source.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      if (material.name === "CAR_PAINT") {
        material.color.set("#a6adb6");
        material.metalness = 0.45;
        material.roughness = 0.28;
      }
      if (["Glass", "Material.016", "Material.017"].includes(material.name)) {
        material.color.set("#17212b");
        material.metalness = 0.15;
        material.roughness = 0.22;
        material.transparent = false;
        material.opacity = 1;
      }
    }
  });
  return car;
}

export function disposeModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}
