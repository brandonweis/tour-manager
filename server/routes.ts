import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { driverLocationSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Driver routes
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  app.get("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const driver = await storage.getDriver(id);
      
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver" });
    }
  });

  app.post("/api/drivers", async (req, res) => {
    try {
      const { name, location } = req.body;
      
      // Validate location (no numbers)
      try {
        driverLocationSchema.parse(location);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ error: error.errors[0].message });
        }
        return res.status(400).json({ error: "Invalid location" });
      }
      
      const driver = await storage.createDriver({ name, location });
      res.status(201).json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to create driver" });
    }
  });

  app.put("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, location } = req.body;
      
      if (location) {
        try {
          driverLocationSchema.parse(location);
        } catch (error) {
          if (error instanceof ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
          }
          return res.status(400).json({ error: "Invalid location" });
        }
      }
      
      const updatedDriver = await storage.updateDriver(id, { name, location });
      
      if (!updatedDriver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      res.json(updatedDriver);
    } catch (error) {
      res.status(500).json({ error: "Failed to update driver" });
    }
  });

  app.get("/api/drivers/location/:location", async (req, res) => {
    try {
      const location = req.params.location;
      const drivers = await storage.getDriversByLocation(location);
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers by location" });
    }
  });

  // Tour routes
  app.get("/api/tours", async (req, res) => {
    try {
      const tours = await storage.getTours();
      res.json(tours);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tours" });
    }
  });

  app.get("/api/tours/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tour = await storage.getTour(id);
      
      if (!tour) {
        return res.status(404).json({ error: "Tour not found" });
      }
      
      res.json(tour);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tour" });
    }
  });

  app.post("/api/tours", async (req, res) => {
    try {
      const { customerName, shipmentDate, locationFrom, locationTo, driverId } = req.body;
      
      // If a driver is assigned, verify the driver exists and location matches
      if (driverId) {
        const driver = await storage.getDriver(driverId);
        
        if (!driver) {
          return res.status(400).json({ error: "Driver not found" });
        }
        
        if (driver.location.toLowerCase() !== locationFrom.toLowerCase()) {
          return res.status(400).json({ 
            error: "Driver location must match the tour's starting location" 
          });
        }
      }
      
      // Format the date as ISO string and take just the date part (YYYY-MM-DD)
      const parsedDate = new Date(shipmentDate);
      const formattedDate = parsedDate.toISOString().split('T')[0];
      
      const tour = await storage.createTour({
        customerName,
        shipmentDate: formattedDate,
        locationFrom,
        locationTo,
        driverId
      });
      
      res.status(201).json(tour);
    } catch (error) {
      res.status(500).json({ error: "Failed to create tour" });
    }
  });

  app.put("/api/tours/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { customerName, shipmentDate, locationFrom, locationTo, driverId } = req.body;
      
      // If locationFrom is changing, validate the driver's location
      const existingTour = await storage.getTour(id);
      if (!existingTour) {
        return res.status(404).json({ error: "Tour not found" });
      }
      
      // If driver is being assigned or locationFrom is changing with an assigned driver
      if (driverId || (locationFrom && existingTour.driverId)) {
        const driverToCheck = driverId || existingTour.driverId;
        const locationToCheck = locationFrom || existingTour.locationFrom;
        
        const driver = await storage.getDriver(driverToCheck);
        
        if (!driver) {
          return res.status(400).json({ error: "Driver not found" });
        }
        
        if (driver.location.toLowerCase() !== locationToCheck.toLowerCase()) {
          return res.status(400).json({ 
            error: "Driver location must match the tour's starting location" 
          });
        }
      }
      
      const updateData: any = {};
      if (customerName) updateData.customerName = customerName;
      if (shipmentDate) {
        const parsedDate = new Date(shipmentDate);
        updateData.shipmentDate = parsedDate.toISOString().split('T')[0];
      }
      if (locationFrom) updateData.locationFrom = locationFrom;
      if (locationTo) updateData.locationTo = locationTo;
      if (driverId !== undefined) updateData.driverId = driverId;
      
      const updatedTour = await storage.updateTour(id, updateData);
      
      if (!updatedTour) {
        return res.status(404).json({ error: "Tour not found" });
      }
      
      res.json(updatedTour);
    } catch (error) {
      res.status(500).json({ error: "Failed to update tour" });
    }
  });

  app.delete("/api/tours/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTour(id);
      
      if (!success) {
        return res.status(404).json({ error: "Tour not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete tour" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
