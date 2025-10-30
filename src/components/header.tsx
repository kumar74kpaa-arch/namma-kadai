"use client";

import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";

import { useCart } from "@/context/cart-provider";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/icons/logo-icon";

export function Header() {
  const { totalItems } = useCart();

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 text-lg font-headline font-bold text-foreground">
          <LogoIcon className="h-6 w-6 text-primary" />
          Namma Kadai
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/cart">
            <Button variant="ghost" size="icon" aria-label="Shopping Cart">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </div>
            </Button>
          </Link>
          <Link href="/admin/login">
            <Button variant="ghost" size="icon" aria-label="Admin Login">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
