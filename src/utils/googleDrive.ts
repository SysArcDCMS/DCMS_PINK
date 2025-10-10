/**
 * Google Drive API Integration
 * 
 * This utility handles all Google Drive operations for the Go-Goyagoy DCMS
 * including file upload, download, deletion, and listing.
 */

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  createdTime: string;
  modifiedTime?: string;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string;
  properties?: Record<string, any>;
  description?: string;
}

interface UploadOptions {
  fileName: string;
  mimeType: string;
  folderId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private config: GoogleDriveConfig;

  constructor() {
    this.config = {
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI || '',
      refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '',
    };
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    // If we have a valid token, return it
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Refresh the token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Google Drive access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety

    if (!this.accessToken) {
      throw new Error('Failed to obtain access token');
    }

    return this.accessToken;
  }

  /**
   * Create a folder in Google Drive
   */
  async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
    const token = await this.getAccessToken();

    const metadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error('Failed to create folder in Google Drive');
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(file: File | Blob, options: UploadOptions): Promise<GoogleDriveFile> {
    const token = await this.getAccessToken();

    // Create metadata
    const metadata: any = {
      name: options.fileName,
      mimeType: options.mimeType,
    };

    if (options.folderId) {
      metadata.parents = [options.folderId];
    }

    if (options.description) {
      metadata.description = options.description;
    }

    // Add custom properties for filtering
    if (options.metadata) {
      metadata.properties = options.metadata;
    }

    // Create multipart request body
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata);

    const fileData = await file.arrayBuffer();
    const filePart = delimiter +
      `Content-Type: ${options.mimeType}\r\n\r\n`;

    // Combine parts
    const multipartRequestBody = new Blob(
      [metadataPart, filePart, fileData, closeDelimiter],
      { type: `multipart/related; boundary=${boundary}` }
    );

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,thumbnailLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to upload file: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Make file publicly readable (optional - configure based on requirements)
    await this.setFilePermissions(data.id, 'reader', 'anyone');

    return data;
  }

  /**
   * Set file permissions
   */
  async setFilePermissions(
    fileId: string,
    role: 'reader' | 'writer' | 'commenter',
    type: 'user' | 'group' | 'domain' | 'anyone',
    emailAddress?: string
  ): Promise<void> {
    const token = await this.getAccessToken();

    const permission: any = {
      type,
      role,
    };

    if (emailAddress && type !== 'anyone') {
      permission.emailAddress = emailAddress;
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permission),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to set file permissions');
    }
  }

  /**
   * Download a file from Google Drive
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download file from Google Drive');
    }

    return await response.blob();
  }

  /**
   * Delete a file from Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete file from Google Drive');
    }
  }

  /**
   * List files in a folder or with specific query
   */
  async listFiles(options?: {
    folderId?: string;
    query?: string;
    pageSize?: number;
    pageToken?: string;
  }): Promise<{ files: GoogleDriveFile[]; nextPageToken?: string }> {
    const token = await this.getAccessToken();

    let query = options?.query || '';
    
    if (options?.folderId) {
      query = query ? `${query} and '${options.folderId}' in parents` : `'${options.folderId}' in parents`;
    }

    const params = new URLSearchParams({
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, properties, description)',
      pageSize: String(options?.pageSize || 100),
    });

    if (query) {
      params.append('q', query);
    }

    if (options?.pageToken) {
      params.append('pageToken', options.pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to list files from Google Drive');
    }

    return await response.json();
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<GoogleDriveFile> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,thumbnailLink,properties,description`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get file metadata from Google Drive');
    }

    return await response.json();
  }

  /**
   * Search files by metadata properties
   */
  async searchByMetadata(metadata: Record<string, string>): Promise<GoogleDriveFile[]> {
    const queries = Object.entries(metadata).map(
      ([key, value]) => `properties has { key='${key}' and value='${value}' }`
    );

    const result = await this.listFiles({
      query: queries.join(' and '),
    });

    return result.files;
  }

  /**
   * Get or create patient folder by patient ID
   */
  async getOrCreatePatientFolder(patientId: string, rootFolderId?: string): Promise<string> {
    // Search for existing folder
    const query = `mimeType='application/vnd.google-apps.folder' and name='${patientId}' and trashed=false`;
    const result = await this.listFiles({ query, folderId: rootFolderId });

    if (result.files.length > 0) {
      return result.files[0].id;
    }

    // Create new folder
    return await this.createFolder(patientId, rootFolderId);
  }

  /**
   * Set folder permissions for a user
   */
  async setFolderPermissionsForUser(
    folderId: string,
    userEmail: string,
    role: 'reader' | 'writer' = 'reader'
  ): Promise<void> {
    await this.setFilePermissions(folderId, role, 'user', userEmail);
  }

  /**
   * Get or create record type subfolder
   */
  async getOrCreateRecordTypeFolder(
    recordType: string,
    patientFolderId: string
  ): Promise<string> {
    // Search for existing folder
    const query = `mimeType='application/vnd.google-apps.folder' and name='${recordType}' and trashed=false`;
    const result = await this.listFiles({ query, folderId: patientFolderId });

    if (result.files.length > 0) {
      return result.files[0].id;
    }

    // Create new folder
    return await this.createFolder(recordType, patientFolderId);
  }

  /**
   * Update file metadata properties
   */
  async updateFileMetadata(
    fileId: string,
    properties: Record<string, any>
  ): Promise<GoogleDriveFile> {
    const token = await this.getAccessToken();

    const metadata = {
      properties,
    };

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,thumbnailLink,properties,description`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update file metadata: ${error.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  }
}

// Export singleton instance
export const googleDrive = new GoogleDriveService();

// Export types
export type { GoogleDriveFile, UploadOptions, GoogleDriveConfig };
