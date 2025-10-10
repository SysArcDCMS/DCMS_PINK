'use client';

import React from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface SearchAndPaginationProps {
  // Search props
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Pagination props
  currentPage: number;
  totalPages: number;
  entriesPerPage: number;
  onPageChange: (page: number) => void;
  onEntriesPerPageChange: (entries: number) => void;
  
  // Display info
  totalEntries: number;
  startEntry: number;
  endEntry: number;
  
  // Optional styling
  className?: string;
}

export default function SearchAndPagination({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  currentPage,
  totalPages,
  entriesPerPage,
  onPageChange,
  onEntriesPerPageChange,
  totalEntries,
  startEntry,
  endEntry,
  className = ""
}: SearchAndPaginationProps) {
  return (
    <div className={`flex flex-col lg:flex-row gap-4 mb-6 items-start lg:items-center ${className}`}>
      {/* Search Input */}
      <div className="flex-1 relative bg-CustomPink3">
        <Search className="text-CustomPink1 absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
        <Input
          className='border-1 border-CustomPink1 rounded-lg pl-10'
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      {/* Pagination Controls */}
      <div className="flex gap-4 items-center">
        {/* Entries Per Page */}
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600 whitespace-nowrap">Entries per page:</span>
          <Select 
            value={entriesPerPage.toString()} 
            onValueChange={(value) => onEntriesPerPageChange(Number(value))}
          >
            <SelectTrigger className="w-20 bg-CustomPink3 border-1 border-CustomPink1 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-CustomPink3 border-1 border-CustomPink1 rounded-lg">
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Pagination Info & Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing {startEntry} to {endEntry} of {totalEntries} entries
          </span>
          <div className="flex items-center gap-1">
            <Button
              className='border-1 border-CustomPink1 rounded-lg'
              variant="outline_pink"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              className='border-1 border-CustomPink1 rounded-lg'
              variant="outline_pink"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}