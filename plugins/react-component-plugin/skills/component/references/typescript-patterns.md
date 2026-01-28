# TypeScript Patterns for React Components

Best practices for type-safe React component encapsulation.

## Basic Component Props

```tsx
import { ReactNode, HTMLAttributes } from 'react';

// Simple props interface
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
```

## Extending HTML Attributes

```tsx
// Extend native HTML props
interface InputProps extends HTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...htmlProps }: InputProps) {
  return (
    <div>
      {label && <label>{label}</label>}
      <input {...htmlProps} />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

## Compound Components with TypeScript

```tsx
import { createContext, useContext, ReactNode } from 'react';

// 1. Define context type
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

// 2. Custom hook with type safety
function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within Tabs');
  }
  return context;
}

// 3. Main component props
interface TabsProps {
  children: ReactNode;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

export function Tabs({ children, defaultTab = '', onChange }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

// 4. Sub-component props
interface TabProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}

function Tab({ id, children, disabled = false }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  
  return (
    <button
      onClick={() => !disabled && setActiveTab(id)}
      disabled={disabled}
      aria-selected={activeTab === id}
    >
      {children}
    </button>
  );
}

interface TabPanelProps {
  id: string;
  children: ReactNode;
}

function TabPanel({ id, children }: TabPanelProps) {
  const { activeTab } = useTabsContext();
  
  if (activeTab !== id) return null;
  
  return <div role="tabpanel">{children}</div>;
}

Tabs.Tab = Tab;
Tabs.Panel = TabPanel;
```

## Generic Components

```tsx
// Generic Select component
interface SelectProps<T> {
  options: T[];
  value?: T;
  onChange?: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
}

export function Select<T>({ 
  options, 
  value, 
  onChange, 
  getLabel, 
  getValue 
}: SelectProps<T>) {
  return (
    <select 
      value={value ? getValue(value) : ''} 
      onChange={(e) => {
        const selected = options.find(opt => getValue(opt) === e.target.value);
        if (selected) onChange?.(selected);
      }}
    >
      {options.map((option) => (
        <option key={getValue(option)} value={getValue(option)}>
          {getLabel(option)}
        </option>
      ))}
    </select>
  );
}

// Usage
interface User {
  id: number;
  name: string;
}

<Select<User>
  options={users}
  getLabel={(user) => user.name}
  getValue={(user) => user.id.toString()}
  onChange={(user) => console.log(user)}
/>
```

## Render Props Pattern

```tsx
interface DataFetcherProps<T> {
  url: string;
  children: (data: T | null, loading: boolean, error: Error | null) => ReactNode;
}

export function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return <>{children(data, loading, error)}</>;
}

// Usage
<DataFetcher<User[]> url="/api/users">
  {(users, loading, error) => {
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    return <div>{users?.map(u => <div key={u.id}>{u.name}</div>)}</div>;
  }}
</DataFetcher>
```

## Discriminated Unions for Variants

```tsx
// Button with different variants
type ButtonVariant = 
  | { variant: 'primary'; color?: never }
  | { variant: 'secondary'; color?: never }
  | { variant: 'custom'; color: string };

interface BaseButtonProps {
  children: ReactNode;
  onClick?: () => void;
}

type ButtonProps = BaseButtonProps & ButtonVariant;

export function Button({ children, onClick, variant, color }: ButtonProps) {
  const bgColor = variant === 'custom' 
    ? color 
    : variant === 'primary' 
      ? 'blue' 
      : 'gray';

  return <button onClick={onClick}>{children}</button>;
}

// Usage - TypeScript enforces correct combinations
<Button variant="primary">OK</Button>
<Button variant="custom" color="#ff0000">OK</Button>
// <Button variant="primary" color="#ff0000">ERROR - color not allowed</Button>
```

## As Prop Pattern (Polymorphic Components)

```tsx
import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type TextProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
} & ComponentPropsWithoutRef<T>;

