'use client';

import { useEffect, useState, useRef } from 'react';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader, MapPin, CheckCircle, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DeliveryPageProps = {
  params: {
    orderId: string;
  };
};

export default function DeliveryPage({ params }: DeliveryPageProps) {
  const { orderId } = params;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    if (!firestore) {
      setError("Database connection not available.");
      return;
    }
    
    setError(null);
    setIsTracking(true);

    const orderRef = doc(firestore, 'orders', orderId);

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        
        updateDocumentNonBlocking(orderRef, { deliveryLocation: location });

        toast({
          title: "Location Updated",
          description: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
        });
      },
      (err) => {
        let message = "An unknown error occurred while tracking.";
        switch(err.code) {
          case err.PERMISSION_DENIED:
            message = "You denied the request for Geolocation. Please enable it in your settings.";
            break;
          case err.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case err.TIMEOUT:
            message = "The request to get user location timed out.";
            break;
        }
        setError(message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
     toast({
        title: "Tracking Stopped",
        description: "You have stopped sharing your location.",
      });
  };

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Live Delivery Tracking</CardTitle>
          <CardDescription>Order ID: {orderId}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {error && (
            <Alert variant="destructive">
              <Ban className="h-4 w-4" />
              <AlertTitle>Tracking Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isTracking && (
             <Button size="lg" onClick={startTracking}>
                <MapPin className="mr-2 h-5 w-5" />
                Start Sharing Location
            </Button>
          )}

          {isTracking && (
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center text-primary">
                    <Loader className="mr-2 h-6 w-6 animate-spin" />
                    <p className="font-semibold text-lg">Actively sharing location...</p>
                </div>
                <p className="text-muted-foreground text-sm">Keep this page open to continue sharing your live location.</p>
                <Button variant="destructive" size="lg" onClick={stopTracking}>
                    <Ban className="mr-2 h-5 w-5" />
                    Stop Sharing
                </Button>
            </div>
          )}

           { !isTracking && !error && (
             <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Ready to Track</AlertTitle>
                <AlertDescription>
                    Click the button above to start sharing your live location for this delivery.
                </AlertDescription>
            </Alert>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
