import { Badge } from '@/components/ui/badge';
import { TenderItemMatchStatus } from '@workspace/api-client-react';

interface MatchStatusBadgeProps {
  status: TenderItemMatchStatus;
  className?: string;
}

export function MatchStatusBadge({ status, className }: MatchStatusBadgeProps) {
  switch (status) {
    case 'matched':
      return (
        <Badge variant="outline" className={`bg-status-matched-bg text-status-matched border-status-matched/20 hover:bg-status-matched-bg ${className}`}>
          Eşleşti
        </Badge>
      );
    case 'fuzzy':
      return (
        <Badge variant="outline" className={`bg-status-fuzzy-bg text-status-fuzzy border-status-fuzzy/20 hover:bg-status-fuzzy-bg ${className}`}>
          Benzer
        </Badge>
      );
    case 'unmatched':
      return (
        <Badge variant="outline" className={`bg-status-unmatched-bg text-status-unmatched border-status-unmatched/20 hover:bg-status-unmatched-bg ${className}`}>
          Eşleşmedi
        </Badge>
      );
    case 'manual':
      return (
        <Badge variant="outline" className={`bg-status-manual-bg text-status-manual border-status-manual/20 hover:bg-status-manual-bg ${className}`}>
          Manuel
        </Badge>
      );
    default:
      return null;
  }
}
