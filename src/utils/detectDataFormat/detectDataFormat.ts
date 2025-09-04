import type { DataFormat } from "../../types/DataFormat";
import { allScripts } from "../../helpers/scripts";
import { detectFromScripts } from "./detectFromScript";

export const detectDataFormat = (fullScan = false): DataFormat => {
  return detectFromScripts(allScripts(), { fullScan });
};

export const fullDetectDataFormat = (): DataFormat => detectDataFormat(true);
