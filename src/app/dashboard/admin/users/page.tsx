'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Badge } from '../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { UserPlus,User , Users, Shield, Mail, Calendar, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

interface StaffUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string; // For backward compatibility
  role: 'staff' | 'dentist';
  createdAt: string;
  createdBy?: string;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: '' as 'staff' | 'dentist' | ''
  });

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Access denied. Only system administrators can manage users.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/admin/users`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name || !formData.role) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setIsCreating(true);
    setMessage(null);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          ...formData,
          createdByAdmin: user?.email
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `${formData.role} account created successfully!` });
        setFormData({ email: '', password: '', first_name: '', last_name: '', role: '' });
        setIsDialogOpen(false);
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'dentist': return { Icon:<Users className='h-4 w-4 '/>, label: 'Dentist', color: 'bg-blue-100 text-blue-800' };
      case 'staff': return { Icon:<Shield className='h-4 w-4 '/>, label: 'Staff Member', color: 'bg-green-100 text-green-800' };
      default: return { Icon:<User className='h-4 w-4 '/>, label: role, color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-CustomPink1">User Management</h1>
          <p className="text-gray-600 mt-1">Create and manage staff and dentist accounts</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className='border-1 border-CustomPink1 bg-CustomPink3'>
            <DialogHeader>
              <DialogTitle className='font-bold text-CustomPink1'>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-CustomPink1" />
                <AlertDescription className="text-blue-700">
                  As an admin, you can only create staff and dentist accounts. Patient accounts are created through registration.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="role" className='font-bold text-CustomPink1'>Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'staff' | 'dentist') => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger className='border-1 border-CustomPink1 bg-CustomPink3'>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className='border-1 border-CustomPink1 bg-CustomPink3'>
                    <SelectItem value="staff">Staff Member</SelectItem>
                    <SelectItem value="dentist">Dentist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className='font-bold text-CustomPink1'>First Name *</Label>
                  <Input
                     className='border-1 border-CustomPink1 bg-CustomPink3'
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className='font-bold text-CustomPink1'>Last Name *</Label>
                  <Input
                     className='border-1 border-CustomPink1 bg-CustomPink3'
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className='font-bold text-CustomPink1'>Email Address *</Label>
                <Input
                  className='border-1 border-CustomPink1 bg-CustomPink3'
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className='font-bold text-CustomPink1'>Password *</Label>
                <div className="relative">
                  <Input
                    className='border-1 border-CustomPink1 bg-CustomPink3'
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 font-bold text-CustomPink1" />
                    ) : (
                      <Eye className="h-4 w-4 font-bold text-CustomPink1" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateUser}
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? 'Creating...' : 'Create User'}
                </Button>
                <Button 
                  variant="outline_pink" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className='border-1 border-CustomPink1 bg-CustomPink3'>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-CustomPink1" />
            <div className="ml-4">
              <p className="text-sm font-bold text-CustomPink1">Total Users</p>
              <p className="text-2xl font-bold text-CustomPink1">{users.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-1 border-CustomPink1 bg-CustomPink3'>
          <CardContent className="flex items-center p-6">
            <Shield className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-bold text-CustomPink1">Staff Members</p>
              <p className="text-2xl font-bold text-CustomPink1">{users.filter(u => u.role === 'staff').length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-1 border-CustomPink1 bg-CustomPink3'>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-CustomPink1" />
            <div className="ml-4">
              <p className="text-sm font-bold text-CustomPink1">Dentists</p>
              <p className="text-2xl font-bold text-CustomPink1">{users.filter(u => u.role === 'dentist').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className='border-1 border-CustomPink1 bg-CustomPink3'>
        <CardHeader>
          <CardTitle className='font-bold text-CustomPink1'>Staff & Dentist Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 font-bold text-CustomPink1" />
              <p className="text-gray-500">No staff or dentist accounts created yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='font-bold text-CustomPink1'>Name</TableHead>
                  <TableHead className='font-bold text-CustomPink1'>Email</TableHead>
                  <TableHead className='font-bold text-CustomPink1'>Role</TableHead>
                  <TableHead className='font-bold text-CustomPink1'>Created</TableHead>
                  <TableHead className='font-bold text-CustomPink1'>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const roleDisplay = getRoleDisplay(user.role);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="flex items-center gap-2">
                        <User className="h-4 w-4 font-bold text-CustomPink1" />
                        {`${user.first_name} ${user.last_name}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 font-bold text-CustomPink1" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-bold text-CustomPink1">
                          {roleDisplay.Icon}
                          <Badge className={roleDisplay.color}>
                          {roleDisplay.label}           
                          </Badge>
                        </div>  
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 font-bold text-CustomPink1" />
                          {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {user.createdBy || 'System'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 p-4 rounded-lg border-1 border-CustomPink1 bg-CustomPink3">
        <h3 className="font-bold text-CustomPink1 mb-2">Admin Permissions</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Create staff and dentist accounts</li>
          <li>• Cannot create patient accounts (patients self-register)</li>
          <li>• Cannot delete or modify existing users in this demo</li>
          <li>• View all appointment and user data</li>
        </ul>
      </div>
    </div>
  );
}