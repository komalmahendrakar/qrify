"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Save, RefreshCw, Wand2, Globe, QrCode } from "lucide-react";
import { generateStyledQrCode } from "@/ai/flows/generate-styled-qr-code";
import { suggestQrCodeDescription } from "@/ai/flows/suggest-qr-code-description-flow";
import { saveQRCode } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function QRGenerator() {
  const [url, setUrl] = useState("");
  const [stylePrompt, setStylePrompt] = useState("classic black and white minimalist");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [qrCodeDataUri, setQrCodeDataUri] = useState<string | null>(null);
  const { toast } = useToast();

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
        description: "Something went wrong while creating your QR code. Please try a simpler style.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!qrCodeDataUri || !url) return;
    setIsSaving(true);
    try {
      const { summary } = await suggestQrCodeDescription({ url });
      await saveQRCode({
        url,
        qrCodeDataUri,
        title: summary,
      });
      toast({
        title: "Saved!",
        description: `QR code for ${summary} has been saved to your dashboard.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Could not save your QR code.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadFile = (format: 'png' | 'jpg' | 'svg') => {
    if (!qrCodeDataUri) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUri;
    // Note: Since AI output is base64 raster, SVG download for AI-styled codes 
    // is currently served as the high-res raster version.
    link.download = `qrify-code.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <Button onClick={handleSave} className="w-full bg-secondary hover:bg-secondary/90 text-white font-semibold" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save to Dashboard
              </Button>
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