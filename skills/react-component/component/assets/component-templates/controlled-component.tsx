import { useState, ChangeEvent } from 'react';

// Props interface
interface ControlledInputProps {
  // Controlled props
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  
  // Additional props
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ControlledInput({
  value: controlledValue,
  defaultValue = '',
  onChange,
  placeholder,
  disabled = false,
  className = '',
}: ControlledInputProps) {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState(defaultValue);

  // Determine if component is controlled
  const isControlled = controlledValue !== undefined;
  
  // Use controlled value or internal state
  const currentValue = isControlled ? controlledValue : internalValue;

  // Handle changes
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Update internal state if uncontrolled
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    // Always call onChange if provided
    onChange?.(newValue);
  };

  return (
    <input
      type="text"
      value={currentValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}

// Usage Examples (delete before using):
/*
// Uncontrolled (component manages state)
<ControlledInput 
  defaultValue="hello" 
  onChange={(val) => console.log(val)} 
/>

// Controlled (parent manages state)
const [value, setValue] = useState('');
<ControlledInput 
  value={value} 
  onChange={setValue} 
/>
*/
