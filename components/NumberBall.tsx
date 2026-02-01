import React from 'react';

interface NumberBallProps {
  number: number;
  isHot?: boolean;
  isCold?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const NumberBall: React.FC<NumberBallProps> = ({ number, isHot, isCold, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm sm:w-11 sm:h-11 sm:text-base',
    lg: 'w-12 h-12 text-lg font-bold',
  };

  // Default: Clean white ball with subtle border
  let styles = 'bg-white text-slate-700 border border-slate-200 shadow-sm';

  if (isHot) {
     // Hot: Solid Primary Color (Matte)
     styles = 'bg-slate-900 text-white border-none shadow-md';
  } else if (isCold) {
     // Cold: Light Gray background
     styles = 'bg-slate-100 text-slate-400 border border-transparent';
  }

  const displayNum = number < 10 ? `0${number}` : number;

  return (
    <div className={`
      ${sizeClasses[size]} 
      rounded-full 
      flex items-center justify-center 
      font-bold font-sans select-none 
      transition-transform duration-200 hover:scale-110
      ${styles}
    `}>
      {displayNum}
    </div>
  );
};

export default NumberBall;