/**
 * Spintax Parser Utility
 * Mendukung format {opsi1|opsi2|opsi3} dan nested spintax {Halo {Kak|Gan}|Hai}
 * serta penggantian variabel {{name}}, {{order_id}}, dll.
 */

export function parseSpintax(
  template: string,
  variables: Record<string, string | number> = {}
): string {
  if (!template) return "";

  let result = template;

  // 1. Ganti variabel dinamis {{key}} atau {key} jika ada di dict variables
  for (const [key, value] of Object.entries(variables)) {
    const regexDouble = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    const regexSingle = new RegExp(`\\{${key}\\}`, "gi");
    result = result.replace(regexDouble, String(value));
    result = result.replace(regexSingle, String(value));
  }

  // 2. Parser Spintax rekursif: mencari pola {pilihan1|pilihan2|pilihan3} yang paling dalam (innermost)
  const spintaxRegex = /\{([^{}]+)\}/;

  while (spintaxRegex.test(result)) {
    result = result.replace(spintaxRegex, (match, choicesStr) => {
      // Jika tidak ada separator pipe |, biarkan teks aslinya
      if (!choicesStr.includes("|")) {
        return match;
      }

      const choices = choicesStr.split("|");
      const randomIndex = Math.floor(Math.random() * choices.length);
      return choices[randomIndex];
    });
  }

  return result;
}

/**
 * Menghasilkan beberapa sampel variasi pesan dari template spintax
 */
export function generateSpintaxSamples(
  template: string,
  variables: Record<string, string | number> = {},
  sampleCount = 3
): string[] {
  const samples = new Set<string>();
  const maxAttempts = sampleCount * 5;
  let attempts = 0;

  while (samples.size < sampleCount && attempts < maxAttempts) {
    samples.add(parseSpintax(template, variables));
    attempts++;
  }

  return Array.from(samples);
}
