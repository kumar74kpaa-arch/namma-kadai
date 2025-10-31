'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { formatPrice, cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServerCrash, CheckCircle, XCircle, Truck, PackageCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

function OrdersSkeleton() {
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                <TableCell className="flex gap-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

const statusConfig = {
    awaiting_payment_verification: { label: 'Awaiting Payment', color: 'bg-orange-500 hover:bg-orange-600', variant: 'secondary' as const },
    payment_rejected: { label: 'Payment Rejected', color: '', variant: 'destructive' as const },
    pending: { label: 'Pending', color: 'bg-yellow-500 hover:bg-yellow-600', variant: 'secondary' as const },
    approved: { label: 'Approved', color: 'bg-green-600 hover:bg-green-700 text-white', variant: 'default' as const },
    rejected: { label: 'Rejected', color: '', variant: 'destructive' as const },
    out_for_delivery: { label: 'Out for Delivery', color: 'bg-blue-600 hover:bg-blue-700 text-white', variant: 'default' as const },
    delivered: { label: 'Delivered', color: 'bg-gray-600 hover:bg-gray-700 text-white', variant: 'default' as const },
}

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const ordersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'orders'), where('status', '!=', 'awaiting_payment_verification'), where('status', '!=', 'payment_rejected')) : null),
    [firestore]
  );
  
  const { data: orders, isLoading, error } = useCollection<Order>(ordersQuery);

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders]);

  const handleUpdateStatus = (orderId: string, status: Order['status']) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { status });
    toast({
        title: `Order ${status.replace('_', ' ')}`,
        description: `The order has been successfully updated.`,
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-headline">🛍️ Order Requests</h1>
        <p className="text-muted-foreground">View and manage all processed orders.</p>
      </div>

      {isLoading && <OrdersSkeleton />}

      {error && (
         <Alert variant="destructive">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>Error Loading Orders</AlertTitle>
            <AlertDescription>
                There was a problem fetching the orders from the database. Please try again later.
            </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && orders && (
         <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-center">Items</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>
                                    <div className="font-medium">{order.customerName}</div>
                                    <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                                </TableCell>
                                <TableCell>
                                    {new Date(order.orderDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={statusConfig[order.status].variant} className={cn("capitalize", statusConfig[order.status].color)}>
                                        {statusConfig[order.status].label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{formatPrice(order.totalPrice)}</TableCell>
                                <TableCell className="text-center">{order.orderItems.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                                <TableCell>{order.customerAddress}</TableCell>
                                <TableCell className="flex flex-col gap-2 items-start">
                                    {order.status === 'awaiting_payment_verification' && (
                                        <Button variant="outline" size="sm" asChild>
                                          <Link href="/admin/payments" className="w-full justify-start border-orange-500 text-orange-600 hover:bg-orange-100 hover:text-orange-700">
                                            <Wallet className="mr-2 h-4 w-4" />Verify Payment
                                          </Link>
                                        </Button>
                                    )}
                                    {order.status === 'pending' && (
                                        <>
                                            <Button variant="outline" size="sm" className="w-full justify-start border-green-500 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleUpdateStatus(order.id, 'approved')}><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                                            <Button variant="outline" size="sm" className="w-full justify-start border-red-500 text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleUpdateStatus(order.id, 'rejected')}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                                        </>
                                    )}
                                    {order.status === 'approved' && (
                                        <Button variant="outline" size="sm" className="w-full justify-start border-blue-500 text-blue-600 hover:bg-blue-100 hover:text-blue-700" onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}><Truck className="mr-2 h-4 w-4" />Out for Delivery</Button>
                                    )}
                                    {order.status === 'out_for_delivery' && (
                                        <Button variant="outline" size="sm" className="w-full justify-start border-gray-500 text-gray-600 hover:bg-gray-100 hover:text-gray-700" onClick={() => handleUpdateStatus(order.id, 'delivered')}><PackageCheck className="mr-2 h-4 w-4" />Mark Delivered</Button>
                                    )}
                                     {order.status === 'out_for_delivery' && (
                                        <Button variant="link" size="sm" asChild className="p-0 h-auto">
                                            <Link href={`/delivery/${order.id}`} target="_blank">View Delivery</Link>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
         </Card>
      )}
       {!isLoading && !error && (!orders || orders.length === 0) && (
        <Card className="flex items-center justify-center p-12">
            <div className="text-center">
                <h3 className="text-xl font-semibold">No Processed Orders Yet</h3>
                <p className="text-muted-foreground mt-2">Approved orders will appear here, ready for delivery management.</p>
            </div>
        </Card>
      )}
    </div>
  );
}
