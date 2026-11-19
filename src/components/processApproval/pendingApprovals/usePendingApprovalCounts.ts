'use client';

import axios from '@/lib/services/config';
import { useQuery } from '@tanstack/react-query';

export type PendingApprovalCounts = {
  requisitions: number;
  retirements: number;
  leave_requests: number;
  loan_requests: number;
  payroll_runs: number;
};

type PendingApprovalResponse = {
  counts: PendingApprovalCounts;
  total: number;
};

export const PENDING_APPROVALS_KEY = ['pending-approval-counts'];

const EMPTY: PendingApprovalResponse = {
  counts: { requisitions: 0, retirements: 0, leave_requests: 0, loan_requests: 0, payroll_runs: 0 },
  total: 0,
};

/**
 * Records waiting on the signed-in user's approval, per type. Shared by the
 * Process Approval sidebar counters and the notification bell total (same
 * query key, so one request serves both).
 */
export const usePendingApprovalCounts = (enabled = true) => {
  const { data } = useQuery({
    queryKey: PENDING_APPROVALS_KEY,
    queryFn: async (): Promise<PendingApprovalResponse> => {
      const { data } = await axios.get('/api/pending-approvals/counts');
      return data ?? EMPTY;
    },
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return data ?? EMPTY;
};
