import { h, ref, computed, onMounted } from 'vue';
import { getInitials, validateLocationNoNumbers } from '../../utils/validators';
import { drivers } from './store';

export const DriversPanel = {
  name: 'DriversPanel',
  
  setup() {
    // State
    const isLoading = ref(true);
    const error = ref(null);
    const selectedDriverId = ref(null);
    const isAddingDriver = ref(false);
    const formError = ref('');
    
    // Form state
    const newDriverName = ref('');
    const newDriverLocation = ref('');
    
    // Fetch drivers on component mount
    onMounted(() => {
      fetchDrivers();
    });
    
    // Computed
    const isNewDriverValid = computed(() => {
      error.value = null;

      const isLocationValid = validateLocationNoNumbers(newDriverLocation.value)

      if(!isLocationValid) {
        error.value = 'Location cannot contain numbers';
      }

      return (
        newDriverName.value.trim() !== '' &&
        newDriverLocation.value.trim() !== '' &&
        isLocationValid
      );
    });
    
    const driversByLocation = computed(() => {
      // Group drivers by location
      const locationMap = new Map();
      
      drivers.value.forEach(driver => {
        if (!locationMap.has(driver.location)) {
          locationMap.set(driver.location, []);
        }
        locationMap.get(driver.location).push(driver);
      });
      
      // Convert to array of objects
      return Array.from(locationMap.entries()).map(([location, driversList]) => ({
        location,
        drivers: driversList
      }));
    });
    
    // Methods
    const fetchDrivers = async () => {
      isLoading.value = true;
      error.value = null;
      
      try {
        console.log('Fetching drivers from API...');
        const response = await fetch('/api/drivers');
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Driver data received:', data);
        drivers.value = data;
      } catch (err) {
        console.error('Error fetching drivers:', err);
        error.value = err.message || 'Failed to fetch drivers';
      } finally {
        isLoading.value = false;
      }
    };
    
    const toggleAddDriver = () => {
      isAddingDriver.value = !isAddingDriver.value;
      formError.value = '';
      
      // Reset form if closing
      if (!isAddingDriver.value) {
        newDriverName.value = '';
        newDriverLocation.value = '';
      }
    };
    
    const addDriver = async () => {
      formError.value = '';
      console.log('Adding driver, formData:', {
        name: newDriverName.value, 
        location: newDriverLocation.value
      });
      
      console.log("validate")
      if (!isNewDriverValid.value) {
        if (!validateLocationNoNumbers(newDriverLocation.value)) {
          formError.value = 'Location cannot contain numbers';
        } else {
          formError.value = 'Please fill in all required fields';
        }
        console.error('Driver form validation failed:', formError.value);
        return;
      }
      
      try {
        console.log('Attempting to create driver');
        
        // API request
        const response = await fetch('/api/drivers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newDriverName.value.trim(),
            location: newDriverLocation.value.trim()
          })
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const newDriver = await response.json();
        console.log('New driver created:', newDriver);
        
        // Reset form
        newDriverName.value = '';
        newDriverLocation.value = '';
        isAddingDriver.value = false;
        
        // Refresh drivers list
        fetchDrivers();
      } catch (err) {
        console.error('Error creating driver:', err);
        formError.value = err.message || 'Failed to create driver';
      }
    };
    
    const selectDriver = (id) => {
      console.log('Driver selected:', id);
      // Toggle selection if clicking the same driver again
      selectedDriverId.value = selectedDriverId.value === id ? null : id;
    };
    
    // Render functions
    const renderAddDriverForm = () => {
      if (!isAddingDriver.value) {
        return null;
      }
      
      return h('div', { class: 'card' }, [
        h('h3', { class: 'card-title' }, 'Add New Driver'),
        
        // Name input
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label' }, 'Name'),
          h('input', {
            type: 'text',
            class: 'form-input',
            value: newDriverName.value,
            onInput: (e) => newDriverName.value = e.target.value,
            placeholder: 'Driver name'
          })
        ]),
        
        // Location input
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label' }, 'Location'),
          h('input', {
            type: 'text',
            class: 'form-input',
            value: newDriverLocation.value,
            onInput: (e) => newDriverLocation.value = e.target.value,
            placeholder: 'City or region (no numbers)'
          })
        ]),
        
        // Form error
        formError.value ? h('div', { class: 'form-error mb-2' }, formError.value) : null,
        
        // Buttons
        h('div', { class: 'btn-group' }, [
          h('button', {
            class: 'btn btn-secondary',
            onClick: toggleAddDriver
          }, 'Cancel'),
          h('button', {
            class: 'btn btn-primary',
            onClick: addDriver,
            disabled: !isNewDriverValid.value
          }, 'Add Driver')
        ])
      ]);
    };
    
    const renderDriverCard = (driver) => {
      const isSelected = selectedDriverId.value === driver.id;
      
      return h('div', {
        key: driver.id,
        class: ['card', 'driver-card', isSelected ? 'selected' : ''],
        onClick: () => selectDriver(driver.id)
      }, [
        h('div', { class: 'flex items-center' }, [
          h('div', { class: 'driver-initials' }, getInitials(driver.name)),
          h('div', {}, [
            h('div', { class: 'card-title' }, driver.name),
            h('div', { class: 'card-body' }, driver.location)
          ])
        ])
      ]);
    };
    
    const renderDriversByLocation = () => {
      const groups = driversByLocation.value;
      
      if (groups.length === 0) {
        return h('div', { class: 'text-sm text-center mt-4' }, 'No drivers found');
      }
      
      return groups.map(group => 
        h('div', { key: group.location, class: 'mb-4' }, [
          h('h3', { class: 'text-lg font-bold mb-2' }, group.location),
          h('div', {}, group.drivers.map(driver => renderDriverCard(driver)))
        ])
      );
    };
    
    // Main render function
    return () => {
      console.log('Rendering DriversPanel, isLoading:', isLoading.value);
      
      return h('div', { class: 'panel' }, [
        // Panel header
        h('div', { class: 'panel-header' }, [
          h('div', { class: 'flex justify-between items-center' }, [
            h('h2', {}, 'Drivers'),
            h('button', {
              class: 'btn btn-primary btn-sm',
              onClick: toggleAddDriver
            }, isAddingDriver.value ? 'Cancel' : 'Add Driver')
          ])
        ]),
        
        // Panel content
        h('div', { class: 'panel-content' }, [
          // Add driver form
          renderAddDriverForm(),
          
          // Loading state
          isLoading.value ? h('div', { class: 'text-center py-4' }, 'Loading...') : null,
          
          // Error state
          error.value ? h('div', { class: 'form-error mb-4' }, error.value) : null,
          
          // Drivers list grouped by location
          !isLoading.value ? renderDriversByLocation() : null
        ])
      ]);
    };
  }
};