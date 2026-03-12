
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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

  // Search for the QR ID globally across all user sub-collections
  const qrQuery = useMemoFirebase(() => {
    if (!db || !qrId) return null;
    console.log(`[REDIRECT_LOG] Initiating lookup for QR ID: ${qrId}`);
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

    // Handle case where query finished but no record was found
    if (data.length === 0) {
      console.warn(`[REDIRECT_WARN] No record found in database for ID: ${qrId}`);
      setErrorStatus("not_found");
      return;
    }

    const qr = data[0];
    console.log(`[REDIRECT_LOG] Found QR record successfully. Status: ${qr.status}, Destination: ${qr.originalUrl}`);

    if (qr.status === 'active') {
      setHasTracked(true);

      // Non-blocking analytics update
      if (db && qr.userId) {
        const qrRef = doc(db, 'users', qr.userId, 'qr_codes', qr.id);
        console.log(`[REDIRECT_LOG] Updating scan metrics for record at: ${qrRef.path}`);
        updateDoc(qrRef, {
          totalScans: increment(1),
          lastScannedAt: serverTimestamp()
        }).catch((err) => {
          console.warn("[TRACKING_ERROR] Failed to update scan count, but proceeding with redirect", err);
        });
      }

      // Perform the redirect
      if (qr.originalUrl) {
        console.log(`[REDIRECT_LOG] Success! Redirecting to: ${qr.originalUrl}`);
        // Small delay to ensure the user sees the "Redirecting" state briefly
        setTimeout(() => {
          window.location.replace(qr.originalUrl);
        }, 300);
      } else {
        console.error("[REDIRECT_ERROR] Record found but originalUrl is missing");
        setErrorStatus("not_found");
      }
    } else {
      console.warn(`[REDIRECT_WARN] Link is inactive for ID: ${qrId}`);
      setErrorStatus("inactive");
    }
  }, [data, isLoading, error, hasTracked, db, qrId]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center">
        {isLoading && !errorStatus ? (
          <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 bg-primary rounded-full animate-ping" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-primary font-headline">Redirecting...</h2>
              <p className="text-muted-foreground text-sm">Please wait while we connect you securely.</p>
            </div>
          </div>
        ) : errorStatus ? (
          <div className="max-w-md w-full p-8 bg-card border border-primary/10 rounded-[2.5rem] shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              {errorStatus === "inactive" ? (
                <ShieldAlert className="h-10 w-10 text-destructive" />
              ) : (
                <AlertCircle className="h-10 w-10 text-destructive" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-primary mb-4 font-headline">
              {errorStatus === "inactive" ? "Link Inactive" : 
               errorStatus === "error" ? "System Error" : "Link Not Found"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {errorStatus === "inactive" 
                ? "This QR code has been temporarily deactivated by its owner." 
                : errorStatus === "error"
                ? "We encountered an issue retrieving the redirect information. Please check your connection or try again later."
                : `The scanned code (ID: ${qrId}) is invalid or has been removed from our system.`}
            </p>
            <Button asChild className="w-full h-14 rounded-2xl text-lg font-semibold shadow-lg">
              <Link href="/"><ArrowLeft className="mr-2 h-5 w-5" /> Return to Home</Link>
            </Button>
          </div>
        ) : (
          // This state occurs after the redirect is initiated but before the page unloads
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
            <p className="text-muted-foreground animate-pulse">Navigating to destination...</p>
          </div>
        )}
      </main>
    </div>
  );
}
