"use client";

import React, { useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search, Shield, Trash2, ExternalLink, QrCode as QrIcon, Loader2, AlertCircle, TrendingUp, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collectionGroup, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const db = useFirestore();

  const allQrsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collectionGroup(db, 'qr_codes'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: qrcodes, isLoading, error } = useCollection(allQrsQuery);

  // Analytics Processing
  const { dailyData, statusData, stats } = useMemo(() => {
    if (!qrcodes) return { dailyData: [], statusData: [], stats: { total: 0, active: 0, inactive: 0 } };

    const total = qrcodes.length;
    const active = qrcodes.filter(q => q.status === 'active').length;
    const inactive = total - active;

    // Status Data for Pie Chart
    const status = [
      { name: "Active", value: active, fill: "hsl(var(--primary))" },
      { name: "Inactive", value: inactive, fill: "hsl(var(--muted-foreground))" },
    ];

    // Daily Data for Bar Chart (last 10 days)
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
      stats: { total, active, inactive } 
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
      .then(() => toast({ title: "Status Updated", description: `Set to ${newStatus}` }))
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: qrRef.path, operation: 'update', requestResourceData: { status: newStatus } }));
      });
  };

  const filtered = (qrcodes || []).filter(q => 
    q.title?.toLowerCase().includes(search.toLowerCase()) || 
    q.originalUrl?.toLowerCase().includes(search.toLowerCase()) ||
    q.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary font-headline">Admin Control Center</h1>
              <p className="text-muted-foreground">Global oversight of all platform activity.</p>
            </div>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search database..." 
              className="pl-10" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have administrative privileges. Ensure your UID is in the roles_admin collection.
            </AlertDescription>
          </Alert>
        )}

        {/* Top Level Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="border-primary/10 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
              <QrIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "..." : stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-primary/10 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
              <div className="h-2 w-2 rounded-full bg-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{isLoading ? "..." : stats.active}</div>
            </CardContent>
          </Card>
          <Card className="border-primary/10 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inactive Codes</CardTitle>
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">{isLoading ? "..." : stats.inactive}</div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Generation Trend</CardTitle>
                <CardDescription>Daily QR codes generated (Last 10 days)</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={dailyData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    tickMargin={10} 
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="count" 
                    fill="var(--color-count)" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="flex flex-row items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Status Distribution</CardTitle>
                <CardDescription>Active vs Inactive composition</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{stats.total}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Total</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="border-primary/10 shadow-lg overflow-hidden">
          <CardHeader className="border-b bg-muted/30 flex flex-row items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Global History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Preview</TableHead>
                  <TableHead>Document ID</TableHead>
                  <TableHead>Title & URL</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status Control</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-muted-foreground">Querying database...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      No global records found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((qr) => (
                    <TableRow key={qr.id} className="group transition-colors hover:bg-muted/40">
                      <TableCell>
                        <div className="w-12 h-12 bg-white border rounded p-1 shadow-sm">
                          <img src={qr.qrCodeImageUrl} alt="" className="w-full h-full object-contain" />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {qr.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-primary">{qr.title || 'Untitled'}</span>
                          <a 
                            href={qr.originalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center text-xs text-secondary hover:underline gap-1 truncate max-w-[200px]"
                          >
                            {qr.originalUrl} <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {qr.createdAt?.toDate?.() ? qr.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch 
                            checked={qr.status === 'active'} 
                            onCheckedChange={(checked) => handleToggleStatus(qr, checked)}
                          />
                          <Badge variant={qr.status === 'active' ? 'default' : 'outline'}>
                            {qr.status || 'active'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" 
                          onClick={() => handleDelete(qr)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}