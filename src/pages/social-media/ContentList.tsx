import { useState, useMemo } from 'react';
import { format, parseISO, isAfter, isBefore, startOfToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Loader2, FileText, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useSMContentItems } from '@/hooks/useSMContentItems';
import { useSMCampaigns } from '@/hooks/useSMCampaigns';
import { SM_PLATFORMS, type SMPlatform } from '@/lib/socialMediaConstants';
import { AddContentDialog } from '@/components/social-media/AddContentDialog';
import { ContentDetailDrawer } from '@/components/social-media/ContentDetailDrawer';

interface ContentWithStats {
  id: string;
  title: string | null;
  platform: SMPlatform;
  campaign_id: string | null;
  campaignName: string | null;
  campaignColor: string | null;
  status: string;
  upcomingDate: string | null;
  lastDate: string | null;
  frequency: number;
}

export default function ContentList() {
  const { contentItems, isLoading: contentLoading, deleteContentItem, isDeleting } = useSMContentItems();
  const { campaigns, isLoading: campaignsLoading } = useSMCampaigns();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const contentWithStats = useMemo(() => {
    const today = startOfToday();
    const campaignMap = new Map(campaigns.map(c => [c.id, c]));

    // Group content by title + platform + campaign for frequency calculation
    const contentMap = new Map<string, ContentWithStats>();

    contentItems.forEach((item) => {
      const campaign = item.campaign_id ? campaignMap.get(item.campaign_id) : null;
      const itemDate = item.override_date;
      const key = `${item.title || 'untitled'}-${item.platform}-${item.campaign_id || 'none'}`;

      const existing = contentMap.get(key);

      if (!existing) {
        contentMap.set(key, {
          id: item.id,
          title: item.title,
          platform: item.platform as SMPlatform,
          campaign_id: item.campaign_id,
          campaignName: campaign?.name || null,
          campaignColor: campaign?.color || null,
          status: item.status,
          upcomingDate: itemDate && isAfter(parseISO(itemDate), today) ? itemDate : null,
          lastDate: itemDate && (isBefore(parseISO(itemDate), today) || item.status === 'published') ? itemDate : null,
          frequency: 1,
        });
      } else {
        // Update frequency
        existing.frequency += 1;

        // Update upcoming date (nearest future date)
        if (itemDate && isAfter(parseISO(itemDate), today)) {
          if (!existing.upcomingDate || isBefore(parseISO(itemDate), parseISO(existing.upcomingDate))) {
            existing.upcomingDate = itemDate;
          }
        }

        // Update last date (most recent past date)
        if (itemDate && (isBefore(parseISO(itemDate), today) || item.status === 'published')) {
          if (!existing.lastDate || isAfter(parseISO(itemDate), parseISO(existing.lastDate))) {
            existing.lastDate = itemDate;
          }
        }
      }
    });

    return Array.from(contentMap.values()).sort((a, b) => {
      // Sort by upcoming date first, then by last date
      if (a.upcomingDate && b.upcomingDate) {
        return parseISO(a.upcomingDate).getTime() - parseISO(b.upcomingDate).getTime();
      }
      if (a.upcomingDate) return -1;
      if (b.upcomingDate) return 1;
      return 0;
    });
  }, [contentItems, campaigns]);

  const isLoading = contentLoading || campaignsLoading;

  const getPlatformInfo = (platform: SMPlatform) => {
    return SM_PLATFORMS.find(p => p.value === platform);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteContentItem(deleteId);
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Overview
              </CardTitle>
              <CardDescription>
                All scheduled content with posting frequency and dates
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contentWithStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content items yet</p>
              <p className="text-sm">Click "Add Content" to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Upcoming Post</TableHead>
                  <TableHead>Last Post</TableHead>
                  <TableHead className="text-right">Frequency</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentWithStats.map((item) => {
                  const platformInfo = getPlatformInfo(item.platform);
                  const PlatformIcon = platformInfo?.icon;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.title || <span className="text-muted-foreground italic">Untitled</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {PlatformIcon && (
                            <PlatformIcon
                              className="h-4 w-4"
                              style={{ color: platformInfo?.color }}
                            />
                          )}
                          <span className="text-sm">{platformInfo?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.campaignName ? (
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${item.campaignColor}20`,
                              color: item.campaignColor,
                              borderColor: item.campaignColor,
                            }}
                            className="border"
                          >
                            {item.campaignName}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.upcomingDate ? (
                          <span className="text-sm">
                            {format(parseISO(item.upcomingDate), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.lastDate ? (
                          <span className="text-sm">
                            {format(parseISO(item.lastDate), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{item.frequency}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedContentId(item.id)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(item.id)}
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
          )}
        </CardContent>
      </Card>

      <AddContentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        campaigns={campaigns}
      />

      <ContentDetailDrawer
        open={!!selectedContentId}
        onOpenChange={(open) => !open && setSelectedContentId(null)}
        contentId={selectedContentId}
        campaigns={campaigns}
        contentItems={contentItems}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this content item. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
