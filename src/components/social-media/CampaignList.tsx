import { Pencil, Trash2, MoreHorizontal, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useState } from 'react';
import { SM_PLATFORMS, DAYS_OF_WEEK } from '@/lib/socialMediaConstants';
import type { SMCampaign } from '@/hooks/useSMCampaigns';

interface CampaignListProps {
  campaigns: SMCampaign[];
  onEdit: (campaign: SMCampaign) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (params: { id: string; is_active: boolean }) => void;
}

export function CampaignList({ campaigns, onEdit, onDelete, onToggleActive }: CampaignListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">
          No campaigns yet. Create your first campaign to start scheduling content.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Platforms</TableHead>
            <TableHead>Cadence</TableHead>
            <TableHead>Default Day</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const recurrence = campaign.recurrence_rule;
            const dayOfWeek = DAYS_OF_WEEK.find(d => d.value === recurrence.day_of_week);

            return (
              <TableRow key={campaign.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: campaign.color }}
                    />
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      {campaign.description_brief && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {campaign.description_brief}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {campaign.platforms.map((platform) => {
                      const config = SM_PLATFORMS.find(p => p.value === platform);
                      const Icon = config?.icon;
                      return Icon ? (
                        <Badge key={platform} variant="outline" className="gap-1">
                          <Icon className="h-3 w-3" style={{ color: config?.color }} />
                          <span className="text-xs">{config?.label}</span>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {recurrence.frequency.charAt(0).toUpperCase() + recurrence.frequency.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {dayOfWeek?.label || '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={campaign.is_active}
                      onCheckedChange={(checked) => 
                        onToggleActive({ id: campaign.id, is_active: checked })
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      {campaign.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(campaign)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteId(campaign.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this campaign and all associated schedule slots.
              Content items will be preserved but unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
