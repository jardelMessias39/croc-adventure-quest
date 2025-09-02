import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Céu azul claro

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luz ambiente e direcional
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Crocodilo
const crocodilo = new THREE.Group();

// Corpo
const corpo = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.5, 3, 32),
  new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
corpo.rotation.z = Math.PI / 2;
crocodilo.add(corpo);

// Cabeça
const cabeca = new THREE.Mesh(
  new THREE.ConeGeometry(0.4, 0.8, 32),
  new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
cabeca.position.set(1.9, 0, 0);
crocodilo.add(cabeca);

// Cauda
const cauda = new THREE.Mesh(
  new THREE.ConeGeometry(0.3, 1, 32),
  new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
cauda.position.set(-2, 0, 0);
cauda.rotation.z = Math.PI;
crocodilo.add(cauda);

// Patas
for (let i = -1; i <= 1; i += 2) {
  for (let j = -0.5; j <= 0.5; j += 1) {
    const pata = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x006400 })
    );
    pata.position.set(i, j, -0.3);
    crocodilo.add(pata);
  }
}

// Olhos
const olhoEsq = new THREE.Mesh(
  new THREE.SphereGeometry(0.1, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
olhoEsq.position.set(2, 0.2, 0.2);
crocodilo.add(olhoEsq);

const olhoDir = olhoEsq.clone();
olhoDir.position.set(2, -0.2, 0.2);
crocodilo.add(olhoDir);

scene.add(crocodilo);

// Zoom adaptativo
let fase = 1;
function atualizarZoom() {
  const zoom = 5 + fase * 2;
  camera.position.set(zoom, zoom, zoom);
  camera.lookAt(crocodilo.position);
}

// Mudança de tempo a cada 10 minutos
let tempoAtual = 0;
function mudarTempo() {
  tempoAtual++;
  if (tempoAtual % 2 === 0) {
    scene.background = new THREE.Color(0x87ceeb); // Sol
  } else {
    scene.background = new THREE.Color(0x4f4f4f); // Chuva
  }
}
setInterval(mudarTempo, 600000); // 10 minutos

// Crescimento simulado
setInterval(() => {
  if (fase < 4) {
    fase++;
    atualizarZoom();
  }
}, 15000); // Simula crescimento a cada 15s

atualizarZoom();

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();