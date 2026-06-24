# Performance Optimization for React Components

Guidelines for building performant, well-encapsulated React components.

## React.memo for Component Optimization

Use `React.memo` to prevent unnecessary re-renders:

```tsx
import { memo } from 'react';

interface OptionProps {
  value: string;
  label: string;
  isSelected: boolean;
  onSelect: (value: string) => void;
}

// Wrap component in memo
export const Option = memo(function Option({ 
  value, 
  label, 
  isSelected, 
  onSelect 
}: OptionProps) {
  console.log('Option rendered:', label); // Track renders
  
  return (
    <div 
      onClick={() => onSelect(value)}
      className={isSelected ? 'selected' : ''}
    >
      {label}
    </div>
  );
});

// Custom comparison function
export const Option = memo(
  function Option({ value, label, isSelected, onSelect }: OptionProps) {
    return <div onClick={() => onSelect(value)}>{label}</div>;
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return (
      prevProps.value === nextProps.value &&
      prevProps.label === nextProps.label &&
      prevProps.isSelected === nextProps.isSelected
    );
  }
);
```

## useCallback for Stable Function References

Prevent child re-renders by memoizing callbacks:

```tsx
import { useCallback, useState } from 'react';

function Select({ options }: { options: string[] }) {
  const [selected, setSelected] = useState('');

  // ❌ Creates new function on every render
  const handleSelect = (value: string) => {
    setSelected(value);
  };

  // ✅ Stable function reference
  const handleSelectMemo = useCallback((value: string) => {
    setSelected(value);
  }, []); // Empty deps = never recreated

  return (
    <div>
      {options.map(opt => (
        <Option 
          key={opt} 
          value={opt} 
          onSelect={handleSelectMemo} // Stable reference
        />
      ))}
    </div>
  );
}
```

## useMemo for Expensive Calculations

Cache computed values:

```tsx
import { useMemo, useState } from 'react';

function SearchableList({ items }: { items: Item[] }) {
  const [search, setSearch] = useState('');

  // ❌ Filters on every render
  const filtered = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Only recalculates when items or search changes
  const filteredMemo = useMemo(() => {
    console.log('Filtering items...'); // Track recalculations
    return items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  return (
    <div>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      {filteredMemo.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}
```

## Virtual Scrolling for Large Lists

Use virtual scrolling for rendering thousands of items:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Estimated item height
    overscan: 5, // Render 5 extra items for smooth scrolling
  });

  return (
    <div 
      ref={parentRef} 
      className="h-[400px] overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <Item data={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Debouncing and Throttling

Optimize frequent updates:

```tsx
import { useState, useCallback, useRef, useEffect } from 'react';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook
function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timeoutId = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLastUpdate);

      return () => clearTimeout(timeoutId);
    }
  }, [value, interval]);

  return throttledValue;
}

// Usage
function SearchComponent() {
  const [input, setInput] = useState('');
  const debouncedSearch = useDebounce(input, 500);

  useEffect(() => {
    // API call only happens 500ms after user stops typing
    if (debouncedSearch) {
      searchAPI(debouncedSearch);
    }
  }, [debouncedSearch]);

  return <input value={input} onChange={e => setInput(e.target.value)} />;
}
```

## Code Splitting with React.lazy

Split components into separate bundles:

```tsx
import { lazy, Suspense } from 'react';

// ❌ Imports everything upfront
import HeavyChart from './HeavyChart';

// ✅ Loads only when needed
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

## Avoid Unnecessary Context Re-renders

Split contexts to minimize re-renders:

```tsx
// ❌ Single context causes all consumers to re-render
const AppContext = createContext({
  user: null,
  theme: 'light',
  setUser: () => {},
  setTheme: () => {},
});

// ✅ Split into separate contexts
const UserContext = createContext(null);
const ThemeContext = createContext('light');

// Components only re-render when their specific context changes
function UserProfile() {
  const user = useContext(UserContext); // Only re-renders on user changes
  return <div>{user.name}</div>;
}

function ThemeToggle() {
  const theme = useContext(ThemeContext); // Only re-renders on theme changes
  return <button>{theme}</button>;
}
```

## Context with useMemo

Prevent unnecessary context provider re-renders:

```tsx
function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  // ❌ Creates new object on every render
  const value = { user, theme, setUser, setTheme };

  // ✅ Memoized value
  const valueMemo = useMemo(
    () => ({ user, theme, setUser, setTheme }),
    [user, theme]
  );

  return (
    <AppContext.Provider value={valueMemo}>
      {children}
    </AppContext.Provider>
  );
}
```

## Use Keys Properly

Optimize list rendering with stable keys:

```tsx
// ❌ Index as key causes re-renders when list changes
{items.map((item, index) => (
  <Item key={index} data={item} />
))}

// ✅ Stable unique key
{items.map(item => (
  <Item key={item.id} data={item} />
))}

// For dynamic lists without stable IDs
{items.map(item => (
  <Item key={`${item.type}-${item.value}`} data={item} />
))}
```

## Lazy Initial State

Avoid expensive initial state calculations:

```tsx
// ❌ Runs on every render
const [state, setState] = useState(expensiveComputation());

// ✅ Only runs once
const [state, setState] = useState(() => expensiveComputation());

// Example
const [data, setData] = useState(() => {
  const cached = localStorage.getItem('data');
  return cached ? JSON.parse(cached) : [];
});
```

## Avoid Inline Objects and Functions

Prevent unnecessary re-renders:

```tsx
// ❌ Creates new object/function on every render
<Component 
  style={{ margin: 10 }}
  onClick={() => console.log('clicked')}
/>

// ✅ Stable references
const style = { margin: 10 };
const handleClick = useCallback(() => console.log('clicked'), []);

<Component 
  style={style}
  onClick={handleClick}
/>
```

## Performance Measurement

Use React DevTools Profiler:

```tsx
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
};

function App() {
  return (
    <Profiler id="App" onRender={onRender}>
      <YourComponent />
    </Profiler>
  );
}
```

## Performance Checklist

- [ ] Use `React.memo` for expensive list items
- [ ] Wrap callbacks in `useCallback` when passing to memoized children
- [ ] Use `useMemo` for expensive computations
- [ ] Implement virtual scrolling for lists >100 items
- [ ] Debounce/throttle frequent updates (search, scroll, resize)
- [ ] Code split large components with `React.lazy`
- [ ] Split contexts to minimize re-renders
- [ ] Use stable keys for lists
- [ ] Avoid inline objects and functions in JSX
- [ ] Measure with React DevTools Profiler

## Common Performance Anti-Patterns

### 1. Over-memoization
```tsx
// ❌ Unnecessary - simple component
const Text = memo(({ children }) => <span>{children}</span>);

// ✅ Only memo when needed
function Text({ children }) {
  return <span>{children}</span>;
}
```

### 2. Premature Optimization
Focus on these first:
1. Reduce bundle size
2. Optimize network requests
3. Virtual scrolling for large lists
4. Then: React.memo, useCallback, useMemo

### 3. Wrong Dependencies
```tsx
// ❌ Missing dependencies
const fetchData = useCallback(() => {
  api.get(`/data/${userId}`);
}, []); // userId should be in deps!

// ✅ Correct dependencies
const fetchData = useCallback(() => {
  api.get(`/data/${userId}`);
}, [userId]);
```

## When to Optimize

Optimize when you have:
- Profiler data showing slow renders
- User-reported performance issues
- Lists with >50 items
- Frequent re-renders (>10/second)

Don't optimize prematurely - measure first!
