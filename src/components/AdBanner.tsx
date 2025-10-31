'use client';

import { useEffect } from 'react';
import { Card } from './ui/card';

// Extend the Window interface to include the adsbygoogle property
declare global {
  interface Window {
    adsbygoogle?: { [key: string]: unknown }[];
  }
}

export function AdBanner() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <Card className="my-8 flex justify-center items-center bg-beige text-center shadow-md rounded-xl min-h-[100px]">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXX'}
        data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || 'YYYYYYYYYY'}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </Card>
  );
}
