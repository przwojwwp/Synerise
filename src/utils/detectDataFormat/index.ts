import { detectFromScripts } from "./parseScript";
import type { DataFormat } from "../../types/DataFormat";

export const detectDataFormat = (): DataFormat => {
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>("script")
  );
  return detectFromScripts(scripts, { fullScan: false });
};

export const fullDetectDataFormat = (): DataFormat => {
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>("script")
  );
  return detectFromScripts(scripts, { fullScan: true });
};
