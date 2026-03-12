"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collectionGroup, query, where, limit } from "firebase/firestore";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * @fileOverview Redirect handler for dynamic QR codes.
 * Fetches the original URL from Firestore based on the QR ID and redirects if active.
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
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="absolute inset-0 blur-xl bg-primary/20 -z-10 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-primary font-headline">Redirecting...</h2>
              <p className="text-muted-foreground">Preparing your destination at high speed.</p>
            </div>
          </div>
        ) : errorStatus ? (
          <div className="max-w-md w-full p-10 bg-card border-2 border-primary/10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-4 font-headline">
              {errorStatus === "inactive" ? "Code Inactive" : "Not Found"}
            </h1>
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              {errorStatus === "inactive" 
                ? "This dynamic QR code has been deactivated by the owner or an administrator." 
                : "The QR code you scanned could not be found in our database or hasn't been saved yet."}
            </p>
            <Button asChild className="w-full h-14 text-lg rounded-2xl shadow-lg hover:scale-[1.02] transition-transform">
              <Link href="/">
                Return to QRify <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