export function Text<T extends ElementType = 'span'>({
  as,
  children,
  ...props
}: TextProps<T>) {
  const Component = as || 'span';
  return <Component {...props}>{children}</Component>;
}

// Usage - fully type-safe!
<Text>Default span</Text>
<Text as="h1">Heading</Text>
<Text as="a" href="/link">Link</Text> // href is typed correctly
// <Text as="span" href="/link">ERROR</Text> // span doesn't accept href
```

## Forward Ref with TypeScript

```tsx
import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, ...props }, ref) => {
    return (
      <div>
        {label && <label>{label}</label>}
        <input ref={ref} {...props} />
      </div>
    );
  }
);

Input.displayName = 'Input';

// Usage
const inputRef = useRef<HTMLInputElement>(null);
<Input ref={inputRef} label="Name" />
```

## Controlled vs Uncontrolled with Types

```tsx
// Helper type to make props controlled or uncontrolled
type ControlledProps<T> = {
  value: T;
  defaultValue?: never;
  onChange: (value: T) => void;
};

type UncontrolledProps<T> = {
  value?: never;
  defaultValue?: T;
  onChange?: (value: T) => void;
};

type ValueProps<T> = ControlledProps<T> | UncontrolledProps<T>;

interface BaseInputProps {
  placeholder?: string;
}

type InputProps = BaseInputProps & ValueProps<string>;

export function Input({ 
  value, 
  defaultValue, 
  onChange, 
  placeholder 
}: InputProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (newValue: string) => {
    if (!isControlled) setInternalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <input
      value={currentValue}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

// TypeScript prevents mixing controlled and uncontrolled
<Input value={state} onChange={setState} /> // ✓ Controlled
<Input defaultValue="test" /> // ✓ Uncontrolled
// <Input value={state} defaultValue="test" /> // ✗ Error
```

## Custom Hooks with TypeScript

```tsx
interface UseToggleReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useToggle(initialValue = false): UseToggleReturn {
  const [isOpen, setIsOpen] = React.useState(initialValue);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}

// Usage
const modal = useToggle();
<button onClick={modal.open}>Open</button>
```

## Utility Types

```tsx
import { ComponentProps, PropsWithChildren } from 'react';

// Extract props from a component
type ButtonProps = ComponentProps<typeof Button>;

// Make all props optional
type PartialButtonProps = Partial<ButtonProps>;

// Make all props required
type RequiredButtonProps = Required<ButtonProps>;

// Pick specific props
type OnlyColorProps = Pick<ButtonProps, 'color' | 'variant'>;

// Omit specific props
type NoOnClickProps = Omit<ButtonProps, 'onClick'>;

// Add children prop
type ButtonWithChildren = PropsWithChildren<ButtonProps>;
```

## Best Practices

1. **Use `ReactNode` for children**: More flexible than `ReactElement`
2. **Extend HTML attributes**: Reuse native props instead of redefining
3. **Use discriminated unions**: Ensure type-safe prop combinations
4. **Generic components**: Make reusable components type-safe
5. **ForwardRef for refs**: Properly type ref forwarding
6. **Avoid `any`**: Use `unknown` and type guards instead
7. **Export types**: Let consumers use your component types

## Common Pitfalls

### ❌ Using `FC` unnecessarily
```tsx
// Avoid - FC is rarely needed
const Button: React.FC<ButtonProps> = ({ children }) => {
  return <button>{children}</button>;
};
```

### ✅ Use function declarations
```tsx
// Prefer - clearer and works with generics
export function Button({ children }: ButtonProps) {
  return <button>{children}</button>;
}
```

### ❌ Overly complex types
```tsx
// Avoid - too complex
type Props = Omit<Pick<ComponentProps<'button'>, 'onClick' | 'disabled'>, never> & ...
```

### ✅ Keep types simple
```tsx
// Prefer - clear and maintainable
interface ButtonProps extends Pick<ComponentProps<'button'>, 'onClick' | 'disabled'> {
  variant: 'primary' | 'secondary';
}
```
