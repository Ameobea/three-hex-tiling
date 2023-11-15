/// <reference types="vite-plugin-glsl/ext" />

import {
  patchMeshPhysicalMaterial,
  patchMeshStandardMaterial,
} from "./materials";
export { type HexTilingParams } from "./materials";

patchMeshPhysicalMaterial();
patchMeshStandardMaterial();
