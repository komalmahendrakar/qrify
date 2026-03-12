
"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, RefreshCw, Globe, QrCode, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateAndSaveQRCode } from "@/app/actions";
import QRCodeLib from 'qrcode';

const GENERATION_COOLDOWN_MS = 2000;

export function QRGenerator() {
  const [url, setUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeDataUri, setQrCodeDataUri] = useState<string | null>(null);
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState(0);
  
  const { toast } = useToast();

  const validateUrl = (string: string) => {
    try {
      const parsed = new URL(string.trim());
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch (_) {
      return false;
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const trimmedUrl = url.trim();
    if (!trimmedUrl || !validateUrl(trimmedUrl)) {
      toast({ variant: "destructive", title: "Invalid URL", description: "Please enter a valid URL starting with http:// or https://" });
      return;
    }

    const now = Date.now();
    if (now - lastGeneratedAt < GENERATION_COOLDOWN_MS) {
      toast({ variant: "destructive", title: "Wait a moment", description: "Generating codes too fast. Please wait 2 seconds." });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate a title from the URL domain
      let title = "My QR Code";
      try {
        const domain = new URL(trimmedUrl).hostname.replace('www.', '');
        title = `Link to ${domain}`;
      } catch {}

      const baseUrl = window.location.origin;
      
      const result = await generateAndSaveQRCode({
        originalUrl: trimmedUrl,
        title,
        baseUrl,
      });

      if (!result.success || !result.qrCode) {
        toast({ variant: "destructive", title: "Generation failed", description: result.error || "Something went wrong." });
        return;
      }

      setQrCodeId(result.qrCode.id);
      setRedirectUrl(`${baseUrl}/r/${result.qrCode.id}`);
      setQrCodeDataUri(result.qrCode.qrCodeImageUrl);
      setLastGeneratedAt(Date.now());
      toast({ title: "QR Code Created!", description: `Dynamic QR code generated and saved. Scannable now.` });
    } catch (error) {
      console.error("[GEN_ERROR]", error);
      toast({ variant: "destructive", title: "Generation failed", description: "Something went wrong while creating your QR code." });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = async (format: 'png' | 'jpg' | 'svg') => {
    if (!qrCodeDataUri || !redirectUrl) return;

    let downloadUrl = qrCodeDataUri;
    let fileName = `qrify-${qrCodeId || Date.now()}.${format}`;

    if (format === 'svg') {
      try {
        const svgString = await QRCodeLib.toString(redirectUrl, {
          type: 'svg',
          width: 1024,
          margin: 2,
          errorCorrectionLevel: 'H'
        });
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        downloadUrl = URL.createObjectURL(blob);
      } catch (e) {
        toast({ variant: "destructive", title: "Download failed", description: "Could not generate SVG." });
        return;
      }
    } else if (format === 'jpg') {
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

  const copyRedirectLink = () => {
    if (!redirectUrl) return;
    navigator.clipboard.writeText(redirectUrl);
    setIsCopied(true);
    toast({ title: "Link Copied", description: "Dynamic redirect link copied to clipboard." });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="font-headline text-primary">Configuration</CardTitle>
          <CardDescription>Enter a destination URL to generate a dynamic QR code.</CardDescription>
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
            <Button 
              type="submit" 
              className="w-full h-12 text-lg shadow-md transition-all hover:scale-[1.01]" 
              disabled={isGenerating || !url.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Generate Dynamic QR
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
              
              <Button 
                onClick={copyRedirectLink} 
                variant="secondary"
                className="w-full text-white font-semibold flex items-center justify-center"
              >
                {isCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {isCopied ? "Link Copied!" : "Copy Dynamic QR Link"}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="h-full w-full max-w-sm flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-12 text-center bg-muted/20 border-muted-foreground/20">
            <QrCode className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm max-w-[200px]">
              Generate a QR code above to see the dynamic preview.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
