'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { formatPrice, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServerCrash, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function PaymentsSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-40 w-full mb-4" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-2/3" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

const statusConfig = {
    awaiting_payment_verification: { label: 'Awaiting Verification', color: 'bg-orange-500 hover:bg-orange-600', variant: 'secondary' as const },
    payment_rejected: { label: 'Payment Rejected', color: '', variant: 'destructive' as const },
    pending: { label: 'Pending', color: 'bg-yellow-500 hover:bg-yellow-600', variant: 'secondary' as const },
    approved: { label: 'Approved', color: 'bg-green-600 hover:bg-green-700 text-white', variant: 'default' as const },
    rejected: { label: 'Rejected', color: '', variant: 'destructive' as const },
    out_for_delivery: { label: 'Out for Delivery', color: 'bg-blue-600 hover:bg-blue-700 text-white', variant: 'default' as const },
    delivered: { label: 'Delivered', color: 'bg-gray-600 hover:bg-gray-700 text-white', variant: 'default' as const },
};

export default function AdminPaymentsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const paymentsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'orders'), where('status', 'in', ['awaiting_payment_verification', 'payment_rejected'])) : null),
    [firestore]
  );
  
  const { data: orders, isLoading, error } = useCollection<Order>(paymentsQuery);

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders]);

  const handleUpdateStatus = (orderId: string, status: Order['status']) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { status });
    toast({
        title: `Payment ${status === 'pending' ? 'Approved' : 'Rejected'}`,
        description: `The order has been successfully updated.`,
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-headline">💳 Payment Verification</h1>
        <p className="text-muted-foreground">Review and approve or reject customer payments.</p>
      </div>

      {isLoading && <PaymentsSkeleton />}

      {error && (
         <Alert variant="destructive">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>Error Loading Payments</AlertTitle>
            <AlertDescription>
                There was a problem fetching the payments from the database. Please try again later.
            </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && orders && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{order.customerName}</CardTitle>
                        <CardDescription>{new Date(order.orderDate).toLocaleString()}</CardDescription>
                    </div>
                    <Badge variant={statusConfig[order.status].variant} className={cn("capitalize", statusConfig[order.status].color)}>
                        {statusConfig[order.status].label}
                    </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {order.paymentScreenshotUrl && (
                     <Dialog>
                        <DialogTrigger asChild>
                            <Image
                                src={order.paymentScreenshotUrl}
                                alt="Payment Screenshot"
                                width={400}
                                height={400}
                                className="w-full h-auto rounded-md object-contain cursor-pointer aspect-square bg-muted"
                            />
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Payment Screenshot</DialogTitle>
                                <DialogDescription>
                                    Order ID: {order.id}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-center">
                                <Image
                                    src={order.paymentScreenshotUrl}
                                    alt="Payment Screenshot"
                                    width={800}
                                    height={800}
                                    className="w-auto h-auto max-h-[80vh] rounded-md object-contain"
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
                <div className="mt-4">
                    <p className="font-semibold">Total: {formatPrice(order.totalPrice)}</p>
                    <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                    <p className="text-sm text-muted-foreground">{order.customerAddress}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="border-green-500 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleUpdateStatus(order.id, 'pending')}><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                <Button variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleUpdateStatus(order.id, 'payment_rejected')}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
       {!isLoading && !error && (!orders || orders.length === 0) && (
        <Card className="flex items-center justify-center p-12">
            <div className="text-center">
                <h3 className="text-xl font-semibold">No Pending Payments</h3>
                <p className="text-muted-foreground mt-2">When customers submit orders with payments, they will appear here for verification.</p>
            </div>
        </Card>
      )}
    </div>
  );
}
