import { format } from 'date-fns';
import { InteractionWithRelations, INTERACTION_TYPES } from '@/hooks/useInteractions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Trash2, Phone, Mail, Video, Linkedin, FileText } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Video className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  demo: <Video className="h-4 w-4" />,
  proposal: <FileText className="h-4 w-4" />,
  other: <MessageSquare className="h-4 w-4" />,
};

interface InteractionListProps {
  interactions: InteractionWithRelations[];
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export default function InteractionList({ interactions, onDelete, isDeleting }: InteractionListProps) {
  if (interactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No interactions logged yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {interactions.map((interaction) => {
        const typeLabel = INTERACTION_TYPES.find((t) => t.value === interaction.type)?.label || interaction.type;

        return (
          <Card key={interaction.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    {TYPE_ICONS[interaction.type] || <MessageSquare className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{typeLabel}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(interaction.occurred_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {interaction.contacts && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        with {interaction.contacts.name}
                      </p>
                    )}
                    {interaction.summary && (
                      <p className="mt-2 text-sm">{interaction.summary}</p>
                    )}
                    {interaction.objections && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-muted-foreground">Objections:</span>
                        <p className="text-sm text-muted-foreground">{interaction.objections}</p>
                      </div>
                    )}
                    {interaction.commitments && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-muted-foreground">Commitments:</span>
                        <p className="text-sm text-muted-foreground">{interaction.commitments}</p>
                      </div>
                    )}
                  </div>
                </div>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(interaction.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
