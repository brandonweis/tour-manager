import { createApp } from 'vue';
import App from './App.vue';
import './index.css';
import setupVuePolyfill from './vuePluginPolyfill';

// Initialize Vue event bus polyfill for component communication
setupVuePolyfill();

// Create and mount Vue application
document.addEventListener('DOMContentLoaded', () => {
  const app = createApp(App);
  
  // Mount the Vue app to root element (replacing React)
  const rootElement = document.getElementById('root');
  if (rootElement) {
    console.log('Mounting Vue application to #root');
    app.mount(rootElement);
  } else {
    console.error('Root element not found!');
  }
});