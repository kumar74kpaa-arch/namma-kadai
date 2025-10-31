"use client";

import { useCart } from "@/context/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingCart, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback, useEffect, useRef } from "react";
import { useFirestore, addDocumentNonBlocking, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Order, Location } from "@/lib/types";

// A simple map component to show the location
function MapView({ location, onLocationChange }: { location: Location, onLocationChange: (newLocation: Location) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: location,
      zoom: 16,
      disableDefaultUI: true,
    });

    const marker = new window.google.maps.Marker({
      position: location,
      map,
      draggable: true,
    });

    marker.addListener('dragstart', () => {
      isDragging.current = true;
    });

    marker.addListener('dragend', () => {
      isDragging.current = false;
      const newPos = marker.getPosition();
      if (newPos) {
        onLocationChange({ lat: newPos.lat(), lng: newPos.lng() });
      }
    });

    // Center map when location changes, but not while dragging
    if(!isDragging.current) {
      map.setCenter(location);
    }

  }, [location, onLocationChange]);

  return <div ref={mapRef} className="h-64 w-full rounded-md bg-muted" />;
}


export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [location, setLocation] = useState<Location | null>(null);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleLocationUpdate = useCallback((newLocation: Location) => {
    setLocation(newLocation);
    // Reverse geocode to get address
    if (window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: newLocation }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          setCustomerAddress(results[0].formatted_address);
        } else {
          console.warn('Geocode was not successful for the following reason: ' + status);
        }
      });
    }
  }, []);

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          handleLocationUpdate(newLocation);
          setIsLocating(false);
          toast({ title: "Location found!" });
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Could not get your location. Please enter your address manually.",
          });
          setIsLocating(false);
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services.",
      });
      setIsLocating(false);
    }
  };

  const handleCheckout = async () => {
    if (!customerName || !customerPhone || !customerAddress) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all customer details before checking out.",
      });
      return;
    }

    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not connect to the database. Please refresh and try again.",
        });
        return;
    }

    setIsCheckingOut(true);

    const order: Omit<Order, 'id'> = {
      userId: user.uid,
      customerName,
      customerPhone,
      customerAddress,
      location: location ?? undefined,
      orderDate: new Date().toISOString(),
      totalPrice,
      orderItems: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      status: 'pending',
    };

    try {
      const ordersCollection = collection(firestore, 'orders');
      await addDocumentNonBlocking(ordersCollection, order);
      
      toast({
        title: "Checkout Successful!",
        description: "Thank you for your order. We will be in touch shortly.",
      });
      clearCart();
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setLocation(null);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: "There was a problem placing your order. Please try again.",
      });
    } finally {
        setIsCheckingOut(false);
    }
  };

  if (totalItems === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-headline font-semibold">Your Cart is Empty</h1>
        <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
        <Button asChild className="mt-6">
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground mb-8">Your Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 items-center">
                    <div className="w-24 h-24 bg-card rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold font-headline">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="grid gap-4 mt-4">
                 <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Enter your name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="Enter your phone number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Shipping Address</Label>
                    <div className="flex gap-2">
                      <Input id="address" placeholder="Enter your address or use current location" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                      <Button variant="outline" size="icon" onClick={handleUseCurrentLocation} disabled={isLocating}>
                        <MapPin className="h-5 w-5"/>
                        <span className="sr-only">Use Current Location</span>
                      </Button>
                    </div>
                  </div>
                  {location && <MapView location={location} onLocationChange={handleLocationUpdate} />}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handleCheckout} disabled={isCheckingOut || isLocating}>
                {isCheckingOut ? 'Placing Order...' : 'Proceed to Checkout'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
