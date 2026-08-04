import React from 'react';

interface CountryFlagProps {
  code?: string | null;
  size?: number;
  className?: string;
}

const CountryFlag: React.FC<CountryFlagProps> = ({ code, size = 16, className = '' }) => {
  if (!code || code.length !== 2) return null;
  const cc = code.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${cc}.png`}
      srcSet={`https://flagcdn.com/${size * 2}x${Math.round(size * 0.75 * 2)}/${cc}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={code.toUpperCase()}
      className={`inline-block rounded-[2px] object-cover ${className}`}
      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
  );
};

export default CountryFlag;
