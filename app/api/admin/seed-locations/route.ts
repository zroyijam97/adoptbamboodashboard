import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { locations } from '@/lib/schema';

const defaultLocations = [
  {
    name: 'Hutan Simpan Kuala Lagong, Kuala Lumpur',
    description: 'Clarity Crest Sdn. Bhd. - Penanaman D. asper fasa 1 & 2 seluas 116 ha dari total 400 ha',
    address: 'Kuala Kubu Bharu, Selangor',
    coordinates: '3.6667,101.6500',
    isActive: true
  },
  {
    name: 'Ladang Buluh Bentong Pahang, Bentong Pahang',
    description: 'MN Redmount Enterprise (Redmount Agro) - Nursery & benih pelbagai spesis buluh untuk projek tempatan',
    address: 'Semenanjung Malaysia',
    coordinates: '3.3833,101.9000',
    isActive: true
  },
  {
    name: 'Taman Eko Bambu, Kluang Johor',
    description: 'Greenworld Bamboo Sdn. Bhd. - Konsultansi, nursery, penanaman komersial & deklar desentralisasi',
    address: 'Perak & Miri, Sarawak',
    coordinates: '2.0333,103.3167',
    isActive: true
  },
  {
    name: 'Kebun Bambu Selatan',
    description: 'Rich Venture Plantation + PUSAKA - Projek komersial besar: 2,760 ha kini, sasaran 10,000 ha',
    address: 'Sarawak',
    coordinates: '1.5533,110.3592',
    isActive: true
  },
  {
    name: 'Taman Bambu Utara',
    description: 'TTITC (model ladang) - Model ladang 15 ha dengan 5 spesis utama sebagai pusat rujukan',
    address: 'Hulu Terengganu, Terengganu',
    coordinates: '4.7833,102.9167',
    isActive: true
  }
];

export async function POST(request: NextRequest) {
  try {
    console.log('Starting to seed locations...');
    
    const results = [];
    
    for (const location of defaultLocations) {
      try {
        const [insertedLocation] = await db
          .insert(locations)
          .values(location)
          .returning();
        
        results.push({
          success: true,
          location: insertedLocation
        });
        
        console.log(`Successfully inserted location: ${location.name}`);
      } catch (error: any) {
        console.error(`Error inserting location ${location.name}:`, error);
        results.push({
          success: false,
          location: location.name,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${successCount} locations. ${failCount} failed.`,
      results
    });
    
  } catch (error: any) {
    console.error('Error seeding locations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed locations',
        details: error.message 
      },
      { status: 500 }
    );
  }
}