'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, FileText, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { MedicalFile, FileUploadProgress } from '../types';

interface FileUploadProps {
  recordId: string;
  recordType: 'medical_info' | 'allergy' | 'medication' | 'correction_request';
  patientId: string;
  patientEmail: string;
  uploadedBy: string;
  uploadedByName: string;
  files: MedicalFile[];
  onFilesChange: (files: MedicalFile[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  recordId,
  recordType,
  patientId,
  patientEmail,
  uploadedBy,
  uploadedByName,
  files,
  onFilesChange,
  disabled = false,
  maxFiles = 5
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return 'File type not allowed. Please upload images, PDFs, or documents.';
    }

    if (file.size > 10 * 1024 * 1024) {
      return 'File size too large. Maximum size is 10MB.';
    }

    return null;
  };

  const uploadFile = async (file: File, description: string = ''): Promise<void> => {
  //  if (process.env.VERCEL_ENV !== "production") {
  //  toast.error("Uploads are disabled outside production");
  //  return;
  //}
  
    const progressId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to upload progress
    const newProgress: FileUploadProgress = {
      id: progressId,
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    };
    
    setUploadProgress(prev => [...prev, newProgress]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('recordId', recordId);
      formData.append('recordType', recordType);
      formData.append('patientId', patientId);
      formData.append('patientEmail', patientEmail);
      formData.append('uploadedBy', uploadedBy);
      formData.append('uploadedByName', uploadedByName);
      formData.append('description', description);

      const response: Response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Update progress to completed
        setUploadProgress(prev => 
          prev.map(p => p.id === progressId ? { ...p, progress: 100, status: 'completed' } : p)
        );

        // Add to files list
        onFilesChange([...files, data.file]);
        
        toast.success(`File "${file.name}" uploaded successfully`);
        
        // Remove from progress after delay
        setTimeout(() => {
          setUploadProgress(prev => prev.filter(p => p.id !== progressId));
        }, 2000);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => 
        prev.map(p => p.id === progressId ? { 
          ...p, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : p)
      );
      
      toast.error(`Failed to upload "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFiles = useCallback(async (fileList: FileList) => {
    if (disabled) return;
    
    const newFiles = Array.from(fileList);
    
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    for (const file of newFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        continue;
      }
      
      await uploadFile(file);
    }
  }, [disabled, files.length, maxFiles, uploadFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const deleteFile = async (fileId: string): Promise<void> => {
    try {
      const response: Response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        onFilesChange(files.filter(f => f.id !== fileId));
        toast.success('File deleted successfully');
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const downloadFile = (fileId: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `/api/files/${fileId}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!disabled && files.length < maxFiles && (
        <Card>
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop files here, or{' '}
                <button
                  type="button"
                  className="text-CustomPink1 hover:text-blue-700 underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500">
                Maximum {maxFiles} files, 10MB each. Supported: Images, PDF, Word documents, Text files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Uploading Files</h4>
            <div className="space-y-3">
              {uploadProgress.map((progress) => (
                <div key={progress.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{progress.fileName}</span>
                      <span className="text-sm text-gray-500">
                        {progress.status === 'uploading' && `${progress.progress}%`}
                        {progress.status === 'completed' && 'Complete'}
                        {progress.status === 'error' && 'Error'}
                      </span>
                    </div>
                    {progress.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    )}
                    {progress.status === 'error' && progress.error && (
                      <p className="text-sm text-red-600">{progress.error}</p>
                    )}
                  </div>
                  {progress.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 animate-spin text-CustomPink1" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Uploaded Files ({files.length})</h4>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getFileIcon(file.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.originalFileName}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                    {file.description && (
                      <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file.id, file.originalFileName)}
                    >
                      Download
                    </Button>
                    {!disabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFile(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;