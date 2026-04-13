/**
 * @file App.tsx
 * @description Root application component and router for Clippy v3.0.0.
 *
 * ROUTING
 * -------
 * Clippy uses wouter with useHashLocation so that all routing is handled
 * via the URL hash fragment (e.g. /#/, /#/share/BASE64). This is required
 * for correct operation after static file deployment — path-based routing
 * breaks on S3/CDN when there's no server-side routing fallback.
 *
 * ROUTES
 * ------
 * /          → Home       — main 3-step analysis wizard
 * /share/:payload → ShareView — read-only shared results viewer
 * *          → NotFound   — 404 fallback
 *
 * V2 NEW ROUTE: /share/:payload
 * The share URL system encodes results as base64 JSON in the URL hash.
 * ShareView.tsx decodes the `:payload` parameter and renders the results
 * in read-only mode. No API key or server required.
 *
 * ARCHITECTURE NOTE
 * -----------------
 * The `hook={useHashLocation}` prop is placed on `<Router>`, NOT on `<Switch>`.
 * This is a critical wouter requirement — `<Switch>` ignores the hook prop,
 * so placing it there causes all routing to silently fail after deployment.
 */

import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n";
import Home from "@/pages/Home";
import ShareView from "@/pages/ShareView";
import NotFound from "@/pages/not-found";

/**
 * Inner routes component — declared separately to keep App() clean.
 * All routes must be registered here.
 */
function AppRoutes() {
  return (
    <Switch>
      {/* Main application wizard */}
      <Route path="/" component={Home} />

      {/* Shared results viewer — `:payload` is the base64-encoded SharePayload */}
      <Route path="/share/:payload" component={ShareView} />

      {/* 404 fallback — catches any unmatched hash route */}
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Root application component.
 *
 * Provides:
 *   - TanStack Query context (for API mutations, if any future backend calls are added)
 *   - Hash-based router (useHashLocation — required for static deployment)
 *   - shadcn/ui Toaster (for toast notifications in Home.tsx)
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/*
       * I18nProvider wraps the entire app so any component can call useI18n().
       * It also applies dir="rtl" / lang attributes to <html> on locale change.
       */}
      <I18nProvider>
        {/* Router with hash-location hook — required for static hosting compatibility */}
        <Router hook={useHashLocation}>
          <AppRoutes />
        </Router>
        {/* Global toast overlay — rendered outside the router so it survives route changes */}
        <Toaster />
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
