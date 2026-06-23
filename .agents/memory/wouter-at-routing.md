---
name: Wouter v3 at-sign routing
description: Wouter v3 (^3.3.5) cannot match route patterns starting with /@; workaround uses a catch-all component and useLocation()
---

## The Rule
Never use `/@:param` as a Wouter route pattern. Wouter v3's path-to-regexp treats `@` specially and the route silently falls through to NotFound.

**Why:** In production, navigating to `/@betty` showed the app's 404 page even though `<Route path="/@:slug" component={Profile} />` was in the Switch. The `@` prefix conflicts with Wouter v3's internal path compilation.

## How to Apply
Replace pattern-based `/@:slug` routes with a catch-all component that checks `useLocation()`:

```tsx
function AtProfileRoute() {
  const [location] = useLocation();
  if (location.startsWith('/@')) return <Profile />;
  return <NotFound />;
}
// In Switch (as the last route, replacing <Route component={NotFound} />):
<Route component={AtProfileRoute} />
```

And in the Profile component, extract the slug via regex from `useLocation()`:
```tsx
const [location] = useLocation()
const atSlug = location.match(/^\/@([^/?#]+)/)?.[1]
const slug = params?.slug ?? atSlug
```

The `useRoute('/profile/:slug')` continues to work normally for `/profile/` paths.
