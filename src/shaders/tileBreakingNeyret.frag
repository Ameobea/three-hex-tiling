/**
 * Adapted from https://www.shadertoy.com/view/MdyfDV
 */

#define rnd22(p) fract(sin((p) * mat2(127.1, 311.7, 269.5, 183.3)) * 43758.5453)
// TODO: Figure out if this is correct for three.js
#define srgb2rgb(V) pow(max(V, 0.), vec4(2.2)) // RGB <-> sRGB conversions
#define rgb2srgb(V) pow(max(V, 0.), vec4(1. / 2.2))

// (textureGrad handles MIPmap through patch borders)
#define C(I)  (srgb2rgb(textureGrad(samp, U / hexTilingPatchScale - rnd22(I), Gx, Gy)) - meanColor * float(hexTilingUseContrastCorrectedBlending))

uniform bool hexTilingUseContrastCorrectedBlending; // https://www.shadertoy.com/view/4dcSDr
uniform float hexTilingPatchScale;
uniform float hexTilingLookupSkipThreshold;
uniform float hexTilingTextureSampleCoefficientExponent;

vec4 textureNoTileNeyret(sampler2D samp, vec2 uv) {
    mat2 M0 = mat2(1, 0, .5, sqrt(3.) / 2.);
    mat2 M = inverse(M0);
    vec2 U = uv * hexTilingPatchScale / 8. * exp2(4. * 0.2 + 1.);
    vec2 V = M * U;
    vec2 I = floor(V);
    vec2 Gx = dFdx(U / hexTilingPatchScale), Gy = dFdy(U / hexTilingPatchScale);

    vec4 meanColor = hexTilingUseContrastCorrectedBlending ? srgb2rgb(texture(samp, U, 99.)) : vec4(0.);

    vec3 F = vec3(fract(V), 0), W;
    F.z = 1. - F.x - F.y;
    vec4 fragColor = vec4(0.);

    if (F.z > 0.) {
        W = vec3(F.z, F.y, F.x);
        W = pow(W, vec3(hexTilingTextureSampleCoefficientExponent));
        W = W / dot(W, vec3(1.));

        if (W.x > hexTilingLookupSkipThreshold) {
            fragColor += C(I) * W.x;
        }
        if (W.y > hexTilingLookupSkipThreshold) {
            fragColor += C(I + vec2(0, 1)) * W.y;
        }
        if (W.z > hexTilingLookupSkipThreshold) {
            fragColor += C(I + vec2(1, 0)) * W.z;
        }
    } else {
        W = vec3(-F.z, 1. - F.y, 1. - F.x);
        W = pow(W, vec3(hexTilingTextureSampleCoefficientExponent));
        W = W / dot(W, vec3(1.));

        if (W.x > hexTilingLookupSkipThreshold) {
            fragColor += C(I + 1.) * W.x;
        }
        if (W.y > hexTilingLookupSkipThreshold) {
            fragColor += C(I + vec2(1, 0)) * W.y;
        }
        if (W.z > hexTilingLookupSkipThreshold) {
            fragColor += C(I + vec2(0, 1)) * W.z;
        }
    }

    fragColor = hexTilingUseContrastCorrectedBlending ? meanColor + fragColor / length(W) : fragColor;

    fragColor = clamp(rgb2srgb(fragColor), 0., 1.);

    return fragColor;
}
