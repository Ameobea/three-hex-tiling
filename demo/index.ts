import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GUI from "lil-gui";

// Install the hex tiling shader patch
import "../src/index";

// You would use this in your own code like this:
// import 'three-hex-tiling';

import { type HexTilingParams } from "../src/index";

console.log("three.js version:", THREE.REVISION);

const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.backgroundColor = "black";
document.body.appendChild(canvas);

interface TexturesDef {
  textureURL: string;
  textureNormalURL: string;
  textureRoughnessURL?: string;
  nonTilingTextureScale: number;
  tilingTextureScale: number;
}

const Materials: { [key: string]: TexturesDef } = {
  ore: {
    textureURL: "https://i.ameo.link/bd3.jpg",
    textureNormalURL: "https://i.ameo.link/bd6.jpg",
    nonTilingTextureScale: 16,
    tilingTextureScale: 40,
  },
  blackStone: {
    textureURL: "https://i.ameo.link/bdd.jpg",
    textureNormalURL: "https://i.ameo.link/bdf.jpg",
    textureRoughnessURL: "https://i.ameo.link/bdg.jpg",
    nonTilingTextureScale: 12,
    tilingTextureScale: 22,
  },
  grayStone: {
    textureURL: "https://i.ameo.link/bfj.jpg",
    textureNormalURL: "https://i.ameo.link/bfk.jpg",
    textureRoughnessURL: "https://i.ameo.link/bfl.jpg",
    nonTilingTextureScale: 22,
    tilingTextureScale: 42,
  },
  cartoonLava: {
    textureURL: "https://i.ameo.link/bl9.jpg",
    textureNormalURL: "https://i.ameo.link/bla.jpg",
    textureRoughnessURL: "https://i.ameo.link/blb.jpg",
    nonTilingTextureScale: 12 * 2,
    tilingTextureScale: 24 * 2,
  },
};

interface Textures {
  texture: THREE.Texture;
  textureNormal: THREE.Texture;
  textureRoughness: THREE.Texture | undefined;
}

interface TexturesCacheEntry {
  enabled: Textures;
  disabled: Textures;
}

const texturesCache: Map<string, Promise<TexturesCacheEntry>> = new Map();

const loadTextures = (key: string) => {
  const cached = texturesCache.get(key);
  if (cached) {
    return cached;
  }

  const defPromise = new Promise<TexturesCacheEntry>(async (resolve) => {
    const {
      tilingTextureScale,
      nonTilingTextureScale,
      textureNormalURL,
      textureURL,
      textureRoughnessURL,
    } = Materials[key];

    const [texture, textureNormal, textureRoughness] = await Promise.all([
      textureLoader.loadAsync(textureURL),
      textureLoader.loadAsync(textureNormalURL),
      textureRoughnessURL
        ? textureLoader.loadAsync(textureRoughnessURL)
        : undefined,
    ]);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(tilingTextureScale, tilingTextureScale);
    texture.magFilter = THREE.NearestFilter;
    texture.anisotropy = 16;
    // I find that this helps to make things look a bit sharper when using
    // the hex tile-breaking shader, but it's not necessary
    texture.minFilter = THREE.NearestMipMapLinearFilter;

    textureNormal.wrapS = THREE.RepeatWrapping;
    textureNormal.wrapT = THREE.RepeatWrapping;
    textureNormal.repeat.set(tilingTextureScale, tilingTextureScale);

    if (textureRoughness) {
      textureRoughness.wrapS = THREE.RepeatWrapping;
      textureRoughness.wrapT = THREE.RepeatWrapping;
      textureRoughness.repeat.set(tilingTextureScale, tilingTextureScale);
      textureRoughness.magFilter = THREE.NearestFilter;
    }

    const enabledTextures = {
      texture,
      textureNormal,
      textureRoughness,
    };
    const disabledTextures = {
      texture: texture.clone(),
      textureNormal: textureNormal.clone(),
      textureRoughness: textureRoughness ? textureRoughness.clone() : undefined,
    };

    disabledTextures.texture.repeat.set(
      nonTilingTextureScale,
      nonTilingTextureScale
    );
    disabledTextures.textureNormal.repeat.set(
      nonTilingTextureScale,
      nonTilingTextureScale
    );
    if (disabledTextures.textureRoughness) {
      disabledTextures.textureRoughness.repeat.set(
        nonTilingTextureScale,
        nonTilingTextureScale
      );
    }

    resolve({ enabled: enabledTextures, disabled: disabledTextures });
  });

  texturesCache.set(key, defPromise);
  return defPromise;
};

const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const gltfPromise = gltfLoader.loadAsync("/terrain.glb");

