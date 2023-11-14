import * as THREE from "three";
import tileBreakingNeyretFragment from "../shaders/tileBreakingNeyret.frag";

export const buildFragment = (baseFragmentShader: string) => {
  THREE.ShaderChunk.map_fragment = THREE.ShaderChunk.map_fragment.replace(
    /texture2D\(\s*map\s*,\s*vMapUv\s*\)/g,
    "textureNoTileNeyret(map, vMapUv)"
  );

  THREE.ShaderChunk.normal_fragment_maps =
    THREE.ShaderChunk.normal_fragment_maps.replace(
      /texture2D\(\s*normalMap\s*,\s*vNormalMapUv\s*\)/g,
      "textureNoTileNeyret(normalMap, vNormalMapUv)"
    );

  THREE.ShaderChunk.roughnessmap_fragment =
    THREE.ShaderChunk.roughnessmap_fragment.replace(
      /texture2D\(\s*roughnessMap\s*,\s*vRoughnessMapUv\s*\)/g,
      "textureNoTileNeyret(roughnessMap, vRoughnessMapUv)"
    );

  THREE.ShaderChunk.metalnessmap_fragment =
    THREE.ShaderChunk.metalnessmap_fragment.replace(
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
  // contrast preserving interpolation factor (0. = disabled)
  hexTilingContrastPreservationFactor: {
    value: 0.9,
  },
  // scale factor when converting to hexagonal tiles.  Larger values create smaller tiles.
  hexTilingPatchScale: {
    value: 6,
  },
  // The mix magnitude under which texture lookups will be skipped
  hexTilingLookupSkipThreshold: {
    value: 0.01,
  },
  // The exponent to raise the mix magnitude to before comparing to `hexTilingLookupSkipThreshold`
  hexTilingLookupSkipThresholdExponent: {
    value: 8,
  },
});
