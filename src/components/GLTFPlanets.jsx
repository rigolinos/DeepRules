import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Sparkles, Clone } from '@react-three/drei';
import * as THREE from 'three';

// Atmosfera Fresnel Universal (Halo de gás)
const AtmosphereMaterialShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vPosition = mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 glowColor;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec3 viewDirection = normalize(-vPosition);
      float fresnel = clamp(1.0 - dot(viewDirection, vNormal), 0.0, 1.0);
      float intensity = pow(fresnel, 3.5);
      
      // Multiplica a cor pela intensidade no blending aditivo
      gl_FragColor = vec4(glowColor * intensity, 1.0);
    }
  `
};

// Shader para os anéis com poeira espacial paramétrica
const RingShaderMaterial = {
  uniforms: {
    color: { value: new THREE.Color("#e6c29a") },
    innerRad: { value: 1.8 },
    outerRad: { value: 3.5 }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPos;
    void main() {
      vUv = uv;
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform float innerRad;
    uniform float outerRad;
    varying vec2 vUv;
    varying vec3 vPos;
    
    // Hash based 3d value noise for rings dust
    float hash(float n) { return fract(sin(n) * 1e4); }
    float noise(float x) {
      float i = floor(x);
      return mix(hash(i), hash(i + 1.0), smoothstep(0.0, 1.0, fract(x)));
    }

    void main() {
      float r = length(vPos.xy); 
      float nR = (r - innerRad) / (outerRad - innerRad);
      
      if (nR < 0.0 || nR > 1.0) discard;

      // Criação de anéis e buracos (Gaps) através de ruído
      float rings = noise(r * 40.0) * noise(r * 80.0);
      float alpha = rings * 0.8 + 0.15; 
      
      // Suavização das bordas do anel
      float edgeFade = smoothstep(0.0, 0.05, nR) * (1.0 - smoothstep(0.9, 1.0, nR));
      
      gl_FragColor = vec4(color * 1.5, alpha * edgeFade * 0.9);
    }
  `
};

// Shader Procedural Tiling 3D Simplex para detalhe da textura com Zoom Extremo
const DetailShellShader = {
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 cameraPos;
    uniform vec3 innerColor;
    varying vec3 vWorldPosition;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy; 
      vec3 x3 = x0 - D.yyy;      
      i = mod289(i);
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857; 
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      float dist = distance(cameraPos, vWorldPosition);
      // Revela ruidos apenas num raio muito perto de 15 units ou menos.
      float visibility = 1.0 - smoothstep(3.0, 16.0, dist);
      
      if (visibility <= 0.0) discard;

      // Micro turbulências para imitar granulação de rocha/poeira planetária.
      float noiseVal = snoise(vWorldPosition * 30.0) * 0.5 + 0.5;
      float microNoise = snoise(vWorldPosition * 100.0) * 0.5 + 0.5;
      
      noiseVal = mix(noiseVal, microNoise, 0.4);
      vec3 dustColor = innerColor + vec3(0.3); // Brighten
      
      gl_FragColor = vec4(dustColor * noiseVal, visibility * 0.65);
    }
  `
};

export function PlanetDetailShell({ scale = 1, color = "#ffffff" }) {
  const materialRef = useRef();
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.cameraPos.value.copy(state.camera.position);
    }
  });

  return (
    <mesh scale={scale} raycast={() => null}>
      <sphereGeometry args={[1.002, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        vertexShader={DetailShellShader.vertexShader}
        fragmentShader={DetailShellShader.fragmentShader}
        uniforms={{ 
          cameraPos: { value: new THREE.Vector3() },
          innerColor: { value: new THREE.Color(color) }
        }}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

export function AtmosphereWrapper({ color = "#4488ff", scale = 1.1 }) {
  const materialRef = useRef();
  return (
    <mesh scale={scale} raycast={() => null}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={AtmosphereMaterialShader.vertexShader}
        fragmentShader={AtmosphereMaterialShader.fragmentShader}
        uniforms={{ glowColor: { value: new THREE.Color(color) } }}
        side={THREE.FrontSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export function SunPlanet() {
  const { scene } = useGLTF('/Meshy_AI_Sol_0415223400_texture.glb');
  const sunRef = useRef();

  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={sunRef}>
      <Clone object={scene} scale={2} />
      <pointLight color="#ffbb00" intensity={15} distance={400} decay={1.2} />
      
      {/* Múltiplas camadas de coroa solar para um "Bloom" massivo fake */}
      <AtmosphereWrapper color="#ff4400" scale={2.1} />
      <AtmosphereWrapper color="#ff8800" scale={2.3} />
      <AtmosphereWrapper color="#ff2200" scale={2.6} />
      <PlanetDetailShell scale={2.001} color="#ff9900" />
      
      {/* Flares e Raios - Isolados em grupo sem raycast. Escala reduzida para evitar Flash na lente! */}
      <group raycast={() => null}>
        <Sparkles count={200} scale={[2.5, 2.5, 2.5]} size={4} speed={1.5} opacity={0.3} color="#ff9900" />
        <Sparkles count={100} scale={[3, 3, 3]} size={8} speed={2} opacity={0.2} color="#ff3300" />
      </group>
    </group>
  );
}

export function JupiterPlanet() {
  const { scene } = useGLTF('/Meshy_AI_jupiter_0415223424_texture.glb');
  const planetRef = useRef();
  
  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <group ref={planetRef} rotation={[0.4, 0, 0.2]}>
      <Clone object={scene} scale={1.5} />
      <AtmosphereWrapper color="#eddfb7" scale={1.55} />
      <PlanetDetailShell scale={1.503} color="#eddfb7" />
      
      {/* Anéis Realísticos via Shader Procedural (sem hitboxes no clique) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[1.8, 4.3, 128]} />
        <shaderMaterial
          vertexShader={RingShaderMaterial.vertexShader}
          fragmentShader={RingShaderMaterial.fragmentShader}
          uniforms={{
            color: { value: new THREE.Color("#dca971") },
            innerRad: { value: 1.8 },
            outerRad: { value: 4.3 }
          }}
          transparent={true}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function GenericMeshPlanet({ path, scale=1, glowColor="#44aaff" }) {
  const { scene } = useGLTF(path);
  const planetRef = useRef();
  
  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      planetRef.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <group ref={planetRef}>
      <Clone object={scene} scale={scale} />
      <AtmosphereWrapper color={glowColor} scale={scale * 1.08} />
      <PlanetDetailShell scale={scale * 1.002} color={glowColor} />
    </group>
  );
}

useGLTF.preload('/Meshy_AI_Sol_0415223400_texture.glb');
useGLTF.preload('/Meshy_AI_jupiter_0415223424_texture.glb');
useGLTF.preload('/Meshy_AI_Nebula_Clash_0415210915_texture.glb');

