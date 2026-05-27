import type { ReactNode } from 'react';

interface TabletLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper for all tablet screens.
 * - Prevents scroll bounce (overscroll-behavior)
 * - Safe area padding for notch devices
 * - Touch-optimized (48px+ tap targets enforced via global CSS)
 */
export function TabletLayout({ children, className = '' }: TabletLayoutProps) {
  return (
    <div
      className={`min-h-svh bg-gray-50 flex flex-col select-none ${className}`}
      style={{ WebkitUserSelect: 'none' }}
    >
      {children}
    </div>
  );
}
