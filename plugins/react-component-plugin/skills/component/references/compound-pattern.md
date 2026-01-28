# Compound Component Pattern - Complete Guide

The compound component pattern is one of the most powerful patterns for building flexible, maintainable React components. It's used extensively in production libraries like Ant Design, Radix UI, and Chakra UI.

## What is the Compound Component Pattern?

Compound components work together to form a complete UI experience. They share implicit state and behavior through React Context, allowing for flexible composition while maintaining a clean API.

## Complete Select Component Example

```tsx
import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";

// 1. Define context shape
interface SelectContextValue {
  selected: string;
  setSelected: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

// 2. Custom hook for consuming context
function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error("Select compound components must be used within Select");
  }
  return context;
}

// 3. Main Select component
interface SelectProps {
  children: ReactNode;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function Select({ 
  children, 
  defaultValue = "", 
  value: controlledValue,
  onChange,
  placeholder = "Select an option..."
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Support both controlled and uncontrolled
  const isControlled = controlledValue !== undefined;
  const selected = isControlled ? controlledValue : internalValue;

  const setSelected = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ selected, setSelected, isOpen, setIsOpen }}>
      <div ref={selectRef} className="relative inline-block w-64">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

// 4. Trigger component
interface TriggerProps {
  children?: ReactNode;
}

function Trigger({ children }: TriggerProps) {
  const { selected, isOpen, setIsOpen } = useSelectContext();

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="w-full px-4 py-2 text-left bg-white border rounded-md shadow-sm hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {children || selected || "Select..."}
      <span className="float-right">{isOpen ? "▲" : "▼"}</span>
    </button>
  );
}

// 5. Options container
interface OptionsProps {
  children: ReactNode;
}

function Options({ children }: OptionsProps) {
  const { isOpen } = useSelectContext();

  if (!isOpen) return null;

  return (
    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
      {children}
    </div>
  );
}

// 6. Individual option
interface OptionProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
}

function Option({ value, children, disabled = false }: OptionProps) {
  const { selected, setSelected } = useSelectContext();
  const isSelected = selected === value;

  return (
    <div
      onClick={() => !disabled && setSelected(value)}
      className={`
        px-4 py-2 cursor-pointer transition-colors
        ${isSelected ? "bg-indigo-50 text-indigo-600 font-medium" : "text-gray-700"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-50"}
      `}
    >
      {children}
      {isSelected && <span className="float-right">✓</span>}
    </div>
  );
}

// 7. Separator component
function Separator() {
  return <div className="border-t my-1" />;
}

// 8. Group component for categorized options
interface GroupProps {
  label: string;
  children: ReactNode;
}

function Group({ label, children }: GroupProps) {
  return (
    <div>
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
        {label}
      </div>
      {children}
    </div>
  );
}

// 9. Attach sub-components
Select.Trigger = Trigger;
Select.Options = Options;
Select.Option = Option;
Select.Separator = Separator;
Select.Group = Group;
```

## Usage Examples

### Basic Usage

```tsx
function App() {
  const [fruit, setFruit] = useState("apple");

  return (
    <Select value={fruit} onChange={setFruit}>
      <Select.Trigger />
      <Select.Options>
        <Select.Option value="apple">🍎 Apple</Select.Option>
        <Select.Option value="banana">🍌 Banana</Select.Option>
        <Select.Option value="orange">🍊 Orange</Select.Option>
      </Select.Options>
    </Select>
  );
}
```

### With Groups and Separators

```tsx
<Select defaultValue="apple">
  <Select.Trigger />
  <Select.Options>
    <Select.Group label="Fruits">
      <Select.Option value="apple">🍎 Apple</Select.Option>
      <Select.Option value="banana">🍌 Banana</Select.Option>
    </Select.Group>
    <Select.Separator />
    <Select.Group label="Vegetables">
      <Select.Option value="carrot">🥕 Carrot</Select.Option>
      <Select.Option value="broccoli">🥦 Broccoli</Select.Option>
    </Select.Group>
  </Select.Options>
</Select>
```

### Custom Trigger

```tsx
<Select>
  <Select.Trigger>
    {({ selected }) => (
      <div className="custom-trigger">
        Selected: {selected || "None"}
      </div>
    )}
  </Select.Trigger>
  <Select.Options>
    {/* options */}
  </Select.Options>
</Select>
```

### With Disabled Options

```tsx
<Select>
  <Select.Trigger />
  <Select.Options>
    <Select.Option value="option1">Available Option</Select.Option>
    <Select.Option value="option2" disabled>Disabled Option</Select.Option>
  </Select.Options>
</Select>
```

## Advanced: Multi-Select Variant

```tsx
function MultiSelect({ children, defaultValue = [], onChange }) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    
    setSelected(newSelected);
    onChange?.(newSelected);
  };

  return (
    <SelectContext.Provider 
      value={{ 
        selected, 
        setSelected: toggleOption, 
        isOpen, 
        setIsOpen,
        isMulti: true 
      }}
    >
      <div className="relative inline-block w-64">{children}</div>
    </SelectContext.Provider>
  );
}

// Usage
<MultiSelect onChange={(values) => console.log(values)}>
  <MultiSelect.Trigger>
    {selected.length} items selected
  </MultiSelect.Trigger>
  <MultiSelect.Options>
    <MultiSelect.Option value="1">Option 1</MultiSelect.Option>
    <MultiSelect.Option value="2">Option 2</MultiSelect.Option>
  </MultiSelect.Options>
</MultiSelect>
```

## Why This Pattern Works

### 1. Flexibility
Users can add custom components between Select parts without breaking functionality:
```tsx
<Select>
  <Select.Trigger />
  <CustomSearchInput /> {/* Custom component */}
  <Select.Options>
    {/* filtered options */}
  </Select.Options>
</Select>
```

### 2. Encapsulation
State management is hidden from consumers:
- No need to pass `isOpen`, `selected` manually
- Context handles all communication

### 3. Composability
Easy to extend with new features:
```tsx
Select.Search = Search;        // Add search
Select.Footer = Footer;        // Add footer
Select.LoadMore = LoadMore;    // Add pagination
```

### 4. Type Safety
TypeScript ensures proper usage:
```tsx
// ✓ Valid
<Select.Option value="test">Test</Select.Option>

// ✗ Error: Option must be inside Select
<Select.Option value="test">Test</Select.Option>
```

## Common Patterns

### Loading State

```tsx
function Options({ children, loading }) {
  const { isOpen } = useSelectContext();
  
  if (!isOpen) return null;
  if (loading) return <div className="p-4">Loading...</div>;
  
  return <div className="options-container">{children}</div>;
}
```

### Search/Filter

```tsx
function SearchableSelect({ options, ...props }) {
  const [search, setSearch] = useState("");
  
  const filtered = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Select {...props}>
      <Select.Trigger />
      <Select.Options>
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="w-full p-2 border-b"
          placeholder="Search..."
        />
        {filtered.map(opt => (
          <Select.Option key={opt.value} value={opt.value}>
            {opt.label}
          </Select.Option>
        ))}
      </Select.Options>
    </Select>
  );
}
```

### Virtual Scrolling

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualOptions({ items }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
  });

  return (
    <div ref={parentRef} className="h-60 overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <Select.Option 
            key={items[virtualRow.index].value}
            value={items[virtualRow.index].value}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index].label}
          </Select.Option>
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

1. **Always validate context**: Throw clear errors when components are used incorrectly
2. **Support both controlled and uncontrolled**: Use the pattern shown above
3. **Close on outside click**: Improve UX with click-outside detection
4. **Keyboard navigation**: Add arrow keys, Enter, Escape support
5. **Accessibility**: Include proper ARIA attributes
6. **Performance**: Use React.memo for Option components if rendering many items

## When NOT to Use

- Simple components with no shared state
- Components that will never need extension
- Performance-critical lists (consider virtualization first)
- When a simple prop-based API would suffice
