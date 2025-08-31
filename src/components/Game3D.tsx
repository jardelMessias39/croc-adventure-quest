import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface GameState {
  phase: number;
  lives: number;
  energy: number;
  score: number;
  weatherType: 'sunny' | 'rainy';
  crocodileSize: number;
  position: { x: number, y: number, z: number };
  abilities: string[];
}

interface Prey {
  id: number;
  type: 'grilo' | 'cobra' | 'carne';
  position: THREE.Vector3;
  energyValue: number;
  isStunned: boolean;
  mesh?: THREE.Mesh;
}

interface Obstacle {
  id: number;
  type: 'pedra' | 'buraco' | 'galho';
  position: THREE.Vector3;
  mesh?: THREE.Mesh;
}

const CrocodileGame3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const crocodileRef = useRef<THREE.Group>();
  const animationIdRef = useRef<number>();

  const [gameState, setGameState] = useState<GameState>({
    phase: 1,
    lives: 3,
    energy: 0,
    score: 0,
    weatherType: 'sunny',
    crocodileSize: 1,
    position: { x: 0, y: 0, z: 0 },
    abilities: ['tail_attack']
  });

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [preys, setPreys] = useState<Prey[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [isMoving, setIsMoving] = useState({ forward: false, backward: false, left: false, right: false });

  const energyRequirements = [150, 300, 450, 700];
  const phaseNames = ['Filhote', 'Jovem', 'Adulto', 'Gigante'];

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.offsetWidth, mountRef.current.offsetHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5d23 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Water areas
    const waterGeometry = new THREE.PlaneGeometry(50, 10);
    const waterMaterial = new THREE.MeshLambertMaterial({ color: 0x006994, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 3; i++) {
      const water = new THREE.Mesh(waterGeometry, waterMaterial);
      water.rotation.x = -Math.PI / 2;
      water.position.set(Math.random() * 100 - 50, 0.1, Math.random() * 100 - 50);
      scene.add(water);
    }

    // Create crocodile
    createCrocodile();

    // Generate initial game objects
    generatePreys();
    generateObstacles();

  }, []);

  // Create crocodile model
  const createCrocodile = () => {
    const crocodileGroup = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 1.2, 4, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    crocodileGroup.add(body);

    // Head
    const headGeometry = new THREE.ConeGeometry(1, 2, 8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(2.5, 0, 0);
    head.rotation.z = Math.PI / 2;
    head.castShadow = true;
    crocodileGroup.add(head);

    // Tail
    const tailGeometry = new THREE.ConeGeometry(0.3, 3, 6);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(-3.5, 0, 0);
    tail.rotation.z = -Math.PI / 2;
    tail.castShadow = true;
    crocodileGroup.add(tail);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(3, 0.5, 0.3);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(3, 0.5, -0.3);
    crocodileGroup.add(leftEye);
    crocodileGroup.add(rightEye);

    crocodileGroup.position.set(0, 1, 0);
    crocodileRef.current = crocodileGroup;
    sceneRef.current?.add(crocodileGroup);
  };

  // Generate preys
  const generatePreys = () => {
    const newPreys: Prey[] = [];
    const preyTypes = ['grilo', 'cobra', 'carne'] as const;
    
    for (let i = 0; i < 10; i++) {
      const type = preyTypes[Math.floor(Math.random() * preyTypes.length)];
      const energyValues = { grilo: 10, cobra: 25, carne: 15 };
      
      const prey: Prey = {
        id: i,
        type,
        position: new THREE.Vector3(
          Math.random() * 80 - 40,
          0.5,
          Math.random() * 80 - 40
        ),
        energyValue: energyValues[type] * gameState.phase,
        isStunned: false
      };

      // Create prey mesh
      let geometry: THREE.BufferGeometry;
      let material: THREE.MeshLambertMaterial;
      
      switch (type) {
        case 'grilo':
          geometry = new THREE.SphereGeometry(0.3, 8, 8);
          material = new THREE.MeshLambertMaterial({ color: 0x32a852 });
          break;
        case 'cobra':
          geometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
          material = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
          break;
        case 'carne':
          geometry = new THREE.BoxGeometry(0.8, 0.4, 0.8);
          material = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
          break;
      }
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(prey.position);
      mesh.castShadow = true;
      prey.mesh = mesh;
      sceneRef.current?.add(mesh);
      
      newPreys.push(prey);
    }
    
    setPreys(newPreys);
  };

  // Generate obstacles
  const generateObstacles = () => {
    const newObstacles: Obstacle[] = [];
    const obstacleTypes = ['pedra', 'buraco', 'galho'] as const;
    
    for (let i = 0; i < 15; i++) {
      const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      
      const obstacle: Obstacle = {
        id: i,
        type,
        position: new THREE.Vector3(
          Math.random() * 80 - 40,
          type === 'buraco' ? -0.5 : 1,
          Math.random() * 80 - 40
        )
      };

      // Create obstacle mesh
      let geometry: THREE.BufferGeometry;
      let material: THREE.MeshLambertMaterial;
      
      switch (type) {
        case 'pedra':
          geometry = new THREE.SphereGeometry(1.5, 8, 8);
          material = new THREE.MeshLambertMaterial({ color: 0x696969 });
          break;
        case 'buraco':
          geometry = new THREE.CylinderGeometry(2, 2, 1, 8);
          material = new THREE.MeshLambertMaterial({ color: 0x2f1b14 });
          break;
        case 'galho':
          geometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
          material = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
          break;
      }
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(obstacle.position);
      mesh.castShadow = true;
      obstacle.mesh = mesh;
      sceneRef.current?.add(mesh);
      
      newObstacles.push(obstacle);
    }
    
    setObstacles(newObstacles);
  };

  // Handle movement
  const handleMovement = useCallback(() => {
    if (!crocodileRef.current || !gameStarted || gameOver) return;

    const speed = 0.3 + (gameState.phase - 1) * 0.1;
    const position = crocodileRef.current.position;

    if (isMoving.forward) position.z -= speed;
    if (isMoving.backward) position.z += speed;
    if (isMoving.left) position.x -= speed;
    if (isMoving.right) position.x += speed;

    // Keep crocodile in bounds
    position.x = Math.max(-90, Math.min(90, position.x));
    position.z = Math.max(-90, Math.min(90, position.z));

    // Update camera to follow crocodile
    if (cameraRef.current) {
      cameraRef.current.position.x = position.x;
      cameraRef.current.position.z = position.z + 20;
      cameraRef.current.lookAt(position);
    }

    setGameState(prev => ({ ...prev, position: { x: position.x, y: position.y, z: position.z } }));
  }, [isMoving, gameStarted, gameOver, gameState.phase]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
          setIsMoving(prev => ({ ...prev, forward: true }));
          break;
        case 'ArrowDown':
          setIsMoving(prev => ({ ...prev, backward: true }));
          break;
        case 'ArrowLeft':
          setIsMoving(prev => ({ ...prev, left: true }));
          break;
        case 'ArrowRight':
          setIsMoving(prev => ({ ...prev, right: true }));
          break;
        case 'r':
          if (e.ctrlKey) {
            e.preventDefault();
            handleTailAttack();
          }
          break;
        case 'c':
          if (e.ctrlKey) {
            e.preventDefault();
            handleEat();
          }
          break;
        case 'g':
          if (e.ctrlKey && gameState.abilities.includes('bite_spin')) {
            e.preventDefault();
            handleBiteSpin();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setIsMoving(prev => ({ ...prev, forward: false }));
          break;
        case 'ArrowDown':
          setIsMoving(prev => ({ ...prev, backward: false }));
          break;
        case 'ArrowLeft':
          setIsMoving(prev => ({ ...prev, left: false }));
          break;
        case 'ArrowRight':
          setIsMoving(prev => ({ ...prev, right: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver, gameState.abilities]);

  // Tail attack
  const handleTailAttack = () => {
    if (!crocodileRef.current) return;

    const crocodilePos = crocodileRef.current.position;
    const attackRange = 5;

    setPreys(prevPreys => 
      prevPreys.map(prey => {
        const distance = crocodilePos.distanceTo(prey.position);
        if (distance < attackRange && !prey.isStunned) {
          toast.success(`${prey.type} atordoado!`);
          return { ...prey, isStunned: true };
        }
        return prey;
      })
    );

    // Tail animation
    if (crocodileRef.current.children[2]) { // tail is the 3rd child
      const tail = crocodileRef.current.children[2];
      tail.rotation.y = Math.PI / 4;
      setTimeout(() => {
        tail.rotation.y = 0;
      }, 200);
    }
  };

  // Eat prey
  const handleEat = () => {
    if (!crocodileRef.current) return;

    const crocodilePos = crocodileRef.current.position;
    const eatRange = 3;

    setPreys(prevPreys => {
      const newPreys = [...prevPreys];
      let energyGained = 0;

      for (let i = newPreys.length - 1; i >= 0; i--) {
        const prey = newPreys[i];
        const distance = crocodilePos.distanceTo(prey.position);
        
        if (distance < eatRange && prey.isStunned) {
          energyGained += prey.energyValue;
          sceneRef.current?.remove(prey.mesh!);
          newPreys.splice(i, 1);
          toast.success(`Comeu ${prey.type}! +${prey.energyValue} energia`);
        }
      }

      if (energyGained > 0) {
        setGameState(prev => {
          const newEnergy = prev.energy + energyGained;
          const newScore = prev.score + energyGained;
          
          // Check for phase progression
          let newPhase = prev.phase;
          let newAbilities = [...prev.abilities];
          let newSize = prev.crocodileSize;
          
          if (newPhase < 4 && newEnergy >= energyRequirements[newPhase - 1]) {
            newPhase++;
            newSize = newPhase;
            
            // Add new abilities
            switch (newPhase) {
              case 2:
                newAbilities.push('bite_spin');
                toast.success('Nova habilidade: Abocanhar e Girar! (Ctrl+G)');
                break;
              case 3:
                newAbilities.push('speed_boost');
                toast.success('Nova habilidade: Velocidade aumentada!');
                break;
              case 4:
                newAbilities.push('super_strength');
                toast.success('Nova habilidade: Super força!');
                break;
            }
            
            // Scale crocodile
            if (crocodileRef.current) {
              crocodileRef.current.scale.setScalar(newSize);
            }
            
            toast.success(`Evoluiu para ${phaseNames[newPhase - 1]}!`);
          }
          
          return {
            ...prev,
            energy: newEnergy,
            score: newScore,
            phase: newPhase,
            abilities: newAbilities,
            crocodileSize: newSize
          };
        });
      }

      return newPreys;
    });
  };

  // Bite and spin attack
  const handleBiteSpin = () => {
    if (!crocodileRef.current) return;

    // Spinning animation
    const originalRotation = crocodileRef.current.rotation.y;
    const spinDuration = 1000;
    const startTime = Date.now();

    const spin = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      
      if (crocodileRef.current) {
        crocodileRef.current.rotation.y = originalRotation + progress * Math.PI * 4;
      }
      
      if (progress < 1) {
        requestAnimationFrame(spin);
      } else if (crocodileRef.current) {
        crocodileRef.current.rotation.y = originalRotation;
      }
    };
    
    spin();
    toast.success('Ataque giratório!');
  };

  // Collision detection
  useEffect(() => {
    if (!crocodileRef.current || !gameStarted || gameOver) return;

    const crocodilePos = crocodileRef.current.position;
    const collisionRange = 2;

    // Check obstacle collisions
    obstacles.forEach(obstacle => {
      const distance = crocodilePos.distanceTo(obstacle.position);
      if (distance < collisionRange) {
        if (obstacle.type === 'galho' && gameState.abilities.includes('tail_attack')) {
          // Can destroy branches with tail
          return;
        }
        
        // Hit obstacle - lose life
        setGameState(prev => {
          const newLives = prev.lives - 1;
          if (newLives <= 0) {
            setGameOver(true);
            toast.error('Game Over! Você perdeu todas as vidas!');
          } else {
            toast.error(`Bateu em ${obstacle.type}! Vidas restantes: ${newLives}`);
          }
          return { ...prev, lives: newLives };
        });
        
        // Move crocodile back
        crocodileRef.current.position.set(0, 1, 0);
      }
    });
  }, [gameState.position, obstacles, gameStarted, gameOver, gameState.abilities]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        handleMovement();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationIdRef.current = requestAnimationFrame(animate);
    };
    
    if (gameStarted) {
      animate();
    }
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [gameStarted, handleMovement]);

  // Initialize scene on mount
  useEffect(() => {
    initScene();
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initScene]);

  // Weather system
  useEffect(() => {
    const weatherInterval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        weatherType: prev.weatherType === 'sunny' ? 'rainy' : 'sunny'
      }));
      
      // Update scene lighting based on weather
      if (sceneRef.current) {
        const directionalLight = sceneRef.current.children.find(child => child instanceof THREE.DirectionalLight) as THREE.DirectionalLight;
        if (directionalLight) {
          directionalLight.intensity = gameState.weatherType === 'sunny' ? 1 : 0.5;
        }
        
        sceneRef.current.background = new THREE.Color(
          gameState.weatherType === 'sunny' ? 0x87CEEB : 0x696969
        );
      }
      
      toast.info(`Clima mudou: ${gameState.weatherType === 'sunny' ? 'Sol' : 'Chuva'}`);
    }, 30000); // Change weather every 30 seconds

    return () => clearInterval(weatherInterval);
  }, [gameState.weatherType]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setGameState({
      phase: 1,
      lives: 3,
      energy: 0,
      score: 0,
      weatherType: 'sunny',
      crocodileSize: 1,
      position: { x: 0, y: 1, z: 0 },
      abilities: ['tail_attack']
    });
    
    // Reset crocodile position and scale
    if (crocodileRef.current) {
      crocodileRef.current.position.set(0, 1, 0);
      crocodileRef.current.scale.setScalar(1);
    }
    
    toast.success('Aventura iniciada! Encontre sua mãe!');
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    
    // Clean up scene
    if (sceneRef.current) {
      preys.forEach(prey => {
        if (prey.mesh) sceneRef.current?.remove(prey.mesh);
      });
      obstacles.forEach(obstacle => {
        if (obstacle.mesh) sceneRef.current?.remove(obstacle.mesh);
      });
    }
    
    setPreys([]);
    setObstacles([]);
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-game-bg flex items-center justify-center p-8">
        <Card className="p-8 text-center max-w-3xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Crocodilo Aventure 3D
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Ajude o pequeno crocodilo a crescer e encontrar sua mãe no pântano!
            <br />
            Colete energia, evolua através de 4 fases e derrote a anaconda gigante!
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            <div>
              <h3 className="font-bold text-primary mb-2">Controles:</h3>
              <ul className="text-sm space-y-1">
                <li>🎮 Setas: Mover</li>
                <li>⚔️ Ctrl+R: Atacar com cauda</li>
                <li>🍽️ Ctrl+C: Comer presa</li>
                <li>🌪️ Ctrl+G: Girar (Fase 2+)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-primary mb-2">Fases:</h3>
              <ul className="text-sm space-y-1">
                <li>🦎 Filhote: 150 energia</li>
                <li>🐊 Jovem: 300 energia</li>
                <li>🐊 Adulto: 450 energia</li>
                <li>🦖 Gigante: 700 energia</li>
              </ul>
            </div>
          </div>
          <Button 
            onClick={startGame}
            size="lg"
            className="hero-button text-white border-0 px-8 py-4 text-xl font-semibold"
          >
            Começar Aventura 3D
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-game-bg relative">
      {/* Game HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="grid grid-cols-4 gap-4 text-white">
            <div>
              <div className="text-sm opacity-80">Fase</div>
              <div className="text-xl font-bold">{gameState.phase} - {phaseNames[gameState.phase - 1]}</div>
            </div>
            <div>
              <div className="text-sm opacity-80">Vidas</div>
              <div className="text-xl font-bold">{'❤️'.repeat(gameState.lives)}</div>
            </div>
            <div>
              <div className="text-sm opacity-80">Energia</div>
              <div className="text-xl font-bold">{gameState.energy}</div>
              <Progress 
                value={(gameState.energy / energyRequirements[gameState.phase - 1]) * 100} 
                className="w-24 h-2" 
              />
            </div>
            <div>
              <div className="text-sm opacity-80">Clima</div>
              <div className="text-xl">{gameState.weatherType === 'sunny' ? '☀️' : '🌧️'}</div>
            </div>
          </div>
          
          <div className="text-right text-white">
            <div className="text-sm opacity-80">Pontuação</div>
            <div className="text-2xl font-bold">{gameState.score}</div>
          </div>
        </div>
      </div>

      {/* 3D Game Scene */}
      <div ref={mountRef} className="w-full h-screen" />

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <Card className="p-8 text-center max-w-md mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-primary">
              {gameState.lives <= 0 ? 'Game Over!' : 'Vitória!'}
            </h2>
            <p className="text-xl mb-6">
              Pontuação Final: <span className="font-bold text-accent">{gameState.score}</span>
            </p>
            <div className="space-y-3">
              <Button 
                onClick={startGame}
                className="hero-button text-white border-0 w-full"
              >
                Jogar Novamente
              </Button>
              <Button 
                onClick={resetGame}
                variant="outline"
                className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Menu Principal
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Controls Help */}
      <div className="absolute bottom-4 left-4 text-white/80 text-sm">
        <p>🎮 Setas: Mover | ⚔️ Ctrl+R: Atacar | 🍽️ Ctrl+C: Comer</p>
      </div>
    </div>
  );
};

export default CrocodileGame3D;
