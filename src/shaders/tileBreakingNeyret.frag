/**
 * Adapted from https://www.shadertoy.com/view/MdyfDV
 */

#define CON 0.8                                  // contrast preserving interpolation
#define Z 8.                                   // patch scale inside example texture
#define SKIP_LOW_MAGNITUDE_LOOKUPS 0           // Skips texture lookups from tiles that have low mix magnitude
#define LOOKUP_SKIP_THRESHOLD 0.28             // The mix magnitude under which texture lookups will be skipped if `SKIP_LOW_MAGNITUDE_LOOKUPS` is enabled
#define LOW_MAG_SKIP_FADE 0.02

#define rnd22(p) fract(sin((p) * mat2(127.1, 311.7, 269.5, 183.3)) * 43758.5453)
#define srgb2rgb(V) pow(max(V, 0.), vec4(2.2)) // RGB <-> sRGB conversions
#define rgb2srgb(V) pow(max(V, 0.), vec4(1. / 2.2))

// (textureGrad handles MIPmap through patch borders)
#define C(I)  (srgb2rgb(textureGrad(samp, U / Z - rnd22(I), Gx, Gy)) - m * float(CON))

vec4 textureNoTileNeyret(sampler2D samp, vec2 uv) {
    mat2 M0 = mat2(1, 0, .5, sqrt(3.) / 2.),
         M = inverse(M0);                      // transform matrix <-> tilted space
    vec2 z = vec2(0.2),
         U = uv * Z / 8. * exp2(z.y == 0. ? 2. : 4. * z.y + 1.),
         V = M * U,                            // pre-hexa tilted coordinates
         I = floor(V);
    float p = .7 * dFdy(U.y);                  // pixel size (for antialiasing)
    vec2 Gx = dFdx(U / Z), Gy = dFdy(U / Z);   // (for cross-borders MIPmap)
    vec4 m = srgb2rgb(texture(samp, U, 99.));  // mean texture color

    vec3 F = vec3(fract(V), 0), A, W;
    F.z = 1. - F.x - F.y;                      // local hexa coordinates
    vec4 fragColor = vec4(0.);

    #if !(SKIP_LOW_MAGNITUDE_LOOKUPS)
    if (F.z > 0.) {
        fragColor = (W.x = F.z) * C(I)                // smart interpolation
                  + (W.y = F.y) * C(I + vec2(0, 1))   // of hexagonal texture patch
                  + (W.z = F.x) * C(I + vec2(1, 0));  // centered at vertex
    } else {                                          // ( = random offset in texture )
        fragColor = (W.x = -F.z) * C(I + 1.)
                  + (W.y = 1. - F.y) * C(I + vec2(1, 0))
                  + (W.z = 1. - F.x) * C(I + vec2(0, 1));
    }
    #else
    if (F.z > 0.) {
        W.x = F.z;
        W.y = F.y;
        W.z = F.x;

        float lostMag = 0.;
        float wXActivation = smoothstep(LOOKUP_SKIP_THRESHOLD - LOW_MAG_SKIP_FADE, LOOKUP_SKIP_THRESHOLD, W.x);
        if (wXActivation > 0.) {
            fragColor += W.x * C(I) * wXActivation;
            lostMag += LOOKUP_SKIP_THRESHOLD * wXActivation;
        }
        float wYActivation = smoothstep(LOOKUP_SKIP_THRESHOLD - LOW_MAG_SKIP_FADE, LOOKUP_SKIP_THRESHOLD, W.y);
        if (wYActivation > 0.) {
            fragColor += W.y * C(I + vec2(0, 1)) * wYActivation;
            lostMag += LOOKUP_SKIP_THRESHOLD * wYActivation;
        }
        float wZActivation = smoothstep(LOOKUP_SKIP_THRESHOLD - LOW_MAG_SKIP_FADE, LOOKUP_SKIP_THRESHOLD, W.z);
        if (wZActivation > 0.) {
            fragColor += W.z * C(I + vec2(1, 0)) * wZActivation;
            lostMag += LOOKUP_SKIP_THRESHOLD * wZActivation;
        }
        fragColor *= (1. + lostMag);
    } else {
        W.x = -F.z;
        W.y = 1. - F.y;
        W.z = 1. - F.x;

        float lostMag = 0.;
        float wXActivation = smoothstep(LOOKUP_SKIP_THRESHOLD - LOW_MAG_SKIP_FADE, LOOKUP_SKIP_THRESHOLD, W.x);
        if (wXActivation > 0.) {
            fragColor += W.x * C(I + 1.) * wXActivation;
            lostMag += LOOKUP_SKIP_THRESHOLD * wXActivation;
        }
        float wYActivation = smoothstep(LOOKUP_SKIP_THRESHOLD - LOW_MAG_SKIP_FADE, LOOKUP_SKIP_THRESHOLD, W.y);
        if (wYActivation > 0.) {
            fragColor += W.y * C(I + vec2(1, 0)) * wYActivation;
            lostMag += LOOKUP_SKIP_THRESHOLD * wYActivation;
        }
        float wZActivation = smoothstep(LOOKUP_SKIP_THRESHOLD - LOW_MAG_SKIP_FADE, LOOKUP_SKIP_THRESHOLD, W.z);
        if (wZActivation > 0.) {
            fragColor += W.z * C(I + vec2(0, 1)) * wZActivation;
            lostMag += LOOKUP_SKIP_THRESHOLD * wZActivation;
        }
        fragColor *= (1. + lostMag);
    }
    #endif

    if (CON > 0.) {
        fragColor = m + fragColor / length(W);       // contrast preserving interp.
    }

    fragColor = clamp(rgb2srgb(fragColor), 0., 1.);
    if (m.g == 0.) fragColor = fragColor.rrrr;   // handles B&W (i.e. "red") textures

    return fragColor;
}
