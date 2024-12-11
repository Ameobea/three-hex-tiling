/// <reference types="vite-plugin-glsl/ext" />

import {
  patchMeshPhysicalMaterial,
  patchMeshStandardMaterial,
} from "./materials";

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

declare module "three" {
  export interface MeshStandardMaterialParameters {
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

patchMeshPhysicalMaterial();
patchMeshStandardMaterial();