const uiParams = {
  enabled: true,
};
const textureParams = {
  normalScale: 1.7,
  texture: "grayStone",
};

const [textures, gltf] = await Promise.all([
  loadTextures(textureParams.texture),
  gltfPromise,
]);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  canvas.width / canvas.height,
  0.1,
  1000
);
camera.position.set(20, 20, 20);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.width, canvas.height);

const hexTilingParams: HexTilingParams = {
  patchScale: 2,
  useContrastCorrectedBlending: true,
  lookupSkipThreshold: 0.01,
  textureSampleCoefficientExponent: 8,
};
const noHexTilingMat = new THREE.MeshPhysicalMaterial({
  name: "no-hex-tiling",
  color: 0xf0e3f6,
  normalScale: new THREE.Vector2(
    textureParams.normalScale,
    textureParams.normalScale
  ),
  map: textures.disabled.texture,
  normalMap: textures.disabled.textureNormal,
  roughnessMap: textures.disabled.textureRoughness,
  metalness: 0,
  roughness: 1,
});
const hexTilingMat = new THREE.MeshPhysicalMaterial({
  name: "hex-tiling",
  color: 0xf0e3f6,
  normalScale: new THREE.Vector2(
    textureParams.normalScale,
    textureParams.normalScale
  ),
  map: textures.enabled.texture,
  normalMap: textures.enabled.textureNormal,
  roughnessMap: textures.enabled.textureRoughness,
  metalness: 0,
  roughness: 1,
  hexTiling: hexTilingParams,
});

// load the terrain
const terrain = gltf.scene.getObjectByName("Landscape002") as THREE.Mesh;
terrain.material = hexTilingMat;
scene.add(terrain);

const gui = new GUI({
  width: window.innerWidth > 500 ? 400 : window.innerWidth - 12,
  title: "`three-hex-tiling` Demo Controls",
});
gui.$title.innerHTML =
  '<a href="https://github.com/ameobea/three-hex-tiling" style="color: #ccc" target="_blank"><code>three-hex-tiling</code></a> Demo Controls';
const link = document.querySelector(".title a")! as HTMLAnchorElement;
// prevent link click from propagating to the title which causes the gui to close
link.addEventListener("click", (e) => e.stopPropagation());

gui.add(uiParams, "enabled").onChange((value) => {
  if (value) {
    terrain.material = hexTilingMat;
  } else {
    terrain.material = noHexTilingMat;
  }
});

const hexFolder = gui.addFolder("Hex Tiling Params");

hexFolder.add(hexTilingParams, "patchScale").min(0.02).max(6);
hexFolder.add(hexTilingParams, "useContrastCorrectedBlending");
hexFolder.add(hexTilingParams, "lookupSkipThreshold").min(0).max(0.5);
hexFolder
  .add(hexTilingParams, "textureSampleCoefficientExponent")
  .min(0.5)
  .max(32);

const textureFolder = gui.addFolder("Texture Params");
textureFolder
  .add(textureParams, "texture", Object.keys(Materials))
  .onChange(async (value) => {
    const textures = await loadTextures(value);

    hexTilingMat.map = textures.enabled.texture;
    hexTilingMat.normalMap = textures.enabled.textureNormal;
    hexTilingMat.roughnessMap = textures.enabled.textureRoughness ?? null;

    noHexTilingMat.map = textures.disabled.texture;
    noHexTilingMat.normalMap = textures.disabled.textureNormal;
    noHexTilingMat.roughnessMap = textures.disabled.textureRoughness ?? null;

    hexTilingMat.needsUpdate = true;
    noHexTilingMat.needsUpdate = true;
  });
textureFolder
  .add(textureParams, "normalScale")
  .min(0)
  .max(5)
  .step(0.1)
  .onChange((value) => {
    hexTilingMat.normalScale.set(value, value);
    noHexTilingMat.normalScale.set(value, value);
  });

const light = new THREE.DirectionalLight(0xf5efd5, 1.2 * Math.PI);
light.position.set(40, 24, 40);
scene.add(light);

// Add a white sphere at the location of the light to indicate its position
const lightSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);
lightSphere.castShadow = false;
lightSphere.receiveShadow = false;
lightSphere.position.copy(light.position);
scene.add(lightSphere);

const ambientLight = new THREE.AmbientLight(0x404040, 2 * Math.PI); // soft white light
scene.add(ambientLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// configure shadows
renderer.shadowMap.enabled = true;

// Set up some tone mapping to make colors look nicer
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// renderer.toneMapping = THREE.CineonToneMapping;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

const animate = () => {
  renderer.render(scene, camera);
  controls.update();
  requestAnimationFrame(animate);
};

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  camera.aspect = canvas.width / canvas.height;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.width, canvas.height);
});

animate();
