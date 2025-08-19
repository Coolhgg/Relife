// React Router mock for testing navigation

/**
 * Comprehensive React Router mock for testing navigation and routing
 * Provides all hooks and components used in the application with proper jest mocks
 */

import * as React from "react";

// Mock navigation state
let mockNavigationState = {
  location: {
    pathname: "/",
    search: "",
    hash: "",
    state: null,
    key: "default",
  },
  history: [] as string[],
  params: {} as Record<string, string>,
  searchParams: new URLSearchParams(),
  isNavigating: false,
};

// Mock navigate function
const mockNavigate = jest.fn((to: string | number | any, options?: any) => {
  if (typeof to === "number") {
    // Navigate back/forward
    console.log(
      `🔙 Mock navigate: ${to > 0 ? "forward" : "back"} ${Math.abs(to)}`,
    );
    return;
  }

  if (typeof to === "string") {
    console.log(`➡️ Mock navigate to: ${to}`, options);
    mockNavigationState.location.pathname = to;
    mockNavigationState.history.push(to);
  } else if (to && typeof to === "object") {
    console.log("➡️ Mock navigate with object:", to, options);
    if (to.pathname) mockNavigationState.location.pathname = to.pathname;
    if (to.search) mockNavigationState.location.search = to.search;
    if (to.hash) mockNavigationState.location.hash = to.hash;
    if (to.state) mockNavigationState.location.state = to.state;
  }

  // Simulate navigation options
  if (options?.replace) {
    console.log("🔄 Mock navigate: replacing current entry");
    mockNavigationState.history[mockNavigationState.history.length - 1] =
      mockNavigationState.location.pathname;
  }

  if (options?.state) {
    mockNavigationState.location.state = options.state;
  }
});

// useNavigate hook mock
export const useNavigate = jest.fn(() => {
  console.log("🧭 Mock useNavigate hook called");
  return mockNavigate;
});

// useLocation hook mock
export const useLocation = jest.fn(() => {
  console.log("📍 Mock useLocation hook called");
  return {
    ...mockNavigationState.location,
    pathname: mockNavigationState.location.pathname,
    search: mockNavigationState.location.search,
    hash: mockNavigationState.location.hash,
    state: mockNavigationState.location.state,
    key: mockNavigationState.location.key || "default",
  };
});

// useParams hook mock
export const useParams = jest.fn(() => {
  console.log("🏷️ Mock useParams hook called");
  return mockNavigationState.params;
});

// useSearchParams hook mock
export const useSearchParams = jest.fn(() => {
  console.log("🔍 Mock useSearchParams hook called");

  const setSearchParams = jest.fn(
    (params: URLSearchParams | Record<string, string> | string) => {
      if (params instanceof URLSearchParams) {
        mockNavigationState.searchParams = params;
        mockNavigationState.location.search = params.toString();
      } else if (typeof params === "object") {
        mockNavigationState.searchParams = new URLSearchParams(params);
        mockNavigationState.location.search =
          mockNavigationState.searchParams.toString();
      } else if (typeof params === "string") {
        mockNavigationState.searchParams = new URLSearchParams(params);
        mockNavigationState.location.search = params;
      }
      console.log(
        "🔍 Mock setSearchParams:",
        mockNavigationState.location.search,
      );
    },
  );

  return [mockNavigationState.searchParams, setSearchParams];
});

// useRoutes hook mock
export const useRoutes = jest.fn((routes: any[], locationArg?: any) => {
  console.log("🗺️ Mock useRoutes hook called", routes.length, "routes");

  // Simple route matching for testing
  const currentPath = mockNavigationState.location.pathname;
  const matchedRoute = routes.find((route) => {
    if (route.path === currentPath) return true;
    if (route.path === "*") return true;
    if (
      route.path?.includes(":") &&
      currentPath.startsWith(route.path.split(":")[0])
    )
      return true;
    return false;
  });

  if (matchedRoute?.element) {
    console.log(`🎯 Mock route matched: ${matchedRoute.path}`);
    return matchedRoute.element;
  }

  console.log("❌ Mock no route matched");
  return null;
});

