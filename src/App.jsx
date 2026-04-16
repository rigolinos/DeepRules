import React, { useEffect, Suspense } from 'react';
import Lenis from 'lenis';
import { Canvas } from '@react-three/fiber';
import { Environment, Loader } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Experience from './components/Experience';
import HUD from './components/HUD';

function App() {
  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      direction: 'vertical', 
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    let isRewinding = false;
    let wheelPushes = 0;

    lenis.on('scroll', () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) : 0;
      window.dispatchEvent(new CustomEvent('lenisscroll', { detail: { progress } }));
      
      // Reseta a contagem de giro falso caso ele suba um pouco
      if (progress < 0.99) wheelPushes = 0;
    });

    // Filtra duplo gatilho e garante ação intencional humana pra iniciar a montanha russa
    const handleWheelGuard = (e) => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) : 0;

      if (progress >= 0.985 && e.deltaY > 0 && !isRewinding) {
        wheelPushes++;
        if (wheelPushes >= 2) { 
          // Trava Dupla Aprovada
          isRewinding = true;
          
          window.dispatchEvent(new Event('rewind_started'));
          
          lenis.scrollTo(0, { 
            duration: 4.5, 
            lock: true, // Bloqueia scroll do usuário sem congelar a animação
            easing: (t) => 1 - Math.pow(1 - t, 4),
            onComplete: () => {
              isRewinding = false;
              wheelPushes = 0;
            }
          });
        }
      }
    };

    window.addEventListener('wheel', handleWheelGuard);

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      window.removeEventListener('wheel', handleWheelGuard);
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <div className="canvas-container">
        <Canvas 
          camera={{ position: [0, 0, 5], fov: 45, near: 1.5, far: 300 }}
          gl={{ antialias: true, alpha: false }}
        >
          {/* Fundo preto espacial mantido limpo para visualização da Galáxia na partida */}
          <color attach="background" args={['#000000']} />
          <fog attach="fog" args={['#000000', 50, 300]} />
          
          {/* Global Illumination matching Igloo.inc high-contrast styling */}
          <ambientLight intensity={0.2} />
          <directionalLight position={[10, 20, 10]} intensity={1.0} color="#e0f0ff" />
          <pointLight position={[-10, 5, -10]} intensity={1.5} color="#00f0ff" />
          <pointLight position={[10, -5, -20]} intensity={1.0} color="#00aaff" />
          
          <Suspense fallback={null}>
            <EffectComposer disableNormalPass>
              <Bloom 
                luminanceThreshold={0.6} 
                mipmapBlur 
                intensity={0.3} 
              />
              <Experience />
              <Environment preset="night" />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>

      <div className="scroll-container">
        {/* Virtual height for lenis scrolling */}
      </div>

      <HUD />
      <Loader 
        containerStyles={{ background: '#000000' }}
        innerStyles={{ width: '300px', backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255,255,255,0.2)', height: '4px' }}
        barStyles={{ backgroundColor: '#ffffff', height: '4px' }}
        dataInterpolation={(p) => `CARREGANDO DEEP RULES ${p.toFixed(0)}%`}
        dataStyles={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.2rem', color: '#ffffff' }}
      />
    </>
  );
}

export default App;
