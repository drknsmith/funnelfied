import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if mobile
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // Device-specific dismissal key
    const deviceType = mobile ? 'mobile' : 'desktop';
    const dismissalKey = `pwa-banner-dismissed-${deviceType}`;

    // Check if banner was dismissed recently for this device type
    const dismissedAt = localStorage.getItem(dismissalKey);
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 1) {
        return; // Don't show for 1 day after dismissal (reduced from 7)
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS Safari which doesn't support beforeinstallprompt
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    if (isIOS && !isInStandaloneMode && !standalone) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Device-specific dismissal
    const deviceType = isMobile ? 'mobile' : 'desktop';
    localStorage.setItem(`pwa-banner-dismissed-${deviceType}`, new Date().toISOString());
  };

  const handleLearnMore = () => {
    setShowBanner(false);
    navigate('/install');
  };

  if (!showBanner || isStandalone) {
    return null;
  }

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {isMobile ? (
          <Smartphone className="h-5 w-5 shrink-0" />
        ) : (
          <Monitor className="h-5 w-5 shrink-0" />
        )}
        <span className="text-sm">
          {isMobile 
            ? 'Install Funnelfied for quick access on your phone'
            : 'Install Funnelfied as a desktop app for faster access'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {deferredPrompt ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInstall}
            className="shrink-0"
          >
            <Download className="h-4 w-4 mr-1" />
            Install
          </Button>
        ) : isIOS ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleLearnMore}
            className="shrink-0"
          >
            Learn How
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleLearnMore}
            className="shrink-0"
          >
            Learn More
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDismiss}
          className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
