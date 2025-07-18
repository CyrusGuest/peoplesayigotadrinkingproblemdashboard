import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation } from "react-router";

// Icons
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, closeMobileSidebar } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Filter navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        icon: <GridIcon />,
        name: "Dashboard",
        path: "/",
      },
      {
        icon: <UserCircleIcon />,
        name: "Profile",
        path: "/profile",
      },
    ];

    // Admin-specific items
    if (user?.role === 'admin') {
      baseItems.push(
        { name: 'Creators', icon: <TableIcon />, path: '/creators' },
        { name: 'Deliverables', icon: <TableIcon />, path: '/deliverables' }
      );
    }

    return baseItems;
  };

  const getOthersItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      // Removed UI Elements and Analytics items
    ];

    // Admin-specific items
    if (user?.role === 'admin') {
      baseItems.push(
        { name: 'User Management', icon: <PlugInIcon />, path: '/admin/users' },
        { name: 'System Settings', icon: <PlugInIcon />, path: '/admin/settings' },
        { name: 'Reports', icon: <PlugInIcon />, path: '/admin/reports' }
      );
    }

    return baseItems;
  };

  const navItems = useMemo(() => getNavItems(), [user?.role]);
  const othersItems = useMemo(() => getOthersItems(), [user?.role]);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // Auto-open submenu based on current route
  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, navItems, othersItems]);

  // Calculate submenu height
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {isExpanded && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {isExpanded && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
                onClick={closeMobileSidebar}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {isExpanded && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && isExpanded && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                      onClick={closeMobileSidebar}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  if (!user) {
    return null; // Don't render sidebar if user is not authenticated
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed h-screen left-0 top-0 z-40 w-64 transform border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-dark lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:fixed lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white/90"
            >
              <span className="text-2xl">🎯</span>
              {isExpanded && <span>InfluencerHub</span>}
            </Link>
            <button
              onClick={closeMobileSidebar}
              className="lg:hidden"
            >
              <HorizontaLDots />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-8">
              {/* Main Navigation */}
              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {isExpanded && "Main Menu"}
                </h3>
                {renderMenuItems(navItems, "main")}
                {/* Creator Tools Heading and Links */}
                {user?.role === 'creator' && (
                  <>
                    <h3 className="mt-8 mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {isExpanded && "Creator Tools"}
                    </h3>
                    <ul className="flex flex-col gap-4">
                      <li>
                        <Link to="/my-deliverables" className={`menu-item group ${isActive('/my-deliverables') ? 'menu-item-active' : 'menu-item-inactive'}`}
                          onClick={closeMobileSidebar}>
                          <span className={`menu-item-icon-size ${isActive('/my-deliverables') ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}`}>
                            <TableIcon />
                          </span>
                          {isExpanded && <span className="menu-item-text">My Deliverables</span>}
                        </Link>
                      </li>
                      <li>
                        <Link to="/earnings" className={`menu-item group ${isActive('/earnings') ? 'menu-item-active' : 'menu-item-inactive'}`}
                          onClick={closeMobileSidebar}>
                          <span className={`menu-item-icon-size ${isActive('/earnings') ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}`}>
                            <TableIcon />
                          </span>
                          {isExpanded && <span className="menu-item-text">Earnings</span>}
                        </Link>
                      </li>
                    </ul>
                  </>
                )}
              </div>

              {/* Other Navigation */}
              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {isExpanded && "Other"}
                </h3>
                {renderMenuItems(othersItems, "others")}
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
