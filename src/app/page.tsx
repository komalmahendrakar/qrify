'use client';

import { Navbar } from "@/components/navbar";
import { QRGenerator } from "@/components/qr-generator";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useAuth, initiateAnonymousSignIn, useUser } from "@/firebase";

export default function Home() {
  const auth = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (auth && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-24 max-w-6xl">
        <header className="text-center space-y-6 mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center rounded-full border border-secondary/20 bg-secondary/10 px-4 py-1.5 text-sm font-semibold text-secondary">
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Powered QR Generation
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary font-headline">
            Create branded QR codes <br className="hidden md:block" /> with AI precision.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Generate stunning, styled QR codes for your brand in seconds. 
            Download in high-quality formats and track your generation history.
          </p>
        </header>

        <QRGenerator />

        <section className="mt-32 grid gap-12 sm:grid-cols-2 lg:grid-cols-3 text-center">
          <div className="space-y-4 p-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary font-headline">Custom Styles</h3>
            <p className="text-muted-foreground leading-relaxed">
              Use natural language to describe the theme and style of your QR codes.
            </p>
          </div>
          <div className="space-y-4 p-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <div className="h-6 w-6 border-2 border-primary rounded-md" />
            </div>
            <h3 className="text-xl font-bold text-primary font-headline">Multi-format</h3>
            <p className="text-muted-foreground leading-relaxed">
              Download your codes in PNG, JPG, or SVG formats for any use case.
            </p>
          </div>
          <div className="space-y-4 p-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <div className="h-6 w-6 bg-primary rounded-full opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-primary font-headline">Always Scannable</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our AI ensures that every style maintains perfect scannability across all devices.
            </p>
          </div>
        </section>
      </main>
      
      <footer className="border-t mt-32 py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} QRify. Built for modern branding.
          </p>
        </div>
      </footer>
    </div>
  );
}
