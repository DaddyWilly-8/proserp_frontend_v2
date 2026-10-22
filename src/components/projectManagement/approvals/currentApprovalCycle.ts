interface CycleApproval {
  status?: string;
  is_superseded?: boolean;
}

/**
 * The approvals that "what happens next" logic should read. A superseded return-to-requester
 * marks the end of a review cycle - the requester edited and resubmitted, so that return and
 * everything before it belong to a cycle that no longer counts (they stay in the history table).
 * The current cycle starts fresh right after the last such return. Mirrors the backend's
 * getLatestApprovalAttribute() on ProjectPaymentClaim / ProjectSubcontractCertificate.
 */
export const getCurrentApprovalCycle = <T extends CycleApproval>(
  approvals: T[] | undefined
): T[] => {
  const all = approvals || [];

  let lastResetIndex = -1;
  all.forEach((approval, index) => {
    if (String(approval.status || '').toLowerCase() === 'returned' && approval.is_superseded) {
      lastResetIndex = index;
    }
  });

  return all.slice(lastResetIndex + 1);
};

/** The most recent approval in the current review cycle, if any. */
export const getLatestCurrentApproval = <T extends CycleApproval>(
  approvals: T[] | undefined
): T | undefined => {
  const cycle = getCurrentApprovalCycle(approvals);

  return cycle[cycle.length - 1];
};
