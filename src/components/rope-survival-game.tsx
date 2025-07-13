
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShoppingCart, Settings, Heart, MessageSquareText, Send, Pause, Play } from 'lucide-react';
import { getNewSawPattern, getAICommentary } from '@/app/actions';
import { GameOverDialog } from './game-over-dialog';
import { ShopDialog } from './shop-dialog';
import { useToast } from "@/hooks/use-toast";
import { type Saw, type SawPattern } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GRAVITY = 0.5;
const DAMPING = 0.995;
const SAW_RADIUS = 40;
const BALL_RADIUS = 15;
const INITIAL_LIVES = 3;
const MAX_PURCHASED_LIVES = 3;
const SAW_COUNT = 3;

const GameState = {
  Playing: 'playing',
  GameOver: 'gameOver',
  Paused: 'paused',
};

type BallExpression = 'normal' | 'scared' | 'relieved';
const NEAR_MISS_DISTANCE = SAW_RADIUS * 2.5;

interface RopeSurvivalGameProps {
  isPlayerControlled: boolean;
}

// A global event bus to share game state
const globalGameState = {
  saws: [] as Saw[],
  isPaused: false,
  sawListeners: new Set<(saws: Saw[]) => void>(),
  pauseListeners: new Set<(isPaused: boolean) => void>(),
  
  setSaws(saws: Saw[]) {
    this.saws = saws;
    this.sawListeners.forEach(listener => listener(saws));
  },
  subscribeSaws(listener: (saws: Saw[]) => void) {
    this.sawListeners.add(listener);
    return () => this.sawListeners.delete(listener);
  },

  setPaused(isPaused: boolean) {
    if (this.isPaused === isPaused) return;
    this.isPaused = isPaused;
    this.pauseListeners.forEach(listener => listener(isPaused));
  },
  subscribePaused(listener: (isPaused: boolean) => void) {
    this.pauseListeners.add(listener);
    return () => this.pauseListeners.delete(listener);
  }
};


