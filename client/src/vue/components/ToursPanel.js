import { h, ref, computed, watch, onMounted } from 'vue';
import { formatDate, formatISODate, getToday, isDateInPast } from '../../utils/dateUtils';
import { validateLocationNoNumbers } from '../../utils/validators';
import { drivers } from './store';

export const ToursPanel = {
  name: 'ToursPanel',
  
  setup() {
    // State
    const tours = ref([]);
    const isLoading = ref(true);
    const error = ref(null);
    const formError = ref('');
    const selectedTourId = ref(null);
    const selectedDriverId = ref(null);
    const isAddingTour = ref(false);
    const isAssigningDriver = ref(false);
    const confirmDelete = ref(null);
    
    // Form state
    const newTour = ref({
      customerName: '',
      shipmentDate: new Date(),
      locationFrom: '',
      locationTo: '',
      driverId: null
    });
    
    // Fetch data on component mount
    onMounted(() => {
      fetchTours();
      fetchDrivers();
    });
    
    // Computed properties
    const selectedTour = computed(() => {
      if (selectedTourId.value === null) return null;
      return tours.value.find(tour => tour.id === selectedTourId.value) || null;
    });
    
    const isNewTourValid = computed(() => {
      error.value = null;

      const isLocationFromValid = validateLocationNoNumbers(newTour.value.locationFrom)
      const isLocationToValid = validateLocationNoNumbers(newTour.value.locationTo)

      if(!isLocationFromValid) {
        error.value = 'Location from cannot contain numbers';
      }

      if(!isLocationToValid) {
        error.value = 'Location to cannot contain numbers';
      }

      return (
        newTour.value.customerName.trim() !== '' &&
        newTour.value.locationFrom.trim() !== '' &&
        newTour.value.locationTo.trim() !== '' &&
        isLocationFromValid &&
        isLocationToValid
      );
    });
    
    const eligibleDriversForSelectedTour = computed(() => {
      if (!selectedTour.value) return [];
      
      console.log("eligibleDriversForSelectedTour", {selectedTour, drivers});

      // Drivers eligible for assignment are those whose location matches the tour's "from" location
      return drivers.value.filter(driver => 
        driver.location.toLowerCase() === selectedTour.value.locationFrom.toLowerCase()
      );
    });
    
    // Methods
    const fetchTours = async () => {
      isLoading.value = true;
      error.value = null;
      
      try {
        console.log('Fetching tours from API...');
        const response = await fetch('/api/tours');
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Tour data received:', data);
        
        // Ensure dates are properly parsed
        tours.value = data.map(tour => ({
          ...tour,
          shipmentDate: tour.shipmentDate instanceof Date 
            ? tour.shipmentDate 
            : new Date(tour.shipmentDate)
        }));
      } catch (err) {
        console.error('Error fetching tours:', err);
        error.value = err.message || 'Failed to fetch tours';
      } finally {
        isLoading.value = false;
      }
    };
    
    const fetchDrivers = async () => {
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
      }
    };
    
    const toggleAddTour = () => {
      isAddingTour.value = !isAddingTour.value;
      formError.value = '';
      
      // Reset form if closing
      if (!isAddingTour.value) {
        newTour.value = {
          customerName: '',
          shipmentDate: new Date(),
          locationFrom: '',
          locationTo: '',
          driverId: null
        };
      }
    };
    
    const addTour = async () => {
      formError.value = '';
      console.log('Adding new tour:', newTour.value);
      
      if (!isNewTourValid.value) {
        if (!validateLocationNoNumbers(newTour.value.locationFrom)) {
          formError.value = 'Location From cannot contain numbers';
        } else if (!validateLocationNoNumbers(newTour.value.locationTo)) {
          formError.value = 'Location To cannot contain numbers';
        } else {
          formError.value = 'Please fill in all required fields';
        }
        console.error('Tour form validation failed:', formError.value);
        return;
      }
      
      try {
        console.log('Attempting to create tour');
        
        // Format the date for API
        const tourData = {
          customerName: newTour.value.customerName.trim(),
          shipmentDate: formatISODate(newTour.value.shipmentDate),
          locationFrom: newTour.value.locationFrom.trim(),
          locationTo: newTour.value.locationTo.trim(),
          driverId: newTour.value.driverId
        };
        
        console.log('Sending tour data:', tourData);
        
        // Call API directly with fetch
        const response = await fetch('/api/tours', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tourData)
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const createdTour = await response.json();
        console.log('New tour created:', createdTour);
        
        // Reset the form
        newTour.value = {
          customerName: '',
          shipmentDate: new Date(),
          locationFrom: '',
          locationTo: '',
          driverId: null
        };
        
        isAddingTour.value = false;
        
        // Refresh the tours list
        fetchTours();
      } catch (err) {
        console.error('Error creating tour:', err);
        formError.value = err.message || 'Failed to create tour';
      }
    };
    
    const selectTour = (id) => {
      console.log('Tour selected:', id);
      selectedTourId.value = id;
      
      // Show assignment mode if both a tour and driver are selected
      if (selectedDriverId.value !== null) {
        isAssigningDriver.value = true;
      } else {
        isAssigningDriver.value = false;
      }
    };
    
    const assignDriverToTour = async () => {
      console.log('Assigning driver to tour');
      console.log('Selected tour:', selectedTour.value);
      console.log('Selected driver ID:', selectedDriverId.value);
      
      // Safety check for missing selections
      if (!selectedTour.value) {
        formError.value = 'No tour selected for driver assignment';
        console.error('Assignment error: No tour selected');
        return;
      }
      
      if (selectedDriverId.value === null) {
        formError.value = 'No driver selected for assignment';
        console.error('Assignment error: No driver selected');
        return;
      }
      
      try {
        // Check if the selected driver's location matches the tour's "from" location
        const selectedDriver = drivers.value.find(d => d.id === selectedDriverId.value);
        console.log('Selected driver:', selectedDriver);
        
        if (!selectedDriver) {
          formError.value = 'Could not find the selected driver';
          console.error('Assignment error: Driver not found');
          return;
        }
        
        console.log(selectedDriver.location.toLowerCase());
        
        if (selectedDriver?.location.toLowerCase() !== selectedTour.value.locationFrom.toLowerCase()) {
          formError.value = `Driver's location (${selectedDriver.location}) does not match the tour's from location (${selectedTour.value.locationFrom})`;
          console.error('Assignment error: Location mismatch');
          return;
        }
        
        // Proceed with assignment - using fetch directly
        console.log(`Assigning driver ${selectedDriver.id} to tour ${selectedTour.value.id}`);
        
        const tourId = selectedTour.value.id;
        const driverId = selectedDriver.id;
        
        // Call API directly with fetch
        const response = await fetch(`/api/tours/${tourId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ driverId })
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const updatedTour = await response.json();
        console.log('Tour updated:', updatedTour);
        
        // Update the tour in the list
        const index = tours.value.findIndex(t => t.id === tourId);
        if (index !== -1) {
          tours.value[index] = {
            ...updatedTour,
            shipmentDate: updatedTour.shipmentDate instanceof Date
              ? updatedTour.shipmentDate
              : new Date(updatedTour.shipmentDate)
          };
        }
        
        // Refresh the tours list
        fetchTours();
        
        // Clear assignment mode
        isAssigningDriver.value = false;
        selectedDriverId.value = null;
      } catch (err) {
        console.error('Error during driver assignment:', err);
        formError.value = err.message || 'Failed to assign driver';
      }
    };
    
    const cancelAssigning = () => {
      isAssigningDriver.value = false;
      selectedDriverId.value = null;
    };
    
    const unassignDriver = async (tourId) => {
      console.log('Unassigning driver from tour', tourId);
      
      try {
        // Call API directly with fetch
        const response = await fetch(`/api/tours/${tourId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ driverId: null })
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const updatedTour = await response.json();
        console.log('Tour updated, driver unassigned:', updatedTour);
        
        // Update the tour in the list
        const index = tours.value.findIndex(t => t.id === tourId);
        if (index !== -1) {
          tours.value[index] = {
            ...updatedTour,
            shipmentDate: updatedTour.shipmentDate instanceof Date
              ? updatedTour.shipmentDate
              : new Date(updatedTour.shipmentDate)
          };
        }
        
        // Refresh the tours list
        fetchTours();
      } catch (err) {
        console.error('Error unassigning driver:', err);
        formError.value = err.message || 'Failed to unassign driver';
      }
    };
    
    const confirmDeleteTour = (id) => {
      confirmDelete.value = id;
    };
    
    const cancelDelete = () => {
      confirmDelete.value = null;
    };
    
    const deleteTour = async (id) => {
      console.log('Deleting tour', id);
      
      try {
        // Call API directly with fetch
        const response = await fetch(`/api/tours/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        console.log('Tour deleted successfully');
        
        // Remove the tour from the list
        tours.value = tours.value.filter(t => t.id !== id);
        
        // Reset confirmDelete
        confirmDelete.value = null;
        
        // If the deleted tour was selected, clear the selection
        if (selectedTourId.value === id) {
          selectedTourId.value = null;
        }
      } catch (err) {
        console.error('Error deleting tour:', err);
        formError.value = err.message || 'Failed to delete tour';
      }
    };
    
    // Get driver name by ID
    const getDriverName = (driverId) => {
      if (!driverId) return 'Unassigned';
      
      const driver = drivers.value.find(driver => driver.id === driverId);
      return driver ? driver.name : 'Unknown Driver';
    };
    
    // Render functions
    const renderAddTourForm = () => {
      if (!isAddingTour.value) {
        return null;
      }
      
      return h('div', { class: 'card' }, [
        h('h3', { class: 'card-title' }, 'Add New Tour'),
        
        // Customer name input
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label' }, 'Customer Name'),
          h('input', {
            type: 'text',
            class: 'form-input',
            value: newTour.value.customerName,
            onInput: (e) => newTour.value.customerName = e.target.value,
            placeholder: 'Customer name'
          })
        ]),
        
        // Shipment date input
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label' }, 'Shipment Date'),
          h('input', {
            type: 'date',
            class: 'form-input',
            value: formatISODate(newTour.value.shipmentDate),
            onChange: (e) => newTour.value.shipmentDate = new Date(e.target.value),
            min: getToday() // Ensure dates are not in the past
          })
        ]),
        
        // Location from input
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label' }, 'Location From'),
          h('input', {
            type: 'text',
            class: 'form-input',
            value: newTour.value.locationFrom,
            onInput: (e) => newTour.value.locationFrom = e.target.value,
            placeholder: 'City or region (no numbers)'
          })
        ]),
        
        // Location to input
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label' }, 'Location To'),
          h('input', {
            type: 'text',
            class: 'form-input',
            value: newTour.value.locationTo,
            onInput: (e) => newTour.value.locationTo = e.target.value,
            placeholder: 'City or region (no numbers)'
          })
        ]),
        
        // Form error
        formError.value ? h('div', { class: 'form-error mb-2' }, formError.value) : null,
        
        // Buttons
        h('div', { class: 'btn-group' }, [
          h('button', {
            class: 'btn btn-secondary',
            onClick: toggleAddTour
          }, 'Cancel'),
          h('button', {
            class: 'btn btn-primary',
            onClick: addTour,
            disabled: !isNewTourValid.value
          }, 'Add Tour')
        ])
      ]);
    };
    
    const renderTourCard = (tour) => {
      const isSelected = selectedTourId.value === tour.id;
      const isPastDate = isDateInPast(tour.shipmentDate);
      const isDriverMatch = tour.driverId !== null && drivers.value.some(
        driver => driver.id === tour.driverId && driver.location.toLowerCase() === tour.locationFrom.toLowerCase()
      );
      
      // Show delete confirmation
      if (confirmDelete.value === tour.id) {
        return h('div', {
          key: tour.id,
          class: 'card tour-card'
        }, [
          h('p', { class: 'mb-2' }, 'Are you sure you want to delete this tour?'),
          h('div', { class: 'btn-group' }, [
            h('button', {
              class: 'btn btn-secondary btn-sm',
              onClick: cancelDelete
            }, 'Cancel'),
            h('button', {
              class: 'btn btn-danger btn-sm',
              onClick: () => deleteTour(tour.id)
            }, 'Delete')
          ])
        ]);
      }
      
      // Card classes based on state
      const cardClasses = ['card', 'tour-card'];
      if (isSelected) cardClasses.push('selected');
      if (tour.driverId !== null) {
        if (isDriverMatch) {
          cardClasses.push('tour-driver-match');
        } else {
          cardClasses.push('tour-driver-mismatch');
        }
      }
      
      return h('div', {
        key: tour.id,
        class: cardClasses,
        onClick: () => selectTour(tour.id)
      }, [
        // Card content
        h('div', { class: 'tour-info' }, [
          h('div', { class: 'card-title' }, tour.customerName),
          
          h('div', { class: 'tour-info-row' }, [
            h('span', { class: 'tour-info-label' }, 'Date:'),
            h('span', { class: 'tour-info-value' }, [
              (tour.shipmentDate ? formatDate(tour.shipmentDate) : 'Invalid date'),
              isPastDate ? h('span', { class: 'badge badge-danger ml-2' }, 'Past') : null
            ])
          ]),
          
          h('div', { class: 'tour-info-row' }, [
            h('span', { class: 'tour-info-label' }, 'From:'),
            h('span', { class: 'tour-info-value' }, tour.locationFrom)
          ]),
          
          h('div', { class: 'tour-info-row' }, [
            h('span', { class: 'tour-info-label' }, 'To:'),
            h('span', { class: 'tour-info-value' }, tour.locationTo)
          ]),
          
          h('div', { class: 'tour-info-row' }, [
            h('span', { class: 'tour-info-label' }, 'Driver:'),
            h('span', { class: 'tour-info-value' }, [
              getDriverName(tour.driverId),
              tour.driverId && !isDriverMatch 
                ? h('span', { class: 'badge badge-warning ml-2' }, 'Location mismatch') 
                : null
            ])
          ])
        ]),
        
        // Card actions
        h('div', { class: 'tour-actions' }, [
          // Unassign button (only if driver is assigned)
          tour.driverId !== null ? h('button', {
            class: 'btn btn-secondary btn-sm',
            onClick: (e) => {
              e.stopPropagation();
              unassignDriver(tour.id);
            }
          }, 'Unassign') : null,
          
          // Delete button
          h('button', {
            class: 'btn btn-danger btn-sm ml-2',
            onClick: (e) => {
              e.stopPropagation();
              confirmDeleteTour(tour.id);
            }
          }, 'Delete')
        ])
      ]);
    };
    
    const renderAssignmentMode = () => {
      if (!isAssigningDriver.value || !selectedTour.value) {
        return null;
      }
      
      const tour = selectedTour.value;
      const eligibleDrivers = eligibleDriversForSelectedTour.value;
      
      return h('div', { class: 'card mb-4' }, [
        h('h3', { class: 'card-title' }, 'Assign Driver'),
        h('p', { class: 'mb-2' }, [
          'Select a driver for tour: ',
          h('strong', {}, tour.customerName),
          ' (',
          tour.locationFrom,
          ' to ',
          tour.locationTo,
          ')'
        ]),
        
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label' }, 'Select Driver'),
          eligibleDrivers.length === 0 
            ? h('p', { class: 'text-sm text-red-500' }, `No drivers available in ${tour.locationFrom}`)
            : h('select', {
                class: 'form-input',
                value: selectedDriverId.value || '',
                onChange: (e) => {
                  const driverId = e.target.value ? parseInt(e.target.value, 10) : null;
                  selectedDriverId.value = driverId;
                }
              }, [
                h('option', { value: '' }, '-- Select a driver --'),
                ...eligibleDrivers.map(driver => 
                  h('option', { value: driver.id }, `${driver.name} (${driver.location})`)
                )
              ])
        ]),
        
        h('div', { class: 'btn-group mt-4' }, [
          h('button', {
            class: 'btn btn-secondary',
            onClick: cancelAssigning
          }, 'Cancel'),
          h('button', {
            class: 'btn btn-primary',
            onClick: assignDriverToTour,
            disabled: !selectedDriverId.value || eligibleDrivers.length === 0
          }, 'Assign Driver')
        ]),
        
        // Error message
        formError.value ? h('div', { class: 'form-error mt-2' }, formError.value) : null
      ]);
    };
    
    const renderToursList = () => {
      // Check for null or undefined tours array to avoid errors
      if (!tours.value || tours.value.length === 0) {
        return h('div', { class: 'text-sm text-center mt-4' }, 'No tours found');
      }
      
      try {
        // Sort tours by date (most recent first)
        const sortedTours = [...tours.value].sort((a, b) => {
          // Make sure we're comparing dates properly
          const dateA = a.shipmentDate instanceof Date ? a.shipmentDate : new Date(a.shipmentDate);
          const dateB = b.shipmentDate instanceof Date ? b.shipmentDate : new Date(b.shipmentDate);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Debug output
        console.log('Rendering sorted tours:', sortedTours);
        
        return h('div', {}, sortedTours.map(renderTourCard));
      } catch (error) {
        console.error('Error rendering tours list:', error);
        return h('div', { class: 'text-sm text-center mt-4 text-red-500' }, 
          'Error displaying tours. Please try again.');
      }
    };
    
    // Main render function
    return () => h('div', { class: 'panel' }, [
      // Panel header
      h('div', { class: 'panel-header' }, [
        h('div', { class: 'flex justify-between items-center' }, [
          h('h2', {}, 'Tours'),
          h('div', { class: 'btn-group' }, [
            selectedTour.value && !isAssigningDriver.value ? h('button', {
              class: 'btn btn-secondary btn-sm',
              onClick: () => {
                isAssigningDriver.value = true;
              }
            }, 'Assign Driver') : null,
            h('button', {
              class: 'btn btn-primary btn-sm',
              onClick: toggleAddTour
            }, isAddingTour.value ? 'Cancel' : 'Add Tour')
          ])
        ])
      ]),
      
      // Panel content
      h('div', { class: 'panel-content' }, [
        // Add tour form
        renderAddTourForm(),
        
        // Assignment mode
        renderAssignmentMode(),
        
        // Loading state
        isLoading.value ? h('div', { class: 'text-center py-4' }, 'Loading...') : null,
        
        // Error state
        error.value && !formError.value ? h('div', { class: 'form-error mb-4' }, error.value) : null,
        
        // Tours list
        !isLoading.value ? renderToursList() : null
      ])
    ]);
  }
};