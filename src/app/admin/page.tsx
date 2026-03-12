"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Shield, Trash2, ExternalLink, BarChart3, Users, QrCode as QrIcon, Loader2, AlertCircle } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collectionGroup, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const db = useFirestore();

  // Collection Group query allows us to see all 'qr_codes' across all user subcollections
  const allQrsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collectionGroup(db, 'qr_codes'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: qrcodes, isLoading, error } = useCollection(allQrsQuery);

  const handleDelete = (qr: any) => {
    if (!db || !confirm("Admin Action: Are you sure you want to delete this global record?")) return;
    
    const qrRef = doc(db, 'users', qr.userId, 'qr_codes', qr.id);
    
    // Non-blocking delete pattern
    deleteDoc(qrRef)
      .then(() => {
        toast({ title: "Record Deleted", description: "Successfully removed from global database." });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: qrRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const stats = {
    total: qrcodes?.length || 0,
    active: qrcodes?.filter(q => q.status === 'active').length || 0,
    inactive: qrcodes?.filter(q => q.status === 'inactive').length || 0,
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
              You do not have administrative privileges to view this data. Please ensure your UID is in the roles_admin collection.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card className="border-primary/10 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
              <QrIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "..." : stats.total}</div>
              <p className="text-xs text-muted-foreground">Generated across all users</p>
            </CardContent>
          </Card>
          <Card className="border-primary/10 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {isLoading ? "..." : stats.active}
              </div>
              <p className="text-xs text-muted-foreground">Currently operational</p>
            </CardContent>
          </Card>
          <Card className="border-primary/10 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inactive Codes</CardTitle>
              <div className="h-2 w-2 rounded-full bg-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {isLoading ? "..." : stats.inactive}
              </div>
              <p className="text-xs text-muted-foreground">Archived or disabled</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/10 shadow-lg overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-muted-foreground">Querying global database...</span>
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
                        <Badge variant={qr.status === 'active' ? 'secondary' : 'outline'}>
                          {qr.status || 'active'}
                        </Badge>
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
