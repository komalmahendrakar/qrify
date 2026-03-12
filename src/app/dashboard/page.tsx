"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Download, Trash2, Calendar, Search, Share2, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteQRCodeAction } from "@/app/actions";

interface QRCodeItem {
  id: string;
  originalUrl: string;
  qrCodeImageUrl: string;
  title: string;
  createdAt: string;
  status: string;
  totalScans: number;
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [qrcodes, setQrcodes] = useState<QRCodeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchQRCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/qrcodes');
      const data = await res.json();
      setQrcodes(data);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load QR codes." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this QR code?")) return;
    
    const result = await deleteQRCodeAction(id);
    if (result.success) {
      setQrcodes(prev => prev.filter(qr => qr.id !== id));
      toast({ title: "Deleted", description: "QR code removed successfully." });
    } else {
      toast({ variant: "destructive", title: "Error", description: "Could not delete code." });
    }
  };

  const handleShare = (qr: QRCodeItem) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/share/${qr.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(qr.id);
    toast({ title: "Link Copied", description: "Public share link copied to clipboard." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = qrcodes.filter(q => 
    q.title?.toLowerCase().includes(search.toLowerCase()) || 
    q.originalUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline">My QR Codes</h1>
            <p className="text-muted-foreground">Manage your history of generated codes.</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title or URL..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((qr) => (
              <Card key={qr.id} className="overflow-hidden group hover:shadow-lg transition-all border-muted/60">
                <div className="aspect-square relative bg-white flex items-center justify-center p-4 border-b">
                  <img src={qr.qrCodeImageUrl} alt={qr.title} className="max-w-full h-auto" />
                </div>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg font-bold text-primary truncate">{qr.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <span className="truncate">{qr.originalUrl}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(qr.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                    const link = document.createElement('a');
                    link.href = qr.qrCodeImageUrl;
                    link.download = `${qr.title.replace(/\s+/g, '-').toLowerCase()}.png`;
                    link.click();
                  }}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-primary hover:bg-primary/10" 
                    onClick={() => handleShare(qr)}
                  >
                    {copiedId === qr.id ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => qr.id && handleDelete(qr.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No QR codes found</h3>
            <p className="text-muted-foreground">Start by generating your first branded QR code on the homepage.</p>
          </div>
        )}
      </main>
    </div>
  );
}
