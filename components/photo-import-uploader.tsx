'use client';

import { useState, useCallback } from 'react';
import { Upload, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PhotoMetadataEditor } from '@/components/photo-metadata-editor';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface PhotoImportUploaderProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'editing' | 'saving' | 'success';

interface PhotoCreateSchema {
  hothash: string;
  hotpreview_base64: string;
  coldpreview_base64?: string | null;
  width: number;
  height: number;
  taken_at?: string | null;
  gps_latitude?: number | null;
  gps_longitude?: number | null;
  exif_dict?: Record<string, any> | null;
  image_file_list: Array<{
    filename: string;
    file_size: number;
  }>;
  rating: number;
  visibility: string;
  input_channel_id?: number | null;
  author_id?: number | null;
  category?: string | null;
  stack_id?: number | null;
  timeloc_correction?: Record<string, any> | null;
  view_correction?: Record<string, any> | null;
}

export function PhotoImportUploader({ onSuccess, onError }: PhotoImportUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoSchema, setPhotoSchema] = useState<PhotoCreateSchema | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      onError?.('Vennligst velg en bildefil (JPEG, PNG, etc.)');
    }
  }, [onError]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadState('uploading');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Send to core.trollfjell.com for processing
      setUploadState('processing');
      const schema = await apiClient.processImageWithCore(file);
      
      setPhotoSchema(schema);
      setUploadState('editing');
    } catch (error) {
      console.error('Error processing image:', error);
      onError?.(error instanceof Error ? error.message : 'Feil ved prosessering av bilde');
      setUploadState('idle');
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleMetadataUpdate = (updates: Partial<PhotoCreateSchema>) => {
    if (photoSchema) {
      setPhotoSchema({ ...photoSchema, ...updates });
    }
  };

  const handleSave = async (tags: string[]) => {
    if (!photoSchema) return;

    try {
      setUploadState('saving');
      await apiClient.createPhoto(photoSchema, tags);
      
      setUploadState('success');
      
      // Reset after short delay
      setTimeout(() => {
        setUploadState('idle');
        setSelectedFile(null);
        setPreviewUrl(null);
        setPhotoSchema(null);
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('Error saving photo:', error);
      onError?.(error instanceof Error ? error.message : 'Feil ved lagring av foto');
      setUploadState('editing');
    }
  };

  const handleCancel = () => {
    setUploadState('idle');
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoSchema(null);
  };

  // Show metadata editor if we have a schema
  if (uploadState === 'editing' && photoSchema) {
    return (
      <PhotoMetadataEditor
        schema={photoSchema}
        previewUrl={previewUrl}
        onUpdate={handleMetadataUpdate}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  // Show success state
  if (uploadState === 'success') {
    return (
      <Card className="border-2 border-green-500">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <p className="text-lg font-semibold">Foto lagret!</p>
          <p className="text-sm text-muted-foreground">Omdirigerer...</p>
        </CardContent>
      </Card>
    );
  }

  // Show processing state
  if (uploadState === 'uploading' || uploadState === 'processing' || uploadState === 'saving') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-lg font-semibold">
            {uploadState === 'uploading' && 'Laster opp...'}
            {uploadState === 'processing' && 'Prosesserer bilde...'}
            {uploadState === 'saving' && 'Lagrer foto...'}
          </p>
          {previewUrl && (
            <div className="mt-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-xs max-h-48 rounded-lg object-contain"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show upload area (idle state)
  return (
    <Card
      className={cn(
        'border-2 border-dashed transition-colors cursor-pointer',
        isDragging && 'border-primary bg-primary/5'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Upload className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-semibold mb-2">
          Dra og slipp bilde her
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          eller
        </p>
        <label htmlFor="file-upload">
          <Button variant="default" asChild>
            <span>Velg fil</span>
          </Button>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </label>
        <p className="text-xs text-muted-foreground mt-4">
          Støtter JPEG, PNG, RAW og andre bildeformater
        </p>
      </CardContent>
    </Card>
  );
}
