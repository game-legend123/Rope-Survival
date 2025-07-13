"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShoppingCart, Settings, Heart } from 'lucide-react';
import { getNewSawPattern } from '@/app/actions';
import { GameOverDialog } from './game-over-dialog';
import { ShopDialog } from './shop-dialog';
import { useToast } from "@/hooks/use-toast";
import { type SawPattern } from '@/lib/types';
import { Button } from '@/components/ui/button';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GRAVITY = 0.5;
const DAMPING = 0.995;
const SAW_RADIUS = 40;
const BALL_RADIUS = 15;
const INITIAL_LIVES = 1;
const MAX_PURCHASED_LIVES = 3;

// Game states
const GameState = {
  Playing: 'playing',
  GameOver: 'gameOver',
  Paused: 'paused',
};

// Main component
const RopeSurvivalGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const lastTime = useRef<number>(0);
  const { toast } = useToast();

  // Game state
  const [gameState, setGameState] = useState(GameState.Playing);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [purchasedLives, setPurchasedLives] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  
  // Modals
  const [isShopOpen, setShopOpen] = useState(false);

  // Rope and Ball state
  const ropeAnchor = useRef({ x: GAME_WIDTH / 2, y: 0 });
  const ropeLength = useRef(200);
  const ball = useRef({
    x: GAME_WIDTH / 2,
    y: ropeLength.current,
    px: GAME_WIDTH / 2,
    py: ropeLength.current - 1,
  });

  // Saw state
  const saw = useRef<SawPattern & { x: number, y: number, angle: number, vx: number, time: number }>({
    x: 0,
    y: GAME_HEIGHT - SAW_RADIUS,
    angle: 0,
    vx: 2,
    pattern: 'steady horizontal',
    speedMultiplier: 1,
    time: 0,
  });
  
  // Customization
  const [currentSkinId, setCurrentSkinId] = useState('default');
  const ropeColor = useRef('#FFFFFF');
  
  // Load state from localStorage
  useEffect(() => {
    const savedSkin = localStorage.getItem('ropeSurvivalSkin');
    if (savedSkin) {
      handleSelectSkin(savedSkin, false);
    }
    const savedPurchasedLives = parseInt(localStorage.getItem('ropeSurvivalPurchasedLives') || '0', 10);
    setPurchasedLives(savedPurchasedLives);
  }, []);

  const handleSelectSkin = (skinId: string, showToast: boolean = true) => {
    localStorage.setItem('ropeSurvivalSkin', skinId);
    setCurrentSkinId(skinId);
    let skinName = 'Classic White';
    if (skinId === 'default') ropeColor.current = '#FFFFFF';
    if (skinId === 'neon-blue') { ropeColor.current = '#00BFFF'; skinName = 'Neon Blue'; }
    if (skinId === 'fabric') { ropeColor.current = '#D2B48C'; skinName = 'Fabric Texture'; }
    if (skinId === 'metal') { ropeColor.current = '#C0C0C0'; skinName = 'Metal Chain'; }

    if (showToast) {
        toast({
            title: "Skin Equipped!",
            description: `You've equipped ${skinName}.`,
        });
    }
  }

  // AI Difficulty Progression
  useEffect(() => {
    if (gameState !== GameState.Playing) return;
    
    const interval = setInterval(async () => {
      const newDifficulty = difficulty + 1;
      setDifficulty(newDifficulty);
      toast({
        title: `Stage ${newDifficulty}`,
        description: 'The saw is getting more dangerous!',
      });
      const newPattern = await getNewSawPattern({ difficulty: newDifficulty });
      saw.current.pattern = newPattern.pattern;
      saw.current.speedMultiplier = newPattern.speedMultiplier;
      saw.current.time = 0; // Reset time for patterns that use it
    }, 15000);

    return () => clearInterval(interval);
  }, [gameState, difficulty, toast]);

  // Game Loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!canvasRef.current) return;
    if (!lastTime.current) lastTime.current = timestamp;
    const deltaTime = (timestamp - lastTime.current) / 1000;
    lastTime.current = timestamp;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx || gameState !== GameState.Playing) {
      if (gameState !== GameState.GameOver) {
         animationFrameId.current = requestAnimationFrame(gameLoop);
      }
      return;
    }
    
    setScore(prev => prev + 1);
    
    // --- UPDATE PHYSICS ---
    const { x, y, px, py } = ball.current;
    let vx = (x - px) * DAMPING;
    let vy = (y - py) * DAMPING;
    ball.current.px = x;
    ball.current.py = y;
    ball.current.x += vx;
    ball.current.y += vy;
    ball.current.y += GRAVITY;

    const dx = ball.current.x - ropeAnchor.current.x;
    const dy = ball.current.y - ropeAnchor.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const diff = ropeLength.current - dist;
    const percent = diff / dist / 2;
    const offsetX = dx * percent;
    const offsetY = dy * percent;

    ball.current.x += offsetX;
    ball.current.y += offsetY;

    saw.current.angle += 0.2;
    saw.current.time += deltaTime;
    const speed = saw.current.speedMultiplier * 2;
    switch(saw.current.pattern) {
      case 'zig-zag':
      case 'accelerated zig-zag':
        saw.current.x += saw.current.vx * speed;
        if(saw.current.x > GAME_WIDTH - SAW_RADIUS || saw.current.x < SAW_RADIUS) saw.current.vx *= -1;
        saw.current.y = GAME_HEIGHT - SAW_RADIUS - Math.abs(Math.sin(saw.current.x / 100)) * 50;
        break;
      case 'sinusoidal wave':
      case 'complex wave':
        saw.current.x = (GAME_WIDTH/2) + Math.sin(saw.current.time * speed / 2) * (GAME_WIDTH / 2 - SAW_RADIUS);
        break;
      default:
        saw.current.x += saw.current.vx * speed;
        if (saw.current.x > GAME_WIDTH - SAW_RADIUS || saw.current.x < SAW_RADIUS) saw.current.vx *= -1;
    }

    const ballSawDx = ball.current.x - saw.current.x;
    const ballSawDy = ball.current.y - saw.current.y;
    const distance = Math.sqrt(ballSawDx * ballSawDx + ballSawDy * ballSawDy);

    if (distance < BALL_RADIUS + SAW_RADIUS) {
      if (lives - 1 > 0) {
        setLives(l => l - 1);
        ball.current.x = GAME_WIDTH/2;
        ball.current.y = 100;
        ball.current.px = GAME_WIDTH/2;
        ball.current.py = 99;
        toast({ title: 'Ouch!', description: 'You lost a life!', variant: 'destructive'});
      } else {
        setLives(0);
        setGameState(GameState.GameOver);
        canvasRef.current.style.animation = 'shake 0.5s';
        setTimeout(() => {
          if(canvasRef.current) canvasRef.current.style.animation = '';
        }, 500);
        return;
      }
    }


    // --- DRAWING ---
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.beginPath();
    ctx.moveTo(ropeAnchor.current.x, ropeAnchor.current.y);
    ctx.lineTo(ball.current.x, ball.current.y);
    ctx.strokeStyle = ropeColor.current;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ball.current.x, ball.current.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.shadowColor = 'hsl(var(--primary))';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.translate(saw.current.x, saw.current.y);
    ctx.rotate(saw.current.angle);
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const x_ = Math.cos(angle) * SAW_RADIUS;
        const y_ = Math.sin(angle) * SAW_RADIUS;
        const x2_ = Math.cos(angle + (Math.PI*2/32)) * (SAW_RADIUS - 10);
        const y2_ = Math.sin(angle + (Math.PI*2/32)) * (SAW_RADIUS - 10);
        ctx.moveTo(x2_, y2_);
        ctx.lineTo(x_, y_);
    }
    ctx.closePath();
    ctx.fillStyle = '#C0C0C0';
    ctx.fill();
    ctx.strokeStyle = 'hsl(var(--destructive))';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
    
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [gameState, lives, toast, difficulty]);

  useEffect(() => {
    if (gameState === GameState.Playing) {
      lastTime.current = 0;
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, gameLoop]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== GameState.Playing) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const forceX = (mouseX - ropeAnchor.current.x) * 0.002;
    ball.current.x += forceX;
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) ropeLength.current = Math.max(100, ropeLength.current - 20);
  }
  
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
     if (e.button === 0) ropeLength.current = Math.min(300, ropeLength.current + 20);
  }

  const restartGame = () => {
    setScore(0);
    setLives(INITIAL_LIVES);
    setDifficulty(1);
    const savedPurchasedLives = parseInt(localStorage.getItem('ropeSurvivalPurchasedLives') || '0', 10);
    setPurchasedLives(savedPurchasedLives);
    
    ball.current = {
      x: GAME_WIDTH / 2, y: 200, px: GAME_WIDTH / 2, py: 199,
    };
    saw.current = {
      x: 0, y: GAME_HEIGHT - SAW_RADIUS, angle: 0, vx: 2, pattern: 'steady horizontal', speedMultiplier: 1, time: 0,
    };
    
    setGameState(GameState.Playing);
  };
  
  const buyLife = () => {
    if (purchasedLives < MAX_PURCHASED_LIVES) {
      toast({ title: "Purchase Simulated", description: "You got an extra life!" });
      const newPurchasedCount = purchasedLives + 1;
      setPurchasedLives(newPurchasedCount);
      localStorage.setItem('ropeSurvivalPurchasedLives', newPurchasedCount.toString());
      setLives(1); // Give one life to continue
      setGameState(GameState.Playing);
    } else {
      toast({ title: "Max lives purchased", description: "You cannot buy more lives this round.", variant: "destructive" });
    }
  };
  
  const watchAdForLife = () => {
    toast({ title: "Ad Finished", description: "You earned a free life!" });
    setLives(1); // Give one life to continue
    setGameState(GameState.Playing);
  };

  return (
    <div className="relative font-body" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
        <h1 className="text-4xl font-headline font-bold text-white [text-shadow:_0_2px_4px_rgb(0_0_0_/_50%)]">SCORE: {Math.floor(score/10)}</h1>
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-2 text-2xl font-bold text-red-500 bg-black/30 px-3 py-1 rounded-lg">
            <Heart className="text-destructive fill-destructive" />
            <span>{lives}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShopOpen(true)}>
            <ShoppingCart className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="bg-background rounded-lg shadow-2xl border-2 border-border cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      <GameOverDialog
        isOpen={gameState === GameState.GameOver}
        score={Math.floor(score/10)}
        lives={lives}
        maxLivesPurchased={purchasedLives >= MAX_PURCHASED_LIVES}
        onRestart={restartGame}
        onBuyLife={buyLife}
        onWatchAd={watchAdForLife}
      />
      <ShopDialog
        isOpen={isShopOpen}
        onOpenChange={setShopOpen}
        onSelectSkin={handleSelectSkin}
        currentSkin={currentSkinId}
      />
    </div>
  );
};

export default RopeSurvivalGame;
