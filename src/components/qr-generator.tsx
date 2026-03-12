"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Save, RefreshCw, Wand2, Globe, QrCode, Share2, Check, Copy } from "lucide-react";
import { generateStyledQrCode } from "@/ai/flows/generate-styled-qr-code";
import { suggestQrCodeDescription } from "@/ai/flows/suggest-qr-code-description-flow";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import QRCode from 'qrcode';

export function QRGenerator() {
  const [url, setUrl] = useState("");
  const [stylePrompt, setStylePrompt] = useState("classic black and white minimalist");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [qrCodeDataUri, setQrCodeDataUri] = useState<string | null>(null);
  const [saveId, setSaveId] = useState<string | null>(null);
  const [savedUserId, setSavedUserId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

  const validateUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!url) {
      toast({
        variant: "destructive",
        title: "URL required",
        description: "Please enter a destination URL.",
      });
      return;
    }

    if (!validateUrl(url)) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://google.com).",
      });
      return;
    }

    setIsGenerating(true);
    setSaveId(null); // Reset save state for new generation
    try {
      const result = await generateStyledQrCode({ 
        url, 
        stylePrompt: stylePrompt || "classic minimalist" 
      });
      setQrCodeDataUri(result.qrCodeDataUri);
      toast({
        title: "QR Code Generated",
        description: "Your scannable QR code is ready.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "Something went wrong while creating your QR code.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!qrCodeDataUri || !url || !user || !db) {
      if (!user) toast({ variant: "destructive", title: "Auth required", description: "You must be signed in to save." });
      return;
    }
    
    setIsSaving(true);
    try {
      const { summary } = await suggestQrCodeDescription({ url });
      
      const qrCodeId = crypto.randomUUID();
      const qrCodeRef = doc(db, 'users', user.uid, 'qr_codes', qrCodeId);
      
      const data = {
        id: qrCodeId,
        originalUrl: url,
        qrCodeImageUrl: qrCodeDataUri,
        title: summary,
        createdAt: serverTimestamp(),
        status: 'active',
        userId: user.uid,
      };

      setDoc(qrCodeRef, data)
        .then(() => {
          setSaveId(qrCodeId);
          setSavedUserId(user.uid);
          toast({
            title: "Saved!",
            description: `QR code for ${summary} has been saved to your dashboard.`,
          });
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: qrCodeRef.path,
            operation: 'create',
            requestResourceData: data,
          });
          errorEmitter.emit('permission-error', permissionError);
        });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Could not process your QR code for saving.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadFile = async (format: 'png' | 'jpg' | 'svg') => {
    if (!qrCodeDataUri) return;

    let downloadUrl = qrCodeDataUri;
    let fileName = `qrify-code.${format}`;

    // For SVG, if it's not a native SVG, we generate a high-quality scannable base SVG
    if (format === 'svg') {
      try {
        const svgString = await QRCode.toString(url, {
          type: 'svg',
          width: 1024,
          margin: 2,
          errorCorrectionLevel: 'H'
        });
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        downloadUrl = URL.createObjectURL(blob);
      } catch (e) {
        console.error("SVG generation failed", e);
      }
    } else if (format === 'jpg') {
      // Convert Data URI to JPG if needed (usually it's PNG from canvas/AI)
      const img = new Image();
      img.src = qrCodeDataUri;
      await new Promise(resolve => img.onload = resolve);
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        downloadUrl = canvas.toDataURL('image/jpeg', 0.9);
      }
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (format === 'svg' && downloadUrl.startsWith('blob:')) {
      URL.revokeObjectURL(downloadUrl);
    }
  };

  const copyShareLink = () => {
    if (!saveId || !savedUserId) return;
    const shareUrl = `${window.location.origin}/share/${savedUserId}/${saveId}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast({ title: "Link Copied", description: "Shareable URL copied to clipboard." });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="font-headline text-primary">Configuration</CardTitle>
          <CardDescription>Enter your link and customize the visual appearance.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-secondary" /> Destination URL
              </label>
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-background border-muted"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-secondary" /> Visual Style
              </label>
              <Input
                placeholder="e.g. futuristic neon, blue watercolor, minimalist"
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                className="bg-background border-muted"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-lg shadow-md transition-all hover:scale-[1.02]" 
              disabled={isGenerating || !url}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Crafting QR Code...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Generate QR Code
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center justify-center space-y-6">
        {qrCodeDataUri ? (
          <Card className="w-full max-w-sm overflow-hidden border-2 border-primary/20 shadow-xl bg-white animate-in zoom-in-95 duration-300">
            <CardContent className="p-8">
              <div className="aspect-square relative flex items-center justify-center bg-muted/30 rounded-lg">
                <img 
                  src={qrCodeDataUri} 
                  alt="Generated QR Code" 
                  className="w-full h-auto rounded-md shadow-inner"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 bg-muted/10 border-t p-4">
              <div className="grid grid-cols-3 gap-2 w-full">
                <Button variant="outline" size="sm" onClick={() => downloadFile('png')} className="flex-1 text-xs">
                  <Download className="h-3 w-3 mr-1" /> PNG
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadFile('jpg')} className="flex-1 text-xs">
                  <Download className="h-3 w-3 mr-1" /> JPG
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadFile('svg')} className="flex-1 text-xs">
                  <Download className="h-3 w-3 mr-1" /> SVG
                </Button>
              </div>
              
              {!saveId ? (
                <Button 
                  onClick={handleSave} 
                  className="w-full bg-secondary hover:bg-secondary/90 text-white font-semibold" 
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save to Dashboard
                </Button>
              ) : (
                <Button 
                  onClick={copyShareLink} 
                  variant="secondary"
                  className="w-full text-white font-semibold flex items-center justify-center"
                >
                  {isCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {isCopied ? "Link Copied!" : "Copy Share Link"}
                </Button>
              )}
            </CardFooter>
          </Card>
        ) : (
          <div className="h-full w-full max-w-sm flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-12 text-center bg-muted/20 border-muted-foreground/20">
            <QrCode className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm max-w-[200px]">
              Your AI-generated QR code will appear here after generation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
