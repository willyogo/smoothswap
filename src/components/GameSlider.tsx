import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, Timer, Calendar } from 'lucide-react';
import { FrequencyTier } from '../types';
import { SLIDER_TIERS } from '../config/constants';

interface GameSliderProps {
  value: number;
  onChange: (value: number) => void;
  tier: FrequencyTier;
  onTierChange: (tier: FrequencyTier) => void;
  frequency: number;
  disabled?: boolean;
}

const GameSlider: React.FC<GameSliderProps> = ({
  value,
  onChange,
  tier,
  onTierChange,
  frequency,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showBounce, setShowBounce] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const tierConfig = SLIDER_TIERS.find(t => t.tier === tier);
  const frequencyInSeconds = Math.round(frequency / 1000);

  // Format frequency display
  const formatFrequency = (freq: number) => {
    if (freq < 60) return `${freq}s`;
    if (freq < 3600) return `${Math.round(freq / 60)}m`;
    if (freq < 86400) return `${Math.round(freq / 3600)}h`;
    return `${Math.round(freq / 86400)}d`;
  };

  // Get tier icon
  const getTierIcon = () => {
    switch (tier) {
      case 'seconds': return <Zap className="w-5 h-5" />;
      case 'minutes': return <Timer className="w-5 h-5" />;
      case 'hours': return <Clock className="w-5 h-5" />;
      case 'days': return <Calendar className="w-5 h-5" />;
    }
  };

  // Calculate dynamic colors based on speed
  const getSpeedColor = () => {
    const intensity = value / 100;
    if (tier === 'seconds') {
      return `hsl(${360 - intensity * 60}, 100%, ${50 + intensity * 30}%)`;
    } else if (tier === 'minutes') {
      return `hsl(${60 - intensity * 60}, 100%, ${50 + intensity * 20}%)`;
    } else if (tier === 'hours') {
      return `hsl(${120 - intensity * 60}, 100%, ${50 + intensity * 15}%)`;
    } else {
      return `hsl(${180 - intensity * 60}, 100%, ${50 + intensity * 10}%)`;
    }
  };

  return (
    <div className="relative px-6">
      {/* Tier indicator */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex bg-gray-100 rounded-full p-1 space-x-1">
          {SLIDER_TIERS.map((tierOption) => (
            <motion.button
              key={tierOption.tier}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTierChange(tierOption.tier)}
              className={`px-3 py-2 rounded-full text-sm font-semibold transition-all flex items-center space-x-1 ${
                tier === tierOption.tier
                  ? 'bg-white text-gray-800 shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tierOption.tier === 'seconds' && <Zap className="w-4 h-4" />}
              {tierOption.tier === 'minutes' && <Timer className="w-4 h-4" />}
              {tierOption.tier === 'hours' && <Clock className="w-4 h-4" />}
              {tierOption.tier === 'days' && <Calendar className="w-4 h-4" />}
              <span className="capitalize">{tierOption.tier}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Frequency display */}
      <motion.div
        animate={{ scale: isDragging ? 1.05 : 1 }}
        className="text-center mb-6"
      >
        <p className="text-sm text-gray-600 mb-1">Swap Frequency</p>
        <p className="text-3xl font-bold text-gray-800">
          Every {formatFrequency(frequencyInSeconds)}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          ~1% of balance per swap
        </p>
      </motion.div>

      {/* Slider track */}
      <div className="relative">
        <div ref={trackRef} className="h-3 bg-gray-200 rounded-full relative overflow-hidden">
          {/* Active track */}
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${value}%`,
              background: `linear-gradient(90deg, #10b981, ${getSpeedColor()})`
            }}
            animate={{ 
              boxShadow: isDragging 
                ? `0 0 20px ${getSpeedColor()}` 
                : 'none'
            }}
          />
          
          {/* Glow effect */}
          <div 
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: `linear-gradient(90deg, transparent, ${getSpeedColor()})`
            }}
          />
        </div>

        {/* Slider thumb */}
        <motion.div
          className="absolute top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full shadow-lg cursor-grab active:cursor-grabbing"
          style={{
            left: `calc(${value}% - 16px)`,
            backgroundColor: getSpeedColor(),
          }}
          animate={{ 
            scale: isDragging ? 1.2 : showBounce ? 1.3 : 1,
            rotate: showBounce ? [0, 10, -10, 0] : 0
          }}
          whileHover={{ scale: 1.1 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          onDrag={(event, info) => {
            if (!trackRef.current) return;
            const rect = trackRef.current.getBoundingClientRect();
            const newValue = Math.max(0, Math.min(100, ((info.point.x - rect.left) / rect.width) * 100));
            onChange(newValue);
          }}
        >
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-sm">
            <motion.div
              animate={{ rotate: isDragging ? 360 : 0 }}
              transition={{ duration: isDragging ? 0.5 : 0, repeat: isDragging ? Infinity : 0 }}
            >
              {getTierIcon()}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-4 text-xs text-gray-500">
        <span className="flex items-center space-x-1">
          <span>Slower</span>
          <span>({formatFrequency(tierConfig?.max || 3600)})</span>
        </span>
        <span className="flex items-center space-x-1">
          <span>Faster</span>
          <span>({formatFrequency(tierConfig?.min || 60)})</span>
        </span>
      </div>

      {/* Instruction tooltip */}
      {!isDragging && value === 50 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm"
        >
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800" />
          Slide to set frequency or use buttons above! 🎯
        </motion.div>
      )}
    </div>
  );
};

export default GameSlider;