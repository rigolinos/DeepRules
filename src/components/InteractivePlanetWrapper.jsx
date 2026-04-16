import React, { useRef, useEffect } from 'react';
import { useSpring, a } from '@react-spring/three';
import { useDrag } from '@use-gesture/react';
import { useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';

export function InteractivePlanetWrapper({ children, position, scale = 1, rotation = [0, 0, 0] }) {
  const { size, viewport, camera } = useThree();
  const baseAspect = viewport.width / size.width;
  const isDragging = useRef(false);

  // Animações de física clássica
  const [{ pos, rot }, api] = useSpring(() => ({
    pos: position,
    rot: rotation,
    config: { mass: 2, tension: 150, friction: 40 }
  }));

  // Retorna para origem SOMENTE quando receber o sinal de Rewind do App.jsx
  useEffect(() => {
    const handleRewind = () => {
      api.start({
        pos: position,
        rot: rotation,
        config: { mass: 5, tension: 120, friction: 50 } 
      });
    };
    window.addEventListener('rewind_started', handleRewind);
    return () => window.removeEventListener('rewind_started', handleRewind);
  }, [api, position, rotation]);

  const bind = useDrag(({ active, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], memo = pos.get() }) => {
    isDragging.current = active;
    
    // Escala realista baseada no quão distante o astro está
    const distance = Math.abs(camera.position.z - memo[2]);
    const scaleFactor = (baseAspect * distance) / 10; 
    const limitedScale = Math.max(0.5, Math.min(scaleFactor, 5.0));

    const x = memo[0] + (mx * limitedScale);
    const y = memo[1] - (my * limitedScale);
    const z = memo[2];

    if (active) {
      document.body.style.cursor = 'grabbing';
      // Movimento PESADO a favor do drag do mouse com giro no punho
      api.start({ 
        pos: [x, y, z],
        rot: [
          rot.get()[0] + (dy * 0.1),
          rot.get()[1] + (dx * 0.1),
          rot.get()[2]
        ],
        config: { mass: 8, tension: 150, friction: 90 } // Extremamente duro de arrastar (Sensação de chumbo)
      });
    } else {
      document.body.style.cursor = 'auto';
      
      // Quando solta, a inércia dá um leve tapinha, inclusive no GIRO. 
      const throwForceX = Math.min(vx, 3);
      const throwForceY = Math.min(vy, 3);
      const finalX = x + dx * throwForceX * 4; 
      const finalY = y - dy * throwForceY * 4;

      api.start({
          pos: [finalX, finalY, z],
          rot: [
            rot.get()[0] + dy * vy * 1.5,
            rot.get()[1] + dx * vx * 1.5,
            rot.get()[2]
          ],
          config: { mass: 12, tension: 10, friction: 80 } // Derrapa como óleo no espaço e para.
      });
    }
    return memo;
  });

  return (
    <a.group
      {...bind()}
      position={pos}
      rotation={rot}
      scale={scale}
      onPointerOver={() => { 
        if (!isDragging.current) document.body.style.cursor = 'grab'; 
      }}
      onPointerOut={() => { 
        if (!isDragging.current) document.body.style.cursor = 'auto'; 
      }}
    >
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1.5}>
        {children}
      </Float>
    </a.group>
  );
}
