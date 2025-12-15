'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { formatBytes, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Database, 
  HardDrive, 
  AlertTriangle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TableStat {
  name: string;
  record_count: number;
  size_bytes: number;
  size_mb: number;
}

interface StorageStat {
  path: string;
  total_files: number;
  total_size_bytes: number;
  total_size_mb: number;
  total_size_gb: number;
}

interface DatabaseStats {
  tables: Record<string, TableStat>;
  coldstorage: StorageStat;
  database_file: string;
  database_size_bytes: number;
  database_size_mb: number;
}

export default function AdminStatsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getDatabaseStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke laste statistikk');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllPhotos = async () => {
    try {
      setDeleting(true);
      setError(null);
      await apiClient.clearDatabase();
      setShowDeleteDialog(false);
      // Reload stats after deletion
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke slette data');
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Statistikk</h1>
          <p className="mt-2 text-muted-foreground">
            Oversikt over tabeller og lagringsplass
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Oppdater
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Slett alle bilder
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          {/* Database File Info */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Database Fil</h2>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filsti:</span>
                <span className="font-mono text-xs">{stats.database_file}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Størrelse:</span>
                <span className="font-semibold">
                  {formatBytes(stats.database_size_bytes)} ({stats.database_size_mb.toFixed(2)} MB)
                </span>
              </div>
            </div>
          </Card>

          {/* Tables Statistics */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Database Tabeller</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Tabell</th>
                    <th className="pb-3 pr-4 font-medium text-right">Records</th>
                    <th className="pb-3 font-medium text-right">Størrelse</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.tables)
                    .sort((a, b) => b[1].size_bytes - a[1].size_bytes)
                    .map(([name, table]) => (
                      <tr key={name} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-mono text-sm">{name}</td>
                        <td className="py-3 pr-4 text-right font-semibold">
                          {formatNumber(table.record_count)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="text-sm font-medium">{table.size_mb.toFixed(2)} MB</div>
                          <div className="text-xs text-muted-foreground">
                            {formatBytes(table.size_bytes)}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Cold Storage */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Cold Storage (Preview-filer)</h2>
            </div>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lagringssti:</span>
                <span className="font-mono text-xs">{stats.coldstorage.path}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Antall filer:</span>
                <span className="font-semibold">{formatNumber(stats.coldstorage.total_files)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total størrelse:</span>
                <span className="font-semibold">
                  {stats.coldstorage.total_size_gb.toFixed(2)} GB
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({stats.coldstorage.total_size_mb.toFixed(2)} MB)
                  </span>
                </span>
              </div>
            </div>
          </Card>

          {/* Summary Card */}
          <Card className="p-6 bg-muted/50">
            <h3 className="mb-4 font-semibold">Oppsummering</h3>
            <div className="grid gap-2 text-sm">
              {Object.entries(stats.tables).map(([name, table]) => (
                <div key={name} className="flex justify-between">
                  <span className="text-muted-foreground">{name}:</span>
                  <span className="font-medium">{formatNumber(table.record_count)} records</span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
                <span>Total diskbruk:</span>
                <span>
                  {(stats.database_size_mb + stats.coldstorage.total_size_mb).toFixed(2)} MB
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ADVARSEL: Slett alle data
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold">
                Dette vil slette ALLE bilder og tilhørende metadata fra databasen!
              </p>
              <p>
                Dette inkluderer:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Alle bilder (photos)</li>
                <li>Alle bildefiler (image_files)</li>
                <li>Alle samlinger (collections)</li>
                <li>Alle tags</li>
                <li>Alle lagrede søk</li>
                <li>Alle events</li>
                <li>Alle PhotoText dokumenter</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">
                Denne handlingen kan IKKE angres!
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                NB: Dette er kun for testing. Denne funksjonen vil bli fjernet i produksjon.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllPhotos}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Sletter...' : 'Ja, slett alt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
