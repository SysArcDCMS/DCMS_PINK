import { NextRequest, NextResponse } from 'next/server';

const FILE_SERVER_URL = process.env.FILE_SERVER_URL || 'http://localhost:9000'; 

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    console.log(formData)
    // Forward the form data to the FileServer
    const response = await fetch(`${FILE_SERVER_URL}/api/files`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to upload file' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const recordId = searchParams.get('recordId');
    const recordType = searchParams.get('recordType');

    let queryParams = new URLSearchParams();
    if (patientId) queryParams.append('patientId', patientId);
    if (recordId) queryParams.append('recordId', recordId);
    if (recordType) queryParams.append('recordType', recordType);

    const response = await fetch(`${FILE_SERVER_URL}/api/files?${queryParams.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch files' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}