import { useRef } from 'react';
import { Upload, X, File as FileIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDealFiles, ContractorType, DealFile } from '@/hooks/useDealFiles';

const CONTRACTOR_SLOTS: { type: ContractorType; label: string }[] = [
  { type: 'fitness_equipment', label: 'Fitness Equipment' },
  { type: 'interior_designer', label: 'Interior Designer' },
  { type: 'architect', label: 'Architect' },
  { type: 'graphic_designer', label: 'Graphic Designer' },
];

interface Props {
  dealId: string;
}

export function ContractorProposalUploads({ dealId }: Props) {
  const { files, uploadFile, deleteFile, getFileUrl, isUploading, isDeleting } =
    useDealFiles(dealId);

  const contractorFiles = files.filter(
    (f) => f.file_category === 'contractor_proposal'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Contractor Proposals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {CONTRACTOR_SLOTS.map((slot) => (
            <ContractorSlot
              key={slot.type}
              dealId={dealId}
              type={slot.type}
              label={slot.label}
              files={contractorFiles.filter((f) => f.contractor_type === slot.type)}
              onUpload={(file) =>
                uploadFile({
                  dealId,
                  file,
                  fileType: 'proposal',
                  fileCategory: 'contractor_proposal',
                  contractorType: slot.type,
                })
              }
              onDelete={deleteFile}
              getFileUrl={getFileUrl}
              isUploading={isUploading}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface SlotProps {
  dealId: string;
  type: ContractorType;
  label: string;
  files: DealFile[];
  onUpload: (file: File) => void;
  onDelete: (file: DealFile) => void;
  getFileUrl: (ref: string) => string;
  isUploading: boolean;
  isDeleting: boolean;
}

function ContractorSlot({
  label,
  files,
  onUpload,
  onDelete,
  getFileUrl,
  isUploading,
  isDeleting,
}: SlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              onUpload(f);
              e.target.value = '';
            }
          }}
        />
      </div>
      {files.length === 0 ? (
        <p className="text-xs text-muted-foreground">No proposal uploaded</p>
      ) : (
        <div className="space-y-1.5">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 rounded border bg-muted/30 p-2"
            >
              <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <a
                href={getFileUrl(file.file_ref)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs truncate flex-1 hover:underline"
              >
                {file.file_name}
              </a>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDelete(file)}
                disabled={isDeleting}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}