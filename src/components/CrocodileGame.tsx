import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import crocodileSprite from '@/assets/crocodile-character.png';
import swampBackground from '@/assets/swamp-background.jpg';
import treasuresImage from '@/assets/treasures.png';
import { toast } from 'sonner';

interface Position {
  x: number;
  y: number;
}

interface GameItem {
  id: number;
  position: Position;
  type: 'treasure' | 'danger';
}

const CrocodileGame = () => {
  const [crocodilePos, setCrocodilePos] = useState<Position>({ x: 50, y: 300 });
  const [gameItems, setGameItems] = useState<GameItem[]>([]);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Generate random game items
  const generateItems = useCallback(() => {
    const items: GameItem[] = [];
    for (let i = 0; i < 8; i++) {
      items.push({
        id: i,
        position: {
          x: 200 + Math.random() * 600,
          y: 150 + Math.random() * 300,
        },
        type: Math.random() > 0.3 ? 'treasure' : 'danger',
      });
    }
    setGameItems(items);
  }, []);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      const speed = 15;
      setCrocodilePos(prev => {
        let newX = prev.x;
        let newY = prev.y;

        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            newY = Math.max(50, prev.y - speed);
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            newY = Math.min(450, prev.y + speed);
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            newX = Math.max(20, prev.x - speed);
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            newX = Math.min(780, prev.x + speed);
            break;
        }

        return { x: newX, y: newY };
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  // Check for collisions
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    gameItems.forEach(item => {
      const distance = Math.sqrt(
        Math.pow(crocodilePos.x - item.position.x, 2) +
        Math.pow(crocodilePos.y - item.position.y, 2)
      );

      if (distance < 50) {
        if (item.type === 'treasure') {
          setScore(prev => prev + 10);
          toast.success('Tesouro coletado! +10 pontos');
          setGameItems(prev => prev.filter(i => i.id !== item.id));
        } else {
          setGameOver(true);
          toast.error('Oh não! Você tocou em algo perigoso!');
        }
      }
    });
  }, [crocodilePos, gameItems, gameStarted, gameOver]);

  // Check win condition
  useEffect(() => {
    if (gameStarted && !gameOver && gameItems.filter(item => item.type === 'treasure').length === 0) {
      setGameOver(true);
      toast.success(`Parabéns! Você coletou todos os tesouros! Pontuação final: ${score}`);
    }
  }, [gameItems, gameStarted, gameOver, score]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setCrocodilePos({ x: 50, y: 300 });
    generateItems();
    toast.success('Aventura iniciada! Use as setas ou WASD para mover');
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setCrocodilePos({ x: 50, y: 300 });
    setGameItems([]);
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-game-bg flex items-center justify-center p-8">
        <Card className="p-8 text-center max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Crocodilo Adventure
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Ajude o crocodilo amigável a coletar todos os tesouros do pântano!
            <br />
            Evite os perigos e colete as moedas douradas.
          </p>
          <div className="space-y-4">
            <Button 
              onClick={startGame}
              size="lg"
              className="hero-button text-white border-0 px-8 py-4 text-lg font-semibold"
            >
              Começar Aventura
            </Button>
            <div className="text-sm text-muted-foreground">
              <p>🎮 Use as setas ou WASD para mover</p>
              <p>💰 Colete tesouros para ganhar pontos</p>
              <p>⚠️ Evite os perigos vermelhos</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-game-bg relative overflow-hidden">
      {/* Game Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${swampBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Game HUD */}
      <div className="relative z-10 p-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-primary">
          Pontuação: {score}
        </div>
        <Button 
          onClick={resetGame}
          variant="outline"
          className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          Menu Principal
        </Button>
      </div>

      {/* Game Area */}
      <div className="relative w-full h-[500px] mx-auto max-w-4xl game-container rounded-2xl overflow-hidden">
        {/* Crocodile */}
        <div
          className="absolute crocodile-sprite transition-all duration-200 ease-out"
          style={{
            left: `${crocodilePos.x}px`,
            top: `${crocodilePos.y}px`,
            width: '80px',
            height: '80px',
          }}
        >
          <img 
            src={crocodileSprite} 
            alt="Crocodilo" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Game Items */}
        {gameItems.map(item => (
          <div
            key={item.id}
            className={`absolute game-item ${item.type === 'treasure' ? 'treasure' : 'danger'}`}
            style={{
              left: `${item.position.x}px`,
              top: `${item.position.y}px`,
              width: '40px',
              height: '40px',
            }}
          >
            {item.type === 'treasure' ? (
              <img 
                src={treasuresImage} 
                alt="Tesouro" 
                className="w-full h-full object-contain opacity-90"
              />
            ) : (
              <div className="w-full h-full bg-game-danger rounded-full shadow-lg border-2 border-red-600 animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <Card className="p-8 text-center max-w-md mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-primary">
              {gameItems.filter(item => item.type === 'treasure').length === 0 ? 'Vitória!' : 'Fim de Jogo!'}
            </h2>
            <p className="text-xl mb-6">
              Pontuação Final: <span className="font-bold text-accent">{score}</span>
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

      {/* Instructions */}
      <div className="absolute bottom-6 left-6 text-sm text-primary/80">
        <p>🎮 Setas ou WASD para mover</p>
      </div>
    </div>
  );
};

export default CrocodileGame;