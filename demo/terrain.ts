import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Install the hex tiling shader patch
import "../src/index";
// You would use this in your own code like this:
// import 'three-hex-tilebreaking';

const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.backgroundColor = "black";
document.body.appendChild(canvas);

// const textureURL = "https://ameo.link/u/b7o.png";
// const textureNormalURL = "https://i.ameo.link/b7n.png";
// const TEXTURE_SCALE = 40;

// const textureURL = "https://i.ameo.link/bd3.jpg";
// const textureNormalURL = "https://i.ameo.link/bd6.jpg";
// const TEXTURE_SCALE = 20;

// const textureURL = "https://i.ameo.link/bdd.jpg";
// const textureNormalURL = "https://i.ameo.link/bdf.jpg";
// const textureRoughnessURL = "https://i.ameo.link/bdg.jpg";
// const TEXTURE_SCALE = 12;

const textureURL = "https://i.ameo.link/bfj.jpg";
const textureNormalURL = "https://i.ameo.link/bfk.jpg";
const textureRoughnessURL = "https://i.ameo.link/bfl.jpg";
const TEXTURE_SCALE = 22;

const NORMAL_SCALE = 1.1;

const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const [texture, textureNormal, textureRoughness, gltf] = await Promise.all([
  textureLoader.loadAsync(textureURL),
  textureLoader.loadAsync(textureNormalURL),
  textureRoughnessURL
    ? textureLoader.loadAsync(textureRoughnessURL)
    : undefined,
  gltfLoader.loadAsync("/terrain.glb"),
]);
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(TEXTURE_SCALE, TEXTURE_SCALE);
texture.magFilter = THREE.NearestFilter;
texture.anisotropy = 16;
// I find that this helps to make things look a bit sharper when using
// the hex tile-breaking shader, but it's not necessary
texture.minFilter = THREE.NearestMipMapLinearFilter;

textureNormal.wrapS = THREE.RepeatWrapping;
textureNormal.wrapT = THREE.RepeatWrapping;
textureNormal.repeat.set(TEXTURE_SCALE, TEXTURE_SCALE);

if (textureRoughness) {
  textureRoughness.wrapS = THREE.RepeatWrapping;
  textureRoughness.wrapT = THREE.RepeatWrapping;
  textureRoughness.repeat.set(TEXTURE_SCALE, TEXTURE_SCALE);
  textureRoughness.magFilter = THREE.NearestFilter;
}

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

// load the terrain
const terrain = gltf.scene.getObjectByName("Landscape002") as THREE.Mesh;
terrain.material = new THREE.MeshPhysicalMaterial({
  color: 0xf0e3f6,
  // color: 0xffffff,
  normalScale: new THREE.Vector2(NORMAL_SCALE, NORMAL_SCALE),
  map: texture,
  normalMap: textureNormal,
  roughnessMap: textureRoughness,
  metalness: 0.0001,
  roughness: 1,
  hexTiling: {
    patchScale: 6,
  },
});
scene.add(terrain);

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

animate();
