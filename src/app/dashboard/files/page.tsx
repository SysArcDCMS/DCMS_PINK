'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Download, 
  Eye, 
  Trash2, 
  FileText, 
  Image as ImageIcon,
  File as FileIcon,
  Calendar,
  User,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface FileRecord {
  id: string;
  fileName: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy?: string;
  uploadedByName?: string;
  recordType?: string;
  patientEmail?: string;
  description?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

export default function FilesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRecordType, setFilterRecordType] = useState<string>('all');

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    filterAndSearchFiles();
  }, [files, searchTerm, filterType, filterRecordType]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/files');
      const data = await response.json();

      if (response.ok) {
        setFiles(data.files || []);
      } else {
        toast.error('Failed to load files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Error loading files');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSearchFiles = () => {
    let result = [...files];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(file =>
        file.originalFileName.toLowerCase().includes(term) ||
        file.patientEmail?.toLowerCase().includes(term) ||
        file.uploadedByName?.toLowerCase().includes(term) ||
        file.description?.toLowerCase().includes(term)
      );
    }

    // File type filter
    if (filterType !== 'all') {
      result = result.filter(file => {
        if (filterType === 'image') return file.fileType.startsWith('image/');
        if (filterType === 'pdf') return file.fileType === 'application/pdf';
        if (filterType === 'document') return file.fileType.includes('document') || file.fileType.includes('word');
        return true;
      });
    }

    // Record type filter
    if (filterRecordType !== 'all') {
      result = result.filter(file => file.recordType === filterRecordType);
    }

    setFilteredFiles(result);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else {
      return <FileIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadFile = (fileId: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `/api/files/${fileId}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewInGoogleDrive = (webViewLink: string) => {
    window.open(webViewLink, '_blank');
  };

  const deleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('File deleted successfully');
        setFiles(files.filter(f => f.id !== fileId));
      } else {
        toast.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Error deleting file');
    }
  };

  const getRecordTypeBadge = (recordType?: string) => {
    const colors: Record<string, string> = {
      medical_info: 'bg-blue-100 text-blue-800',
      allergy: 'bg-red-100 text-red-800',
      medication: 'bg-green-100 text-green-800',
      correction_request: 'bg-yellow-100 text-yellow-800',
    };

    const labels: Record<string, string> = {
      medical_info: 'Medical Info',
      allergy: 'Allergy',
      medication: 'Medication',
      correction_request: 'Correction',
    };

    if (!recordType) return null;

    return (
      <Badge className={colors[recordType] || 'bg-gray-100 text-gray-800'}>
        {labels[recordType] || recordType}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg"/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>File Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all uploaded files stored in Google Drive
          </p>
        </div>
        <Button onClick={fetchFiles} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search files, patients, uploader..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* File Type */}
            <div>
              <Label htmlFor="fileType">File Type</Label>
              <select
                id="fileType"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="pdf">PDF Documents</option>
                <option value="document">Word Documents</option>
              </select>
            </div>

            {/* Record Type */}
            <div>
              <Label htmlFor="recordType">Record Type</Label>
              <select
                id="recordType"
                value={filterRecordType}
                onChange={(e) => setFilterRecordType(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="all">All Records</option>
                <option value="medical_info">Medical Info</option>
                <option value="allergy">Allergy</option>
                <option value="medication">Medication</option>
                <option value="correction_request">Correction Request</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{files.length}</div>
            <p className="text-sm text-muted-foreground">Total Files</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {files.filter(f => f.fileType.startsWith('image/')).length}
            </div>
            <p className="text-sm text-muted-foreground">Images</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {files.filter(f => f.fileType === 'application/pdf').length}
            </div>
            <p className="text-sm text-muted-foreground">PDF Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatFileSize(files.reduce((sum, f) => sum + f.fileSize, 0))}
            </div>
            <p className="text-sm text-muted-foreground">Total Size</p>
          </CardContent>
        </Card>
      </div>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Files ({filteredFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No files found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.fileType)}
                          <div>
                            <div className="font-medium">{file.originalFileName}</div>
                            {file.description && (
                              <div className="text-sm text-muted-foreground">
                                {file.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRecordTypeBadge(file.recordType)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {file.patientEmail || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {file.uploadedByName || 'System'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatDate(file.uploadedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatFileSize(file.fileSize)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {file.webViewLink && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewInGoogleDrive(file.webViewLink!)}
                              title="View in Google Drive"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(file.id, file.originalFileName)}
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {(user?.role === 'admin' || user?.role === 'dentist') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteFile(file.id, file.originalFileName)}
                              title="Delete"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
