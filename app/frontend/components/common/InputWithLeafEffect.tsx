import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeafIcon } from './IconComponents';

interface InputWithLeafEffectProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

const InputWithLeafEffect: React.FC<InputWithLeafEffectProps> = ({ label, type, value, onChange, ...props }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  let particleIdCounter = 0;

  const triggerParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      particleIdCounter++;
      newParticles.push({
        id: particleIdCounter,
        x: (Math.random() - 0.5) * 150,
        y: (Math.random() - 0.5) * 100,
        rotate: Math.random() * 360 - 180,
        scale: Math.random() * 0.5 + 0.5,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
        setParticles(prev => prev.slice(count));
    }, 800);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
    }
    if ((e.target.value as string).length > (value as string).length) {
        triggerParticles();
    }
  };

  return (
    <div className="relative floating-label-input mb-8">
      <div className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute text-emerald-400"
              initial={{ x: 0, y: 0, scale: p.scale, opacity: 1, rotate: 0 }}
              animate={{ x: p.x, y: p.y, scale: 0, opacity: 0, rotate: p.rotate }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ top: '50%', left: '50%' }}
            >
              <LeafIcon className="w-3 h-3" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
       <input 
            type={type} 
            value={value}
            onChange={handleChange}
            {...props} 
            placeholder=" " 
            className="w-full pt-4 pb-2 bg-transparent border-none text-white focus:outline-none" 
        />
        <label className="label-text absolute top-4 left-0 text-gray-400 transition-transform duration-300 origin-top-left pointer-events-none">{label}</label>
    </div>
  );
};

export default InputWithLeafEffect;
