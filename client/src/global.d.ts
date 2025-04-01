/**
 * Global type declarations for the application
 */

// Extend Window interface to add our custom properties
interface Window {
  // Vue event bus for component communication
  __VUE_EVENT_BUS__?: {
    emit: (event: string, payload?: any) => void;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
  };
  
  // Reference to main Vue app instance
  __VUE_APP__?: {
    unmount: () => void;
    [key: string]: any;
  };
}