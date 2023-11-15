import {
  type MeshPhysicalMaterialParameters,
  ShaderLib,
  MeshStandardMaterial,
  type Shader,
  type WebGLRenderer,
  MeshPhysicalMaterial,
} from "three";
import {
  buildFragment,
  buildUniforms,
  THREE_HEX_TILING_DEFINE,
} from "./shaders";

export interface HexTilingParams {
  /**
   * Scale factor for the hexagonal tiles used to break up the texture.  This is the most important
   * parameter for controlling the look of the hex tiling and likely needs to be adjusted for each
   * texture.
   *
   * Should be greater than zero and usually somewhere between 0.1 and 16, but the optimal
   * value depends on the texture and the desired effect.
   *
   * Larger values create smaller hexagonal tiles and break up the texture more.
   *
   * **Default**: 2
   */
  patchScale: number;
  /**
   * If set to true, contrast-corrected blending will be used to blend between the texture samples.  This
   * greatly improves the quality of the blending for most textures, but can sometimes create very bright
   * or very dark patches if the texture has a lot of contrast.
   *
   * See https://www.shadertoy.com/view/4dcSDr for a demo of the effect.
   *
   * **Default**: `true`
   */
  useContrastCorrectedBlending: boolean;
  /**
   * The magnitude under which texture lookups will be skipped.
   *
   * You probably don't need to change this.
   *
   * **Default**: 0.01
   *
   * ### Details
   *
   * The hex tiling shader mixes between up to three texture samples per fragment.  As an optimization,
   * if the magnitude of one particular mix is below this threshold, the texture lookup will be skipped to
   * reduce GPU memory bandwidth usage.
   *
   * If the final coefficient of a texture sample is less than `lookupSkipThreshold`, the texture lookup will
   * be skipped.
   */
  lookupSkipThreshold: number;
  /**
   * The exponent to which texture sample coefficients are raised before comparing to `lookupSkipThreshold`.
   *
   * Higher values make the shader more efficient but can make the borders between hexagonal tiles more visible.
   *
   * Lower values make the shader less efficient and can cause detail to get washed out and make the texture
   * look blurry and homogenized.
   *
   * The default value works pretty well for most textures; you likely don't need to change this.
   *
   * **Default**: 8
   *
   * ### Details
   *
   * The hex tiling shader mixes between up to three texture samples per fragment.  By raising the coefficients
   * to a power, it's possible to make the threshold for skipping a texture lookup more or less steep.  Exponents
   * greater than 1 make the threshold steeper, exponents less than 1 make the threshold less steep.
   *
   * Higher exponents, when combined with `lookupSkipThreshold`, can be used to make the hex tiling shader
   * more efficient by skipping some texture lookups and reducing GPU memory bandwidth usage.
   */
  textureSampleCoefficientExponent: number;
}

const DefaultHexTilingParams: HexTilingParams = Object.freeze({
  patchScale: 2,
  useContrastCorrectedBlending: true,
  lookupSkipThreshold: 0.01,
  textureSampleCoefficientExponent: 8,
});

declare module "three" {
  export interface MeshStandardMaterial {
    /**
     * Parameters for controlling the hex tiling from `three-hex-tiling`.
     *
     * If this parameter is not set, hex tiling will not be applied.
     *
     * This parameter cannot be changed after the material is created.
     */
    hexTiling?: Partial<HexTilingParams>;
  }

  export interface MeshPhysicalMaterialParameters {
    /**
     * Parameters for controlling the hex tiling from `three-hex-tiling`.
     *
     * If this parameter is not set, hex tiling will not be applied.
     *
     * This parameter cannot be changed after the material is created.
     */
    hexTiling?: Partial<HexTilingParams>;
  }
}

export interface MeshPhysicalHexMaterialParameters
  extends MeshPhysicalMaterialParameters {
  patchScale?: number;
}

const genRandomStringID = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

const buildOnBeforeCompile = <
  T extends {
    hexTiling: Partial<HexTilingParams>;
    defines: { [key: string]: string };
  }
>(
  shaderMap: Map<string, Shader>
) =>
  function (this: T, shader: Shader, _renderer: WebGLRenderer) {
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
  shaderMap: Map<string, Shader>
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
  const shaderMap = new Map<string, Shader>();

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
