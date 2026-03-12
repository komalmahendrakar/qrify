"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collectionGroup, query, where, limit } from "firebase/firestore";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * @fileOverview Redirect handler for dynamic QR codes.
 * Fetches the original URL from Firestore based on the QR ID and redirects if active.
 * Provides styled error states for inactive or missing codes.
 */
export default function RedirectPage() {
  const params = useParams();
  const qrId = params.qrId as string;
  const db = useFirestore();
  const [errorStatus, setErrorStatus] = useState<"not_found" | "inactive" | null>(null);

  // Query the collection group to find the QR code by its unique ID
  const qrQuery = useMemoFirebase(() => {
    if (!db || !qrId) return null;
    return query(
      collectionGroup(db, 'qr_codes'),
      where('id', '==', qrId),
      limit(1)
    );
  }, [db, qrId]);

  const { data, isLoading } = useCollection(qrQuery);

  useEffect(() => {
    if (isLoading || !data) return;

    if (data.length === 0) {
      setErrorStatus("not_found");
      return;
    }

    const qr = data[0];
    if (qr.status === 'active') {
      // Perform the redirect to the original destination
      window.location.href = qr.originalUrl;
    } else {
      setErrorStatus("inactive");
    }
  }, [data, isLoading]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 bg-primary rounded-full animate-pulse opacity-20" />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-primary font-headline">Redirecting</h2>
              <p className="text-muted-foreground animate-pulse">Checking destination status...</p>
            </div>
          </div>
        ) : errorStatus ? (
          <div className="max-w-md w-full p-8 md:p-12 bg-card border border-primary/10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 fade-in duration-500 text-center">
            <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-3xl flex items-center justify-center mb-8 rotate-3 hover:rotate-0 transition-transform duration-300">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            
            <h1 className="text-3xl font-bold text-primary mb-4 font-headline">
              {errorStatus === "inactive" ? "QR Code Inactive" : "QR Code Not Found"}
            </h1>
            
            <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
              {errorStatus === "inactive" 
                ? "This QR code is currently inactive. It may have been disabled by the owner." 
                : "The QR code you are looking for does not exist in our system."}
            </p>
            
            <div className="space-y-4">
              <Button asChild className="w-full h-14 text-lg rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-95">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-5 w-5" /> Return to QRify
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                Error Reference: {qrId?.substring(0, 8) || "Unknown"}
              </p>
            </div>
          </div>
        ) : null}
      </main>
      
      <footer className="py-8 text-center opacity-50">
        <p className="text-xs">Secure dynamic redirection powered by QRify</p>
      </footer>
    </div>
  );
}
