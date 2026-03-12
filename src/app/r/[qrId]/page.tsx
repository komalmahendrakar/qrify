"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collectionGroup, query, where, limit, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * @fileOverview Redirect handler for dynamic QR codes.
 * Fetches the original URL from Firestore, increments scan count, and redirects if active.
 */
export default function RedirectPage() {
  const params = useParams();
  const qrId = params.qrId as string;
  const db = useFirestore();
  const [errorStatus, setErrorStatus] = useState<"not_found" | "inactive" | null>(null);
  const [hasTracked, setHasTracked] = useState(false);

  // 1. Query the collection group to find the QR code by its unique ID across all users
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
    // Wait for the query to finish and avoid double-tracking
    if (isLoading || !data || hasTracked) return;

    // Handle case where QR ID doesn't exist
    if (data.length === 0) {
      setErrorStatus("not_found");
      return;
    }

    const qr = data[0];

    // Handle status logic
    if (qr.status === 'active') {
      setHasTracked(true);

      // 2. Track the scan (non-blocking)
      if (db && qr.userId) {
        const qrRef = doc(db, 'users', qr.userId, 'qr_codes', qr.id);
        updateDoc(qrRef, {
          totalScans: increment(1),
          lastScannedAt: serverTimestamp()
        }).catch(async (err) => {
          // Fallback error logging for rules denial
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: qrRef.path,
            operation: 'update',
            requestResourceData: { totalScans: 'increment', lastScannedAt: 'serverTimestamp' }
          }));
        });
      }

      // 3. Perform the redirect immediately to original_url
      window.location.href = qr.originalUrl;
    } else {
      // Show "inactive" message if status is not "active"
      setErrorStatus("inactive");
    }
  }, [data, isLoading, hasTracked, db]);

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
              <p className="text-muted-foreground animate-pulse">Accessing dynamic destination...</p>
            </div>
          </div>
        ) : errorStatus ? (
          <div className="max-w-md w-full p-8 md:p-12 bg-card border border-primary/10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 fade-in duration-500 text-center">
            <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-3xl flex items-center justify-center mb-8">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            
            <h1 className="text-3xl font-bold text-primary mb-4 font-headline">
              {errorStatus === "inactive" ? "QR Code Inactive" : "QR Code Not Found"}
            </h1>
            
            <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
              {errorStatus === "inactive" 
                ? "This QR code has been deactivated by the administrator or the owner." 
                : "The QR code you scanned does not exist in our system."}
            </p>
            
            <div className="space-y-4">
              <Button asChild className="w-full h-14 text-lg rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-95">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-5 w-5" /> Return Home
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </main>
      
      <footer className="py-8 text-center opacity-50">
        <p className="text-xs">Dynamic tracking enabled • QRify Redirect Service</p>
      </footer>
    </div>
  );
}
