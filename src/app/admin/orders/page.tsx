'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServerCrash } from 'lucide-react';

function OrdersSkeleton() {
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Items</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-8" /></TableCell>
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

  const ordersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'orders') : null),
    [firestore]
  );
  
  const { data: orders, isLoading, error } = useCollection<Order>(ordersQuery);

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders]);


  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-headline">Customer Orders</h1>
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
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-center">Items</TableHead>
                            <TableHead>Address</TableHead>
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
                                <TableCell className="text-right">{formatPrice(order.totalPrice)}</TableCell>
                                <TableCell className="text-center">{order.orderItems.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                                <TableCell>{order.customerAddress}</TableCell>
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
