'use client';

import { useState } from 'react';
import Image from 'next/image';
import { UtensilsCrossed } from 'lucide-react';

interface SafeFoodImageProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export default function SafeFoodImage({
  src,
  alt,
  size = 64,
  className = '',
}: SafeFoodImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-primary-fixed to-secondary-container text-primary shrink-0 ${className}`}
        aria-label={alt}
      >
        <UtensilsCrossed className="w-6 h-6" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover shrink-0 ${className}`}
    />
  );
}
