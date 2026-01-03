import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import scribeIcon from '@/assets/scribe-icon.png';

interface ScribeFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function ScribeFloatingButton({ onClick, isOpen }: ScribeFloatingButtonProps) {
  if (isOpen) return null;

  return (
    <Button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full',
        'bg-white/90 backdrop-blur-sm shadow-lg border border-border',
        'hover:bg-white hover:scale-105',
        'transition-all duration-200',
        'flex items-center justify-center'
      )}
      size="icon"
    >
      <img src={scribeIcon} alt="Scribe AI" className="h-8 w-8 object-contain" />
      <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400 drop-shadow-sm animate-pulse opacity-90" />
    </Button>
  );
}
