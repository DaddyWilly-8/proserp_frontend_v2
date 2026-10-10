/**
 * Resolves whether the unit actually selected for a line item - falling back
 * to the product's primary unit when no override was picked - allows a
 * fractional quantity. Defaults true when unknown, matching the backend
 * column's own default, so this never blocks anything until a unit is
 * explicitly marked otherwise.
 *
 * `product` is expected in the shared product-select shape (useProductsSelect):
 * { primary_unit: { id, allows_fractional, ... }, secondary_units: [{ id, allows_fractional, ... }] }
 */
export function unitAllowsFractional(product, measurementUnitId) {
    if (!product) return true;
    const unit = measurementUnitId
        ? (product.secondary_units || []).concat(product.primary_unit).find(u => u?.id === measurementUnitId)
        : product.primary_unit;
    return unit?.allows_fractional !== false;
}

export const wholeUnitQuantityTest = {
    name: 'whole-unit',
    message: 'This product is sold in whole units — quantity cannot be a fraction',
    test: function (value) {
        const product = this.parent.product;
        const measurementUnitId = this.parent.measurement_unit_id;
        return unitAllowsFractional(product, measurementUnitId) || !value || Number.isInteger(value);
    },
};
