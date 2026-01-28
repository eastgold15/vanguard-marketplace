import { createContext, useContext, useState, ReactNode } from 'react';

// 1. Define Context Type
interface ComponentContextValue {
  // Define shared state here
  value: string;
  setValue: (value: string) => void;
}

const ComponentContext = createContext<ComponentContextValue | null>(null);

// 2. Custom Hook
function useComponentContext() {
  const context = useContext(ComponentContext);
  if (!context) {
    throw new Error('Component must be used within ComponentProvider');
  }
  return context;
}

// 3. Main Component Props
interface ComponentProps {
  children: ReactNode;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function Component({ 
  children, 
  defaultValue = '', 
  value: controlledValue,
  onChange 
}: ComponentProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  // Support both controlled and uncontrolled
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const setValue = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <ComponentContext.Provider value={{ value, setValue }}>
      <div className="component-container">
        {children}
      </div>
    </ComponentContext.Provider>
  );
}

// 4. Sub-component 1
interface SubComponentProps {
  children: ReactNode;
  // Add additional props
}

function SubComponent({ children }: SubComponentProps) {
  const { value, setValue } = useComponentContext();

  return (
    <div className="sub-component">
      {children}
    </div>
  );
}

// 5. Sub-component 2
interface AnotherSubProps {
  children: ReactNode;
}

function AnotherSub({ children }: AnotherSubProps) {
  const { value } = useComponentContext();

  return (
    <div className="another-sub">
      {children}
    </div>
  );
}

// 6. Attach sub-components
Component.Sub = SubComponent;
Component.Another = AnotherSub;

// 7. Usage Example (delete before using):
/*
<Component defaultValue="initial">
  <Component.Sub>Content 1</Component.Sub>
  <Component.Another>Content 2</Component.Another>
</Component>
*/
