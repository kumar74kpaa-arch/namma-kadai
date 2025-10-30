import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingBag, Users } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome to the Namma Kadai admin panel. Here you can manage your products, view orders, and more.</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span>Product Management</span>
            </CardTitle>
            <CardDescription>
              Add, edit, or delete products in your store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/products">Manage Products</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Customer Orders</span>
            </CardTitle>
            <CardDescription>
              View and manage incoming customer orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/orders">View Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
