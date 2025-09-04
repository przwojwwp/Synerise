import { fullDetectDataFormat } from "../utils/detectDataFormat";

export const getProductName = (): string | null => {
  const format = fullDetectDataFormat();

  if (format === "ld+json" || format === "both") {
    const scripts = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    );

    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent?.trim() || "{}");
        const nodes = Array.isArray(data) ? data : [data];

        for (const node of nodes) {
          const types = Array.isArray(node?.["@type"])
            ? node["@type"]
            : [node?.["@type"]];
          if (types?.includes("Product") && node?.name) {
            return String(node.name).trim();
          }
        }
      } catch {}
    }
  }

  return `no suitable format found`;
};
