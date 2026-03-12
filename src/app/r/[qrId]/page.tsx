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
 * This is the heart of the "Dynamic" functionality. 
 * It decouples the physical QR from the destination URL.
 */
export default function RedirectPage() {
  const params = useParams();
  const qrId = params.qrId as string;
  const db = useFirestore();
  const [errorStatus, setErrorStatus] = useState<"not_found" | "inactive" | null>(null);
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

  const { data, isLoading } = useCollection(qrQuery);

  useEffect(() => {
    if (isLoading || !data || hasTracked) return;

    if (data.length === 0) {
      setErrorStatus("not_found");
      return;
    }

    const qr = data[0];

    if (qr.status === 'active') {
      setHasTracked(true);

      // Non-blocking analytics update
      if (db && qr.userId) {
        const qrRef = doc(db, 'users', qr.userId, 'qr_codes', qr.id);
        updateDoc(qrRef, {
          totalScans: increment(1),
          lastScannedAt: serverTimestamp()
        }).catch(() => {
          // Silent catch to ensure redirect isn't blocked by rule issues
        });
      }

      // Instant redirection
      window.location.href = qr.originalUrl;
    } else {
      setErrorStatus("inactive");
    }
  }, [data, isLoading, hasTracked, db]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
            <Loader2 className="h-16 w-16 animate-spin text-primary/40" />
            <h2 className="text-2xl font-bold text-primary font-headline">Redirecting</h2>
          </div>
        ) : errorStatus ? (
          <div className="max-w-md w-full p-8 bg-card border border-primary/10 rounded-[2.5rem] shadow-2xl text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-6" />
            <h1 className="text-3xl font-bold text-primary mb-4 font-headline">
              {errorStatus === "inactive" ? "QR Code Inactive" : "QR Code Not Found"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {errorStatus === "inactive" 
                ? "This link has been deactivated by the owner." 
                : "The scanned code does not exist in our system."}
            </p>
            <Button asChild className="w-full h-14 rounded-2xl">
              <Link href="/"><ArrowLeft className="mr-2 h-5 w-5" /> Return Home</Link>
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  );
}