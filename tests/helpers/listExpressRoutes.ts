import type { Express } from "express";

export interface ListedRoute {
  method: string;
  path: string;
}

type Layer = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
  };
  name?: string;
  handle?: { stack?: Layer[] };
  regexp?: RegExp;
};

/**
 * Walk Express 4/5 router layers and collect method + path pairs.
 * Paths from nested routers are absolute in this app (routers register full paths).
 */
export function listExpressRoutes(app: Express): ListedRoute[] {
  const stack = (app as Express & { router?: { stack?: Layer[] }; _router?: { stack?: Layer[] } })
    .router?.stack
    ?? (app as Express & { _router?: { stack?: Layer[] } })._router?.stack
    ?? [];

  const routes: ListedRoute[] = [];

  const visit = (layers: Layer[]): void => {
    for (const layer of layers) {
      if (layer.route?.path) {
        for (const [method, enabled] of Object.entries(layer.route.methods)) {
          if (enabled) {
            routes.push({
              method: method.toLowerCase(),
              path: normalizePath(layer.route.path),
            });
          }
        }
        continue;
      }

      if (layer.name === "router" && layer.handle?.stack) {
        visit(layer.handle.stack);
      }
    }
  };

  visit(stack);
  return routes;
}

function normalizePath(path: string | string[]): string {
  const value = Array.isArray(path) ? path[0] : path;
  if (!value) return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

export function listedRouteKeys(routes: ListedRoute[]): Set<string> {
  return new Set(routes.map((route) => `${route.method} ${route.path}`));
}
