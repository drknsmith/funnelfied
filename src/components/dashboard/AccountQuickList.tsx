import { useNavigate } from 'react-router-dom';
import { Account } from '@/hooks/useAccounts';

interface AccountWithDeals extends Account {
  openDealCount: number;
}

interface AccountQuickListProps {
  accounts: AccountWithDeals[];
  maxItems?: number;
}

export default function AccountQuickList({ accounts, maxItems = 5 }: AccountQuickListProps) {
  const navigate = useNavigate();
  const displayAccounts = accounts.slice(0, maxItems);

  return (
    <div className="space-y-1">
      {displayAccounts.map((account) => (
        <div
          key={account.id}
          className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/accounts/${account.id}`);
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{account.name}</p>
            <p className="text-xs text-muted-foreground">
              {account.portfolio_size} sites • {account.openDealCount} open deal{account.openDealCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
