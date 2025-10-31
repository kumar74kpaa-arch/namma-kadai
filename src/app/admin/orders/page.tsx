'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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
import { ServerCrash, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
                                <TableCell className="flex gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const ordersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'orders') : null),
    [firestore]
  );
  
  const { data: orders, isLoading, error } = useCollection<Order>(ordersQuery);

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    // sort by date desc
    return [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders]);

  const handleUpdateStatus = (orderId: string, status: 'approved' | 'rejected') => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { status });
    toast({
        title: `Order ${status}`,
        description: `The order has been successfully ${status}.`,
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-headline">🛍️ Order Requests</h1>
        <p className="text-muted-foreground">View and manage all incoming orders.</p>
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
                                    <Badge variant={
                                        order.status === 'approved' ? 'default' :
                                        order.status === 'rejected' ? 'destructive' :
                                        'secondary'
                                    } className={cn(
                                        "capitalize",
                                        order.status === 'approved' && 'bg-green-600 hover:bg-green-700 text-white',
                                        order.status === 'pending' && 'bg-yellow-500 hover:bg-yellow-600'
                                    )}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{formatPrice(order.totalPrice)}</TableCell>
                                <TableCell className="text-center">{order.orderItems.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                                <TableCell>{order.customerAddress}</TableCell>
                                <TableCell className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="text-green-600 hover:bg-green-100 hover:text-green-700 border-green-600"
                                        onClick={() => handleUpdateStatus(order.id, 'approved')}
                                        disabled={order.status === 'approved'}
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="text-red-600 hover:bg-red-100 hover:text-red-700 border-red-600"
                                        onClick={() => handleUpdateStatus(order.id, 'rejected')}
                                        disabled={order.status === 'rejected'}
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
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
                <h3 className="text-xl font-semibold">No Orders Yet</h3>
                <p className="text-muted-foreground mt-2">As soon as customers start placing orders, they will appear here.</p>
            </div>
        </Card>
      )}
    </div>
  );
}
