# `three-hex-tiling`
[![npm version](https://img.shields.io/npm/v/three-hex-tiling.svg?style=flat-square)](https://www.npmjs.com/package/three-hex-tiling)
[![twitter](https://flat.badgen.net/badge/twitter/@ameobea10/?icon&label)](https://twitter.com/ameobea10)

Extends built-in Three.JS materials to support infinite, non-repeating, seamless texture tiling.

![Screenshot showing comparison between a repeating seamless rock texture with and without three-hex-tiling.  The image is divided in half horizontally by a gray bar.  The left side is labeled "baseline" and shows a gray rock-like texture that clearly repeats, resulting in an artifical grid-like pattern.  The right side has the same rock texture but without any visible tiling and is labeled three-hex-tiling.](https://i.ameo.link/bpu.jpg)

Live interactive demo: <https://three-hex-tiling.ameo.design/>

## Installation

`npm install three-hex-tiling`

Then, to enable it, just add this to your project as early as possible:

```ts
import 'three-hex-tiling';
```

This import will patch Three.JS's shaders and materials to support the hex tiling algorithm and it will extend the types for the patched materials with parameters to control it.

### Three.JS Version Support

This library has been tested with Three.JS versions `0.151` through `0.173`.  Although it may work with other versions, support is not guaranteed.

## Usage

After adding the `three-hex-tiling` import at the top of your project, a new `hexTiling` parameter is added to the parameters of supported materials.  If your project uses TypeScript, these should be included in the types you see when creating those materials.

By setting the `hexTiling` property when creating a material, hex tiling will be enabled for that material.  It is disabled by default.

```ts
const mat = new THREE.MeshStandardMaterial({
  map: myTexture,
  normalMap: myTextureNormalMap,
  roughnessMap: myTextureRoughnessMap,
  hexTiling: {
    // default values shown
    patchScale: 2,
    useContrastCorrectedBlending: true,
    lookupSkipThreshold: 0.01,
    textureSampleCoefficientExponent: 8,
  }
});
```

Hex tiling cannot be enabled or disabled after a material is created, but the values of individual parameters can be changed dynamically:

```ts
mat.hexTiling.patchScale = newPatchScale;
```

### Texture Scaling

When enabling hex tiling for a material, you may find that your textures need a scale adjustment to look optimal.  This can be done using built-in Three.JS texture scaling support:

```ts
myTexture.scale.set(1.5, 1.5);
myTextureNormalMap.scale.set(1.5, 1.5);
myTextureRoughnessMap.scale.set(1.5, 1.5);

myTexture.needsUpdate = true;
myTextureNormalMap.needsUpdate = true;
myTextureRoughnessMap.needsUpdate = true;
```

### Supported Textures

Textures used with `three-hex-tiling` must be seamless - meaning that there are no sharp cutoffs when the texture is tiled.  There's a good chance your textures are seamless already and if they aren't, it will be obvious.

### Supported Materials

The following materials are currently supported for use with `three-hex-tiling`:

 * `MeshStandardMaterial`
 * `MeshPhysicalMaterial`

You can still use all of the other materials that Three.JS provides, but they will not have support for hex tiling.

### Supported Maps

In addition to the base texture/color of a material provided in the `map` property, `three-hex-tiling` supports with the following maps:

 * `normalMap`
 * `roughnessMap`
 * `metalnessMap`

## Config Options

`three-hex-tiling` accepts the following configuration properties in the `hexTiling` object:

### `patchScale: number`

- **Description**: Scale factor for the hexagonal tiles used to break up the texture. This parameter is crucial in controlling the hex tiling's appearance and requires adjustment for each texture.
- **Default**: `2`
- **Range**: `[0, Infinity]`, typically between 0.1 and 8. Optimal values depend on the texture and desired effect.
- **Behavior**: Larger values create smaller hexagonal tiles, resulting in more texture breakup.

| ![Screenshot of a black and red lava-like texture with three-hex-tiling applied with a patch scale of 1](https://i.ameo.link/bp2.jpg) | ![Screenshot of a black and red lava-like texture with three-hex-tiling applied with a patch scale of 2](https://i.ameo.link/bp3.jpg) | ![Screenshot of a black and red lava-like texture with three-hex-tiling applied with a patch scale of 6](https://i.ameo.link/bp5.jpg) |
|----------------------------------|----------------------------------|----------------------------------|
| Patch Scale: 1                   | Patch Scale: 2                   | Patch Scale: 6                   |

### `useContrastCorrectedBlending: boolean`

- **Description**: Determines if contrast-corrected blending is used for texture samples. This method often enhances blending quality but might result in overly bright or dark patches in high-contrast textures.
- **Default**: `true`
- **Reference**: [ShaderToy Demo](https://www.shadertoy.com/view/4dcSDr)

| ![Screenshot of a rocky/mineral-like texture with three-hex-tiling applied and contrast-corrected blending enabled](https://i.ameo.link/bp8.jpg)     | ![Screenshot of a rocky/mineral-like texture with three-hex-tiling applied and contrast-corrected blending disabled](https://i.ameo.link/bp9.jpg)      |
|--------------------------------------|---------------------------------------|
| Contrast-Corrected Blending: Enabled | Contrast-Corrected Blending: Disabled |

### `lookupSkipThreshold: number`

- **Description**: The minimum magnitude below which texture lookups are skipped, mainly for optimization purposes.
- **Default**: `0.01`
- **Range**: `[0, 1]` (but you'll probably always want to keep it <0.1)
- **Advice**: Usually doesn't require modification.
- **Details**: The shader mixes up to three texture samples per fragment. Texture lookups with a final coefficient less than this threshold are skipped to reduce GPU memory bandwidth usage.

### `textureSampleCoefficientExponent: number`

- **Description**: The exponent for texture sample coefficients before comparison with `lookupSkipThreshold`. Adjusting this value affects shader efficiency and the visibility of hexagonal tile borders.
- **Default**: `8`
- **Range**: `(0, 64]`
- **Advice**: The default value is suitable for most textures. Modification is usually unnecessary.
- **Details**: Coefficients raised to this exponent modify the steepness of the threshold for skipping texture lookups. Higher exponents increase efficiency by reducing texture lookups, potentially making the shader more efficient.

| ![Screenshot of a gray rock-like texture with three-hex-tiling applied with a texture sample coefficient exponent of 1](https://i.ameo.link/bpi.jpg) | ![Screenshot of a gray rock-like texture with three-hex-tiling applied with a texture sample coefficient exponent of 2](https://i.ameo.link/bph.jpg) | ![Screenshot of a gray rock-like texture with three-hex-tiling applied with a texture sample coefficient exponent of 8](https://i.ameo.link/bpg.jpg) |
|----------------------------------|----------------------------------|----------------------------------|
| Texture Sample Coefficient Exponent: 1    | Texture Sample Coefficient Exponent: 2    | Texture Sample Coefficient Exponent: 8    |

## Performance

The hex tiling shader used by this library needs to make up to 3 texture fetches per map per fragment in order to function.

Usually, this is fine and doesn't result in any noticeable performance hit.  But in some situations, hex tiling can create a significant amount of texture bandwidth usage on the GPU and impact performance on weaker devices.

### Optimizing Performance

There are some ways to tune `three-hex-tiling` to lessen its performance impact:

 * Increase `textureSampleCoefficientExponent` and/or `lookupSkipThreshold`
   * This directly reduces the average number of texture samples made per fragment, but it can make the borders between hex tiles more obvious.
 * Use a [depth pre-pass](https://cprimozic.net/blog/threejs-depth-pre-pass-optimization/) to your scene to reduce the number of calls to the fragment shader.
   * For some scenes, especially those with high overdraw, this can be a big win
 * Reduce the number of maps used by your material
 * Reduce the size of textures used or use [compressed textures](https://threejs.org/docs/#api/en/textures/CompressedTexture)

## Implementation Details

The hex tiling shader itself is adapted from [a Shadertoy](https://www.shadertoy.com/view/MdyfDV) by [Fabrice Neyret](http://evasion.imag.fr/Membres/Fabrice.Neyret/).

`three-hex-tiling` works by modifying Three.JS's shaders directly, patching in the hex tiling algorithm and conditionally enabling it for materials that opt in.  Materials that do not explicitly set `hexTiling` will work normally.

In addition to patching the shaders, it also installs a custom [`onBeforeCompile`](https://threejs.org/docs/#api/en/materials/Material.onBeforeCompile) callback on materials.  If you make use of `onBeforeCompile` in your own code, there's a good chance that `three-hex-tiling` will interfere with it and cause problems.
