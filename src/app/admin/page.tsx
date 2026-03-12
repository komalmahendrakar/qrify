
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Shield, 
  Trash2, 
  ExternalLink, 
  QrCode as QrIcon, 
  Loader2, 
  AlertCircle, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  LogOut,
  Copy,
  Download,
  Check,
  MousePointerClick
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError, useUser, useAuth } from "@/firebase";
import { collectionGroup, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // Enforce Admin Authentication
  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous)) {
      router.push("/admin/login");
    }
  }, [user, isUserLoading, router]);

  const allQrsQuery = useMemoFirebase(() => {
    if (!db || !user || user.isAnonymous) return null;
    return query(collectionGroup(db, 'qr_codes'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const { data: qrcodes, isLoading, error } = useCollection(allQrsQuery);

  // Analytics Processing
  const { dailyData, statusData, stats } = useMemo(() => {
    if (!qrcodes) return { dailyData: [], statusData: [], stats: { total: 0, active: 0, inactive: 0, totalScans: 0 } };

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
      const date = qr.createdAt?.toDate?.() || new Date();
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
    },
    Active: {
      label: "Active",
      color: "hsl(var(--primary))",
    },
    Inactive: {
      label: "Inactive",
      color: "hsl(var(--muted-foreground))",
    }
  } satisfies ChartConfig;

  const handleDelete = (qr: any) => {
    if (!db || !confirm("Admin Action: Are you sure you want to delete this global record?")) return;
    const qrRef = doc(db, 'users', qr.userId, 'qr_codes', qr.id);
    deleteDoc(qrRef)
      .then(() => toast({ title: "Record Deleted" }))
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: qrRef.path, operation: 'delete' }));
      });
  };

  const handleToggleStatus = (qr: any, checked: boolean) => {
    if (!db) return;
    const newStatus = checked ? 'active' : 'inactive';
    const qrRef = doc(db, 'users', qr.userId, 'qr_codes', qr.id);
    updateDoc(qrRef, { status: newStatus })
      .then(() => toast({ title: "Status Updated" }))
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: qrRef.path, operation: 'update', requestResourceData: { status: newStatus } }));
      });
  };

  const handleCopyLink = (qr: any) => {
    const redirectUrl = `${window.location.origin}/r/${qr.id}`;
    navigator.clipboard.writeText(redirectUrl);
    setCopiedId(qr.id);
    toast({ title: "Link Copied" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (qr: any) => {
    const link = document.createElement('a');
    link.href = qr.qrCodeImageUrl;
    link.download = `qrify-admin-${qr.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push("/admin/login");
  };

  const filtered = (qrcodes || []).filter(q => 
    q.title?.toLowerCase().includes(search.toLowerCase()) || 
    q.originalUrl?.toLowerCase().includes(search.toLowerCase()) ||
    q.id?.toLowerCase().includes(search.toLowerCase())
  );

  if (isUserLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user || user.isAnonymous) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold font-headline">Admin Control Center</h1>
          </div>
          <div className="flex items-center gap-4">
            <Input 
              placeholder="Search..." 
              className="max-w-xs" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outline" size="icon" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Global Metrics */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Total QR Codes</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Total Scans</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-secondary">{stats.totalScans}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Active</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-primary">{stats.active}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Inactive</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-muted-foreground">{stats.inactive}</div></CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg">Generation Trend</CardTitle></CardHeader>
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
            <CardHeader><CardTitle className="text-lg">Status Breakdown</CardTitle></CardHeader>
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

        {/* Global Table */}
        <Card className="shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Document ID</TableHead>
                  <TableHead>Title & Destination</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Scans</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                ) : filtered.map((qr) => (
                  <TableRow key={qr.id}>
                    <TableCell>
                      <img src={qr.qrCodeImageUrl} className="w-10 h-10 border rounded" alt="" />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{qr.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{qr.title || 'Untitled'}</span>
                        <a href={qr.originalUrl} target="_blank" className="text-xs text-secondary truncate max-w-[150px]">{qr.originalUrl}</a>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {qr.createdAt?.toDate?.() ? qr.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-semibold">
                        <MousePointerClick className="h-3 w-3 text-secondary" />
                        {qr.totalScans || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={qr.status === 'active'} onCheckedChange={(c) => handleToggleStatus(qr, c)} />
                        <Badge variant={qr.status === 'active' ? 'default' : 'outline'}>{qr.status || 'active'}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleCopyLink(qr)}>
                          {copiedId === qr.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(qr)}><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(qr)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