// BrowserRouter component mock
export const BrowserRouter = jest.fn(({ children, basename }: any) => {
  console.log(
    "🌐 Mock BrowserRouter rendered",
    basename ? `with basename: ${basename}` : "",
  );
  return React.createElement(
    "div",
    { "data-testid": "mock-browser-router" },
    children,
  );
});

// Router component mock
export const Router = jest.fn(({ children, location, navigator }: any) => {
  console.log("🌐 Mock Router rendered");
  return React.createElement("div", { "data-testid": "mock-router" }, children);
});

// Routes component mock
export const Routes = jest.fn(({ children, location }: any) => {
  console.log("🗺️ Mock Routes rendered");
  return React.createElement("div", { "data-testid": "mock-routes" }, children);
});

// Route component mock
export const Route = jest.fn(({ path, element, index, children }: any) => {
  console.log(`🛤️ Mock Route: ${path || (index ? "index" : "no path")}`);
  return React.createElement(
    "div",
    {
      "data-testid": "mock-route",
      "data-path": path || (index ? "index" : ""),
    },
    element || children,
  );
});

// Link component mock
export const Link = jest.fn(
  ({ to, children, replace, state, className, style, ...props }: any) => {
    console.log(
      `🔗 Mock Link to: ${typeof to === "string" ? to : JSON.stringify(to)}`,
    );

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      console.log(`👆 Mock Link clicked: ${to}`);
      mockNavigate(to, { replace, state });
    };

    return React.createElement(
      "a",
      {
        "data-testid": "mock-link",
        "data-to": typeof to === "string" ? to : JSON.stringify(to),
        className,
        style,
        href: typeof to === "string" ? to : to.pathname || "#",
        onClick: handleClick,
        ...props,
      },
      children,
    );
  },
);

// NavLink component mock
export const NavLink = jest.fn(
  ({
    to,
    children,
    className,
    style,
    activeClassName,
    activeStyle,
    end,
    caseSensitive,
    ...props
  }: any) => {
    console.log(
      `🔗 Mock NavLink to: ${typeof to === "string" ? to : JSON.stringify(to)}`,
    );

    const currentPath = mockNavigationState.location.pathname;
    const linkPath = typeof to === "string" ? to : to.pathname;

    // Simple active state calculation
    let isActive = false;
    if (end) {
      isActive = currentPath === linkPath;
    } else {
      isActive = currentPath.startsWith(linkPath);
    }

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      console.log(`👆 Mock NavLink clicked: ${to}`);
      mockNavigate(to);
    };

    const finalClassName =
      typeof className === "function"
        ? className({ isActive, isPending: mockNavigationState.isNavigating })
        : [className, isActive && activeClassName].filter(Boolean).join(" ");

    const finalStyle =
      typeof style === "function"
        ? style({ isActive, isPending: mockNavigationState.isNavigating })
        : { ...style, ...(isActive ? activeStyle : {}) };

    return React.createElement(
      "a",
      {
        "data-testid": "mock-navlink",
        "data-to": typeof to === "string" ? to : JSON.stringify(to),
        "data-active": isActive,
        className: finalClassName,
        style: finalStyle,
        href: linkPath || "#",
        onClick: handleClick,
        ...props,
      },
      children,
    );
  },
);

// Navigate component mock
export const Navigate = jest.fn(({ to, replace, state }: any) => {
  console.log(`🚀 Mock Navigate component: ${to}`, { replace, state });

  React.useEffect(() => {
    mockNavigate(to, { replace, state });
  }, [to, replace, state]);

  return null;
});

// Outlet component mock
export const Outlet = jest.fn(({ context }: any) => {
  console.log("🔌 Mock Outlet rendered", context ? "with context" : "");
  return React.createElement(
    "div",
    {
      "data-testid": "mock-outlet",
      "data-context": context ? JSON.stringify(context) : undefined,
    },
    "Mock Outlet Content",
  );
});

// useOutletContext hook mock
export const useOutletContext = jest.fn(() => {
  console.log("🔌 Mock useOutletContext hook called");
  return {};
});

// useNavigationType hook mock
export const useNavigationType = jest.fn(() => {
  console.log("🧭 Mock useNavigationType hook called");
  return "PUSH"; // Default to PUSH navigation
});

