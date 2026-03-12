'use client';

import { Navbar } from "@/components/navbar";
import { QRGenerator } from "@/components/qr-generator";
import { Sparkles, CheckCircle2, Zap, Download, BarChart3, ArrowDown } from "lucide-react";
import { useEffect } from "react";
import { useAuth, initiateAnonymousSignIn, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";

export default function Home() {
  const auth = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (auth && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user]);

  const scrollToGenerator = () => {
    document.getElementById('generator-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
        {/* Hero Landing Section */}
        <section className="text-center space-y-8 mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center rounded-full border border-secondary/20 bg-secondary/10 px-4 py-1.5 text-sm font-semibold text-secondary mb-4">
            <Sparkles className="mr-2 h-4 w-4" />
            Professional AI-Powered QR Tool
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-primary font-headline">
              Free QR Code Generator
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Create beautiful, scannable, and branded QR codes in seconds. 
              Our AI ensures every code is a masterpiece without sacrificing functionality.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 py-6">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-card px-4 py-2 rounded-full border shadow-sm">
              <Zap className="h-4 w-4 text-secondary" />
              <span>Instant QR creation</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-card px-4 py-2 rounded-full border shadow-sm">
              <Download className="h-4 w-4 text-secondary" />
              <span>Download PNG / JPG / SVG</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-card px-4 py-2 rounded-full border shadow-sm">
              <BarChart3 className="h-4 w-4 text-secondary" />
              <span>Track QR codes</span>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              size="lg" 
              onClick={scrollToGenerator}
              className="h-14 px-8 text-lg font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              Generate QR Code <ArrowDown className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Generator Section */}
        <section id="generator-section" className="scroll-mt-24">
          <QRGenerator />
        </section>

        {/* Features Grid */}
        <section className="mt-32 grid gap-12 sm:grid-cols-2 lg:grid-cols-3 text-center">
          <div className="space-y-4 p-8 bg-card rounded-[2rem] border border-primary/5 shadow-sm transition-all hover:shadow-md">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary font-headline">Custom AI Styles</h3>
            <p className="text-muted-foreground leading-relaxed">
              Use natural language to describe the theme and style. Our AI blends your brand identity with scannable patterns.
            </p>
          </div>
          <div className="space-y-4 p-8 bg-card rounded-[2rem] border border-primary/5 shadow-sm transition-all hover:shadow-md">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary font-headline">High-Res Exports</h3>
            <p className="text-muted-foreground leading-relaxed">
              Export in vector (SVG) or raster (PNG/JPG) formats. Perfect for social media, print marketing, or business cards.
            </p>
          </div>
          <div className="space-y-4 p-8 bg-card rounded-[2rem] border border-primary/5 shadow-sm transition-all hover:shadow-md">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary font-headline">Real-time Tracking</h3>
            <p className="text-muted-foreground leading-relaxed">
              Monitor scan counts and last activity for every dynamic QR code you generate from your private dashboard.
            </p>
          </div>
        </section>
      </main>
      
      <footer className="border-t mt-32 py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-secondary" />
            <span className="font-semibold text-primary">Trusted by over 10,000 creators</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} QRify. Built for modern branding and dynamic marketing.
          </p>
        </div>
      </footer>
    </div>
  );
}
