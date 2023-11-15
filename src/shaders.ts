import * as THREE from "three";
import tileBreakingNeyretFragment from "./shaders/tileBreakingNeyret.frag";

export const THREE_HEX_TILING_DEFINE = "USE_THREE_HEX_TILING";

const buildConditionalReplacer = (
  haystack: string,
  regex: RegExp,
  replacement: string
): string => {
  const match = haystack.match(regex);
  if (!match) {
    return haystack;
  }

  const updatedMatch = `
#ifdef ${THREE_HEX_TILING_DEFINE}
${replacement}
#else
${match[0]}
#endif
`;

  return haystack.replace(regex, updatedMatch);
};

export const buildFragment = (baseFragmentShader: string) => {
  THREE.ShaderChunk.map_fragment = buildConditionalReplacer(
    THREE.ShaderChunk.map_fragment,
    /texture2D\(\s*map\s*,\s*vMapUv\s*\)/g,
    "textureNoTileNeyret(map, vMapUv)"
  );

  THREE.ShaderChunk.normal_fragment_maps = buildConditionalReplacer(
    THREE.ShaderChunk.normal_fragment_maps,
    /texture2D\(\s*normalMap\s*,\s*vNormalMapUv\s*\)/g,
    "textureNoTileNeyret(normalMap, vNormalMapUv)"
  );

  THREE.ShaderChunk.roughnessmap_fragment = buildConditionalReplacer(
    THREE.ShaderChunk.roughnessmap_fragment,
    /texture2D\(\s*roughnessMap\s*,\s*vRoughnessMapUv\s*\)/g,
    "textureNoTileNeyret(roughnessMap, vRoughnessMapUv)"
  );

  THREE.ShaderChunk.metalnessmap_fragment = buildConditionalReplacer(
    THREE.ShaderChunk.metalnessmap_fragment,
    /texture2D\(\s*metalnessMap\s*,\s*vMetalnessMapUv\s*\)/g,
    "textureNoTileNeyret(metalnessMap, vMetalnessMapUv)"
  );

  (THREE.ShaderChunk as any).tilebreaking_pars_fragment =
    tileBreakingNeyretFragment;

  let fragment = baseFragmentShader;
  fragment = fragment.replace(
    "void main() {",
    `
#include <tilebreaking_pars_fragment>

void main() {
`
  );

  return fragment;
};

export const buildUniforms = () => ({
  hexTilingUseContrastCorrectedBlending: { value: true },
  hexTilingPatchScale: { value: 6 },
  hexTilingLookupSkipThreshold: { value: 0.01 },
  hexTilingTextureSampleCoefficientExponent: { value: 8 },
});
