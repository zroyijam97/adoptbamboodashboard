import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, bambooPlants, adoptions, locations } from '@/lib/schema';

export async function POST() {
  try {
    // Add sample locations
    const sampleLocations = await db.insert(locations).values([
      {
        name: 'Taman Bambu Utara',
        address: 'Penang, Malaysia',
        latitude: '5.4164',
        longitude: '100.3327',
        description: 'Lokasi penanaman bambu di Penang',
        capacity: 1000,
        currentCount: 150,
      },
      {
        name: 'Kebun Bambu Selatan',
        address: 'Johor, Malaysia',
        latitude: '1.4927',
        longitude: '103.7414',
        description: 'Lokasi penanaman bambu di Johor',
        capacity: 800,
        currentCount: 200,
      }
    ]).returning();

    // Add sample bamboo plants
    const samplePlants = await db.insert(bambooPlants).values([
      {
        plantCode: 'BMB001',
        location: 'Taman Bambu Utara',
        plantedDate: new Date('2024-01-15'),
        currentHeight: '2.5',
        species: 'Bambusa vulgaris',
        status: 'growing',
        co2Absorbed: '15.5',
      },
      {
        plantCode: 'BMB002',
        location: 'Taman Bambu Utara',
        plantedDate: new Date('2024-01-20'),
        currentHeight: '3.2',
        species: 'Dendrocalamus asper',
        status: 'growing',
        co2Absorbed: '22.3',
      },
      {
        plantCode: 'BMB003',
        location: 'Kebun Bambu Selatan',
        plantedDate: new Date('2024-02-01'),
        currentHeight: '1.8',
        species: 'Bambusa vulgaris',
        status: 'growing',
        co2Absorbed: '12.1',
      },
      {
        plantCode: 'BMB004',
        location: 'Kebun Bambu Selatan',
        plantedDate: new Date('2024-02-10'),
        currentHeight: '2.1',
        species: 'Gigantochloa scortechinii',
        status: 'growing',
        co2Absorbed: '18.7',
      },
      {
        plantCode: 'BMB005',
        location: 'Taman Bambu Utara',
        plantedDate: new Date('2024-03-01'),
        currentHeight: '1.5',
        species: 'Bambusa vulgaris',
        status: 'growing',
        co2Absorbed: '8.9',
      }
    ]).returning();

    // Add sample users
    const sampleUsers = await db.insert(users).values([
      {
        clerkId: 'user_sample1',
        email: 'ahmad@example.com',
        firstName: 'Ahmad',
        lastName: 'Rahman',
      },
      {
        clerkId: 'user_sample2',
        email: 'siti@example.com',
        firstName: 'Siti',
        lastName: 'Aminah',
      },
      {
        clerkId: 'user_sample3',
        email: 'hassan@example.com',
        firstName: 'Hassan',
        lastName: 'Ali',
      },
      {
        clerkId: 'user_sample4',
        email: 'fatimah@example.com',
        firstName: 'Fatimah',
        lastName: 'Zahra',
      }
    ]).returning();

    // Add sample adoptions
    const sampleAdoptions = await db.insert(adoptions).values([
      {
        userId: sampleUsers[0].id,
        bambooPlantId: samplePlants[0].id,
        adoptionDate: new Date('2024-01-16'),
        adoptionPrice: '50.00',
        isActive: true,
        certificateIssued: true,
      },
      {
        userId: sampleUsers[1].id,
        bambooPlantId: samplePlants[1].id,
        adoptionDate: new Date('2024-01-25'),
        adoptionPrice: '50.00',
        isActive: true,
        certificateIssued: true,
      },
      {
        userId: sampleUsers[2].id,
        bambooPlantId: samplePlants[2].id,
        adoptionDate: new Date('2024-02-05'),
        adoptionPrice: '50.00',
        isActive: true,
        certificateIssued: false,
      },
      {
        userId: sampleUsers[3].id,
        bambooPlantId: samplePlants[3].id,
        adoptionDate: new Date('2024-02-15'),
        adoptionPrice: '50.00',
        isActive: true,
        certificateIssued: false,
      },
      {
        userId: sampleUsers[0].id,
        bambooPlantId: samplePlants[4].id,
        adoptionDate: new Date(),
        adoptionPrice: '50.00',
        isActive: true,
        certificateIssued: false,
      }
    ]).returning();

    return NextResponse.json({
      success: true,
      message: 'Sample data created successfully',
      data: {
        locations: sampleLocations.length,
        plants: samplePlants.length,
        users: sampleUsers.length,
        adoptions: sampleAdoptions.length,
      }
    });

  } catch (error) {
    console.error('Error creating sample data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}