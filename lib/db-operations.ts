import { db } from './db';
import { users, bambooPlants, adoptions, locations } from './schema';
import { eq } from 'drizzle-orm';

// User operations
export const userOperations = {
  async createUser(userData: {
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }) {
    return await db.insert(users).values(userData).returning();
  },

  async getUserByClerkId(clerkId: string) {
    return await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  },

  async updateUser(clerkId: string, userData: Partial<typeof users.$inferInsert>) {
    return await db.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.clerkId, clerkId))
      .returning();
  },

  async deleteUser(clerkId: string) {
    return await db.delete(users).where(eq(users.clerkId, clerkId));
  }
};

// Bamboo plant operations
export const bambooOperations = {
  async createPlant(plantData: typeof bambooPlants.$inferInsert) {
    return await db.insert(bambooPlants).values(plantData).returning();
  },

  async getPlantByCode(plantCode: string) {
    return await db.select().from(bambooPlants).where(eq(bambooPlants.plantCode, plantCode)).limit(1);
  },

  async getAllPlants() {
    return await db.select().from(bambooPlants);
  },

  async updatePlantHeight(plantCode: string, height: string) {
    return await db.update(bambooPlants)
      .set({ currentHeight: height, updatedAt: new Date() })
      .where(eq(bambooPlants.plantCode, plantCode))
      .returning();
  }
};

// Adoption operations
export const adoptionOperations = {
  async createAdoption(adoptionData: typeof adoptions.$inferInsert) {
    return await db.insert(adoptions).values(adoptionData).returning();
  },

  async getUserAdoptions(userId: number) {
    return await db.select({
      adoption: adoptions,
      plant: bambooPlants
    })
    .from(adoptions)
    .leftJoin(bambooPlants, eq(adoptions.bambooPlantId, bambooPlants.id))
    .where(eq(adoptions.userId, userId));
  },

  async getAdoptionById(adoptionId: number) {
    return await db.select().from(adoptions).where(eq(adoptions.id, adoptionId)).limit(1);
  }
};

// Location operations
export const locationOperations = {
  async createLocation(locationData: typeof locations.$inferInsert) {
    return await db.insert(locations).values(locationData).returning();
  },

  async getAllLocations() {
    return await db.select().from(locations).where(eq(locations.isActive, true));
  },

  async getLocationById(locationId: number) {
    return await db.select().from(locations).where(eq(locations.id, locationId)).limit(1);
  }
};