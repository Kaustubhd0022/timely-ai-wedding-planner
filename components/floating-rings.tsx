"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import * as THREE from "three";

function Rings() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
      groupRef.current.rotation.x += 0.0005;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[2, 0.02, 16, 100]} />
          <meshStandardMaterial color="#E6C97A" metalness={0.8} roughness={0.2} transparent opacity={0.6} />
        </mesh>
      </Float>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[0.5, 0.5, -1]} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[1.5, 0.015, 16, 100]} />
          <meshStandardMaterial color="#F8C8DC" metalness={0.6} roughness={0.3} transparent opacity={0.4} />
        </mesh>
      </Float>
    </group>
  );
}

export default function FloatingRings3D() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-0 opacity-40">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#FFF8F5" />
        <Rings />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
