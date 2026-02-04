import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDeals, DealWithRelations } from '@/hooks/useDeals';

interface DealSearchSelectProps {
  value: string;
  onValueChange: (dealId: string, deal?: DealWithRelations) => void;
  disabled?: boolean;
}

export function DealSearchSelect({ value, onValueChange, disabled }: DealSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const { deals } = useDeals();

  const selectedDeal = deals.find((d) => d.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedDeal ? (
            <span className="truncate">
              {selectedDeal.deal_name || 'Unnamed Deal'}
              {selectedDeal.accounts?.name && (
                <span className="text-muted-foreground ml-1">
                  ({selectedDeal.accounts.name})
                </span>
              )}
            </span>
          ) : (
            'Select deal...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[300px] p-0 z-50 bg-background" align="start">
        <Command>
          <CommandInput placeholder="Search deals..." />
          <CommandList>
            <CommandEmpty>
              <div className="p-2 text-center">
                <p className="text-sm text-muted-foreground">No deal found.</p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {deals.map((deal) => (
                <CommandItem
                  key={deal.id}
                  value={`${deal.deal_name || ''} ${deal.accounts?.name || ''}`}
                  onSelect={() => {
                    onValueChange(deal.id, deal);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === deal.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{deal.deal_name || 'Unnamed Deal'}</span>
                    {deal.accounts?.name && (
                      <span className="text-xs text-muted-foreground">
                        {deal.accounts.name}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
