import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';

export default function IceBlock({ position, scale, rotation, color = '#a0e0ff' }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    // Subtle rotation to make the space feel suspended and organic
    meshRef.current.rotation.x += delta * 0.05;
    meshRef.current.rotation.y += delta * 0.08;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale} rotation={rotation}>
      <boxGeometry args={[1, 1, 1]} />
      {/* 
        MeshTransmissionMaterial is perfect for the "Cyber-Ártico" glass/ice look.
        It renders glass refractions based on the environment map and background.
      */}
      <MeshTransmissionMaterial 
        backside={false}
        samples={2}
        thickness={1.5}
        chromaticAberration={0.06}
        anisotropy={0.15}
        distortion={0.2}
        distortionScale={0.5}
        temporalDistortion={0.08}
        iridescence={0.3}
        iridescenceIOR={1.2}
        iridescenceThicknessRange={[50, 400]}
        color={color}
        attenuationDistance={2}
        attenuationColor="#ffffff"
        clearcoat={1}
        roughness={0.15}
        envMapIntensity={1.5}
      />
    </mesh>
  );
}
