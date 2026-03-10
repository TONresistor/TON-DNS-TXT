// Conditional wrapper for the Telegram WebApp API.
// Telegram injects window.Telegram.WebApp automatically inside a mini-app.
// All exports are no-ops when running outside Telegram.

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  requestFullscreen?: () => void;
  setBottomBarColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (fn: () => void) => void;
    offClick: (fn: () => void) => void;
  };
  MainButton: {
    text: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    setText: (text: string) => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    onClick: (fn: () => void) => void;
    offClick: (fn: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

const tg: TelegramWebApp | undefined =
  typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

export const isTelegram = !!tg;

export function tgReady(): void { tg?.ready(); }
export function tgExpand(): void { tg?.expand(); }
export function tgRequestFullscreen(): void { tg?.requestFullscreen?.(); }
export function tgSetBottomBarColor(color: string): void { tg?.setBottomBarColor?.(color); }
export function tgSetBackgroundColor(color: string): void { tg?.setBackgroundColor?.(color); }

export const BackButton = {
  show: () => tg?.BackButton.show(),
  hide: () => tg?.BackButton.hide(),
  onClick: (fn: () => void) => tg?.BackButton.onClick(fn),
  offClick: (fn: () => void) => tg?.BackButton.offClick(fn),
};

export const MainButton = {
  show: () => tg?.MainButton.show(),
  hide: () => tg?.MainButton.hide(),
  enable: () => tg?.MainButton.enable(),
  disable: () => tg?.MainButton.disable(),
  setText: (text: string) => tg?.MainButton.setText(text),
  setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => tg?.MainButton.setParams(params),
  showProgress: (leaveActive?: boolean) => tg?.MainButton.showProgress(leaveActive),
  hideProgress: () => tg?.MainButton.hideProgress(),
  onClick: (fn: () => void) => tg?.MainButton.onClick(fn),
  offClick: (fn: () => void) => tg?.MainButton.offClick(fn),
};

export const haptic = {
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') =>
    tg?.HapticFeedback.impactOccurred(style),
  notification: (type: 'error' | 'success' | 'warning') =>
    tg?.HapticFeedback.notificationOccurred(type),
  selection: () => tg?.HapticFeedback.selectionChanged(),
};
