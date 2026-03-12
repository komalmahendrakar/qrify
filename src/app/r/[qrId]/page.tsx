"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collectionGroup, query, where, limit, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { Loader2, AlertCircle, ArrowLeft, ShieldAlert } from "lucide-react";
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

  // Search for the QR ID globally using collectionGroup.
  // This requires the qr_codes collection group index on the 'id' field.
  const qrQuery = useMemoFirebase(() => {
    if (!db || !qrId) return null;
    console.log(`[REDIRECT_LOG] Initiating lookup for ID: ${qrId}`);
    return query(
      collectionGroup(db, 'qr_codes'),
      where('id', '==', qrId),
      limit(1)
    );
  }, [db, qrId]);

  const { data, isLoading, error } = useCollection(qrQuery);

  useEffect(() => {
    if (error) {
      console.error("[REDIRECT_ERROR] Firestore query failed:", error);
      setErrorStatus("error");
      return;
    }

    if (isLoading || !data || hasTracked) return;

    if (data.length === 0) {
      console.warn(`[REDIRECT_WARN] Record not found for ID: ${qrId}`);
      setErrorStatus("not_found");
      return;
    }

    const qr = data[0];
    console.log(`[REDIRECT_LOG] Record found. Status: ${qr.status}, Destination: ${qr.originalUrl}`);

    if (qr.status === 'active') {
      setHasTracked(true);

      // Background tracking update (non-blocking)
      if (db && qr.userId) {
        const qrRef = doc(db, 'users', qr.userId, 'qr_codes', qr.id);
        updateDoc(qrRef, {
          totalScans: increment(1),
          lastScannedAt: serverTimestamp()
        }).catch((err) => {
          console.warn("[TRACKING_ERROR] Metrics update failed, proceeding with redirect", err);
        });
      }

      // Execute redirect
      if (qr.originalUrl) {
        console.log(`[REDIRECT_LOG] Success. Redirecting to: ${qr.originalUrl}`);
        window.location.replace(qr.originalUrl);
      } else {
        setErrorStatus("not_found");
      }
    } else {
      console.warn(`[REDIRECT_WARN] Link is inactive: ${qrId}`);
      setErrorStatus("inactive");
    }
  }, [data, isLoading, error, hasTracked, db, qrId]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center">
        {isLoading && !errorStatus ? (
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary font-headline">Redirecting...</h2>
              <p className="text-muted-foreground">Please wait while we connect you.</p>
            </div>
          </div>
        ) : errorStatus ? (
          <div className="max-w-md w-full p-8 bg-card border border-primary/10 rounded-[2.5rem] shadow-2xl text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              {errorStatus === "inactive" ? <ShieldAlert className="h-10 w-10 text-destructive" /> : <AlertCircle className="h-10 w-10 text-destructive" />}
            </div>
            <h1 className="text-3xl font-bold text-primary mb-4 font-headline">
              {errorStatus === "inactive" ? "Link Inactive" : errorStatus === "error" ? "System Error" : "Link Not Found"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {errorStatus === "inactive" 
                ? "This link is temporarily disabled." 
                : errorStatus === "error"
                ? "There was a problem reaching the destination. Please try again."
                : "The scanned QR code is invalid or has been removed."}
            </p>
            <Button asChild className="w-full h-14 rounded-2xl text-lg font-semibold">
              <Link href="/"><ArrowLeft className="mr-2 h-5 w-5" /> Return to Home</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
            <p className="text-muted-foreground">Forwarding...</p>
          </div>
        )}
      </main>
    </div>
  );
}
