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
import { AlertCircle } from 'lucide-react';

interface MissingField {
  field: string;
  label: string;
}

interface StageValidationModalProps {
  open: boolean;
  onClose: () => void;
  missingFields: MissingField[];
  targetStage: string;
}

export function StageValidationModal({
  open,
  onClose,
  missingFields,
  targetStage,
}: StageValidationModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Cannot Advance Stage
          </AlertDialogTitle>
          <AlertDialogDescription>
            The following fields are required to move to "{targetStage}":
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 space-y-2">
          {missingFields.map((field) => (
            <div
              key={field.field}
              className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm"
            >
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>{field.label}</span>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
