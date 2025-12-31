import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Monitor, Smartphone, Share, MoreVertical, PlusSquare, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import logoPrimary from '@/assets/logo-primary.png';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>('checking...');
  
  const { user } = useAuth();

  useEffect(() => {
    // Check if running as standalone PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detect mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          setServiceWorkerStatus('registered');
        } else {
          setServiceWorkerStatus('not registered');
        }
      }).catch(() => {
        setServiceWorkerStatus('error');
      });
    } else {
      setServiceWorkerStatus('not supported');
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Wrapper component that conditionally uses AppLayout
  const PageWrapper = ({ children }: { children: React.ReactNode }) => {
    if (user) {
      return <AppLayout>{children}</AppLayout>;
    }
    return (
      <div className="min-h-screen bg-secondary/30">
        <div className="border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto py-4 px-4 flex justify-center">
            <img src={logoPrimary} alt="Funnelfied" className="h-8 w-auto" />
          </div>
        </div>
        {children}
      </div>
    );
  };

  if (isStandalone) {
    return (
      <PageWrapper>
        <div className="container mx-auto py-8 px-4 max-w-3xl">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Already Installed!</CardTitle>
              <CardDescription>
                You're currently using Funnelfied as an installed app.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Get the Funnelfied App</h1>
          <p className="text-muted-foreground">
            Install Funnelfied on your device for quick access and a native app experience.
          </p>
        </div>

        {/* Quick Install Button */}
        {deferredPrompt && !installed && (
          <Card className="mb-8 border-primary">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-semibold text-lg mb-1">Quick Install Available</h3>
                  <p className="text-muted-foreground text-sm">
                    Your browser supports one-click installation.
                  </p>
                </div>
                <Button onClick={handleInstall} size="lg" className="gap-2">
                  <Download className="h-5 w-5" />
                  Install Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {installed && (
          <Card className="mb-8 border-green-500 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 justify-center">
                <Check className="h-6 w-6 text-green-500" />
                <p className="font-medium">Installation started! Check your device for the app.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform-specific instructions */}
        <div className="grid gap-6">
          {/* Desktop Instructions */}
          <Card className={!isMobile ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Monitor className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-lg">Desktop (Chrome, Edge)</CardTitle>
                  {!isMobile && (
                    <span className="text-xs text-primary font-medium">You're on desktop</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                <li>Look for the <strong className="text-foreground">install icon</strong> in the address bar (right side)</li>
                <li>Click the icon and select <strong className="text-foreground">"Install"</strong></li>
                <li>The app will open in its own window</li>
              </ol>
              {deferredPrompt && !isMobile && (
                <Button onClick={handleInstall} className="w-full gap-2 mt-4">
                  <Download className="h-4 w-4" />
                  Install for Desktop
                </Button>
              )}
            </CardContent>
          </Card>

          {/* iOS Instructions */}
          <Card className={isIOS ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-lg">iPhone & iPad (Safari)</CardTitle>
                  {isIOS && (
                    <span className="text-xs text-primary font-medium">You're on iOS</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span>1.</span>
                  <span>Tap the <Share className="inline h-4 w-4 text-foreground" /> <strong className="text-foreground">Share</strong> button at the bottom of Safari</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>2.</span>
                  <span>Scroll down and tap <PlusSquare className="inline h-4 w-4 text-foreground" /> <strong className="text-foreground">"Add to Home Screen"</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span>3.</span>
                  <span>Tap <strong className="text-foreground">"Add"</strong> in the top right corner</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Android Instructions */}
          <Card className={isMobile && !isIOS ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-lg">Android (Chrome)</CardTitle>
                  {isMobile && !isIOS && (
                    <span className="text-xs text-primary font-medium">You're on Android</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span>1.</span>
                  <span>Tap the <MoreVertical className="inline h-4 w-4 text-foreground" /> <strong className="text-foreground">menu</strong> (three dots) in Chrome</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>2.</span>
                  <span>Tap <strong className="text-foreground">"Install app"</strong> or <strong className="text-foreground">"Add to Home screen"</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span>3.</span>
                  <span>Confirm by tapping <strong className="text-foreground">"Install"</strong></span>
                </li>
              </ol>
              {deferredPrompt && isMobile && !isIOS && (
                <Button onClick={handleInstall} className="w-full gap-2 mt-4">
                  <Download className="h-4 w-4" />
                  Install for Android
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Why Install?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                Quick access from your home screen
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                Works offline
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                Faster loading times
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                Full-screen experience
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Troubleshooting Section */}
        <Card className="mt-8">
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Troubleshooting</CardTitle>
              {showTroubleshooting ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {showTroubleshooting && (
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  If you don't see the install button, try the following:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Make sure you're using a supported browser (Chrome, Edge, or Safari)</li>
                  <li>Clear your browser cache and reload the page</li>
                  <li>Wait a few seconds for the install prompt to appear</li>
                </ul>
              </div>

              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>

              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Status:</p>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Service Worker:</span>
                    <span className={serviceWorkerStatus === 'registered' ? 'text-green-500' : 'text-amber-500'}>
                      {serviceWorkerStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Install Prompt:</span>
                    <span className={deferredPrompt ? 'text-green-500' : 'text-amber-500'}>
                      {deferredPrompt ? 'available' : 'not available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Display Mode:</span>
                    <span>{isStandalone ? 'standalone' : 'browser'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
};

export default Install;
