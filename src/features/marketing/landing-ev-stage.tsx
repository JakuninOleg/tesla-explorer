"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createEvCarGroup } from "@/features/map/ev-car-mesh";

/**
 * Same EV mesh as the route cinema Mapbox layer — bird’s-eye WebGL stage for the landing.
 */
export function LandingEvStage({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.className = "absolute inset-0 h-full w-full";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 80);
    camera.up.set(0, 0, 1);
    camera.position.set(5.2, -11.5, 7.2);
    camera.lookAt(0, 0.4, 0.7);

    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(6, -4, 10);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe6cc, 0.95);
    fill.position.set(-5, 3, 6);
    scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 48),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        metalness: 0.1,
        roughness: 0.92,
      }),
    );
    scene.add(ground);

    const route = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 28, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0xe31937,
        emissive: 0xe31937,
        emissiveIntensity: 0.85,
        metalness: 0.2,
        roughness: 0.4,
      }),
    );
    route.position.set(0.2, 2, 0.05);
    route.rotation.z = -0.18;
    scene.add(route);

    const stop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.12, 24),
      new THREE.MeshStandardMaterial({
        color: 0xe31937,
        emissive: 0xe31937,
        emissiveIntensity: 0.7,
      }),
    );
    stop.rotation.x = Math.PI / 2;
    stop.position.set(1.4, 6.5, 0.12);
    scene.add(stop);

    const car = createEvCarGroup();
    car.position.set(0, 0, 0);
    car.rotation.z = -0.35;
    scene.add(car);

    let raf = 0;
    let running = true;
    const t0 = performance.now();

    const paint = () => {
      if (!running) {
        raf = 0;
        return;
      }
      if (!reduceMotion) {
        const t = (performance.now() - t0) / 1000;
        car.position.y = Math.sin(t * 0.55) * 1.1;
        car.position.x = Math.sin(t * 0.55) * 0.35;
        car.rotation.z = -0.35 + Math.sin(t * 0.4) * 0.04;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);

    const onResize = () => {
      const w = Math.max(host.clientWidth, 1);
      const h = Math.max(host.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(host);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      running = true;
      if (!raf) {
        raf = requestAnimationFrame(paint);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      renderer.dispose();
      host.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else {
            mat.dispose();
          }
        }
      });
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={["absolute inset-0", className].join(" ")}
      aria-hidden
    />
  );
}
