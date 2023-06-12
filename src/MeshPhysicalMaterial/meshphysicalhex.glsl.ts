import * as THREE from "three";
import tileBreakingNeyretFragment from "../shaders/tileBreakingNeyret.frag";

export const buildFragment = (
  baseFragmentShader: string,
  patchScale?: number
) => {
  const tileBreakFrag = tileBreakingNeyretFragment.replace(
    "#define Z 8.",
    `#define Z ${(patchScale ?? 16).toFixed(4)}`
  );

  const customMapFragment = `
  #ifdef USE_MAP
    diffuseColor *= textureNoTileNeyret(map, vMapUv);
  #endif
`;

  const customNormalMapFragment =
    THREE.ShaderChunk.normal_fragment_maps.replace(
      /texture2D\(\s*normalMap\s*,\s*vNormalMapUv\s*\)/g,
      "textureNoTileNeyret(normalMap, vNormalMapUv)"
    );
  console.log({ customNormalMapFragment });

  let fragment = baseFragmentShader;
  fragment = fragment.replace(
    "void main() {",
    `
${tileBreakFrag}

void main() {
`
  );
  fragment = fragment.replace(
    "#include <normal_fragment_maps>",
    customNormalMapFragment
  );

  return fragment.replace("#include <map_fragment>", customMapFragment);
};
