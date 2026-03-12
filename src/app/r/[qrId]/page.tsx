import { redirect } from "next/navigation";
import { getQRCodeById, incrementScanCount } from "@/lib/storage";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Dynamic QR Code Redirect Engine (Server Component).
 * Looks up the QR code by ID, checks status, and redirects if active.
 */
export default async function RedirectPage({ params }: { params: Promise<{ qrId: string }> }) {
  const { qrId } = await params;
  const qr = await getQRCodeById(qrId);

  // If found and active, increment scans and redirect
  if (qr && qr.status === 'active' && qr.originalUrl) {
    await incrementScanCount(qrId);
    redirect(qr.originalUrl);
  }

  // Determine error type
  const errorType = !qr ? "not_found" : qr.status === 'inactive' ? "inactive" : "not_found";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full p-8 bg-card border border-primary/10 rounded-[2.5rem] shadow-2xl text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            {errorType === "inactive" ? (
              <ShieldAlert className="h-10 w-10 text-destructive" />
            ) : (
              <AlertCircle className="h-10 w-10 text-destructive" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-primary mb-4 font-headline">
            {errorType === "inactive" ? "Link Inactive" : "Link Not Found"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {errorType === "inactive"
              ? "This QR code link has been disabled by the administrator."
              : "The scanned QR code is invalid or has been removed from our system."}
          </p>
          <Button asChild className="w-full h-14 rounded-2xl text-lg font-semibold">
            <Link href="/"><ArrowLeft className="mr-2 h-5 w-5" /> Return to Home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
