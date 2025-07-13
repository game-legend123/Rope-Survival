"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShoppingCart, Settings, Heart, MessageSquareText } from 'lucide-react';
import { getNewSawPattern, getAICommentary } from '@/app/actions';
import { GameOverDialog } from './game-over-dialog';
import { ShopDialog } from './shop-dialog';
import { useToast } from "@/hooks/use-toast";
import { type Saw, type SawPattern } from '@/lib/types';
import { Button } from '@/components/ui/button';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GRAVITY = 0.5;
const DAMPING = 0.995;
const SAW_RADIUS = 40;
const BALL_RADIUS = 15;
const INITIAL_LIVES = 3;
const MAX_PURCHASED_LIVES = 3;

const GameState = {
  Playing: 'playing',
  GameOver: 'gameOver',
  Paused: 'paused',
};

type BallExpression = 'normal' | 'scared' | 'relieved';
const NEAR_MISS_DISTANCE = SAW_RADIUS * 2.5;

const RopeSurvivalGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const lastTime = useRef<number>(0);
  const { toast } = useToast();

  const [gameState, setGameState] = useState(GameState.Playing);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [purchasedLives, setPurchasedLives] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [commentary, setCommentary] = useState('');
  
  const [isShopOpen, setShopOpen] = useState(false);

  const ropeAnchor = useRef({ x: GAME_WIDTH / 2, y: 0 });
  const ropeLength = useRef(200);
  const ball = useRef({
    x: GAME_WIDTH / 2,
    y: ropeLength.current,
    px: GAME_WIDTH / 2,
    py: ropeLength.current - 1,
  });
  const [ballExpression, setBallExpression] = useState<BallExpression>('normal');
  const expressionTimeout = useRef<NodeJS.Timeout>();

  const [saws, setSaws] = useState<Saw[]>([]);

  const [currentSkinId, setCurrentSkinId] = useState('default');
  const ropeColor = useRef('#FFFFFF');

  const fetchCommentary = useCallback(async (event: 'lostLife' | 'levelUp' | 'gameStart' | 'gameOver' | 'nearMiss') => {
      const currentScore = Math.floor(score / 10);
      try {
        const result = await getAICommentary({ score: currentScore, difficulty, event });
        if (result.commentary) {
          setCommentary(result.commentary);
        }
      } catch (e) {
        console.error(e);
      }
  }, [score, difficulty]);
  
  useEffect(() => {
    const savedSkin = localStorage.getItem('ropeSurvivalSkin');
    if (savedSkin) {
      handleSelectSkin(savedSkin, false);
    }
    const savedPurchasedLives = parseInt(localStorage.getItem('ropeSurvivalPurchasedLives') || '0', 10);
    setPurchasedLives(savedPurchasedLives);
    fetchCommentary('gameStart');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectSkin = (skinId: string, showToast: boolean = true) => {
    localStorage.setItem('ropeSurvivalSkin', skinId);
    setCurrentSkinId(skinId);
    let skinName = 'Classic White';
    if (skinId === 'default') ropeColor.current = '#FFFFFF';
    if (skinId === 'neon-blue') { ropeColor.current = '#00BFFF'; skinName = 'Neon Blue'; }
    if (skinId === 'fabric') { ropeColor.current = '#D2B48C'; skinName = 'Fabric Weave'; }
    if (skinId === 'metal') { ropeColor.current = '#C0C0C0'; skinName = 'Metal Chain'; }

    if (showToast) {
        toast({
            title: "Skin Equipped!",
            description: `You've equipped ${skinName}.`,
        });
    }
  }

  const addNewSaw = useCallback(async (patternData: SawPattern) => {
    const edges: ('top' | 'bottom' | 'left' | 'right')[] = ['bottom', 'left', 'right', 'top'];
    const spawnEdge = edges[Math.floor(Math.random() * edges.length)];

    const newSaw: Saw = {
      id: Date.now() + Math.random(),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      time: 0,
      spawnEdge,
      ...patternData,
    };

    switch (spawnEdge) {
        case 'bottom':
            newSaw.x = Math.random() * GAME_WIDTH;
            newSaw.y = GAME_HEIGHT + SAW_RADIUS;
            newSaw.vx = (Math.random() - 0.5) * 4;
            newSaw.vy = -2;
            break;
        case 'top':
            newSaw.x = Math.random() * GAME_WIDTH;
            newSaw.y = -SAW_RADIUS;
            newSaw.vx = (Math.random() - 0.5) * 4;
            newSaw.vy = 2;
            break;
        case 'left':
            newSaw.x = -SAW_RADIUS;
            newSaw.y = Math.random() * GAME_HEIGHT;
            newSaw.vx = 2;
            newSaw.vy = (Math.random() - 0.5) * 4;
            break;
        case 'right':
            newSaw.x = GAME_WIDTH + SAW_RADIUS;
            newSaw.y = Math.random() * GAME_HEIGHT;
            newSaw.vx = -2;
            newSaw.vy = (Math.random() - 0.5) * 4;
            break;
    }

    setSaws(prevSaws => [...prevSaws, newSaw]);
  }, []);

  useEffect(() => {
    if (gameState !== GameState.Playing) return;

    const manageSaws = async () => {
        const newDifficulty = Math.floor(score / 100) + 1; // Faster difficulty increase
        if(newDifficulty > difficulty) {
            setDifficulty(newDifficulty);
            fetchCommentary('levelUp');
        }

        const maxSaws = Math.min(1 + Math.floor(difficulty / 2), 6);

        if (saws.length < maxSaws) {
            try {
                const newPattern = await getNewSawPattern({ difficulty });
                addNewSaw(newPattern);
            } catch (error) {
                console.error("Failed to add new saw:", error);
                // Add a default saw on error
                addNewSaw({ pattern: 'steady', speedMultiplier: 1 + difficulty * 0.5});
            }
        }
    };
    
    const interval = setInterval(manageSaws, 2000); // More frequent saw spawning

    return () => clearInterval(interval);
  }, [gameState, difficulty, score, saws.length, addNewSaw, fetchCommentary]);

  const updateBallExpression = useCallback((distance: number) => {
    clearTimeout(expressionTimeout.current);
    if (distance < NEAR_MISS_DISTANCE) {
        setBallExpression('scared');
    } else if (ballExpression === 'scared') {
        setBallExpression('relieved');
        expressionTimeout.current = setTimeout(() => setBallExpression('normal'), 500);
    }
  }, [ballExpression]);

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
    
    let minDistanceToSaw = Infinity;

    const updatedSaws = saws.map(saw => {
        saw.angle += 0.25;
        saw.time += deltaTime;
        const speed = saw.speedMultiplier;
        
        const targetX = ball.current.x;
        const targetY = ball.current.y;
        
        // All saws now have homing behavior
        const homingFactor = 0.015 * speed;
        saw.vx += (targetX - saw.x) * homingFactor * 0.1;
        saw.vy += (targetY - saw.y) * homingFactor * 0.1;

        // Cap velocity
        const maxSpeed = 5 * speed;
        const currentSpeed = Math.sqrt(saw.vx**2 + saw.vy**2);
        if (currentSpeed > maxSpeed) {
            saw.vx = (saw.vx / currentSpeed) * maxSpeed;
            saw.vy = (saw.vy / currentSpeed) * maxSpeed;
        }
        
        saw.x += saw.vx;
        saw.y += saw.vy;

        // Random reversal for higher difficulty saws
        if (saw.pattern.includes('reversal') && Math.random() < 0.015) {
           if (Math.random() > 0.5) saw.vx *= -1.2;
           else saw.vy *= -1.2;
        }

        // Screen wrap
        if (saw.x < -SAW_RADIUS) saw.x = GAME_WIDTH + SAW_RADIUS;
        if (saw.x > GAME_WIDTH + SAW_RADIUS) saw.x = -SAW_RADIUS;
        if (saw.y < -SAW_RADIUS) saw.y = GAME_HEIGHT + SAW_RADIUS;
        if (saw.y > GAME_HEIGHT + SAW_RADIUS) saw.y = -SAW_RADIUS;

        const ballSawDx = ball.current.x - saw.x;
        const ballSawDy = ball.current.y - saw.y;
        const distance = Math.sqrt(ballSawDx * ballSawDx + ballSawDy * ballSawDy);
        minDistanceToSaw = Math.min(minDistanceToSaw, distance);

        if (distance < BALL_RADIUS + SAW_RADIUS) {
            if (lives - 1 > 0) {
                fetchCommentary('lostLife');
                setLives(l => l - 1);
                ball.current.x = GAME_WIDTH / 2;
                ball.current.y = 100;
                ball.current.px = GAME_WIDTH / 2;
                ball.current.py = 99;
                return null;
            } else {
                fetchCommentary('gameOver');
                setLives(0);
                setGameState(GameState.GameOver);
                canvasRef.current.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    if (canvasRef.current) canvasRef.current.style.animation = '';
                }, 500);
                return null; 
            }
        }
        return saw;
    }).filter((saw): saw is Saw => saw !== null);

    if (minDistanceToSaw < NEAR_MISS_DISTANCE * 2 && minDistanceToSaw > SAW_RADIUS + BALL_RADIUS) {
        fetchCommentary('nearMiss');
    }
    updateBallExpression(minDistanceToSaw);

    setSaws(updatedSaws);


    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.beginPath();
    ctx.moveTo(ropeAnchor.current.x, ropeAnchor.current.y);
    ctx.lineTo(ball.current.x, ball.current.y);
    ctx.strokeStyle = ropeColor.current;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw ball with expression
    ctx.beginPath();
    ctx.arc(ball.current.x, ball.current.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.shadowColor = 'hsl(var(--primary))';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Eyes
    const eyeOffsetX = BALL_RADIUS * 0.3;
    const eyeOffsetY = BALL_RADIUS * 0.2;
    const eyeRadius = BALL_RADIUS * 0.15;
    ctx.fillStyle = '#000';
    if(ballExpression === 'scared'){
        // Wide eyes
        ctx.beginPath();
        ctx.arc(ball.current.x - eyeOffsetX, ball.current.y - eyeOffsetY, eyeRadius * 1.5, 0, Math.PI * 2);
        ctx.arc(ball.current.x + eyeOffsetX, ball.current.y - eyeOffsetY, eyeRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
    } else if (ballExpression === 'relieved') {
        // Relaxed eyes (like ^ ^)
        ctx.beginPath();
        ctx.moveTo(ball.current.x - eyeOffsetX - eyeRadius, ball.current.y - eyeOffsetY + eyeRadius);
        ctx.lineTo(ball.current.x - eyeOffsetX, ball.current.y - eyeOffsetY - eyeRadius);
        ctx.lineTo(ball.current.x - eyeOffsetX + eyeRadius, ball.current.y - eyeOffsetY + eyeRadius);
        ctx.moveTo(ball.current.x + eyeOffsetX - eyeRadius, ball.current.y - eyeOffsetY + eyeRadius);
        ctx.lineTo(ball.current.x + eyeOffsetX, ball.current.y - eyeOffsetY - eyeRadius);
        ctx.lineTo(ball.current.x + eyeOffsetX + eyeRadius, ball.current.y - eyeOffsetY + eyeRadius);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

    } else {
        // Normal eyes
        ctx.beginPath();
        ctx.arc(ball.current.x - eyeOffsetX, ball.current.y - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.arc(ball.current.x + eyeOffsetX, ball.current.y - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
    }


    saws.forEach(saw => {
        ctx.save();
        ctx.translate(saw.x, saw.y);
        ctx.rotate(saw.angle);
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
    });
    
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [gameState, lives, toast, difficulty, fetchCommentary, saws, updateBallExpression]);

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
    setCommentary('');
    setSaws([]);
    fetchCommentary('gameStart');
    const savedPurchasedLives = parseInt(localStorage.getItem('ropeSurvivalPurchasedLives') || '0', 10);
    setPurchasedLives(savedPurchasedLives);
    
    ball.current = {
      x: GAME_WIDTH / 2, y: 200, px: GAME_WIDTH / 2, py: 199,
    };
    
    setGameState(GameState.Playing);
  };
  
  const buyLife = () => {
    if (purchasedLives < MAX_PURCHASED_LIVES) {
      toast({ title: "Purchase Simulated", description: "You got an extra life!" });
      const newPurchasedCount = purchasedLives + 1;
      setPurchasedLives(newPurchasedCount);
      localStorage.setItem('ropeSurvivalPurchasedLives', newPurchasedCount.toString());
      setLives(1);
      setGameState(GameState.Playing);
    } else {
      toast({ title: "Max lives purchased", description: "You cannot buy more lives this round.", variant: "destructive" });
    }
  };
  
  const watchAdForLife = () => {
    toast({ title: "Ad Finished", description: "You earned a free life!" });
    setLives(1);
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
        @keyframes fadeInOut {
            0%, 100% { opacity: 0; transform: translateY(10px); }
            10%, 90% { opacity: 1; transform: translateY(0); }
        }
        .commentary {
            animation: fadeInOut 4s ease-in-out forwards;
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

      {commentary && (
        <div key={commentary} className="commentary absolute top-20 left-1/2 -translate-x-1/2 bg-black/50 text-white p-2 rounded-lg flex items-center gap-2 z-20">
            <MessageSquareText className="w-5 h-5 text-primary" />
            <p className="font-bold">{commentary}</p>
        </div>
      )}

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

    