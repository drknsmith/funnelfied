import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { useAllInteractions, AllInteraction } from '@/hooks/useAllInteractions';
import { INTERACTION_TYPES } from '@/hooks/useInteractions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageSquare, User, Briefcase, MoreHorizontal, Trash2, ExternalLink } from 'lucide-react';
import { useInteractions } from '@/hooks/useInteractions';

export default function Interactions() {
  const navigate = useNavigate();
  const { data: interactions, isLoading } = useAllInteractions();
  const { deleteInteraction, isDeleting } = useInteractions();

  const getTypeLabel = (type: string) => {
    return INTERACTION_TYPES.find((t) => t.value === type)?.label || type;
  };

  const handleRowClick = (interaction: AllInteraction) => {
    if (interaction.source_type === 'contact') {
      navigate(`/contacts/${interaction.source_id}`);
    } else {
      navigate(`/deals/${interaction.source_id}`);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteInteraction(id);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Interactions</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !interactions?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">No interactions logged yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Log interactions from deal or contact detail pages
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interactions.map((interaction) => (
                    <TableRow
                      key={interaction.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(interaction)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {interaction.source_type === 'contact' ? (
                            <User className="h-4 w-4 text-purple-500 shrink-0" />
                          ) : (
                            <Briefcase className="h-4 w-4 text-primary shrink-0" />
                          )}
                          <div>
                            <p className="font-medium truncate max-w-[200px]">
                              {interaction.source_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {interaction.summary?.slice(0, 50)}
                              {interaction.summary && interaction.summary.length > 50 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {interaction.account_name || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={interaction.source_type === 'contact' ? 'secondary' : 'default'}>
                            {interaction.source_type === 'contact' ? 'Contact' : 'Deal'}
                          </Badge>
                          <Badge variant="outline">{getTypeLabel(interaction.type)}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(interaction.occurred_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRowClick(interaction)}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View {interaction.source_type === 'contact' ? 'Contact' : 'Deal'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => handleDelete(e, interaction.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
