import {
  ShaderLib,
  MeshStandardMaterial,
  type WebGLRenderer,
  MeshPhysicalMaterial,
  type ShaderLibShader,
} from "three";
import {
  buildFragment,
  buildUniforms,
  THREE_HEX_TILING_DEFINE,
} from "./shaders";
import type { HexTilingParams } from ".";

const DefaultHexTilingParams: HexTilingParams = Object.freeze({
  patchScale: 2,
  useContrastCorrectedBlending: true,
  lookupSkipThreshold: 0.01,
  textureSampleCoefficientExponent: 8,
});

const genRandomStringID = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

const buildOnBeforeCompile = <
  T extends {
    hexTiling: Partial<HexTilingParams>;
    defines: { [key: string]: string };
  }
>(
  shaderMap: Map<string, ShaderLibShader>
) =>
  function (this: T, shader: ShaderLibShader, _renderer: WebGLRenderer) {
    const hexTilingID = genRandomStringID();
    (this as any).hexTilingID = hexTilingID;
    shaderMap.set(hexTilingID, shader);

    if (this.hexTiling && this.hexTiling !== EMPTY_HEX_TILING_PARAMS) {
      this.defines[THREE_HEX_TILING_DEFINE] = "";
    }
  };

const buildCustomProgramCacheKey = <
  T extends { hexTiling: Partial<HexTilingParams> }
>() =>
  function (this: T): string {
    return this.hexTiling && this.hexTiling !== EMPTY_HEX_TILING_PARAMS
      ? "1"
      : "0";
  };

const buildOnBeforeRender = <T extends { hexTiling: Partial<HexTilingParams> }>(
  shaderMap: Map<string, ShaderLibShader>
) =>
  function onBeforeRender(this: T) {
    const shaderRef = shaderMap.get((this as any).hexTilingID);
    if (!shaderRef) {
      return;
    }

    const params = this.hexTiling ?? DefaultHexTilingParams;

    shaderRef.uniforms.hexTilingPatchScale.value =
      params.patchScale ?? DefaultHexTilingParams.patchScale;
    shaderRef.uniforms.hexTilingUseContrastCorrectedBlending.value =
      params.useContrastCorrectedBlending ??
      DefaultHexTilingParams.useContrastCorrectedBlending;
    shaderRef.uniforms.hexTilingLookupSkipThreshold.value =
      params.lookupSkipThreshold ?? DefaultHexTilingParams.lookupSkipThreshold;
    shaderRef.uniforms.hexTilingTextureSampleCoefficientExponent.value =
      params.textureSampleCoefficientExponent ??
      DefaultHexTilingParams.textureSampleCoefficientExponent;
  };

const EMPTY_HEX_TILING_PARAMS = Object.freeze({});

const patchMaterial = (
  MaterialToPatch: typeof MeshStandardMaterial | typeof MeshPhysicalMaterial
) => {
  const shaderMap = new Map<string, ShaderLibShader>();

  MaterialToPatch.prototype.onBeforeCompile = buildOnBeforeCompile(shaderMap);
  MaterialToPatch.prototype.customProgramCacheKey =
    buildCustomProgramCacheKey();

  // internal ID used to match the shader to the material so that the custom uniforms can be updated
  // from the material
  (MaterialToPatch.prototype as any).hexTilingID = "NOT_SET";
  MaterialToPatch.prototype.hexTiling = EMPTY_HEX_TILING_PARAMS;

  (MaterialToPatch.prototype as any).onBeforeRender =
    buildOnBeforeRender(shaderMap);
};

export const patchMeshStandardMaterial = () => {
  const baseFragmentShader = ShaderLib.standard.fragmentShader;
  const fragmentShader = buildFragment(baseFragmentShader);
  ShaderLib.standard.fragmentShader = fragmentShader;

  Object.assign(ShaderLib.standard.uniforms, buildUniforms());

  patchMaterial(MeshStandardMaterial);
};

export const patchMeshPhysicalMaterial = () => {
  const baseFragmentShader = ShaderLib.physical.fragmentShader;
  const fragmentShader = buildFragment(baseFragmentShader);
  ShaderLib.physical.fragmentShader = fragmentShader;

  Object.assign(ShaderLib.physical.uniforms, buildUniforms());

  patchMaterial(MeshPhysicalMaterial);
};
