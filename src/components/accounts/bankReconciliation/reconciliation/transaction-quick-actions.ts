import paymentServices from '@/components/accounts/transactions/payments/payment-services';
import receiptServices from '@/components/accounts/transactions/receipts/receipt-services';
import fundTransferServices from '@/components/accounts/transactions/tranfers/fund-transfer-services';
import journalServices from '@/components/accounts/transactions/journals/journal-services';
import { PERMISSIONS } from '@/utilities/constants/permissions';

/**
 * Lets an unmatched book entry be dealt with right from the reconciliation
 * screen — cancelled or deleted — instead of making someone go find it in
 * the Payments/Receipts/Fund Transfers/Journal Vouchers list first. Keyed by
 * journals.journalable_type exactly as the backend serializes it, so a
 * journal's own record tells the row which service/permissions apply.
 */
export interface TransactionQuickActions {
  label: string;
  cancel: (id: number, payload: { reason: string; cancellation_date: string | undefined }) => Promise<any>;
  delete: (id: number) => Promise<any>;
  cancelPermissions: string[];
  deletePermissions: string[];
}

const QUICK_ACTIONS: Record<string, TransactionQuickActions> = {
  'App\\Models\\Accounts\\Transactions\\Payment': {
    label: 'Payment',
    cancel: (id, payload) => paymentServices.cancel({ id }, payload),
    delete: (id) => paymentServices.delete({ id }),
    cancelPermissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL, PERMISSIONS.PAYMENTS_CANCEL],
    deletePermissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE, PERMISSIONS.PAYMENTS_DELETE],
  },
  'App\\Models\\Accounts\\Transactions\\Receipt': {
    label: 'Receipt',
    cancel: (id, payload) => receiptServices.cancel({ id }, payload),
    delete: (id) => receiptServices.delete({ id }),
    cancelPermissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL, PERMISSIONS.RECEIPTS_CANCEL],
    deletePermissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE, PERMISSIONS.RECEIPTS_DELETE],
  },
  'App\\Models\\Accounts\\Transactions\\FundTransfer': {
    label: 'Fund Transfer',
    cancel: (id, payload) => fundTransferServices.cancel({ id }, payload),
    delete: (id) => fundTransferServices.delete({ id }),
    cancelPermissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL, PERMISSIONS.FUND_TRANSFERS_CANCEL],
    deletePermissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE, PERMISSIONS.FUND_TRANSFERS_DELETE],
  },
  'App\\Models\\Accounts\\Transactions\\JournalVoucher': {
    label: 'Journal Voucher',
    cancel: (id, payload) => journalServices.cancel({ id }, payload),
    delete: (id) => journalServices.delete({ id }),
    cancelPermissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL, PERMISSIONS.JOURNAL_VOUCHERS_CANCEL],
    deletePermissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE, PERMISSIONS.JOURNAL_VOUCHERS_DELETE],
  },
};

export const quickActionsFor = (journalableType?: string | null): TransactionQuickActions | null =>
  (journalableType && QUICK_ACTIONS[journalableType]) || null;
