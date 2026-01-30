import {
  LayoutDashboard,
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
              {/* <!-- Menu Item Dashboard --> */}
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
                Analytics
              </NavLink>
              {/* <!-- Menu Item Dashboard --> */}

              {/* <!-- Menu Item Users --> */}
              <li>
                <NavLink
                  to="/admin/users"
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
                  <Users />
                  Users
                </NavLink>
              </li>
              {/* <!-- Menu Item Users --> */}

              {/* <!-- Menu Item Settings --> */}
              <li>
                <NavLink
                  to="/admin/settings"
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
                  <Settings />
                  Settings
                </NavLink>
              </li>
              {/* <!-- Menu Item Settings --> */}
            </ul>
          </div>
        </nav>
        {/* <!-- Sidebar Menu --> */}
      </div>
    </aside>
  );
};

export default Sidebar;