// useResolvedPath hook mock
export const useResolvedPath = jest.fn((to: string) => {
  console.log(`🎯 Mock useResolvedPath: ${to}`);
  return {
    pathname: to,
    search: "",
    hash: "",
  };
});

// matchPath function mock
export const matchPath = jest.fn((pattern: any, pathname: string) => {
  console.log(
    `🎯 Mock matchPath: ${JSON.stringify(pattern)} against ${pathname}`,
  );

  if (typeof pattern === "string") {
    if (pattern === pathname) {
      return {
        params: {},
        pathname,
        pattern: { path: pattern, caseSensitive: false, end: true },
      };
    }
    return null;
  }

  // Handle pattern object
  const patternPath = pattern.path || pattern;
  if (patternPath === pathname) {
    return {
      params: {},
      pathname,
      pattern: {
        path: patternPath,
        caseSensitive: false,
        end: true,
        ...pattern,
      },
    };
  }

  return null;
});

// generatePath function mock
export const generatePath = jest.fn(
  (path: string, params?: Record<string, string>) => {
    console.log(`🛠️ Mock generatePath: ${path}`, params);

    if (!params) return path;

    let generatedPath = path;
    Object.entries(params).forEach(([key, value]) => {
      generatedPath = generatedPath.replace(`:${key}`, value);
      generatedPath = generatedPath.replace(`{${key}}`, value);
    });

    return generatedPath;
  },
);

// createBrowserRouter function mock
export const createBrowserRouter = jest.fn((routes: any[], options?: any) => {
  console.log("🏗️ Mock createBrowserRouter", routes.length, "routes", options);
  return {
    routes,
    options,
    navigate: mockNavigate,
    location: mockNavigationState.location,
    _isMockRouter: true,
  };
});

// RouterProvider component mock
export const RouterProvider = jest.fn(({ router, fallbackElement }: any) => {
  console.log("🎭 Mock RouterProvider rendered");
  return React.createElement(
    "div",
    {
      "data-testid": "mock-router-provider",
    },
    "Mock Router Provider Content",
  );
});

// Internal methods for testing
export const _mockRouterSetup = {
  setLocation: (
    pathname: string,
    search?: string,
    hash?: string,
    state?: any,
  ) => {
    mockNavigationState.location.pathname = pathname;
    if (search !== undefined) mockNavigationState.location.search = search;
    if (hash !== undefined) mockNavigationState.location.hash = hash;
    if (state !== undefined) mockNavigationState.location.state = state;
    console.log(
      `📍 Mock location set: ${pathname}${search || ""}${hash || ""}`,
    );
  },

  setParams: (params: Record<string, string>) => {
    mockNavigationState.params = params;
    console.log("🏷️ Mock params set:", params);
  },

  setSearchParams: (
    searchParams: URLSearchParams | string | Record<string, string>,
  ) => {
    if (typeof searchParams === "string") {
      mockNavigationState.searchParams = new URLSearchParams(searchParams);
      mockNavigationState.location.search = searchParams;
    } else if (searchParams instanceof URLSearchParams) {
      mockNavigationState.searchParams = searchParams;
      mockNavigationState.location.search = searchParams.toString();
    } else {
      mockNavigationState.searchParams = new URLSearchParams(searchParams);
      mockNavigationState.location.search =
        mockNavigationState.searchParams.toString();
    }
    console.log(
      "🔍 Mock search params set:",
      mockNavigationState.location.search,
    );
  },

  getHistory: () => {
    return [...mockNavigationState.history];
  },

  clearHistory: () => {
    mockNavigationState.history = [];
    console.log("🧹 Mock router history cleared");
  },

  reset: () => {
    mockNavigationState = {
      location: {
        pathname: "/",
        search: "",
        hash: "",
        state: null,
        key: "default",
      },
      history: [],
      params: {},
      searchParams: new URLSearchParams(),
      isNavigating: false,
    };
    console.log("🧹 Mock router reset");
  },
};

// Default export for jest.mock
export default {
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
  useRoutes,
  BrowserRouter,
  Router,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  Outlet,
  useOutletContext,
  useNavigationType,
  useResolvedPath,
  matchPath,
  generatePath,
  createBrowserRouter,
  RouterProvider,
  _mockRouterSetup,
};
