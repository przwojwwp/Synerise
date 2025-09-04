export function extractNameFromLDJSON(): string | null {
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>(
      'script[type^="application/ld+json"]'
    )
  );

  for (const s of scripts) {
    try {
      const txt = s.textContent?.trim();
      if (!txt) continue;

      const data = JSON.parse(txt);
      const roots = Array.isArray(data) ? data : [data];

      for (const root of roots) {
        const nodes = Array.isArray(root?.["@graph"]) ? root["@graph"] : [root];

        for (const node of nodes) {
          const types = (
            Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]]
          )
            .filter(Boolean)
            .map(String);
          if (!types.some((t) => t.toLowerCase() === "product")) continue;

          const candidate =
            (typeof node?.name === "string" && node.name) ||
            (typeof node?.headline === "string" && node.headline) ||
            (typeof node?.offers?.name === "string" && node.offers.name);

          if (candidate) return candidate;
        }
      }
    } catch {}
  }
  return null;
}
