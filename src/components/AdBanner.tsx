'use client';

import { useEffect, useState } from 'react';
import { Card } from './ui/card';

// Extend the Window interface to include the adsbygoogle property
declare global {
  interface Window {
    adsbygoogle?: { [key: string]: unknown }[];
  }
}

export function AdBanner() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error(err);
      }
    }
  }, [isClient]);

  // Render a placeholder on the server and during the initial client render
  if (!isClient) {
    return <Card className="my-8 flex justify-center items-center text-center shadow-md rounded-xl min-h-[100px] overflow-hidden bg-muted" />;
  }

  return (
    <Card className="my-8 flex justify-center items-center text-center shadow-md rounded-xl min-h-[100px] overflow-hidden">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXX'}
        data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || 'YYYYYYYYYY'}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </Card>
  );
}
