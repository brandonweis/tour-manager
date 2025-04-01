// This file is needed for TypeScript to recognize .vue files and
// provide type declarations for JavaScript Vue modules

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module './vue/index' {
  /**
   * Vue application mounting function
   * Mounts the Vue.js tour management application to the given DOM element
   * @param element The DOM element to mount the Vue app to
   * @returns The Vue app instance or null if mounting failed
   */
  export function mountVueApp(element: HTMLElement): any;
  
  // Add any other exports from the Vue index module here
  export const version: string;
}

declare module './vue/components/DriversPanel' {
  import type { Component } from 'vue'
  export const DriversPanel: Component;
}

declare module './vue/components/ToursPanel' {
  import type { Component } from 'vue'
  export const ToursPanel: Component;
}