"use client";

import Link from "next/link";
import { QrCode, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="rounded-xl bg-primary p-1.5 text-primary-foreground">
            <QrCode className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary font-headline">QRify</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link href="/" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span>Generate</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link href="/admin" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
