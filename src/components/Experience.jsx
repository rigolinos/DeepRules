import React, { useRef, useLayoutEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Text, Image } from '@react-three/drei';
import * as THREE from 'three';
import { InteractivePlanetWrapper } from './InteractivePlanetWrapper';
import { SunPlanet, JupiterPlanet, GenericMeshPlanet } from './GLTFPlanets';



function GalaxyParticles() {
  const particlesCount = 9000;

  const positions = useMemo(() => {
    const posArr = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
        // Distribuição Dupla (80% Aglomerados densos naturais, 20% Vácuo espalhado infinito)
        let z;
        if (Math.random() > 0.2) {
           z = 50 - (Math.pow(Math.random(), 2.0) * 850); 
        } else {
           z = 50 - (Math.random() * 850);
        }
        
        const hollowRadius = 6.0; 
        const randomRadius = Math.random() * 80;
        const radius = hollowRadius + randomRadius;
        
        const angle = Math.random() * Math.PI * 2 + (z * 0.1); 
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        posArr[i * 3] = x;
        posArr[i * 3 + 1] = y;
        posArr[i * 3 + 2] = z;
    }
    return posArr;
  }, [particlesCount]);

  const pointsRef = useRef();
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05 + state.mouse.x * 0.5;
      pointsRef.current.rotation.x = state.mouse.y * 0.5;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffffff"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default function Experience() {
  const { camera, scene } = useThree();
  const groupRef = useRef();
  const [scrollProgress, setScrollProgress] = useState(0);

  // Refs de Textos para fading dinâmico e desacoplado
  const logoRef = useRef();
  const text1Ref = useRef();
  const text2Ref = useRef();
  const endRef = useRef();

  useLayoutEffect(() => {
    const handleScroll = (e) => setScrollProgress(e.detail.progress);
    window.addEventListener('lenisscroll', handleScroll);
    return () => window.removeEventListener('lenisscroll', handleScroll);
  }, []);

  useFrame((state) => {
    // MOVIMENTAÇÃO PROFUNDA Z-AXIS CÂMERA VOANDO PARA O FUNDO DA VIA LÁCTEA
    const targetZ = 5 - (scrollProgress * 180); 
    
    const mouseX = state.mouse.x; 
    const mouseY = state.mouse.y; 

    // Efeito sinuoso orgânico
    const targetX = (mouseX * 3.5) + Math.sin(scrollProgress * Math.PI * 2) * 1.5;
    const targetY = (mouseY * 3.5) + Math.cos(scrollProgress * Math.PI * 2) * 1.0;

    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.08;

    camera.rotation.y = -(mouseX * 0.15);
    camera.rotation.x = (mouseY * 0.15);

    // MAGIC CONVEYOR BELT: Mantém as estrelas estáticas ao invés de recalcular buffers.
    // O módulo mágico abaixa a malha conforme a lente passa de forma homogênea.
    const chunkWidth = 100;
    const zOffset = - (Math.floor(Math.abs(camera.position.z) / chunkWidth) * chunkWidth);

    if (groupRef.current) {
      groupRef.current.position.z = zOffset;
    }

    // Fade Direcional dos Textos baseado no exato Scroll Progress!
    const smoothStepOpacity = (prog, min, max, fadeRange) => {
      if (prog < min - fadeRange || prog > max + fadeRange) return 0;
      if (prog >= min && prog <= max) return 1;
      if (prog < min) return (prog - (min - fadeRange)) / fadeRange;
      return (max + fadeRange - prog) / fadeRange;
    };

    const updateOpacity = (ref, targetOpacity) => {
      if (ref.current) {
        ref.current.position.x += ((mouseX * 0.8) - ref.current.position.x) * 0.1;
        ref.current.position.y += ((mouseY * 0.8) - ref.current.position.y) * 0.1;

        ref.current.traverse((c) => {
          if (c.material) {
            c.material.transparent = true;
            c.material.opacity += (targetOpacity - c.material.opacity) * 0.1;
          }
        });
      }
    };

    updateOpacity(logoRef, smoothStepOpacity(scrollProgress, 0.0, 0.02, 0.02)); // Camera cruza -4 no prog 0.05. Some total no 0.04!
    updateOpacity(text1Ref, smoothStepOpacity(scrollProgress, 0.10, 0.13, 0.02)); // Camera cruza -25 no prog 0.16. Some total no 0.15!
    updateOpacity(text2Ref, smoothStepOpacity(scrollProgress, 0.27, 0.32, 0.02)); // Camera cruza -60 no prog 0.36. Some total no 0.34!
    updateOpacity(endRef, smoothStepOpacity(scrollProgress, 0.88, 1.0, 0.05));

    scene.background = new THREE.Color('#000000');
    scene.fog.color = new THREE.Color('#000000');
    scene.fog.near = 50; 
    scene.fog.far = 300; 
  });

  // MEMOIZATION ABSOLUTA: Trava o componente dos planetas na memória para bloquear o React de resetar a física sob qualquer hipótese de scroll!
  const planetMeshes = useMemo(() => (
    <group>
      <InteractivePlanetWrapper position={[-15, 8, -25]} scale={3.5}>
        <GenericMeshPlanet path="/Meshy_AI_Nebula_Clash_0415210915_texture.glb" glowColor="#ff44aa" />
      </InteractivePlanetWrapper>

      <InteractivePlanetWrapper position={[12, -4, -60]} scale={3.5}>
        <JupiterPlanet />
      </InteractivePlanetWrapper>

      <InteractivePlanetWrapper position={[-18, -8, -100]} scale={4}>
        <GenericMeshPlanet path="/Meshy_AI_jupiter_0415211230_texture.glb" glowColor="#44aaff" />
      </InteractivePlanetWrapper>

      <InteractivePlanetWrapper position={[8, 15, -170]} scale={9}>
        <SunPlanet />
      </InteractivePlanetWrapper>
    </group>
  ), []);

  return (
    <>
      <group ref={groupRef}>
        <GalaxyParticles />
        <Sparkles count={8000} scale={[50, 50, 600]} position={[0, 0, -300]} size={1.8} speed={0.5} opacity={0.3} color="#2b4055" />
      </group>

      {planetMeshes}

      <group>
        {/* LOGO */}
        <group ref={logoRef} position={[0, 0, -4]}>
          <Image 
            position={[0, 0.8, 0]} 
            scale={[4, 1.3]} 
            url="/deep_rules_logo.png" 
            transparent 
          />
          <Text 
            position={[0, -0.6, 0]} 
            fontSize={0.35} 
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.2}
            fontWeight="bold"
          >
            BEYOND THE SURFACE
          </Text>
        </group>
        
        {/* Frase 1 */}
        <group ref={text1Ref} position={[-8, 11, -25]}>
          <Text 
            fontSize={0.8} 
            color="#ffffff"
            rotation={[0, 0.25, 0]}
          >
            nasce pra quem pensa diferente.
          </Text>
        </group>
        
        {/* Frase 2 */}
        <group ref={text2Ref} position={[15, -2, -60]}>
          <Text 
            fontSize={1.0} 
            color="#ffffff"
            rotation={[0, -0.35, 0]}
            maxWidth={8}
            textAlign="center"
          >
            Pra quem vê além do óbvio.
          </Text>
        </group>

        {/* PRODUTOS NA GRAVIDADE ZERO AO FIM DO TÚNEL (Recuado para Z=-195 para n ser atravessado!) */}
        <group ref={endRef} position={[0, 0, -195]}>
          <Text position={[0, 3, 0]} fontSize={0.6} color="#ffffff" letterSpacing={0.2}>
            [ SPACE DROP - 001 ]
          </Text>
          <Image 
            position={[-2.8, 0, 0]} 
            scale={[3.2, 4.4]} 
            url="/shirt_white.png" 
            transparent={true}
            rotation={[0, 0.15, 0]}
          />
          <Image 
            position={[2.8, 0, 0]} 
            scale={[3.2, 4.4]} 
            url="/shirt_black.png"
            transparent={true} 
            rotation={[0, -0.15, 0]}
          />
        </group>
      </group>

      {/* A VIA LÁCTEA NO FUNDO EXTREMO */}
      <Image 
        position={[0, 0, -260]} 
        scale={[300, 170]} 
        url="/galaxy.jpg" 
        transparent={false} 
      />
    </>
  );
}
