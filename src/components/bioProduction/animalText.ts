/**
 * Fills a screen string's {animals} / {Animals} with what a species is counted as ("fish", "birds"),
 * so the same screens read naturally for fish farming and poultry.
 */
export const animalText = (text: string, label?: string | null) => {
  const word = (label || 'fish').toLowerCase();

  return text.replaceAll('{animals}', word).replaceAll('{Animals}', word.charAt(0).toUpperCase() + word.slice(1));
};
