export interface Currency {
  code?: string;
}

export interface ApprovalChainLevel {
  id: number;
  position_index?: number;
  label?: string;
  role?: {
    id?: number;
    name?: string;
  };
  can_override?: boolean;
  can_finalize?: boolean;
}

export interface ProjectClaimApproval {
  id?: number;
  approval_chain_level_id?: number;
  status?: 'approved' | 'on hold' | 'rejected' | 'returned';
  is_final?: boolean;
  remarks?: string | null;
  approval_date?: string | null;
  creator?: {
    id?: number;
    name?: string;
    email?: string;
    phone?: string;
  };
  approval_chain_level?: ApprovalChainLevel;
}

export interface ProjectClaimApprovalChain {
  id?: number;
  process_type?: string;
  levels?: ApprovalChainLevel[];
}

export interface ProjectClaim {
  id: number;
  claim_date?: string;
  claimNo?: string;
  remarks?: string;
  amount?: number;
  vat_percentage?: number | null;
  vat_amount?: number | null;
  total_amount?: number | null;
  currency?: Currency;
  status?: 'draft' | 'in_review' | 'rejected' | 'approved' | 'invoiced' | 'returned';
  // Backend-computed — "Waiting for {Role}" while under a pending approval
  // level, same convention as LeaveRequest.status_label.
  status_label?: string;
  invoice_date?: string | null;
  // The real Customer Invoice generated for this claim (organizations that generate invoices for IPCs).
  // due_date/customer_reference/terms_and_instructions are only populated on the single-claim detail
  // endpoint (show()), for prefilling the edit form — list endpoints only return id/invoiceNo.
  customer_invoice?: {
    id: number;
    invoiceNo: string;
    due_date?: string | null;
    customer_reference?: string | null;
    terms_and_instructions?: string | null;
  } | null;
  approval_chain_id?: number | null;
  approval_chain?: ProjectClaimApprovalChain | null;
  approvals?: ProjectClaimApproval[];
  // Present on the org-wide "Approved Project Payment Claims" list
  // (project-payment-claims org-wide endpoint) — not on the project-scoped list.
  project_id?: number | string;
  project?: { id?: number | string; name?: string } | null;
  client?: { id?: number | string; name?: string } | null;
}
