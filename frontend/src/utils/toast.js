// Simple toast utility that works with our CustomToastProvider
// This is a global accessor for the toast functionality

// Store toast functions when they're initialized by the provider
let toastFunctions = {
  success: (message, duration) => console.log('Toast not initialized - success:', message),
  error: (message, duration) => console.log('Toast not initialized - error:', message),
  info: (message, duration) => console.log('Toast not initialized - info:', message),
  warning: (message, duration) => console.log('Toast not initialized - warning:', message)
};

// Method to initialize toast functions (called by CustomToastProvider)
export const initializeToast = (functions) => {
  if (functions && typeof functions === 'object') {
    toastFunctions = functions;
    console.log('Toast functionality initialized');
  }
};

// Export a simple toast object that components can import
const toast = {
  success: (message, duration = 5000) => toastFunctions.success(message, duration),
  error: (message, duration = 5000) => toastFunctions.error(message, duration),
  info: (message, duration = 5000) => toastFunctions.info(message, duration),
  warning: (message, duration = 5000) => toastFunctions.warning(message, duration)
};

export default toast;
