import { useState, useEffect, useCallback } from 'react';
import { proposalApi, ProposalFilters, ApiResponse } from '@/lib/api';
import { Proposal } from '@/types';
import { useUIStore } from '@/stores/useUIStore';

interface UseProposalsOptions {
  filters?: ProposalFilters;
  enabled?: boolean;
  refetchInterval?: number;
}

interface UseProposalsReturn {
  proposals: Proposal[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export const useProposals = (
  options: UseProposalsOptions = {}
): UseProposalsReturn => {
  const { filters = {}, enabled = true, refetchInterval } = options;

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(filters.page || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const { showErrorToast } = useUIStore();

  const fetchProposals = useCallback(
    async (page: number = 1, append: boolean = false) => {
      if (!enabled) return;

      setLoading(true);
      setError(null);

      try {
        const response: ApiResponse<Proposal[]> =
          await proposalApi.getProposals({
            ...filters,
            page,
          });

        if (response.success && response.data) {
          if (append) {
            setProposals(prev => [...prev, ...response.data!]);
          } else {
            setProposals(response.data);
          }

          if (response.pagination) {
            setTotalCount(response.pagination.total);
            setCurrentPage(response.pagination.page);
            setTotalPages(response.pagination.totalPages);
            setHasMore(
              response.pagination.page < response.pagination.totalPages
            );
          }
        } else {
          throw new Error(response.error || 'Failed to fetch proposals');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch proposals';
        setError(errorMessage);
        showErrorToast('Error', errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [filters, enabled, showErrorToast]
  );

  const refetch = useCallback(async () => {
    await fetchProposals(1, false);
  }, [fetchProposals]);

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await fetchProposals(currentPage + 1, true);
    }
  }, [fetchProposals, hasMore, loading, currentPage]);

  // Initial fetch
  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Auto-refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      refetch();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetch, refetchInterval, enabled]);

  return {
    proposals,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    refetch,
    loadMore,
    hasMore,
  };
};
