"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export type RopeSkin = {
  id: string;
  name: string;
  color: string;
  price: string;
};

const availableSkins: RopeSkin[] = [
  { id: 'default', name: 'Classic White', color: '#FFFFFF', price: 'Free' },
  { id: 'neon-blue', name: 'Neon Blue', color: '#00BFFF', price: '0.99 USD' },
  { id: 'fabric', name: 'Fabric Weave', color: '#D2B48C', price: '0.99 USD' },
  { id: 'metal', name: 'Metal Chain', color: '#C0C0C0', price: '0.99 USD' },
];

interface ShopDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectSkin: (skinId: string) => void;
  currentSkin: string;
}

export function ShopDialog({ isOpen, onOpenChange, onSelectSkin, currentSkin }: ShopDialogProps) {
  const { toast } = useToast();

  const handlePurchase = (skin: RopeSkin) => {
    // Simulate purchase
    toast({
        title: "Purchase Simulated",
        description: `You can now equip ${skin.name}.`,
    });
    // In a real app you'd unlock the skin. Here we just select it.
    onSelectSkin(skin.id);
    onOpenChange(false);
  };

  const handleSelect = (skin: RopeSkin) => {
    onSelectSkin(skin.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="font-body">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Cosmetic Upgrades</DialogTitle>
          <DialogDescription>
            Purchase or select a new rope skin.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {availableSkins.map((skin) => (
            <Card key={skin.id} className={currentSkin === skin.id ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle className="text-base">{skin.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-16 rounded flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                   <div className="w-3/4 h-2 rounded-full" style={{ backgroundColor: skin.color }}></div>
                </div>
              </CardContent>
              <CardFooter>
                 {skin.price === 'Free' ? (
                   <Button className="w-full" onClick={() => handleSelect(skin)} disabled={currentSkin === skin.id}>
                     {currentSkin === skin.id ? 'Equipped' : 'Select'}
                   </Button>
                 ) : (
                   <Button className="w-full" onClick={() => handlePurchase(skin)}>
                     {`Buy ${skin.price}`}
                   </Button>
                 )}
              </CardFooter>
            </Card>
          ))}
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-base">5 Skin Bundle</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Get all premium skins in a bundle.</p></CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => {
                toast({ title: "Purchase Simulated", description: "All skins unlocked!"});
                onOpenChange(false);
              }}>Buy - 3.99 USD</Button>
            </CardFooter>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
