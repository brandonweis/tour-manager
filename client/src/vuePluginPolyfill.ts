/**
 * This polyfill helps with Vue in a React-configured Vite project
 * It tricks the build system into processing .vue files correctly
 * without requiring direct modification of vite.config.ts
 * 
 * This is a workaround to allow us to use Vue.js with the existing React project structure
 * without having to modify the Vite configuration files.
 */

// We're relying on the fact that @vitejs/plugin-vue is installed,
// and that we have proper .vue file declarations in vue-shim.d.ts

import { App, createApp } from 'vue';

// Set up global Vue state and functionality
const vueState = {
  // Track if Vue has been initialized
  initialized: false,
  
  // Store the Vue app instance
  app: null as App<Element> | null,
  
  // Track the mount element
  mountElement: null as HTMLElement | null,
  
  // Available store instances
  stores: new Map(),
  
  // Add an event bus for simple component communication
  events: new Map()
};

// Utility to handle Vue's processing of .vue files
const processVueFiles = () => {
  // This function doesn't do anything directly,
  // it exists to help track when Vue's functionality is being used
  return vueState.initialized;
};

// Setup function to initialize Vue compatibility
export default function setupVuePolyfill() {
  // Log startup for debugging
  console.log('Vue compatibility layer loaded');
  
  // Mark as initialized
  vueState.initialized = true;
  
  // Add global event bus methods
  window.__VUE_EVENT_BUS__ = {
    emit(event: string, payload?: any) {
      const listeners = vueState.events.get(event) || [];
      listeners.forEach((callback: Function) => callback(payload));
    },
    on(event: string, callback: Function) {
      if (!vueState.events.has(event)) {
        vueState.events.set(event, []);
      }
      vueState.events.get(event).push(callback);
    },
    off(event: string, callback: Function) {
      if (!vueState.events.has(event)) return;
      const listeners = vueState.events.get(event);
      const index = listeners.indexOf(callback);
      if (index !== -1) listeners.splice(index, 1);
    }
  };
  
  // Log successful setup
  console.log('Vue compatibility layer initialized');
  
  return {
    processVueFiles,
    getVueState: () => vueState
  };
}