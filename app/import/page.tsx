'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoImportUploader } from '@/components/photo-import-uploader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export default function ImportPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleImportSuccess = () => {
    // Redirect to home page after successful import with refresh
    router.push('/?refresh=true');
    router.refresh();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Legg til foto</h1>
          <p className="text-muted-foreground mt-2">
            Last opp bilder som blir automatisk analysert og organisert
          </p>
        </div>

        {/* Information Box */}
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Slik fungerer det:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Velg eller dra et bilde til opplastingsområdet</li>
                <li>Bildet sendes til ImaLink Core for analyse og prosessering</li>
                <li>EXIF-data, GPS-koordinater og andre metadata ekstraheres automatisk</li>
                <li>Du kan redigere synlighet, vurdering og legge til tagger før lagring</li>
                <li>Bildet lagres i ditt personlige galleri</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Component */}
        <PhotoImportUploader 
          onSuccess={handleImportSuccess}
          onError={setError}
        />
      </div>
    </div>
  );
}
