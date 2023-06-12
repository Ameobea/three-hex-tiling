import { MeshPhysicalMaterialParameters, ShaderLib } from "three";
import { buildFragment } from "./meshphysicalhex.glsl";

export interface MeshPhysicalHexMaterialParameters
  extends MeshPhysicalMaterialParameters {
  patchScale?: number;
}

export const patchMeshPhysicalMaterial = () => {
  const baseFragmentShader = ShaderLib.physical.fragmentShader;
  const fragmentShader = buildFragment(baseFragmentShader);
  ShaderLib.physical.fragmentShader = fragmentShader;
};
