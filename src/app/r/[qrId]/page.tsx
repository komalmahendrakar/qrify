
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
 * @fileOverview Redirect engine for dynamic QR codes.
 * Decouples the physical QR from the destination URL by routing via /r/[qrId].
 */
export default function RedirectPage() {
  const params = useParams();
  const qrId = params?.qrId as string;
  const db = useFirestore();
  const [errorStatus, setErrorStatus] = useState<"not_found" | "inactive" | "error" | null>(null);
  const [hasTracked, setHasTracked] = useState(false);

  // Search for the QR ID globally across all user sub-collections
  const qrQuery = useMemoFirebase(() => {
    if (!db || !qrId) return null;
    return query(
      collectionGroup(db, 'qr_codes'),
      where('id', '==', qrId),
      limit(1)
    );
  }, [db, qrId]);

  const { data, isLoading, error } = useCollection(qrQuery);

  useEffect(() => {
    // If we have an error from Firestore, set the UI to error state
    if (error) {
      setErrorStatus("error");
      return;
    }

    if (isLoading || !data || hasTracked) return;

    // If query finished and no record was found
    if (data.length === 0) {
      setErrorStatus("not_found");
      return;
    }

    const qr = data[0];

    if (qr.status === 'active') {
      setHasTracked(true);

      // Non-blocking analytics update
      // We use the full path stored in the query result to get the exact doc reference
      if (db && qr.userId) {
        const qrRef = doc(db, 'users', qr.userId, 'qr_codes', qr.id);
        updateDoc(qrRef, {
          totalScans: increment(1),
          lastScannedAt: serverTimestamp()
        }).catch((err) => {
          console.warn("[TRACKING_ERROR] Silent catch to prevent redirect blocking", err);
        });
      }

      // Perform the redirect
      if (qr.originalUrl) {
        window.location.href = qr.originalUrl;
      } else {
        setErrorStatus("not_found");
      }
    } else {
      setErrorStatus("inactive");
    }
  }, [data, isLoading, error, hasTracked, db]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center">
        {isLoading && !errorStatus ? (
          <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
            <Loader2 className="h-16 w-16 animate-spin text-primary/40" />
            <h2 className="text-2xl font-bold text-primary font-headline">Redirecting...</h2>
            <p className="text-muted-foreground text-sm">Please wait while we connect you.</p>
          </div>
        ) : errorStatus ? (
          <div className="max-w-md w-full p-8 bg-card border border-primary/10 rounded-[2.5rem] shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-4 font-headline">
              {errorStatus === "inactive" ? "Link Inactive" : 
               errorStatus === "error" ? "System Error" : "Link Not Found"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {errorStatus === "inactive" 
                ? "This QR code has been temporarily deactivated by its owner." 
                : errorStatus === "error"
                ? "We encountered an issue retrieving the redirect information. Please try again."
                : "The scanned code is invalid or has been removed from our system."}
            </p>
            <Button asChild className="w-full h-14 rounded-2xl text-lg font-semibold shadow-lg">
              <Link href="/"><ArrowLeft className="mr-2 h-5 w-5" /> Return to Home</Link>
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
