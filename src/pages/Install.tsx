import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Monitor, Smartphone, Share, MoreVertical, PlusSquare, Check } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

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

  if (isStandalone) {
    return (
      <AppLayout>
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
      </AppLayout>
    );
  }

  return (
    <AppLayout>
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
      </div>
    </AppLayout>
  );
};

export default Install;
