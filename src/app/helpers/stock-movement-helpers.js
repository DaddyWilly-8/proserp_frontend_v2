// Movement columns that can be hidden when they hold nothing. Opening and
// closing balances always stay, they anchor the report.
const OPTIONAL_MOVEMENT_FIELDS = {
  purchaseReceived: 'quantity_received',
  produced: 'quantity_produced',
  transferIn: 'quantity_transferred_in',
  transferOut: 'quantity_transferred_out',
  stockGain: 'stock_gain',
  stockLoss: 'stock_loss',
  consumed: 'quantity_consumed',
  sold: 'quantity_sold',
};

export const getEmptyMovementKeys = (movements) =>
  new Set(
    Object.entries(OPTIONAL_MOVEMENT_FIELDS)
      .filter(([, field]) =>
        (movements || []).every(
          (movement) => !parseFloat(movement[field] || 0)
        )
      )
      .map(([key]) => key)
  );
