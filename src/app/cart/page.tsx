"use client";

import { useCart } from "@/context/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingCart, Upload, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";
import { useFirestore, addDocumentNonBlocking, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Order } from "@/lib/types";

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const storage = getStorage();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (['image/jpeg', 'image/png'].includes(file.type)) {
        setScreenshotFile(file);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a JPEG or PNG image.",
        });
      }
    }
  };

  const handlePlaceOrder = async () => {
    if (!customerName || !customerPhone || !customerAddress) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all customer details.",
      });
      return;
    }
    if (!screenshotFile) {
      toast({
        variant: "destructive",
        title: "Missing Payment Screenshot",
        description: "Please upload a screenshot of your payment.",
      });
      return;
    }
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not connect to the database. Please try again.",
        });
        return;
    }

    setIsPlacingOrder(true);

    try {
      // 1. Upload screenshot to Firebase Storage
      const screenshotRef = ref(storage, `payment_screenshots/${user.uid}/${Date.now()}_${screenshotFile.name}`);
      const uploadResult = await uploadBytes(screenshotRef, screenshotFile);
      const screenshotUrl = await getDownloadURL(uploadResult.ref);

      // 2. Create order document in Firestore
      const order: Omit<Order, 'id'> = {
        userId: user.uid,
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
        status: 'awaiting_payment_verification',
        paymentScreenshotUrl: screenshotUrl,
      };
      
      const ordersCollection = collection(firestore, 'orders');
      await addDocumentNonBlocking(ordersCollection, order);
      
      // 3. Update UI
      toast({
        title: "Order Placed Successfully!",
        description: "We have received your order and are verifying your payment.",
      });
      setOrderPlaced(true);
      clearCart();

    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: "There was a problem placing your order. Please try again.",
      });
    } finally {
        setIsPlacingOrder(false);
    }
  };

  if (totalItems === 0 && !orderPlaced) {
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

  if (orderPlaced) {
    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <CheckCircle className="mx-auto h-24 w-24 text-green-500" />
            <h1 className="mt-6 text-2xl font-headline font-semibold">Thank You For Your Order!</h1>
            <p className="mt-2 text-muted-foreground">We are verifying your payment and will process your order shortly. You can track the status on the "My Orders" page.</p>
            <div className="flex justify-center gap-4 mt-6">
                <Button asChild>
                    <Link href="/orders">View My Orders</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/">Continue Shopping</Link>
                </Button>
            </div>
        </div>
    )
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
              <CardTitle className="font-headline">Confirm Order</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
               {/* Delivery Details */}
               <div className="grid gap-4">
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
              
              <Separator />

              {/* Payment Section */}
              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold text-center">📲 Scan to Pay via UPI</h3>
                  <div className="flex justify-center">
                    <Image src="/assets/upi_qr.png" alt="UPI QR Code" width={200} height={200} className="rounded-md" />
                  </div>
                  <p className="text-center text-sm font-mono text-muted-foreground">paytm.s7kThqj@pty</p>
                  <div className="text-center font-bold text-lg">
                      Total Amount: {formatPrice(totalPrice)}
                  </div>
                   <p className="text-xs text-center text-muted-foreground">Please complete the payment before confirming your order.</p>
              </div>

               {/* Screenshot Upload */}
              <div className="space-y-2">
                  <Label htmlFor="screenshot">Upload Payment Screenshot</Label>
                  <div className="flex items-center gap-2">
                    <Input id="screenshot" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="flex-grow" />
                    {screenshotFile && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </div>
              </div>

            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                 {isPlacingOrder ? 'Placing Order...' : 'Confirm Order'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
