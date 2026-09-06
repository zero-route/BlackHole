"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { vertexShader, fragmentShader } from "@/shaders/blackhole";

function BlackHoleMesh() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uTime: { value: 0 },
      uCamPos: { value: new THREE.Vector3(0, 1.4, 6.0) },
      uDiskInner: { value: 1.6 },
      uDiskOuter: { value: 6.0 },
      uBlackHoleRadius: { value: 1.0 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uResolution.value.set(
        size.width,
        size.height
      );
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function BlackHoleCanvas() {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1], near: 0, far: 1 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
    >
      <BlackHoleMesh />
    </Canvas>
  );
}