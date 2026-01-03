import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface Stakeholder {
  name?: string;
  title?: string;
  email?: string;
  linkedin?: string;
  role?: string;
}

interface StakeholdersListProps {
  stakeholders: Json | null;
}

export function StakeholdersList({ stakeholders }: StakeholdersListProps) {
  if (!stakeholders) return null;

  // Handle both array and object formats
  let stakeholderList: Stakeholder[] = [];
  if (Array.isArray(stakeholders)) {
    stakeholderList = stakeholders as Stakeholder[];
  } else if (typeof stakeholders === 'object') {
    stakeholderList = [stakeholders as Stakeholder];
  }

  if (stakeholderList.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Stakeholders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stakeholderList.map((stakeholder, index) => (
          <div
            key={index}
            className="rounded-lg border bg-muted/30 p-3 space-y-1"
          >
            {stakeholder.name && (
              <p className="font-medium">{stakeholder.name}</p>
            )}
            {stakeholder.title && (
              <p className="text-sm text-muted-foreground">{stakeholder.title}</p>
            )}
            {stakeholder.role && (
              <p className="text-sm text-muted-foreground">Role: {stakeholder.role}</p>
            )}
            {stakeholder.email && (
              <a
                href={`mailto:${stakeholder.email}`}
                className="text-sm text-primary hover:underline block"
              >
                {stakeholder.email}
              </a>
            )}
            {stakeholder.linkedin && (
              <a
                href={stakeholder.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline block"
              >
                LinkedIn Profile
              </a>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
