import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Install the hex tiling patch
import "../src/index";

const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.backgroundColor = "black";
document.body.appendChild(canvas);

// Simple cube rendered by MeshPhysicalMaterial

// const textureURL =
//   "https://pub-80300747d44d418ca912329092f69f65.r2.dev/imgen/2593919833_ridged_niobium_wall__relic_of_an_ancient_alien_civilization__long_sulfur_trenches_with_deep_symmetrical_geometric_patterned_corroded__erosion_exposes_intricate_black_crystalline_neodymium_computer_circuitry.png";
// const textureNormalURL = "https://i.ameo.link/b72.png";

const textureURL = "https://i.ameo.link/b7d.png";
const textureNormalURL = "https://i.ameo.link/b7e.png";

const loader = new THREE.TextureLoader();
const [texture, textureNormal] = await Promise.all([
  loader.loadAsync(textureURL),
  loader.loadAsync(textureNormalURL),
]);
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(16, 16);

textureNormal.wrapS = THREE.RepeatWrapping;
textureNormal.wrapT = THREE.RepeatWrapping;
textureNormal.repeat.set(16, 16);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  canvas.width / canvas.height,
  0.1,
  1000
);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.width, canvas.height);

const geometry = new THREE.IcosahedronGeometry(1, 8);
const material = new THREE.MeshPhysicalMaterial({
  color: 0x888888,
  normalScale: new THREE.Vector2(8, 8),
  map: texture,
  normalMap: textureNormal,
  roughness: 0.15,
  metalness: 0.8,
  reflectivity: 0.4,
  ior: 1.5,
});

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const light = new THREE.PointLight(0xdddddd, 0.6, 100);
light.position.set(0, 0.5, 2);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 4); // soft white light
scene.add(ambientLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// configure shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

let curRotation = 0;
const animate = () => {
  // Slowly orbit the pointlight around the cube
  curRotation += 0.001;
  light.position.x = Math.sin(curRotation) * 2;
  light.position.z = Math.cos(curRotation) * 2;

  renderer.render(scene, camera);
  controls.update();
  requestAnimationFrame(animate);
};

animate();
