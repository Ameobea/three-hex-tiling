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

const textureURL = "https://ameo.link/u/b7o.png";
const textureNormalURL = "https://i.ameo.link/b7n.png";

const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const [texture, textureNormal, gltf] = await Promise.all([
  textureLoader.loadAsync(textureURL),
  textureLoader.loadAsync(textureNormalURL),
  gltfLoader.loadAsync("/terrain.glb"),
]);
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(40, 40);
// texture.magFilter = THREE.NearestFilter;
// texture.minFilter = THREE.NearestFilter;

textureNormal.wrapS = THREE.RepeatWrapping;
textureNormal.wrapT = THREE.RepeatWrapping;
textureNormal.repeat.set(40, 40);

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
  color: 0xffffff,
  normalScale: new THREE.Vector2(1, 1),
  map: texture,
  normalMap: textureNormal,
  roughness: 0.95,
  metalness: 0.8,
});
scene.add(terrain);

const light = new THREE.DirectionalLight(0xdddddd, 2.6);
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

const ambientLight = new THREE.AmbientLight(0x404040, 2); // soft white light
scene.add(ambientLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// configure shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const animate = () => {
  renderer.render(scene, camera);
  controls.update();
  requestAnimationFrame(animate);
};

animate();
