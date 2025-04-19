import "./style.css";
import * as THREE from "three";
import vertexShader from "./shaders/main.vert";
import fragmentShader from "./shaders/main.frag";

const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
const gradientCanvas =
  document.querySelector<HTMLCanvasElement>("#gradient-canvas");
gradientCanvas!.width = 256;
gradientCanvas!.height = 64;

const colors = [
  "hsl(204deg 100% 22%)",
  "hsl(199deg 100% 29%)",
  "hsl(189deg 100% 32%)",
  "hsl(173deg 100% 33%)",
  "hsl(154deg 100% 39%)",
  "hsl( 89deg  70% 56%)",
  "hsl( 55deg 100% 50%)",
];
const ctx = gradientCanvas?.getContext("2d");
const linearGradient = ctx?.createLinearGradient(
  0,
  0,
  gradientCanvas!.width,
  0
);

for (const [i, color] of colors.entries()) {
  const stop = i / (colors.length - 1);
  linearGradient?.addColorStop(stop, color);
}

ctx!.fillStyle = linearGradient!;
ctx!.fillRect(0, 0, gradientCanvas!.width, gradientCanvas!.height);

const canvasTexture = new THREE.CanvasTexture(gradientCanvas!);
const canvasMaterial = new THREE.MeshBasicMaterial({
  map: canvasTexture,
});

// Create scene
const scene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 1;

// Create renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas!,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Calculate plane size to cover the screen
const fov = 75;
const aspect = window.innerWidth / window.innerHeight;
const distance = 1; // Distance from camera
const planeHeight = 2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2) * distance;
const planeWidth = planeHeight * aspect;

const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uResolution: {
      value: new THREE.Vector2(
        window.innerWidth * Math.min(window.devicePixelRatio, 2),
        window.innerHeight * Math.min(window.devicePixelRatio, 2)
      ),
    },
    uTexture: { value: canvasTexture },
  },
  vertexShader,
  fragmentShader,
});
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// Handle window resize
window.addEventListener("resize", () => {
  // Update camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update uniforms
  material.uniforms.uResolution.value.set(
    window.innerWidth * Math.min(window.devicePixelRatio, 2),
    window.innerHeight * Math.min(window.devicePixelRatio, 2)
  );

  // Update plane size
  const newAspect = window.innerWidth / window.innerHeight;
  const newPlaneHeight =
    2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2) * distance;
  const newPlaneWidth = newPlaneHeight * newAspect;
  plane.scale.set(newPlaneWidth / planeWidth, newPlaneHeight / planeHeight, 1);
});

// Animation loop

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  material.uniforms.uTime.value += clock.getDelta();
  renderer.render(scene, camera);
}

animate();
