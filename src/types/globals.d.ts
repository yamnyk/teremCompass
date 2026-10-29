interface DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

// lib.dom declares the DeviceOrientationEvent constructor as an anonymous type, so the
// iOS-only static cannot be merged in; consumers cast to this instead.
interface DeviceOrientationEventConstructorWithPermission {
  requestPermission?: () => Promise<"granted" | "denied">;
}

interface Navigator {
  standalone?: boolean;
}

interface Window {
  webkitAudioContext: typeof AudioContext;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
  deviceorientationabsolute: DeviceOrientationEvent;
}
