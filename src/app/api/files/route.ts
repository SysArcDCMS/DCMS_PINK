import { NextRequest, NextResponse } from 'next/server';
import { googleDrive } from '@/utils/googleDrive';
import { v4 as uuidv4 } from 'uuid';

const GOOGLE_DRIVE_ROOT_FOLDER = process.env.GOOGLE_DRIVE_ROOT_FOLDER || '';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const recordId = formData.get('recordId') as string;
    const recordType = formData.get('recordType') as string;
    const patientId = formData.get('patientId') as string;
    const patientEmail = formData.get('patientEmail') as string;
    const uploadedBy = formData.get('uploadedBy') as string;
    const uploadedByName = formData.get('uploadedByName') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get or create patient folder using patient ID
    const patientFolderId = await googleDrive.getOrCreatePatientFolder(
      patientId,
      GOOGLE_DRIVE_ROOT_FOLDER
    );

    // Get or create record type subfolder
    const recordTypeFolderId = await googleDrive.getOrCreateRecordTypeFolder(
      recordType,
      patientFolderId
    );

    // Generate unique filename with UUID
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    // Upload file to Google Drive
    const uploadedFile = await googleDrive.uploadFile(file, {
      fileName: uniqueFileName,
      mimeType: file.type,
      folderId: recordTypeFolderId,
      description: description || file.name, // Store original filename in description
      metadata: {
        recordId,
        recordType,
        patientId,
        patientEmail,
        uploadedBy,
        uploadedByName,
        uploadedAt: new Date().toISOString(),
        originalFileName: file.name, // Store original filename in metadata
      },
    });

    // Return file information in the format expected by the frontend
    const fileData = {
      id: uploadedFile.id,
      fileName: uploadedFile.name, // UUID filename
      originalFileName: file.name, // Original filename from upload
      fileType: uploadedFile.mimeType,
      fileSize: parseInt(uploadedFile.size || '0'),
      recordId,
      recordType,
      patientId,
      patientEmail,
      uploadedBy,
      uploadedByName,
      description: description || file.name,
      uploadedAt: uploadedFile.createdTime,
      webViewLink: uploadedFile.webViewLink,
      webContentLink: uploadedFile.webContentLink,
      thumbnailLink: uploadedFile.thumbnailLink,
    };

    return NextResponse.json({ file: fileData });
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const patientEmail = searchParams.get('patientEmail');
    const recordId = searchParams.get('recordId');
    const recordType = searchParams.get('recordType');

    console.log('[Files API GET] Request params:', {
      patientId,
      patientEmail,
      recordId,
      recordType,
    });

    // Build search query
    const metadataFilters: Record<string, string> = {};
    
    if (patientId) {
      metadataFilters.patientId = patientId;
    }
    if (patientEmail) {
      metadataFilters.patientEmail = patientEmail;
    }
    if (recordId) {
      metadataFilters.recordId = recordId;
    }
    if (recordType) {
      metadataFilters.recordType = recordType;
    }

    console.log('[Files API GET] Metadata filters:', metadataFilters);

    let files = [];

    if (Object.keys(metadataFilters).length > 0) {
      // Search by metadata
      files = await googleDrive.searchByMetadata(metadataFilters);
      console.log('[Files API GET] Found files by metadata:', files.length);
    } else {
      // List all files in root folder recursively
      const result = await googleDrive.listFiles({
        folderId: GOOGLE_DRIVE_ROOT_FOLDER,
        query: "mimeType != 'application/vnd.google-apps.folder' and trashed=false",
      });
      files = result.files;
      console.log('[Files API GET] Found all files:', files.length);
    }

    // Transform files to expected format and extract metadata from properties
    const transformedFiles = files.map((file: any) => {
      const properties = file.properties || {};
      const transformed = {
        id: file.id,
        fileName: file.name, // UUID filename
        originalFileName: properties.originalFileName || file.description || file.name,
        fileType: file.mimeType,
        fileSize: parseInt(file.size || '0'),
        uploadedAt: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        // Extract metadata from properties
        recordId: properties.recordId,
        recordType: properties.recordType,
        patientId: properties.patientId,
        patientEmail: properties.patientEmail,
        uploadedBy: properties.uploadedBy,
        uploadedByName: properties.uploadedByName,
        description: file.description,
      };
      
      console.log('[Files API GET] Transformed file:', {
        id: transformed.id,
        originalFileName: transformed.originalFileName,
        recordId: transformed.recordId,
        recordType: transformed.recordType,
      });
      
      return transformed;
    });

    console.log('[Files API GET] Returning files:', transformedFiles.length);
    return NextResponse.json({ files: transformedFiles });
  } catch (error) {
    console.error('[Files API GET] Error fetching files from Google Drive:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { fileId, recordId } = body;

    if (!fileId || !recordId) {
      return NextResponse.json(
        { error: 'fileId and recordId are required' },
        { status: 400 }
      );
    }

    console.log('[Files API PUT] Updating file:', fileId, 'with recordId:', recordId);

    // Get current metadata
    const currentMetadata = await googleDrive.getFileMetadata(fileId);
    const currentProperties = currentMetadata.properties || {};

    // Update only the recordId property
    const updatedFile = await googleDrive.updateFileMetadata(fileId, {
      ...currentProperties,
      recordId,
    });

    console.log('[Files API PUT] Successfully updated file:', updatedFile.id);

    return NextResponse.json({ 
      success: true,
      file: {
        id: updatedFile.id,
        recordId,
      }
    });
  } catch (error) {
    console.error('[Files API PUT] Error updating file metadata:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}