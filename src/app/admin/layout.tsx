'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from '@/components/ui/sidebar';
import { LayoutDashboard, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { LogoIcon } from '@/components/icons/logo-icon';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('namma-kadai-admin-auth') === 'true';
    if (!sessionAuth) {
      if (pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    } else {
      setIsAuthenticated(true);
    }
  }, [router, pathname]);

  if (pathname === '/admin/login') {
    return <div className="flex min-h-screen items-center justify-center bg-background">{children}</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-headline font-bold">
              <LogoIcon className="h-8 w-8 text-sidebar-primary" />
              <span className="text-sidebar-foreground">Namma Kadai Admin</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/admin/dashboard" className="w-full">
                  <SidebarMenuButton tooltip="Dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/products" className="w-full">
                  <SidebarMenuButton tooltip="Products">
                    <ShoppingBag />
                    <span>Products</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
