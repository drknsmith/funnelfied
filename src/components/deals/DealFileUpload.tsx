import { useRef } from 'react';
import { Upload, X, File, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DealFile } from '@/hooks/useDealFiles';

interface DealFileUploadProps {
  files: DealFile[];
  fileType: 'proposal' | 'site_photo';
  onUpload: (file: File) => void;
  onDelete: (file: DealFile) => void;
  getFileUrl: (fileRef: string) => string;
  isUploading: boolean;
  isDeleting: boolean;
  accept?: string;
  label: string;
}

export function DealFileUpload({
  files,
  fileType,
  onUpload,
  onDelete,
  getFileUrl,
  isUploading,
  isDeleting,
  accept = fileType === 'proposal' ? '.pdf,.jpg,.jpeg,.png' : '.jpg,.jpeg,.png',
  label,
}: DealFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  const isImage = (fileName: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
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
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files uploaded</p>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg border p-2"
            >
              {isImage(file.file_name) ? (
                <img
                  src={getFileUrl(file.file_ref)}
                  alt={file.file_name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <File className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(file.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a href={getFileUrl(file.file_ref)} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(file)}
                  disabled={isDeleting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
