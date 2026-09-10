/**
 * Spintax Parser Utility
 * Mendukung format {opsi1|opsi2|opsi3} dan nested spintax {Halo {Kak|Gan}|Hai}
 * serta penggantian variabel {{name}}, {{order_id}}, dll.
 */

export function parseSpintax(
  template: string,
  variables: Record<string, string | number> = {},
  options: { cleanUnresolved?: boolean } = { cleanUnresolved: true }
): string {
  if (!template) return "";

  let result = template;

  // 1. Variabel kontekstual bawaan sistem
  const now = new Date();
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("id-ID", { dateStyle: "medium" });
  const yearStr = String(now.getFullYear());

  const mergedVariables: Record<string, string | number> = {
    date: dateStr,
    tanggal: dateStr,
    time: timeStr,
    jam: timeStr,
    year: yearStr,
    tahun: yearStr,
    ...variables,
  };

  // 2. Ganti variabel dinamis {{key}} atau {key}
  for (const [key, value] of Object.entries(mergedVariables)) {
    const regexDouble = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    const regexSingle = new RegExp(`\\{${key}\\}`, "gi");
    result = result.replace(regexDouble, String(value ?? ""));
    result = result.replace(regexSingle, String(value ?? ""));
  }

  // 3. Parser Spintax: mencari pola {pilihan1|pilihan2|...}
  const spintaxRegex = /\{([^{}]*\|[^{}]*)\}/;
  let maxLoop = 30;

  while (maxLoop > 0 && spintaxRegex.test(result)) {
    result = result.replace(spintaxRegex, (_, choicesStr) => {
      const choices = choicesStr.split("|");
      const randomIndex = Math.floor(Math.random() * choices.length);
      return choices[randomIndex] ?? "";
    });
    maxLoop--;
  }

  // 4. Bersihkan sisa placeholder {{unknown_var}}
  if (options.cleanUnresolved) {
    result = result.replace(/\{\{\s*[\w.-]+\s*\}\}/g, "");
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
