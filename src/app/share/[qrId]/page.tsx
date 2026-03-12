import { getQRCodeById } from "@/lib/storage";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Download, Calendar, QrCode, AlertCircle } from "lucide-react";
import Link from "next/link";

/**
 * Public share page for a QR code (Server Component).
 * Looks up the QR code from the JSON store by ID.
 */
export default async function SharePage({ params }: { params: Promise<{ qrId: string }> }) {
  const { qrId } = await params;
  const qr = await getQRCodeById(qrId);

  if (!qr || qr.status === 'inactive') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">QR Code Unavailable</h1>
          <p className="text-muted-foreground">
            {qr?.status === 'inactive' 
              ? "This QR code has been deactivated by an administrator." 
              : "This link is invalid or the QR code has been removed."}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <header className="text-center mb-12 animate-in fade-in slide-in-from-top-2 duration-500">
          <h1 className="text-3xl font-bold text-primary font-headline mb-2">{qr.title}</h1>
          <p className="text-muted-foreground">Shared Dynamic QR Code</p>
        </header>

        <Card className="w-full max-w-md overflow-hidden border-2 border-primary/20 shadow-xl bg-white animate-in zoom-in-95 duration-500">
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
                <a 
                  href={qr.originalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:underline truncate text-secondary font-semibold"
                >
                  {qr.originalUrl}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Generated {new Date(qr.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <ShareDownloadButton qrCodeImageUrl={qr.qrCodeImageUrl} qrId={qr.id} />
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

/** Client-side download button for the share page */
function ShareDownloadButton({ qrCodeImageUrl, qrId }: { qrCodeImageUrl: string; qrId: string }) {
  'use client';
  
  return (
    <a 
      href={qrCodeImageUrl} 
      download={`qrify-${qrId}.png`}
      className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-12 text-lg font-semibold hover:bg-primary/90 transition-colors"
    >
      <Download className="h-4 w-4 mr-2" /> Download PNG
    </a>
  );
}
