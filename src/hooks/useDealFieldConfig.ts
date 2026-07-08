import { useAuth } from '@/contexts/AuthContext';
import { isTreneurWorkspace, isRedLoftWorkspace } from '@/lib/workspaceFeatures';
import {
  DEAL_TYPES,
  DEAL_SIZES,
  BUYING_MOTIVES,
  BUYER_ROLES,
  TRENEUR_DEAL_TYPES,
  TRENEUR_PARTNERSHIP_MOTIVES,
  TRENEUR_PARTNER_ROLES,
  REDLOFT_DEAL_TYPES,
} from './useDeals';

export function useDealFieldConfig() {
  const { workspaceId } = useAuth();
  const isTreneur = isTreneurWorkspace(workspaceId);
  const isRedLoft = isRedLoftWorkspace(workspaceId);

  return {
    isTreneur,
    dealTypes: isTreneur ? TRENEUR_DEAL_TYPES : isRedLoft ? REDLOFT_DEAL_TYPES : DEAL_TYPES,
    showDealSizeRange: !isTreneur,
    motiveLabel: isTreneur ? 'Partnership Motive' : 'Buying Motive',
    motives: isTreneur ? TRENEUR_PARTNERSHIP_MOTIVES : BUYING_MOTIVES,
    roleLabel: isTreneur ? 'Primary Partner Role' : 'Primary Buyer Role',
    roles: isTreneur ? TRENEUR_PARTNER_ROLES : BUYER_ROLES,
  };
}
