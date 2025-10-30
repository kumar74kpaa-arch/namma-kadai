"use client";

import { useCart } from "@/context/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Order } from "@/lib/types";

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!customerName || !customerPhone || !customerAddress) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all customer details before checking out.",
      });
      return;
    }

    if (!firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not connect to the database. Please try again later.",
        });
        return;
    }

    setIsCheckingOut(true);

    const order: Omit<Order, 'id'> = {
      customerName,
      customerPhone,
      customerAddress,
      orderDate: new Date().toISOString(),
      totalPrice,
      orderItems: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
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
                    <Input id="address" placeholder="Enter your address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                  </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handleCheckout} disabled={isCheckingOut}>
                {isCheckingOut ? 'Placing Order...' : 'Proceed to Checkout'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
