import { useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { routes } from "wasp/client/router";
import { Toaster } from "../client/components/ui/toaster";
import "./Main.css";
import NavBar from "./components/NavBar/NavBar";
import { buildNavigationItems } from "./components/NavBar/constants";
import CookieConsentBanner from "./components/cookie-consent/Banner";
/**
 * use this component to wrap all child components
 * this is useful for templates, themes, and context
 */
export default function App() {
    const location = useLocation();
    const { data: user } = useAuth();
    const isLandingPage = useMemo(() => {
        return location.pathname === "/";
    }, [location]);
    const navigationItems = useMemo(() => {
        return buildNavigationItems(!!user, isLandingPage);
    }, [user, isLandingPage]);
    const shouldDisplayAppNavBar = useMemo(() => {
        return (location.pathname !== routes.LoginRoute.build() &&
            location.pathname !== routes.SignupRoute.build());
    }, [location]);
    const isAdminDashboard = useMemo(() => {
        return location.pathname.startsWith("/admin");
    }, [location]);
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace("#", "");
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView();
            }
        }
    }, [location]);
    return (<>
      <div className="bg-background text-foreground min-h-screen">
        {isAdminDashboard ? (<Outlet />) : (<>
            {shouldDisplayAppNavBar && (<NavBar navigationItems={navigationItems}/>)}
            <div className="mx-auto max-w-screen-2xl">
              <Outlet />
            </div>
          </>)}
      </div>
      <Toaster position="bottom-right"/>
      <CookieConsentBanner />
    </>);
}
//# sourceMappingURL=App.jsx.map