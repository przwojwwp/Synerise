import type { DataFormat } from "@/types/DataFormat";
import { detectFromScripts } from "./detectFromScript";
import { allScripts } from "@/lib/web/scripts";

export const detectDataFormat = (fullScan = false): DataFormat => {
  return detectFromScripts(allScripts(), { fullScan });
};

export const fullDetectDataFormat = (): DataFormat => detectDataFormat(true);
