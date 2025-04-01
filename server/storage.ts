import { 
  users, type User, type InsertUser,
  drivers, type Driver, type InsertDriver,
  tours, type Tour, type InsertTour
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Driver operations
  getDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  getDriversByLocation(location: string): Promise<Driver[]>;
  
  // Tour operations
  getTours(): Promise<Tour[]>;
  getTour(id: number): Promise<Tour | undefined>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: number, tour: Partial<InsertTour>): Promise<Tour | undefined>;
  deleteTour(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private driversMap: Map<number, Driver>;
  private toursMap: Map<number, Tour>;
  
  currentId: number;
  driverId: number;
  tourId: number;

  constructor() {
    this.users = new Map();
    this.driversMap = new Map();
    this.toursMap = new Map();
    this.currentId = 1;
    this.driverId = 1;
    this.tourId = 1;
    
    // Add some initial data
    this.createDriver({ name: "John Doe", location: "Berlin" });
    this.createDriver({ name: "Maria Schmidt", location: "Hamburg" });
    this.createDriver({ name: "Robert Wagner", location: "Munich" });
    
    const today = new Date().toISOString().split('T')[0];
    this.createTour({
      customerName: "Great Company", 
      shipmentDate: today,
      locationFrom: "Berlin", 
      locationTo: "Hamburg",
      driverId: 1
    });
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    this.createTour({
      customerName: "Best Logistics", 
      shipmentDate: nextWeekStr,
      locationFrom: "Hamburg", 
      locationTo: "Berlin",
      driverId: 2
    });
    
    const inTwoWeeks = new Date();
    inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
    const inTwoWeeksStr = inTwoWeeks.toISOString().split('T')[0];
    this.createTour({
      customerName: "Premium Shipping", 
      shipmentDate: inTwoWeeksStr,
      locationFrom: "Munich", 
      locationTo: "Frankfurt",
      driverId: null
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Driver operations
  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.driversMap.values());
  }
  
  async getDriver(id: number): Promise<Driver | undefined> {
    return this.driversMap.get(id);
  }
  
  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = this.driverId++;
    const driver: Driver = { ...insertDriver, id };
    this.driversMap.set(id, driver);
    return driver;
  }
  
  async updateDriver(id: number, driverUpdate: Partial<InsertDriver>): Promise<Driver | undefined> {
    const existingDriver = this.driversMap.get(id);
    if (!existingDriver) return undefined;
    
    const updatedDriver = { ...existingDriver, ...driverUpdate };
    this.driversMap.set(id, updatedDriver);
    return updatedDriver;
  }
  
  async getDriversByLocation(location: string): Promise<Driver[]> {
    return Array.from(this.driversMap.values()).filter(
      driver => driver.location.toLowerCase() === location.toLowerCase()
    );
  }
  
  // Tour operations
  async getTours(): Promise<Tour[]> {
    return Array.from(this.toursMap.values());
  }
  
  async getTour(id: number): Promise<Tour | undefined> {
    return this.toursMap.get(id);
  }
  
  async createTour(insertTour: InsertTour): Promise<Tour> {
    const id = this.tourId++;
    // Ensure driverId is explicitly null if undefined
    const driverId = insertTour.driverId === undefined ? null : insertTour.driverId;
    const tour: Tour = { ...insertTour, id, driverId };
    this.toursMap.set(id, tour);
    return tour;
  }
  
  async updateTour(id: number, tourUpdate: Partial<InsertTour>): Promise<Tour | undefined> {
    const existingTour = this.toursMap.get(id);
    if (!existingTour) return undefined;
    
    // Ensure driverId is explicitly null if undefined in the update
    if (tourUpdate.driverId === undefined && 'driverId' in tourUpdate) {
      tourUpdate.driverId = null;
    }
    
    const updatedTour = { ...existingTour, ...tourUpdate };
    this.toursMap.set(id, updatedTour);
    return updatedTour;
  }
  
  async deleteTour(id: number): Promise<boolean> {
    return this.toursMap.delete(id);
  }
}

export const storage = new MemStorage();
