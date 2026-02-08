import { routes } from "wasp/client/router";
import type { NavigationItem } from "./NavBar";

// Build navigation items dynamically based on context
export const buildNavigationItems = (
  isAuthenticated: boolean,
  isLandingPage: boolean
): NavigationItem[] => {
  const items: NavigationItem[] = [];

  // Show Dashboard first when authenticated
  if (isAuthenticated) {
    items.push({ name: "Dashboard", to: routes.DemoAppRoute.to });
  }

  // Show Features only on landing page
  if (isLandingPage) {
    items.push({ name: "Features", to: "/#features" });
  }

  // Always show Pricing last
  items.push({ name: "Pricing", to: routes.PricingPageRoute.to });

  return items;
};
