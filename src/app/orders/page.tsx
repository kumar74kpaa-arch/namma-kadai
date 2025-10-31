'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc, onSnapshot } from 'firebase/firestore';
import type { Order, Location } from '@/lib/types';
import { formatPrice, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServerCrash, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';


const statusConfig = {
    awaiting_payment_verification: { label: 'Awaiting Payment', color: 'bg-orange-500 hover:bg-orange-600', variant: 'secondary' as const },
    payment_rejected: { label: 'Payment Rejected', color: '', variant: 'destructive' as const },
    pending: { label: 'Pending', color: 'bg-yellow-500 hover:bg-yellow-600', variant: 'secondary' as const },
    approved: { label: 'Approved', color: 'bg-green-600 hover:bg-green-700 text-white', variant: 'default' as const },
    rejected: { label: 'Rejected', color: '', variant: 'destructive' as const },
    out_for_delivery: { label: 'Out for Delivery', color: 'bg-blue-600 hover:bg-blue-700 text-white', variant: 'default' as const },
    delivered: { label: 'Delivered', color: 'bg-gray-600 hover:bg-gray-700 text-white', variant: 'default' as const },
}

function LiveMapView({ order }: { order: Order }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();
  const [deliveryLocation, setDeliveryLocation] = useState<Location | null>(order.deliveryLocation || null);
  const deliveryMarkerRef = useRef<google.maps.Marker | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!firestore) return;

    const deliveryRef = doc(firestore, `orders/${order.id}`);
    const unsubscribe = onSnapshot(deliveryRef, (docSnap) => {
      const data = docSnap.data();
      if (data && data.deliveryLocation) {
        setDeliveryLocation(data.deliveryLocation);
      }
    });

    return () => unsubscribe();
  }, [firestore, order.id]);

  useEffect(() => {
    if (!mapRef.current || !window.google || !order.location) return;

    if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: order.location,
            zoom: 14,
            disableDefaultUI: true,
        });

        new window.google.maps.Marker({
            position: order.location,
            map: mapInstanceRef.current,
            title: "Your Location",
        });
    }
    
    if (deliveryLocation) {
        if (!deliveryMarkerRef.current) {
            deliveryMarkerRef.current = new window.google.maps.Marker({
                position: deliveryLocation,
                map: mapInstanceRef.current,
                title: "Delivery Person",
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2,
                }
            });
        } else {
            deliveryMarkerRef.current.setPosition(deliveryLocation);
        }
    }
    
    if (deliveryLocation && order.location) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(order.location);
        bounds.extend(deliveryLocation);
        mapInstanceRef.current.fitBounds(bounds);
    } else if (order.location) {
        mapInstanceRef.current.setCenter(order.location);
    }
  
  }, [order.location, deliveryLocation]);


  return (
    <div className="mt-4">
      <h4 className="font-semibold mb-2">Live Tracking</h4>
      <div ref={mapRef} className="h-64 w-full rounded-md bg-muted" />
    </div>
  );
}


function OrdersSkeleton() {
    return (
        <div className="grid gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                             <Skeleton className="h-5 w-full" />
                             <Skeleton className="h-5 w-2/3" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-6 w-28" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

export default function MyOrdersPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const ordersQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'orders'), where('userId', '==', user.uid)) : null),
    [firestore, user]
  );
  
  const { data: orders, isLoading, error } = useCollection<Order>(ordersQuery);

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders]);

  if (isUserLoading || (isLoading && !orders)) {
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold font-headline">📦 My Orders</h1>
                <p className="text-muted-foreground">Checking for your recent orders...</p>
            </div>
            <OrdersSkeleton />
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-headline">📦 My Orders</h1>
        <p className="text-muted-foreground">Here's a list of your past and current orders.</p>
      </div>

      {error && (
         <Alert variant="destructive">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>Error Loading Orders</AlertTitle>
            <AlertDescription>
                There was a problem fetching your orders. Please try refreshing the page.
            </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && sortedOrders.length > 0 && (
        <div className="grid gap-6 md:gap-8">
            {sortedOrders.map(order => (
                <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 bg-muted/50 p-4 md:p-6">
                        <div>
                            <CardTitle className="text-lg">Order #{order.id.substring(0, 7)}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Placed on {new Date(order.orderDate).toLocaleDateString()}
                            </p>
                        </div>
                        <Badge variant={statusConfig[order.status]?.variant || 'default'} className={cn("capitalize text-sm py-1 px-3", statusConfig[order.status]?.color)}>
                            {statusConfig[order.status]?.label || order.status}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 grid gap-4">
                        <div>
                            <h4 className="font-semibold mb-2">Items</h4>
                            <ul className="space-y-2">
                                {order.orderItems.map(item => (
                                    <li key={item.id} className="flex justify-between items-center text-sm">
                                        <span>{item.name} <span className="text-muted-foreground">x {item.quantity}</span></span>
                                        <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-1">Delivery Address</h4>
                            <p className="text-sm text-muted-foreground">{order.customerAddress}</p>
                        </div>
                        {order.status === 'out_for_delivery' && order.location && <LiveMapView order={order} />}
                    </CardContent>
                    <CardFooter className="bg-muted/50 p-4 md:p-6 flex justify-end">
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-xl font-bold">{formatPrice(order.totalPrice)}</p>
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
      )}
       {!isLoading && !error && sortedOrders.length === 0 && (
        <div className="text-center border-2 border-dashed rounded-lg p-12">
            <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-6 text-xl font-semibold">No Orders Found</h3>
            <p className="text-muted-foreground mt-2">You haven't placed any orders yet. Let's change that!</p>
            <Button asChild className="mt-6">
              <Link href="/">Start Shopping</Link>
            </Button>
        </div>
      )}
    </div>
  );
}
