import { useWorkspaceUsers } from '@/hooks/useWorkspaceUsers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from 'lucide-react';

interface OwnerSelectProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function OwnerSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select owner',
}: OwnerSelectProps) {
  const { users, loading } = useWorkspaceUsers();

  return (
    <Select
      value={value || 'unassigned'}
      onValueChange={(v) => onValueChange(v === 'unassigned' ? null : v)}
      disabled={disabled || loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {value ? (
            <span className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              {users?.find((u) => u.user_id === value)?.full_name || 'Unknown User'}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <span className="text-muted-foreground">Unassigned</span>
        </SelectItem>
        {users?.map((user) => (
          <SelectItem key={user.user_id} value={user.user_id}>
            <div className="flex flex-col">
              <span>{user.full_name || 'Unnamed User'}</span>
              {user.email && (
                <span className="text-xs text-muted-foreground">{user.email}</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
