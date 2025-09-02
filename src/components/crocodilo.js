import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xF5DEB3); // Cor de areia/terra

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luz ambiente e direcional
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Crocodilo realista
const crocodilo = new THREE.Group();

// Material do crocodilo com textura escamosa
const materialCrocodilo = new THREE.MeshStandardMaterial({ 
  color: 0x3d4a3d, 
  transparent: false, 
  opacity: 1,
  roughness: 0.8,
  metalness: 0.1
});

// Corpo principal - mais longo e baixo
const corpoGeometry = new THREE.BoxGeometry(4, 0.8, 1.2);
const corpo = new THREE.Mesh(corpoGeometry, materialCrocodilo);
corpo.position.set(0, 0, 0);
crocodilo.add(corpo);

// Segmentos do corpo para simular escamas
for (let i = 0; i < 8; i++) {
  const segmento = new THREE.Mesh(
    new THREE.RingGeometry(0.4, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x2d3a2d })
  );
  segmento.position.set(-1.5 + i * 0.4, 0, 0.61);
  segmento.rotation.x = Math.PI / 2;
  crocodilo.add(segmento);
}

// Cabeça mais realista - formato de cunha
const cabecaGeometry = new THREE.ConeGeometry(0.6, 1.8, 8);
const cabeca = new THREE.Mesh(cabecaGeometry, materialCrocodilo);
cabeca.position.set(2.9, 0, 0);
cabeca.rotation.z = Math.PI / 2;
crocodilo.add(cabeca);

// Focinho
const focinhoGeometry = new THREE.CylinderGeometry(0.25, 0.4, 1, 8);
const focinho = new THREE.Mesh(focinhoGeometry, materialCrocodilo);
focinho.position.set(3.5, 0, 0);
focinho.rotation.z = Math.PI / 2;
crocodilo.add(focinho);

// Maxilar inferior
const maxilarGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.4);
const maxilar = new THREE.Mesh(maxilarGeometry, materialCrocodilo);
maxilar.position.set(3.5, 0, -0.2);
crocodilo.add(maxilar);

// Cauda longa e afilada
const caudaSegmentos = 6;
for (let i = 0; i < caudaSegmentos; i++) {
  const tamanho = 0.8 - (i * 0.1);
  const altura = 0.6 - (i * 0.08);
  const caudaSegmento = new THREE.Mesh(
    new THREE.BoxGeometry(tamanho, altura, 0.8),
    materialCrocodilo
  );
  caudaSegmento.position.set(-2.5 - i * 0.7, 0, 0);
  crocodilo.add(caudaSegmento);
}

// Patas mais realistas
const pataPositions = [
  [-1.2, 1, -0.8], [-1.2, -1, -0.8], // patas traseiras
  [1.2, 1, -0.8], [1.2, -1, -0.8]   // patas dianteiras
];

pataPositions.forEach(pos => {
  // Coxa
  const coxa = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x2d3a2d })
  );
  coxa.position.set(pos[0], pos[1], pos[2]);
  crocodilo.add(coxa);

  // Pé
  const pe = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.3, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x1d2a1d })
  );
  pe.position.set(pos[0], pos[1], pos[2] - 0.4);
  crocodilo.add(pe);

  // Garras
  for (let g = 0; g < 3; g++) {
    const garra = new THREE.Mesh(
      new THREE.ConeGeometry(0.03, 0.2, 4),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    garra.position.set(pos[0] + 0.15 - g * 0.15, pos[1] + 0.1, pos[2] - 0.5);
    garra.rotation.x = Math.PI / 2;
    crocodilo.add(garra);
  }
});

// Olhos mais realistas
const olhoEsq = new THREE.Mesh(
  new THREE.SphereGeometry(0.15, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xffff00 })
);
olhoEsq.position.set(2.5, 0.3, 0.4);
crocodilo.add(olhoEsq);

// Pupila esquerda
const pupilaEsq = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0x000000 })
);
pupilaEsq.position.set(2.52, 0.32, 0.42);
crocodilo.add(pupilaEsq);

const olhoDir = olhoEsq.clone();
olhoDir.position.set(2.5, -0.3, 0.4);
crocodilo.add(olhoDir);

// Pupila direita
const pupilaDir = pupilaEsq.clone();
pupilaDir.position.set(2.52, -0.32, 0.42);
crocodilo.add(pupilaDir);

// Narinas
const narinaEsq = new THREE.Mesh(
  new THREE.SphereGeometry(0.05, 8, 8),
  new THREE.MeshStandardMaterial({ color: 0x000000 })
);
narinaEsq.position.set(4, 0.1, 0.2);
crocodilo.add(narinaEsq);

const narinaDir = narinaEsq.clone();
narinaDir.position.set(4, -0.1, 0.2);
crocodilo.add(narinaDir);

// Dentes
for (let i = 0; i < 12; i++) {
  const dente = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.3, 4),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  dente.position.set(3.2 + i * 0.1, 0.2 - (i % 2) * 0.4, 0.1);
  dente.rotation.z = Math.PI;
  crocodilo.add(dente);
}

scene.add(crocodilo);

// Cubo de teste para verificar renderização
const teste = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
teste.position.set(0, 0, 2); // Posicionar o cubo em uma posição visível
scene.add(teste);

// Posicionamento fixo da câmera
camera.position.set(10, 5, 10);
camera.lookAt(crocodilo.position);

// Zoom adaptativo
let fase = 1;
function atualizarZoom() {
  const zoom = 4 + fase * 1.5; // Câmera mais próxima
  camera.position.set(10, 5, 10); // Posição fixa sugerida
  camera.lookAt(crocodilo.position);
}

// Mudança de tempo a cada 10 minutos
let tempoAtual = 0;
function mudarTempo() {
  tempoAtual++;
  if (tempoAtual % 2 === 0) {
    scene.background = new THREE.Color(0xF5DEB3); // Sol na areia
  } else {
    scene.background = new THREE.Color(0xD2B48C); // Tempo nublado na areia
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