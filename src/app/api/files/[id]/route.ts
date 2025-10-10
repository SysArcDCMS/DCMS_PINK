import { NextRequest, NextResponse } from 'next/server';
import { googleDrive } from '@/utils/googleDrive';

// 
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: recordId } = await params;
    
    // Get file metadata first
    const metadata = await googleDrive.getFileMetadata(recordId);

    // Download file from Google Drive
    const fileBlob = await googleDrive.downloadFile(recordId);

    // Convert blob to buffer
    const fileBuffer = await fileBlob.arrayBuffer();
    
    const headers: HeadersInit = {
      'Content-Type': metadata.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata.name)}"`,
    };

    return new NextResponse(fileBuffer, { headers });
  } catch (error) {
    console.error('Error downloading file from Google Drive:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: recordId } = await params;
    
    // Delete file from Google Drive
    await googleDrive.deleteFile(recordId);

    return NextResponse.json({ 
      success: true,
      message: 'File deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting file from Google Drive:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}