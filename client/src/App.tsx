import React, { useEffect, useRef } from 'react';
import setupVuePolyfill from './vuePluginPolyfill';

// Workaround for TypeScript import
type VueModule = {
  mountVueApp: (element: HTMLElement) => any;
};

/**
 * App component that serves as a container for the Vue application
 * It sets up the Vue environment and mounts the Vue app to a container element
 */
export default function App() {
  // Create a reference to the Vue container element
  const vueContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialize Vue event bus polyfill for component communication
    setupVuePolyfill();
    
    // When the component mounts, import and mount the Vue application
    if (vueContainerRef.current) {
      // Ensure any existing Vue instance is unmounted first
      const container = vueContainerRef.current;
      container.innerHTML = '';
      
      // Dynamically import Vue components to avoid loading during React render
      // @ts-ignore - TypeScript can't find declaration file for the Vue module
      import('./vue/index').then((module: VueModule) => {
        if (typeof module.mountVueApp === 'function') {
          // Check if we already have a window.__VUE_APP__ for tracking purposes
          if (window.__VUE_APP__) {
            try {
              window.__VUE_APP__.unmount();
              console.log('Unmounted previous Vue app instance');
            } catch (e) {
              console.warn('Failed to unmount previous Vue app:', e);
            }
          }
          
          // Mount new instance and store reference
          const app = module.mountVueApp(container);
          window.__VUE_APP__ = app;
        } else {
          console.error('Vue mount function not found!');
        }
      }).catch((err: Error) => {
        console.error('Failed to load Vue components:', err);
      });
    }
    
    // Clean up when the component unmounts
    return () => {
      // Unmount Vue app if it exists
      if (window.__VUE_APP__) {
        try {
          window.__VUE_APP__.unmount();
        } catch (e) {
          console.warn('Error unmounting Vue app during cleanup:', e);
        }
        delete window.__VUE_APP__;
      }
      
      // Clean up event bus
      if (window.__VUE_EVENT_BUS__) {
        delete window.__VUE_EVENT_BUS__;
      }
    };
  }, []);
  
  // Render a container for the Vue application
  return (
    <div 
      ref={vueContainerRef} 
      id="vue-app" 
      style={{ width: '100%', height: '100%' }}
    ></div>
  );
}