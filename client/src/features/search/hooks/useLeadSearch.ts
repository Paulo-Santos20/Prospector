import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  searchLeadsStream,
  DEFAULT_PROVIDER,
  type Lead,
  type SearchResponse,
  type SearchStreamEvent,
} from '../services/searchService';

const EMPTY_SEARCH: SearchResponse = { count: 0, leads: [] };

export const useLeadSearch = (
  niche: string,
  location: string,
  provider: string = DEFAULT_PROVIDER
) => {
  const queryClient = useQueryClient();
  const queryKey = ['leads', niche, location, provider] as const;

  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      let snapshot = EMPTY_SEARCH;

      const update = (next: SearchResponse) => {
        snapshot = next;
        queryClient.setQueryData(queryKey, snapshot);
      };

      await searchLeadsStream(
        niche,
        location,
        provider,
        (event: SearchStreamEvent) => {
          if (event.type === 'INIT') {
            update({ count: event.total, leads: event.leads });
          }

          if (event.type === 'UPDATE') {
            const exists = snapshot.leads.some((lead) => lead.id === event.lead.id);
            const leads: Lead[] = exists
              ? snapshot.leads.map((lead) => (lead.id === event.lead.id ? event.lead : lead))
              : [...snapshot.leads, event.lead];

            update({ ...snapshot, leads });
          }
        },
        signal
      );

      return snapshot;
    },
    enabled: !!niche && !!location,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};
