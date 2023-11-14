/**
 * Adapted from https://www.shadertoy.com/view/MdyfDV
 */

#define rnd22(p) fract(sin((p) * mat2(127.1, 311.7, 269.5, 183.3)) * 43758.5453)
#define srgb2rgb(V) pow(max(V, 0.), vec4(2.2)) // RGB <-> sRGB conversions
#define rgb2srgb(V) pow(max(V, 0.), vec4(1. / 2.2))

// (textureGrad handles MIPmap through patch borders)
#define C(I)  (srgb2rgb(textureGrad(samp, U / hexTilingPatchScale - rnd22(I), Gx, Gy)) - m * float(hexTilingContrastPreservationFactor))

uniform float hexTilingContrastPreservationFactor;
uniform float hexTilingPatchScale;
uniform float hexTilingLookupSkipThreshold;
uniform float hexTilingLookupSkipThresholdExponent;

vec4 textureNoTileNeyret(sampler2D samp, vec2 uv) {
    mat2 M0 = mat2(1, 0, .5, sqrt(3.) / 2.);
    mat2 M = inverse(M0);
    vec2 z = vec2(0.2);
    vec2 U = uv * hexTilingPatchScale / 8. * exp2(z.y == 0. ? 2. : 4. * z.y + 1.);
    vec2 V = M * U;
    vec2 I = floor(V);
    vec2 Gx = dFdx(U / hexTilingPatchScale), Gy = dFdy(U / hexTilingPatchScale);

    vec4 m = vec4(0.);
    if (hexTilingContrastPreservationFactor > 0.) {
        m = srgb2rgb(texture(samp, U, 99.)); // mean texture color
    }

    vec3 F = vec3(fract(V), 0), A, W;
    F.z = 1. - F.x - F.y; // local hexa coordinates
    vec4 fragColor = vec4(0.);

    if (F.z > 0.) {
        W = vec3(F.z, F.y, F.x);
        W = pow(W, vec3(hexTilingLookupSkipThresholdExponent));
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
        W = pow(W, vec3(hexTilingLookupSkipThresholdExponent));
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

    if (hexTilingContrastPreservationFactor > 0.) {
        // contrast preserving interpolation
        fragColor = m + fragColor / length(W);
    }

    fragColor = clamp(rgb2srgb(fragColor), 0., 1.);

    return fragColor;
}
