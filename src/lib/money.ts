/** All prices in the app are in Canadian dollars. */
export const CURRENCY = "CAD";

function formatter(fractionDigits: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: CURRENCY,
    currencyDisplay: "code", // "CAD 1,000" rather than "$1,000", so the currency is explicit
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

const whole = formatter(0);
const cents = formatter(2);

/** e.g. 1000 -> "CAD 1,000" and 12.5 -> "CAD 12.50" */
export function formatPrice(amount: number) {
  return (Number.isInteger(amount) ? whole : cents).format(amount);
}
