"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface GameOverDialogProps {
  isOpen: boolean;
  score: number;
  lives: number;
  maxLivesPurchased: boolean;
  onRestart: () => void;
  onBuyLife: () => void;
  onWatchAd: () => void;
}

export function GameOverDialog({
  isOpen,
  score,
  maxLivesPurchased,
  onRestart,
  onBuyLife,
  onWatchAd,
}: GameOverDialogProps) {

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="font-body">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline text-3xl text-center text-destructive">
            Bạn đã thất bại!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg text-foreground/80">
            Final Score: <span className="font-bold text-primary">{score}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4 my-4">
          <Button onClick={onBuyLife} disabled={maxLivesPurchased} variant="outline">
            {maxLivesPurchased ? "Max Lives Purchased" : "Mua thêm 1 mạng – 0.99 USD"}
          </Button>
          <Button onClick={onWatchAd} variant="outline">
            Watch Ad for 1 Free Life
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onRestart} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Play Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