const RopeSurvivalGame = ({ isPlayerControlled }: RopeSurvivalGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const lastTime = useRef<number>(0);
  const { toast } = useToast();

  const [gameState, setGameState] = useState(GameState.Playing);
  const [score, setScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [deathCount, setDeathCount] = useState(0);
  const [purchasedLives, setPurchasedLives] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [commentary, setCommentary] = useState('');
  const [isShopOpen, setShopOpen] = useState(false);
  const [playerMessage, setPlayerMessage] = useState('');

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
  
  useEffect(() => {
    // Player-controlled component manages the saw state
    if (isPlayerControlled) {
      globalGameState.setSaws(saws);
    }
  }, [saws, isPlayerControlled]);

  useEffect(() => {
    const unsubscribeSaws = globalGameState.subscribeSaws((newSaws) => {
      setSaws(newSaws);
    });
    
    const unsubscribePaused = globalGameState.subscribePaused((paused) => {
        setGameState(paused ? GameState.Paused : GameState.Playing);
    });

    return () => {
        unsubscribeSaws();
        unsubscribePaused();
    };
  }, []);


  const [currentSkinId, setCurrentSkinId] = useState('default');
  const ropeColor = useRef('#FFFFFF');

  const fetchCommentary = useCallback(async (event: 'lostLife' | 'levelUp' | 'gameStart' | 'gameOver' | 'nearMiss', playerMessage?: string) => {
      if (!isPlayerControlled) return;
      if (gameState === GameState.GameOver) return;
      const currentScore = Math.floor(score);
      try {
        const result = await getAICommentary({ score: currentScore, difficulty, event, playerMessage });
        if (result.commentary) {
          setCommentary(result.commentary);
        }
      } catch (e) {
        console.error(e);
      }
  }, [score, difficulty, isPlayerControlled, gameState]);

  const handlePlayerReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerMessage.trim() || !isPlayerControlled) return;
    fetchCommentary('nearMiss', playerMessage); 
    setPlayerMessage('');
  };
  
  const createNewSaw = useCallback(async (difficultyLevel: number, spawnEdge: 'top' | 'bottom' | 'left' | 'right') => {
    try {
        const patternData = await getNewSawPattern({ difficulty: difficultyLevel });
        
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
                break;
            case 'top':
                newSaw.x = Math.random() * GAME_WIDTH;
                newSaw.y = -SAW_RADIUS;
                break;
            case 'left':
                newSaw.x = -SAW_RADIUS;
                newSaw.y = Math.random() * GAME_HEIGHT;
                break;
            case 'right':
                newSaw.x = GAME_WIDTH + SAW_RADIUS;
                newSaw.y = Math.random() * GAME_HEIGHT;
                break;
        }

        const targetX = ball.current.x + (Math.random() - 0.5) * 200; // Aim near the ball
        const targetY = ball.current.y + (Math.random() - 0.5) * 200;
        const dx = targetX - newSaw.x;
        const dy = targetY - newSaw.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        newSaw.vx = (dx / dist) * 2 * patternData.speedMultiplier;
        newSaw.vy = (dy / dist) * 2 * patternData.speedMultiplier;
        
        return newSaw;
    } catch (error) {
        console.error("Failed to initialize saw:", error);
        return null;
    }
  }, []);

  const initializeSaws = useCallback(async (difficultyLevel: number) => {
      if (!isPlayerControlled) return;
      
      const newSaws: Saw[] = [];
      const spawnEdges: ('left' | 'right')[] = ['left', 'left', 'right'];

      for (let i = 0; i < SAW_COUNT; i++) {
        const edge = spawnEdges[i % spawnEdges.length];
        const newSaw = await createNewSaw(difficultyLevel, edge);
        if (newSaw) newSaws.push(newSaw);
      }

      globalGameState.setSaws(newSaws);
  }, [isPlayerControlled, createNewSaw]);
  
  const resetBall = () => {
    ball.current = {
        x: GAME_WIDTH / 2,
        y: 200,
        px: GAME_WIDTH / 2,
        py: 199,
    };
  }

  const handleLoss = () => {
      if (lives - 1 > 0) {
          if (isPlayerControlled) fetchCommentary('lostLife');
          setLives(l => l - 1);
          resetBall();
          if (isPlayerControlled) {
            const newDeathCount = deathCount + 1;
            setDeathCount(newDeathCount);
          }
      } else {
          if (isPlayerControlled) {
            fetchCommentary('gameOver');
            setLives(0);
            setGameState(GameState.GameOver);
            if (canvasRef.current) {
              canvasRef.current.style.animation = 'shake 0.5s';
              setTimeout(() => {
                  if (canvasRef.current) canvasRef.current.style.animation = '';
              }, 500);
            }
          } else {
            // AI player logic for losing: just resets its own state and continues
            setAiScore(0);
            setDifficulty(1);
            resetBall();
          }
      }
  }


  useEffect(() => {
    if (isPlayerControlled) {
      const savedSkin = localStorage.getItem('ropeSurvivalSkin');
      if (savedSkin) {
        handleSelectSkin(savedSkin, false);
      }
      const savedPurchasedLives = parseInt(localStorage.getItem('ropeSurvivalPurchasedLives') || '0', 10);
      setPurchasedLives(savedPurchasedLives);
      fetchCommentary('gameStart');
      initializeSaws(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayerControlled]);

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

  useEffect(() => {
    if (gameState !== GameState.Playing || !isPlayerControlled) return;

    const manageGame = async () => {
        let currentDifficulty = Math.floor((isPlayerControlled ? score : aiScore) / 100) + 1;
        
        if (isPlayerControlled && deathCount >= 5) {
            currentDifficulty = Math.max(1, currentDifficulty - 2); // Slow down difficulty increase
        }

        if(currentDifficulty > difficulty) {
            setDifficulty(currentDifficulty);
            if(isPlayerControlled) fetchCommentary('levelUp');
            
            const newPattern = await getNewSawPattern({ difficulty: currentDifficulty });
            const currentSaws = globalGameState.saws;
            globalGameState.setSaws(currentSaws.map(saw => ({
                ...saw,
                speedMultiplier: newPattern.speedMultiplier,
                pattern: newPattern.pattern,
            })));
        }
    };
    
    const interval = setInterval(manageGame, 2000); 
    const commentaryInterval = setInterval(() => {
        if (!globalGameState.isPaused) {
            fetchCommentary('nearMiss');
        }
    }, 6000);


    return () => {
        clearInterval(interval);
        clearInterval(commentaryInterval);
    }
  }, [gameState, difficulty, score, aiScore, fetchCommentary, isPlayerControlled, deathCount]);

  const updateBallExpression = useCallback((distance: number) => {
    clearTimeout(expressionTimeout.current);
    if (distance < NEAR_MISS_DISTANCE) {
        setBallExpression('scared');
    } else if (ballExpression === 'scared') {
        setBallExpression('relieved');
        expressionTimeout.current = setTimeout(() => setBallExpression('normal'), 500);
    }
  }, [ballExpression]);

  const aiControlLogic = useCallback(() => {
    if (globalGameState.saws.length === 0) return;

    let closestSaw = globalGameState.saws[0];
    let minDistance = Infinity;

    globalGameState.saws.forEach(saw => {
      const dist = Math.sqrt((ball.current.x - saw.x)**2 + (ball.current.y - saw.y)**2);
      if (dist < minDistance) {
        minDistance = dist;
        closestSaw = saw;
      }
    });
    
    // AI tries to get close for points, but not too close to die
    const avoidanceRadius = SAW_RADIUS * 1.8; 
    const optimalRadius = SAW_RADIUS * 2.5;

    let targetX = ball.current.x;
    let targetY = ropeLength.current;

    // Move away from the saw
    const dx = ball.current.x - closestSaw.x;
    const dy = ball.current.y - closestSaw.y;
    const angle = Math.atan2(dy, dx);
    
    if (minDistance < avoidanceRadius) {
        // Too close, move directly away
        targetX = closestSaw.x + Math.cos(angle) * (avoidanceRadius + 20);
    } else if (minDistance < optimalRadius * 1.5) {
        // Try to maintain optimal distance for points
        targetX = closestSaw.x + Math.cos(angle) * optimalRadius;
    } else {
      // Saw is far, move towards center
      targetX += (GAME_WIDTH / 2 - ball.current.x) * 0.01;
    }
    
    targetX = Math.max(BALL_RADIUS, Math.min(GAME_WIDTH - BALL_RADIUS, targetX));
    targetY = Math.max(50, Math.min(GAME_HEIGHT - 20, targetY));

    const forceX = (targetX - ball.current.x) * 0.02;
    ball.current.x += forceX;
    ropeLength.current = targetY;

  }, []);

  const gameLoop = useCallback(async (timestamp: number) => {
    if (!canvasRef.current) return;
    if (!lastTime.current) lastTime.current = timestamp;
    const deltaTime = (timestamp - lastTime.current) / 1000;
    lastTime.current = timestamp;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx || gameState === GameState.GameOver) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    if (gameState === GameState.Playing) {
      if (!isPlayerControlled) {
        aiControlLogic();
      }
      
      let { x, y, px, py } = ball.current;
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

      // Keep ball within bounds
      if (ball.current.x < BALL_RADIUS) ball.current.x = BALL_RADIUS;
      if (ball.current.x > GAME_WIDTH - BALL_RADIUS) ball.current.x = GAME_WIDTH - BALL_RADIUS;
      if (ball.current.y < BALL_RADIUS) ball.current.y = BALL_RADIUS;
      if (ball.current.y > GAME_HEIGHT - BALL_RADIUS) ball.current.y = GAME_HEIGHT - BALL_RADIUS;

      
      let minDistanceToSaw = Infinity;
      let scoreGainedThisFrame = 0;

      const currentSaws = [...globalGameState.saws];
      const updatedSaws = currentSaws.map(saw => {
          let newSaw = { ...saw };
          newSaw.angle += 0.25;
          newSaw.time += deltaTime;
          const speed = newSaw.speedMultiplier * (isPlayerControlled && deathCount >= 5 ? 0.7 : 1);
          
          const homingFactor = 0.005 * speed;
          newSaw.vx += (ball.current.x - newSaw.x) * homingFactor * 0.1;
          newSaw.vy += (ball.current.y - newSaw.y) * homingFactor * 0.1;

          // Repulsion from other saws
          currentSaws.forEach(otherSaw => {
            if (saw.id !== otherSaw.id) {
                const repDx = newSaw.x - otherSaw.x;
                const repDy = newSaw.y - otherSaw.y;
                let repDist = Math.sqrt(repDx*repDx + repDy*repDy) || 1;
                const minRepelDist = SAW_RADIUS * 4; 
                if (repDist < minRepelDist) {
                    const repelForce = (minRepelDist - repDist) / minRepelDist * 0.2; // increased force
                    newSaw.vx += (repDx / repDist) * repelForce;
                    newSaw.vy += (repDy / repDist) * repelForce;
                }
            }
          });

          const maxSpeed = 3 * speed;
          const currentSpeed = Math.sqrt(newSaw.vx**2 + newSaw.vy**2);
          if (currentSpeed > maxSpeed) {
              newSaw.vx = (newSaw.vx / currentSpeed) * maxSpeed;
              newSaw.vy = (newSaw.vy / currentSpeed) * maxSpeed;
          }
          
          newSaw.x += newSaw.vx;
          newSaw.y += newSaw.vy;

          if (newSaw.pattern.includes('reversal') && Math.random() < 0.015) {
            if (Math.random() > 0.5) newSaw.vx *= -1.2;
            else newSaw.vy *= -1.2;
          }

          if ((newSaw.x - SAW_RADIUS < 0 && newSaw.vx < 0) || (newSaw.x + SAW_RADIUS > GAME_WIDTH && newSaw.vx > 0)) {
              newSaw.vx *= -1;
          }
          if ((newSaw.y - SAW_RADIUS < 0 && newSaw.vy < 0) || (newSaw.y + SAW_RADIUS > GAME_HEIGHT && newSaw.vy > 0)) {
              newSaw.vy *= -1;
          }

          const ballSawDx = ball.current.x - newSaw.x;
          const ballSawDy = ball.current.y - newSaw.y;
          const distance = Math.sqrt(ballSawDx * ballSawDx + ballSawDy * ballSawDy);
          minDistanceToSaw = Math.min(minDistanceToSaw, distance);
          
          const scoringDistance = NEAR_MISS_DISTANCE * 1.5;
          if (distance < scoringDistance) {
              const points = (scoringDistance - distance) / scoringDistance;
              scoreGainedThisFrame += points * 0.2; 
          } else {
              scoreGainedThisFrame += 0.01; // Base score for just surviving
          }

          if (distance < BALL_RADIUS + SAW_RADIUS) {
              handleLoss();
              return newSaw; 
          }
          return newSaw;
      });

      if (isPlayerControlled) {
        setScore(s => s + scoreGainedThisFrame);
      } else {
        setAiScore(s => s + scoreGainedThisFrame);
      }
      
      let finalSaws = updatedSaws;
      if (isPlayerControlled) {
          if (finalSaws.length < SAW_COUNT) {
              const numToAdd = SAW_COUNT - finalSaws.length;
              for (let i = 0; i < numToAdd; i++) {
                  const edges: ('top' | 'bottom' | 'left' | 'right')[] = ['left', 'right', 'top', 'bottom'];
                  const spawnEdge = edges[Math.floor(Math.random() * edges.length)];
                  const newSaw = await createNewSaw(difficulty, spawnEdge);
                  if (newSaw) finalSaws.push(newSaw);
              }
          }
          globalGameState.setSaws(finalSaws);
      }
      
      if (isPlayerControlled && minDistanceToSaw < NEAR_MISS_DISTANCE && Math.random() < 0.02) { 
        if (!globalGameState.isPaused) fetchCommentary('nearMiss');
      }
      updateBallExpression(minDistanceToSaw);
    }


    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.beginPath();
    ctx.moveTo(ropeAnchor.current.x, ropeAnchor.current.y);
    ctx.lineTo(ball.current.x, ball.current.y);
    ctx.strokeStyle = ropeColor.current;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(ball.current.x, ball.current.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = isPlayerControlled ? 'hsl(var(--primary))' : 'hsl(var(--secondary))';
    ctx.shadowColor = isPlayerControlled ? 'hsl(var(--primary))' : 'hsl(var(--secondary))';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    const eyeOffsetX = BALL_RADIUS * 0.3;
    const eyeOffsetY = BALL_RADIUS * 0.2;
    const eyeRadius = BALL_RADIUS * 0.15;
    ctx.fillStyle = '#000';
    if(ballExpression === 'scared'){
        ctx.beginPath();
        ctx.arc(ball.current.x - eyeOffsetX, ball.current.y - eyeOffsetY, eyeRadius * 1.5, 0, Math.PI * 2);
        ctx.arc(ball.current.x + eyeOffsetX, ball.current.y - eyeOffsetY, eyeRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
    } else if (ballExpression === 'relieved') {
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
        ctx.beginPath();
        ctx.arc(ball.current.x - eyeOffsetX, ball.current.y - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.arc(ball.current.x + eyeOffsetX, ball.current.y - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
    }


    globalGameState.saws.forEach(saw => {
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
  }, [gameState, lives, difficulty, fetchCommentary, updateBallExpression, isPlayerControlled, aiControlLogic, handleLoss, score, deathCount, createNewSaw]);

  useEffect(() => {
    lastTime.current = 0;
    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameLoop]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== GameState.Playing || !canvasRef.current || !isPlayerControlled) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    ropeLength.current = Math.max(50, Math.min(GAME_HEIGHT - 20, mouseY));
    const forceX = (mouseX - ball.current.x) * 0.1; // More responsive horizontal movement
    const targetX = ball.current.x + forceX;
    ball.current.x = Math.max(BALL_RADIUS, Math.min(GAME_WIDTH - BALL_RADIUS, targetX));
  };

  const restartGame = () => {
    setScore(0);
    setAiScore(0);
    setLives(INITIAL_LIVES);
    setDeathCount(0);
    setDifficulty(1);
    setCommentary('');
    if (isPlayerControlled) {
      initializeSaws(1);
      fetchCommentary('gameStart');
      const savedPurchasedLives = parseInt(localStorage.getItem('ropeSurvivalPurchasedLives') || '0', 10);
      setPurchasedLives(savedPurchasedLives);
    }
    
    resetBall();
    setGameState(GameState.Playing);
    globalGameState.setPaused(false);
  };
  
  const buyLife = () => {
    if (purchasedLives < MAX_PURCHASED_LIVES) {
      toast({ title: "Purchase Simulated", description: "You got an extra life!" });
      const newPurchasedCount = purchasedLives + 1;
      setPurchasedLives(newPurchasedCount);
      localStorage.setItem('ropeSurvivalPurchasedLives', newPurchasedCount.toString());
      setLives(1);
      setGameState(GameState.Playing);
      globalGameState.setPaused(false);
    } else {
      toast({ title: "Max lives purchased", description: "You cannot buy more lives this round.", variant: "destructive" });
    }
  };
  
  const watchAdForLife = () => {
    toast({ title: "Ad Finished", description: "You earned a free life!" });
    setLives(1);
    setGameState(GameState.Playing);
    globalGameState.setPaused(false);
  };

  const togglePause = () => {
    if (!isPlayerControlled) return;
    globalGameState.setPaused(!globalGameState.isPaused);
  };

  const gameContainerHeight = isPlayerControlled ? GAME_HEIGHT + 100 : GAME_HEIGHT;

  return (
    <div className="relative font-body" style={{ width: GAME_WIDTH, height: gameContainerHeight }}>
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes fadeInOut {
            0%, 100% { opacity: 0; transform: translateY(10px); }
            5%, 95% { opacity: 1; transform: translateY(0); }
        }
        .commentary {
            animation: fadeInOut 5s ease-in-out forwards;
        }
      `}</style>
      
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
          <h1 className="text-4xl font-headline font-bold text-white [text-shadow:_0_2px_4px_rgb(0_0_0_/_50%)]">SCORE: {isPlayerControlled ? Math.floor(score) : Math.floor(aiScore)}</h1>
          {isPlayerControlled && (
            <div className="flex items-center gap-4 pointer-events-auto">
            <div className="flex items-center gap-2 text-2xl font-bold text-red-500 bg-black/30 px-3 py-1 rounded-lg">
                <Heart className="text-destructive fill-destructive" />
                <span>{lives}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={togglePause}>
              {gameState === GameState.Playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShopOpen(true)}>
                <ShoppingCart className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon">
                <Settings className="w-6 h-6" />
            </Button>
            </div>
          )}
      </div>

      {isPlayerControlled && commentary && (
          <div key={commentary} className="commentary absolute top-20 left-1/2 -translate-x-1/2 bg-black/50 text-white p-2 rounded-lg flex items-center gap-2 z-20 text-center max-w-[90%]">
              <MessageSquareText className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="font-bold">{commentary}</p>
          </div>
      )}
      
      {gameState === GameState.Paused && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30 pointer-events-auto">
            <h2 className="text-5xl font-bold text-white">Paused</h2>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="bg-background rounded-lg shadow-2xl border-2 border-border"
        style={{
          cursor: isPlayerControlled ? 'pointer' : 'default',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        onMouseMove={handleMouseMove}
      />

      {isPlayerControlled && (
        <div className="absolute bottom-0 left-0 w-full p-4 bg-background/80 backdrop-blur-sm rounded-b-lg">
            <form onSubmit={handlePlayerReply} className="flex items-center gap-2">
                <Input 
                    type="text"
                    placeholder="Nói gì đó với trợ lý AI..."
                    value={playerMessage}
                    onChange={(e) => setPlayerMessage(e.target.value)}
                    className="bg-background/50 border-border"
                    aria-label="Chat with AI assistant"
                />
                <Button type="submit" size="icon" disabled={!playerMessage.trim()}>
                    <Send className="w-5 h-5" />
                </Button>
            </form>
        </div>
      )}

      {isPlayerControlled && (
        <GameOverDialog
          isOpen={gameState === GameState.GameOver}
          score={Math.floor(score)}
          lives={lives}
          maxLivesPurchased={purchasedLives >= MAX_PURCHASED_LIVES}
          onRestart={restartGame}
          onBuyLife={buyLife}
          onWatchAd={watchAdForLife}
        />
      )}

      {isPlayerControlled && (
          <ShopDialog
            isOpen={isShopOpen}
            onOpenChange={setShopOpen}
            onSelectSkin={handleSelectSkin}
            currentSkin={currentSkinId}
          />
      )}
    </div>
  );
};

export default RopeSurvivalGame;
