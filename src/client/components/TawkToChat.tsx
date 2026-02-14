import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: Date;
  }
}

interface TawkToChatProps {
  propertyId: string;
  widgetId: string;
  user?: {
    email?: string | null;
    username?: string | null;
    id?: string;
  } | null;
}

export function TawkToChat({ propertyId, widgetId, user }: TawkToChatProps) {
  const location = useLocation();

  useEffect(() => {
    // Initialize Tawk.to
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Load Tawk.to script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    // Set user data when Tawk.to loads
    window.Tawk_API.onLoad = function() {
      if (user) {
        if (user.email) {
          window.Tawk_API.setAttributes({
            email: user.email,
            name: user.username || 'User',
            userId: user.id || '',
          });
        }
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Remove Tawk widget
      const tawkWidget = document.getElementById('tawkchat-container');
      if (tawkWidget) {
        tawkWidget.remove();
      }
    };
  }, [propertyId, widgetId, user]);

  // Hide chat on auth pages
  useEffect(() => {
    const shouldHide = location.pathname.includes('/login') ||
                       location.pathname.includes('/signup') ||
                       location.pathname.includes('/request-password-reset');

    if (window.Tawk_API && window.Tawk_API.hideWidget) {
      if (shouldHide) {
        window.Tawk_API.hideWidget();
      } else {
        window.Tawk_API.showWidget();
      }
    }
  }, [location.pathname]);

  return null; // No UI - Tawk.to injects its own widget
}
