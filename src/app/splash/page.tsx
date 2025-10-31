
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function SplashPage() {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000); // Start fade-out 0.5s before redirect

    const redirectTimer = setTimeout(() => {
      router.replace('/home');
    }, 2500); // Redirect after 2.5s

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div
      style={{ backgroundColor: '#f5a623' }}
      className={cn(
        'fixed inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out',
        isFadingOut ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg px-4">
        <Image
          src="/splash.jpg"
          alt="Namma Kadai Splash Screen"
          width={600}
          height={900}
          layout="responsive"
          priority
          className="object-contain"
        />
      </div>
    </div>
  );
}
