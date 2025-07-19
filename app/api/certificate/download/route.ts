import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { adoptions, users, packages, locations } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import jsPDF from 'jspdf';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const adoptionId = searchParams.get('adoptionId');

    if (!adoptionId) {
      return NextResponse.json(
        { success: false, error: 'Adoption ID is required' },
        { status: 400 }
      );
    }

    // Get user record
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get adoption with package and location details
    const adoptionData = await db
      .select({
        adoption: adoptions,
        package: packages,
        location: locations,
      })
      .from(adoptions)
      .leftJoin(packages, eq(adoptions.packageId, packages.id))
      .leftJoin(locations, eq(adoptions.locationId, locations.id))
      .where(
        and(
          eq(adoptions.id, parseInt(adoptionId)),
          eq(adoptions.userId, userRecord[0].id),
          eq(adoptions.isActive, true)
        )
      )
      .limit(1);

    if (adoptionData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Adoption not found or not active' },
        { status: 404 }
      );
    }

    const { adoption, package: packageData, location } = adoptionData[0];

    // Create PDF certificate
    const doc = new jsPDF();
    
    // Set up the certificate design
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Background color
    doc.setFillColor(248, 250, 252); // Light gray background
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Border
    doc.setDrawColor(34, 197, 94); // Green border
    doc.setLineWidth(3);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    // Inner border
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(1);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);
    
    // Title
    doc.setFontSize(28);
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'bold');
    const title = 'BAMBOO ADOPTION CERTIFICATE';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, 40);
    
    // Subtitle
    doc.setFontSize(16);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    const subtitle = 'Certificate of Environmental Stewardship';
    const subtitleWidth = doc.getTextWidth(subtitle);
    doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 55);
    
    // Main content
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');
    
    const mainText = 'This certifies that';
    const mainTextWidth = doc.getTextWidth(mainText);
    doc.text(mainText, (pageWidth - mainTextWidth) / 2, 80);
    
    // User name
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'bold');
    const userName = userRecord[0].firstName || 'Bamboo Adopter';
    const userNameWidth = doc.getTextWidth(userName);
    doc.text(userName, (pageWidth - userNameWidth) / 2, 100);
    
    // Adoption details
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');
    
    const adoptionText = 'has successfully adopted a bamboo plant';
    const adoptionTextWidth = doc.getTextWidth(adoptionText);
    doc.text(adoptionText, (pageWidth - adoptionTextWidth) / 2, 120);
    
    // Package details
    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'bold');
    const packageName = packageData?.name || 'Standard Package';
    const packageNameWidth = doc.getTextWidth(packageName);
    doc.text(packageName, (pageWidth - packageNameWidth) / 2, 140);
    
    // Location
    doc.setFontSize(12);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    const locationText = `Located at: ${location?.name || 'Bamboo Forest'}`;
    const locationTextWidth = doc.getTextWidth(locationText);
    doc.text(locationText, (pageWidth - locationTextWidth) / 2, 155);
    
    // Adoption details box
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    doc.rect(30, 170, pageWidth - 60, 50, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    
    const details = [
      `Adoption ID: ${adoption.id}`,
      `Adoption Date: ${adoption.adoptionDate ? new Date(adoption.adoptionDate).toLocaleDateString() : 'N/A'}`,
      `Package: ${packageData?.name || 'Standard'} (${packageData?.period || 'monthly'})`,
      `Investment: RM ${(parseFloat(adoption.adoptionPrice || '0') / 100).toFixed(2)}`,
      `Location: ${location?.name || 'Bamboo Forest'}`,
    ];
    
    details.forEach((detail, index) => {
      doc.text(detail, 35, 185 + (index * 8));
    });
    
    // Environmental impact
    doc.setFontSize(12);
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'bold');
    const impactText = 'Contributing to a Sustainable Future';
    const impactTextWidth = doc.getTextWidth(impactText);
    doc.text(impactText, (pageWidth - impactTextWidth) / 2, 240);
    
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    const benefitsText = 'Your bamboo adoption helps reduce CO₂, supports biodiversity, and promotes sustainable forestry.';
    const benefitsTextWidth = doc.getTextWidth(benefitsText);
    doc.text(benefitsText, (pageWidth - benefitsTextWidth) / 2, 250);
    
    // Date and signature area
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Certificate issued on: ${new Date().toLocaleDateString()}`, 30, 270);
    doc.text('Adopt Bamboo System', pageWidth - 80, 270);
    
    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bamboo-adoption-certificate-${adoption.id}.pdf"`,
      },
    });
    
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}