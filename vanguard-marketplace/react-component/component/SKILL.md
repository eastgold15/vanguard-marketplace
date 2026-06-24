---
name: react-component-encapsulation
description: Professional React component encapsulation patterns and best practices. Use when creating reusable React components, implementing compound components, designing component APIs, or refactoring components for better maintainability. Covers single responsibility, low coupling, compound component patterns, controlled/uncontrolled components, and context-based state management.
---

# React Component Encapsulation

Professional guide for creating well-structured, maintainable React components following industry standards.

## Core Principles

Follow these three golden rules when encapsulating components:

1. **Inversion of Control**: Let consumers decide what to render (via `children` or render props), not complex internal conditionals
2. **Default Props**: Provide sensible defaults for all optional props to reduce cognitive load
3. **Controlled & Uncontrolled**: Support both state management patterns for maximum flexibility

## When to Use Different Patterns

### Compound Components Pattern

**Use when:**
- Component has multiple related sub-parts (Select + Option, Tabs + Tab, Accordion + Panel)
- Need to share state between parent and children without prop drilling
- Want flexible composition with semantic JSX structure
- Building design system components

**See:** [compound-pattern.md](references/compound-pattern.md) for complete implementation guide

### Render Props Pattern

**Use when:**
- Need to share behavior without prescribing structure
- Consumer needs full control over rendering logic
- Building headless/unstyled components

### Custom Hooks Pattern

**Use when:**
- State logic is reusable across multiple components
- Separating concerns from presentation
- Building composable behaviors

## Quick Start: Compound Component

Basic structure for a compound component:

```tsx
import { createContext, useContext, useState } from "react";

// 1. Create context
const SelectContext = createContext(null);

// 2. Parent component
export function Select({ children, defaultValue = "", onChange }) {
  const [selected, setSelectedValue] = useState(defaultValue);
  
  const setSelected = (val) => {
    setSelectedValue(val);
    onChange?.(val);
  };

  return (
    <SelectContext.Provider value={{ selected, setSelected }}>
      <div className="select-container">{children}</div>
    </SelectContext.Provider>
  );
}

// 3. Child component
function Option({ value, children }) {
  const context = useContext(SelectContext);
  if (!context) throw new Error("Option must be used inside Select");
  
  const isSelected = context.selected === value;
  
  return (
    <div 
      onClick={() => context.setSelected(value)}
      className={isSelected ? "selected" : ""}
    >
      {children}
    </div>
  );
}

// 4. Attach to parent
Select.Option = Option;
```

**Usage:**
```tsx
<Select defaultValue="apple" onChange={(val) => console.log(val)}>
  <Select.Option value="apple">🍎 Apple</Select.Option>
  <Select.Option value="banana">🍌 Banana</Select.Option>
</Select>
```

## Common Patterns

### Controlled vs Uncontrolled Components

Support both patterns for maximum flexibility:

```tsx
function Input({ value, defaultValue = "", onChange }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  // Determine if controlled
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  
  const handleChange = (newValue) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };
  
  return <input value={currentValue} onChange={e => handleChange(e.target.value)} />;
}
```

**Benefits:**
- Uncontrolled: `<Input defaultValue="hello" />` - component manages state
- Controlled: `<Input value={state} onChange={setState} />` - parent manages state

### Context for Avoiding Prop Drilling

Use Context API to share state in compound components:

```tsx
const ComponentContext = createContext(null);

function useComponentContext() {
  const context = useContext(ComponentContext);
  if (!context) {
    throw new Error("Component must be used within ComponentProvider");
  }
  return context;
}

export { ComponentContext, useComponentContext };
```

### Component Composition

Attach sub-components to main component for better DX:

```tsx
function Tabs({ children }) {
  return <div className="tabs">{children}</div>;
}

function Tab({ label, children }) {
  return <div>{children}</div>;
}

function TabPanel({ children }) {
  return <div>{children}</div>;
}

// Composition
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// Usage
<Tabs>
  <Tabs.Tab label="First">Content 1</Tabs.Tab>
  <Tabs.Tab label="Second">Content 2</Tabs.Tab>
</Tabs>
```

## Anti-Patterns to Avoid

### ❌ Large Configuration Objects

```tsx
// Bad: Rigid, hard to customize
<Select options={[
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" }
]} />
```

### ✅ Compound Components

```tsx
// Good: Flexible, easy to customize
<Select>
  <Select.Option value="apple">🍎 Apple</Select.Option>
  <Select.Option value="banana">🍌 Banana</Select.Option>
</Select>
```

### ❌ Excessive Prop Drilling

```tsx
// Bad: Passing props through many levels
<Parent state={state}>
  <Middle state={state}>
    <Child state={state} />
  </Middle>
</Parent>
```

### ✅ Context API

```tsx
// Good: Direct state access
<StateProvider value={state}>
  <Parent>
    <Middle>
      <Child /> {/* uses useContext */}
    </Middle>
  </Parent>
</StateProvider>
```

### ❌ Monolithic Components

```tsx
// Bad: One component doing everything
function Dashboard() {
  // 500 lines of code handling:
  // - data fetching
  // - state management
  // - rendering multiple sections
  // - event handlers
}
```

### ✅ Component Composition

```tsx
// Good: Focused, reusable components
function Dashboard() {
  return (
    <DashboardLayout>
      <Header />
      <Sidebar />
      <MainContent>
        <DataTable />
        <Charts />
      </MainContent>
    </DashboardLayout>
  );
}
```

## Best Practices Summary

1. **Single Responsibility**: Each component should have one clear purpose
2. **Low Coupling**: Minimize dependencies between components
3. **High Cohesion**: Related functionality should be grouped together
4. **Semantic Naming**: Use clear, descriptive names (e.g., `Select.Option` not `SelectItem`)
5. **Error Boundaries**: Add helpful error messages for misuse
6. **Default Values**: Always provide sensible defaults for optional props
7. **TypeScript**: Use TypeScript for better DX and fewer runtime errors (see [typescript-patterns.md](references/typescript-patterns.md))

## Resources

### references/
- **compound-pattern.md**: Complete guide with advanced examples
- **typescript-patterns.md**: TypeScript best practices for React components
- **performance.md**: Optimization techniques for React components

### assets/
- **component-templates/**: Starter templates for common component patterns
