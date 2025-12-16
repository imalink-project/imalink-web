'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import type { Author } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CreateAuthorDialog } from '@/components/create-author-dialog';
import { EditAuthorDialog } from '@/components/edit-author-dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Camera, Plus, MoreVertical, Edit, Trash, Mail, User } from 'lucide-react';

export default function PhotographersPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAuthors();
    }
  }, [isAuthenticated]);

  const loadAuthors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getAuthors(0, 100);
      setAuthors(response.data || []);
    } catch (err) {
      console.error('Failed to load authors:', err);
      setError(err instanceof Error ? err.message : 'Kunne ikke laste fotografer');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: { name: string; email?: string; bio?: string }) => {
    try {
      await apiClient.createAuthor(data);
      await loadAuthors();
      setShowCreateDialog(false);
    } catch (err) {
      console.error('Failed to create author:', err);
      throw err;
    }
  };

  const handleEdit = async (id: number, data: { name?: string; email?: string; bio?: string }) => {
    try {
      await apiClient.updateAuthor(id, data);
      await loadAuthors();
      setShowEditDialog(false);
      setSelectedAuthor(null);
    } catch (err) {
      console.error('Failed to update author:', err);
      throw err;
    }
  };

  const handleDeleteClick = (author: Author) => {
    setSelectedAuthor(author);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAuthor) return;

    try {
      setDeleting(true);
      await apiClient.deleteAuthor(selectedAuthor.id);
      await loadAuthors();
      setShowDeleteDialog(false);
      setSelectedAuthor(null);
    } catch (err) {
      console.error('Failed to delete author:', err);
      alert('Kunne ikke slette fotograf');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditClick = (author: Author) => {
    setSelectedAuthor(author);
    setShowEditDialog(true);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fotografer</h1>
          <p className="mt-2 text-muted-foreground">
            Administrer fotografer og opphavsrett-informasjon
          </p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ny fotograf
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="text-muted-foreground">Laster fotografer...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          {error}
        </div>
      ) : authors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Camera className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h2 className="mb-2 text-xl font-semibold">Ingen fotografer ennå</h2>
          <p className="mb-4 text-muted-foreground">
            Opprett din første fotograf for å komme i gang
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ny fotograf
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <div
              key={author.id}
              className="rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{author.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {author.image_count || 0} bilder
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClick(author)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Rediger
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(author)}
                      className="text-destructive"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Slett
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {author.email && (
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{author.email}</span>
                </div>
              )}

              {author.bio && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                  {author.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Author Dialog */}
      <CreateAuthorDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onAuthorCreated={handleCreate}
      />

      {/* Edit Author Dialog */}
      {selectedAuthor && (
        <EditAuthorDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          author={selectedAuthor}
          onAuthorUpdated={handleEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett fotograf?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette &quot;{selectedAuthor?.name}&quot;?
              <br />
              <br />
              Bilder knyttet til denne fotografen vil beholde forfatter-informasjonen,
              men du kan ikke lenger redigere den.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Sletter...' : 'Slett'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
