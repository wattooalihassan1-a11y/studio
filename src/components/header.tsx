import { Fuel } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center">
        <div className="flex items-center space-x-3">
          <Fuel className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            FuelTrack Pro
          </h1>
        </div>
      </div>
    </header>
  );
}
