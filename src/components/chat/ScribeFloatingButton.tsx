import { Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
        'bg-primary/80 backdrop-blur-sm shadow-lg',
        'hover:bg-primary hover:scale-105',
        'transition-all duration-200',
        'flex items-center justify-center'
      )}
      size="icon"
    >
      <Bot className="h-6 w-6" />
      <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 drop-shadow-sm" />
    </Button>
  );
}
