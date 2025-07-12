# Custom Toast Notification System

This is a custom toast notification system created to replace react-toastify, which had compatibility issues with React 19.1.0.

## How to Use

### In Your Components

```jsx
import toast from '../../utils/toast';

// Then in your component:
toast.success('Operation completed successfully');
toast.error('Something went wrong');
toast.info('Here is some information');
toast.warning('Be careful!');
```

### Advanced Usage with the Hook

For more control, you can use the `useToast` hook:

```jsx
import { useToast } from '../components/common/CustomToast';

function MyComponent() {
  const { success, error, info, warning } = useToast();
  
  const handleClick = () => {
    success('Custom duration message', 10000); // 10 seconds
  };
  
  return <button onClick={handleClick}>Show Toast</button>;
}
```

## Implementation Details

- `CustomToastProvider` - The main provider component that should wrap your application
- `useToast` - React hook for accessing toast functions within components
- `toast.js` - Global utility that works without needing to use hooks

The system is set up to work both within React components (via the context/hook) and outside of components (via the utility).
