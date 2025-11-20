/**
 * formatFor20x2(line1, line2)
 * - Truncates or pads each line to 20 characters.
 * - Returns [line1, line2]
 */
export function formatFor20x2(line1 = "", line2 = "") {
  const max = 20;
  const padOrTrunc = (s) => {
    s = String(s || "");
    if (s.length > max) return s.slice(0, max);
    return s.padEnd(max, " ");
  };
  return [padOrTrunc(line1), padOrTrunc(line2)];
}
