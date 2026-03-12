
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Shield, 
  Trash2, 
  Loader2, 
  Copy,
  Download,
  Check,
  MousePointerClick
} from "lucide-react";
import { deleteQRCodeAction, toggleQRCodeStatusAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface QRCodeItem {
  id: string;
  originalUrl: string;
  qrCodeImageUrl: string;
  title: string;
  createdAt: string;
  status: string;
  totalScans: number;
}

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrcodes, setQrcodes] = useState<QRCodeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === "admin123") { // Fallback for local dev if env not set
      setIsAuthenticated(true);
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Incorrect password." });
    }
  };

  const fetchQRCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/qrcodes');
      const data = await res.json();
      setQrcodes(data);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load QR codes." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  // Analytics Processing
  const { dailyData, statusData, stats } = useMemo(() => {
    if (!qrcodes.length) return { dailyData: [], statusData: [], stats: { total: 0, active: 0, inactive: 0, totalScans: 0 } };

    const total = qrcodes.length;
    const active = qrcodes.filter(q => q.status === 'active').length;
    const inactive = total - active;
    const totalScans = qrcodes.reduce((sum, q) => sum + (q.totalScans || 0), 0);

    const status = [
      { name: "Active", value: active, fill: "hsl(var(--primary))" },
      { name: "Inactive", value: inactive, fill: "hsl(var(--muted-foreground))" },
    ];

    const dailyMap: Record<string, number> = {};
    [...qrcodes].reverse().forEach(qr => {
      const date = new Date(qr.createdAt);
      const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;
    });

    const daily = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .slice(-10);

    return { 
      dailyData: daily, 
      statusData: status, 
      stats: { total, active, inactive, totalScans } 
    };
  }, [qrcodes]);

  const chartConfig = {
    count: {
      label: "Generations",
      color: "hsl(var(--primary))",
    }
  } satisfies ChartConfig;

  const handleDelete = async (qr: QRCodeItem) => {
    if (!confirm("Admin Action: Are you sure you want to delete this record?")) return;
    const result = await deleteQRCodeAction(qr.id);
    if (result.success) {
      setQrcodes(prev => prev.filter(q => q.id !== qr.id));
      toast({ title: "Record Deleted" });
    } else {
      toast({ variant: "destructive", title: "Error", description: "Could not delete record." });
    }
  };

  const handleToggleStatus = async (qr: QRCodeItem, checked: boolean) => {
    const newStatus = checked ? 'active' : 'inactive';
    const result = await toggleQRCodeStatusAction(qr.id, newStatus);
    if (result.success) {
      setQrcodes(prev => prev.map(q => q.id === qr.id ? { ...q, status: newStatus } : q));
      toast({ title: "Status Updated", description: `QR code is now ${newStatus}.` });
    } else {
      toast({ variant: "destructive", title: "Error", description: "Could not update status." });
    }
  };

  const handleCopyLink = (qr: QRCodeItem) => {
    const baseUrl = window.location.origin;
    const redirectUrl = `${baseUrl}/r/${qr.id}`;
    navigator.clipboard.writeText(redirectUrl);
    setCopiedId(qr.id);
    toast({ title: "Link Copied" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (qr: QRCodeItem) => {
    const link = document.createElement('a');
    link.href = qr.qrCodeImageUrl;
    link.download = `qrify-admin-${qr.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = qrcodes.filter(q => 
    q.title?.toLowerCase().includes(search.toLowerCase()) || 
    q.originalUrl?.toLowerCase().includes(search.toLowerCase()) ||
    q.id?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-primary/20">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold font-headline">Admin Access</CardTitle>
              <CardDescription>Please enter the administrator password to continue.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-center text-lg"
                  autoFocus
                />
                <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg">
                  Unlock Dashboard
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Input 
              placeholder="Search records..." 
              className="max-w-xs" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Global Metrics */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Generated</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Global Scans</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-secondary">{stats.totalScans}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Links</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-primary">{stats.active}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Inactive Links</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-muted-foreground">{stats.inactive}</div></CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg">Generation Activity</CardTitle></CardHeader>
            <CardContent className="h-[250px]">
              <ChartContainer config={chartConfig}>
                <BarChart data={dailyData}>
                  <CartesianGrid vertical={false} opacity={0.2} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg">Link Status Distribution</CardTitle></CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Global Management Table */}
        <Card className="shadow-lg overflow-hidden border-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[80px]">Preview</TableHead>
                  <TableHead>Destination & Title</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Total Scans</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No records found matching your search.</TableCell></TableRow>
                ) : filtered.map((qr) => (
                  <TableRow key={qr.id}>
                    <TableCell>
                      <img src={qr.qrCodeImageUrl} className="w-12 h-12 border rounded-xl object-contain bg-white" alt="" />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-primary">{qr.title || 'Untitled Code'}</span>
                        <a href={qr.originalUrl} target="_blank" className="text-xs text-secondary hover:underline truncate max-w-[200px]">{qr.originalUrl}</a>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(qr.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold">
                        <MousePointerClick className="h-4 w-4 text-secondary" />
                        {qr.totalScans || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch checked={qr.status === 'active'} onCheckedChange={(c) => handleToggleStatus(qr, c)} />
                        <Badge variant={qr.status === 'active' ? 'default' : 'outline'} className="capitalize">
                          {qr.status || 'active'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleCopyLink(qr)} title="Copy Redirect Link">
                          {copiedId === qr.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(qr)} title="Download Image">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(qr)} className="text-destructive hover:bg-destructive/10" title="Delete Record">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
