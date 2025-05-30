# SSR Zustand Fix Documentation

## Problem

The application was experiencing a critical error during server-side rendering (SSR):

```
Uncaught Error: Cannot find module './vendor-chunks/zustand.js'
```

## Root Cause

The error occurred because Zustand stores were being accessed during server-side rendering, but Zustand is a client-side only state management library. The specific issue was:

1. The main page (`src/app/page.tsx`) imports `TypeSpecificProposalCard`
2. `TypeSpecificProposalCard` imports `HolidayCharityCard`
3. `HolidayCharityCard` uses `useCharityStore()` from Zustand
4. During SSR, Next.js tries to render this component on the server, but Zustand stores don't exist on the server
5. This causes the module resolution error for `./vendor-chunks/zustand.js`

## Solution

We implemented a client-side rendering guard using the following approach:

### 1. Created a Utility Hook (`src/hooks/useClientOnly.ts`)

```typescript
import { useEffect, useState } from 'react';

export const useClientOnly = (): boolean => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
};

export const useClientStore = <T>(storeHook: () => T): T | null => {
  const isClient = useClientOnly();

  if (!isClient) {
    return null;
  }

  return storeHook();
};
```

### 2. Updated Components to Use SSR-Safe Store Access

In `HolidayCharityCard.tsx`:

```typescript
import { useClientOnly } from '@/hooks/useClientOnly';

export const HolidayCharityCard: React.FC<HolidayCharityCardProps> = ({
  proposal,
  className,
}) => {
  const isClient = useClientOnly();

  // Only use Zustand store after client-side hydration
  const charityStore = isClient ? useCharityStore() : null;
  const getCharityById = charityStore?.getCharityById || (() => null);

  // Provide fallback data during SSR
  const availableCharities = isClient
    ? proposal.availableCharities
        .map(id => getCharityById(id))
        .filter(Boolean)
    : proposal.availableCharities.map(id => ({
        id,
        name: 'Loading...',
        category: 'general_support'
      }));
```

## How It Works

1. **Server-Side Rendering**: During SSR, `isClient` is `false`, so Zustand stores are not accessed
2. **Client-Side Hydration**: After the component mounts on the client, `useEffect` runs and sets `isClient` to `true`
3. **Store Access**: Only after hydration, the component can safely access Zustand stores
4. **Fallback Data**: During SSR, placeholder data is shown until real data loads

## Benefits

- ✅ Prevents SSR errors with Zustand stores
- ✅ Maintains SEO benefits of SSR
- ✅ Provides smooth user experience with loading states
- ✅ Reusable pattern for other components
- ✅ Type-safe implementation

## Best Practices

1. **Always use `useClientOnly`** when accessing Zustand stores in components that might be server-rendered
2. **Provide meaningful fallback data** during SSR
3. **Use the `useClientStore` utility** for simpler store access patterns
4. **Test both SSR and client-side rendering** to ensure proper functionality

## Alternative Solutions Considered

1. **Dynamic Imports with `ssr: false`** - Would disable SSR entirely for components
2. **Moving store logic to `useEffect`** - Less clean and harder to maintain
3. **Conditional rendering** - Could cause layout shifts

The chosen solution provides the best balance of performance, maintainability, and user experience.
