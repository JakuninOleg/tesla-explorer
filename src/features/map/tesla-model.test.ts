import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { disposeModel, prepareTeslaModel } from "./tesla-model";

describe("licensed Tesla model", () => {
  it("ships every referenced buffer and texture plus attribution", () => {
    const root = resolve("public/models/tesla-model-3");
    const asset = JSON.parse(readFileSync(resolve(root, "scene.gltf"), "utf8")) as {
      buffers: { uri: string }[]; images: { uri: string }[];
    };
    for (const resource of [...asset.buffers, ...asset.images]) expect(existsSync(resolve(root, resource.uri))).toBe(true);
    expect(readFileSync(resolve(root, "license.txt"), "utf8")).toContain("CC-BY-NC-4.0");
    expect(readFileSync(resolve(root, "CREDITS.md"), "utf8")).toContain("iSteven");
  });

  it("normalizes length, grounds tires and converts the nose to north (+Y)", () => {
    const source = new THREE.Group();
    source.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 4.7), new THREE.MeshStandardMaterial()));
    const car = prepareTeslaModel(source);
    car.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(car);
    expect(bounds.min.z).toBeCloseTo(0);
    expect(bounds.getSize(new THREE.Vector3()).y).toBeCloseTo(1);
    const direction = new THREE.Vector3(0, 0, 1).transformDirection(source.matrixWorld);
    expect(direction.y).toBeCloseTo(1);
    disposeModel(car);
  });

  it("releases shared resources exactly once", () => {
    const texture = new THREE.Texture();
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const geometry = new THREE.BoxGeometry();
    const textureSpy = vi.spyOn(texture, "dispose");
    const materialSpy = vi.spyOn(material, "dispose");
    const geometrySpy = vi.spyOn(geometry, "dispose");
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material));
    disposeModel(group);
    expect(textureSpy).toHaveBeenCalledOnce();
    expect(materialSpy).toHaveBeenCalledOnce();
    expect(geometrySpy).toHaveBeenCalledOnce();
  });
});
