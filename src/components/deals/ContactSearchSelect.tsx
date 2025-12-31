import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
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
import ContactFormDialog from '@/components/contacts/ContactFormDialog';
import { useContacts } from '@/hooks/useContacts';

interface ContactSearchSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  accountId?: string;
  disabled?: boolean;
}

export function ContactSearchSelect({ value, onValueChange, accountId, disabled }: ContactSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { contacts } = useContacts();

  // Filter contacts by account if accountId is provided
  const filteredContacts = accountId 
    ? contacts.filter((c) => c.account_id === accountId)
    : contacts;

  const selectedContact = contacts.find((c) => c.id === value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedContact ? selectedContact.name : 'Select contact...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[300px] p-0 z-50 bg-background" align="start">
          <Command>
            <CommandInput placeholder="Search contacts..." />
            <CommandList>
              <CommandEmpty>
                <div className="p-2 text-center">
                  <p className="text-sm text-muted-foreground">No contact found.</p>
                  {accountId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setOpen(false);
                        setCreateDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add new Contact
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredContacts.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={contact.name}
                    onSelect={() => {
                      onValueChange(contact.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === contact.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div>
                      <p>{contact.name}</p>
                      {contact.title && (
                        <p className="text-xs text-muted-foreground">{contact.title}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            {accountId && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setOpen(false);
                    setCreateDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add new Contact
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      <ContactFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultAccountId={accountId}
      />
    </>
  );
}
