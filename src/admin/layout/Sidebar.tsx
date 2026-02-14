import {
  Activity,
  Database,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Logo from "../../client/static/logo.svg";
import { cn } from "../../client/utils";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });


  return (
    <aside
      ref={sidebar}
      className={cn(
        "z-9999 w-72.5 bg-muted absolute left-0 top-0 flex h-screen flex-col overflow-y-hidden border-r duration-300 ease-linear lg:static lg:translate-x-0",
        {
          "translate-x-0": sidebarOpen,
          "-translate-x-full": !sidebarOpen,
        },
      )}
    >
      {/* <!-- SIDEBAR HEADER --> */}
      <div className="py-5.5 lg:py-6.5 flex items-center justify-between gap-2 px-6">
        <NavLink to="/">
          <img src={Logo} alt="Logo" width={50} />
        </NavLink>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden"
        >
          <X />
        </button>
      </div>
      {/* <!-- SIDEBAR HEADER --> */}

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        {/* <!-- Sidebar Menu --> */}
        <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
          {/* <!-- Menu Group --> */}
          <div>
            <h3 className="text-muted-foreground mb-4 ml-4 text-sm font-semibold">
              ADMIN
            </h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              {/* <!-- Menu Item Overview --> */}
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  cn(
                    "text-muted-foreground hover:bg-accent hover:text-accent-foreground group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium duration-300 ease-in-out",
                    {
                      "bg-accent text-accent-foreground": isActive,
                    },
                  )
                }
              >
                <LayoutDashboard />
                Overview
              </NavLink>
              {/* <!-- Menu Item Overview --> */}

              {/* <!-- Menu Item Users --> */}
              <li>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    cn(
                      "text-muted-foreground hover:bg-accent hover:text-accent-foreground group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium duration-300 ease-in-out",
                      {
                        "bg-accent text-accent-foreground": isActive,
                      },
                    )
                  }
                >
                  <Users />
                  Users
                </NavLink>
              </li>
              {/* <!-- Menu Item Users --> */}

              {/* <!-- Menu Item Sync Monitor --> */}
              <li>
                <NavLink
                  to="/admin/sync-monitor"
                  className={({ isActive }) =>
                    cn(
                      "text-muted-foreground hover:bg-accent hover:text-accent-foreground group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium duration-300 ease-in-out",
                      {
                        "bg-accent text-accent-foreground": isActive,
                      },
                    )
                  }
                >
                  <Activity />
                  Sync Monitor
                </NavLink>
              </li>
              {/* <!-- Menu Item Sync Monitor --> */}

              {/* <!-- Menu Item Database --> */}
              <li>
                <NavLink
                  to="/admin/database"
                  className={({ isActive }) =>
                    cn(
                      "text-muted-foreground hover:bg-accent hover:text-accent-foreground group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium duration-300 ease-in-out",
                      {
                        "bg-accent text-accent-foreground": isActive,
                      },
                    )
                  }
                >
                  <Database />
                  Database
                </NavLink>
              </li>
              {/* <!-- Menu Item Database --> */}

              {/* <!-- Menu Item Settings --> */}
              <li>
                <NavLink
                  to="/admin/settings"
                  className={({ isActive }) =>
                    cn(
                      "text-muted-foreground hover:bg-accent hover:text-accent-foreground group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium duration-300 ease-in-out",
                      {
                        "bg-accent text-accent-foreground": isActive,
                      },
                    )
                  }
                >
                  <Settings />
                  Settings
                </NavLink>
              </li>
              {/* <!-- Menu Item Settings --> */}

              {/* <!-- Menu Item Support Chat --> */}
              <li>
                <a
                  href="https://dashboard.tawk.to/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:bg-accent hover:text-accent-foreground group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium duration-300 ease-in-out"
                >
                  <MessageSquare />
                  <span className="flex-1">Support Chat</span>
                  <svg
                    className="w-3 h-3 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </li>
              {/* <!-- Menu Item Support Chat --> */}
            </ul>
          </div>
        </nav>
        {/* <!-- Sidebar Menu --> */}
      </div>
    </aside>
  );
};

export default Sidebar;
