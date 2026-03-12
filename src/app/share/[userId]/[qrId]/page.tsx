"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Download, Calendar, Loader2, QrCode } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function SharePage() {
  const params = useParams();
  const userId = params.userId as string;
  const qrId = params.qrId as string;
  const db = useFirestore();

  const qrRef = useMemoFirebase(() => {
    if (!db || !userId || !qrId) return null;
    return doc(db, 'users', userId, 'qr_codes', qrId);
  }, [db, userId, qrId]);

  const { data: qr, isLoading, error } = useDoc(qrRef);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (error || !qr) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <QrCode className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">QR Code Not Found</h1>
          <p className="text-muted-foreground">This link may be invalid or the QR code has been removed.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold text-primary font-headline mb-2">{qr.title}</h1>
          <p className="text-muted-foreground">Shared QR Code</p>
        </header>

        <Card className="w-full max-w-md overflow-hidden border-2 border-primary/20 shadow-xl bg-white">
          <CardContent className="p-8">
            <div className="aspect-square relative flex items-center justify-center bg-muted/10 rounded-lg p-4">
              <img 
                src={qr.qrCodeImageUrl} 
                alt={qr.title} 
                className="max-w-full h-auto rounded-md"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 bg-muted/5 border-t p-6">
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                <a href={qr.originalUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate text-secondary font-medium">
                  {qr.originalUrl}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created {qr.createdAt?.toDate?.() ? qr.createdAt.toDate().toLocaleDateString() : 'Recently'}</span>
              </div>
            </div>
            
            <Button className="w-full" onClick={() => {
              const link = document.createElement('a');
              link.href = qr.qrCodeImageUrl;
              link.download = `${qr.title.replace(/\s+/g, '-').toLowerCase()}.png`;
              link.click();
            }}>
              <Download className="h-4 w-4 mr-2" /> Download PNG
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
