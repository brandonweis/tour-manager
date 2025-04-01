import { createApp, h, ref } from 'vue';
import { DriversPanel } from './components/DriversPanel';
import { ToursPanel } from './components/ToursPanel';

// Create the Vue application
const TourApp = {
  name: 'TourApp',
  setup() {    
    // Current year for footer
    const currentYear = new Date().getFullYear();
    
    // Render function using h (hyperscript)
    return () => h('div', { class: 'tour-management-app' }, [
      // Header
      h('header', {}, [
        h('h1', {}, 'Tour Management System'),
      ]),
      
      // Main content
      h('main', {}, [
        h('div', { class: 'container' }, [
          h('div', { class: 'content-grid' }, [
            // Left panel (Drivers Panel)
            h(DriversPanel),
            
            // Right panel (Tours Panel)
            h(ToursPanel)
          ])
        ])
      ]),
      
      // Footer
      h('footer', {}, [
        h('p', {}, `© ${currentYear} Tour Management System`)
      ])
    ]);
  }
};

// Store the active Vue app instance
let activeApp = null;

// Export a function to mount Vue
export function mountVueApp(element) {
  if (!element) {
    console.error('Mount element not found!');
    return null;
  }
  
  console.log('Vue compatibility layer loaded');
  
  // Unmount any existing Vue app instance
  if (activeApp) {
    try {
      activeApp.unmount();
      console.log('Unmounted previous Vue app instance');
    } catch (e) {
      console.error('Error unmounting previous app:', e);
    }
    activeApp = null;
  }
  
  // Check theme preference from localStorage and apply it to document
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  }
  
  try {
    // Create and mount Vue app
    const app = createApp(TourApp);
    app.mount(element);
    activeApp = app;
    
    console.log('Vue compatibility layer initialized');
    return app;
  } catch (error) {
    console.error('Error mounting Vue app:', error);
    return null;
  }
}