// Inventory and asset lines are received into a store, so received is a quantity.
// Services and non-inventory lines never are: they are fulfilled by billing, so
// "received" there is the amount billed and there is no received quantity.
export const manifestAmounts = (item: any) => {
  const billed = item.fulfilment === 'billed';
  const ordered = item.quantity_ordered || 0;
  const received = item.quantity_received || 0;
  const rate = item.rate || 0;
  const itemAmount = ordered * rate;
  const receivedAmt = billed ? item.billed_amount || 0 : received * rate;
  return {
    billed,
    itemAmount,
    receivedAmt,
    pendingAmt: itemAmount - receivedAmt,
    qtyPending: Math.max(ordered - received, 0),
  };
};

export const isFullyFulfilled = (status?: string | null) =>
  ['fully received', 'fully billed'].includes((status || '').toLowerCase());
