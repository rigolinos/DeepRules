import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HUD() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (e) => {
      // Fade out indicator if scrolled more than 5%
      setScrolled(e.detail.progress > 0.05);
    };
    window.addEventListener('lenisscroll', handleScroll);
    return () => window.removeEventListener('lenisscroll', handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.5,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 }
    }
  };

  return (
    <motion.div 
      className="hud-layer"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '1rem', pointerEvents: 'auto' }}>
          <img 
            src="/GATO.png" 
            alt="Deep Rules Logo" 
            style={{ width: '45px', height: '45px', objectFit: 'contain' }} 
          />
          <span className="hud-element" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
            DEEP RULES
          </span>
        </motion.div>
        
        <motion.div variants={itemVariants} className="hud-element">
          V1.0.0 // SPACE-DROP
        </motion.div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <motion.button 
          variants={itemVariants}
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          whileTap={{ scale: 0.95 }}
          className="hud-element hud-button"
        >
          SOUND: OFF
        </motion.button>
        <AnimatePresence>
          {!scrolled && (
            <motion.div 
              variants={itemVariants} 
              initial="visible"
              exit={{ opacity: 0, y: 10, transition: { duration: 0.5 } }}
              className="hud-element" 
              style={{ textAlign: 'right' }}
            >
              SCROLL TO EXPLORE<br />
              <motion.span 
                className="scroll-arrow"
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                style={{ display: 'inline-block', marginTop: '5px' }}
              >
                ↓
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
