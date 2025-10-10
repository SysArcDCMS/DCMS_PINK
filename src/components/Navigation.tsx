'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar,
  Users,
  FileText,
  PlusCircle,
  LogOut,
  Home,
  UserPlus,
  User,
  Shield,
  Menu,
  X,
  Wrench,
  BarChart3,
  Package,
  Receipt,
  Heart,
  History,
  CreditCard
} from 'lucide-react';

interface NavigationProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeSection, setActiveSection }) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuItemClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false); // Close mobile menu when item is selected
  };

  // Close mobile menu on window resize to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobileMenuOpen]);

  // Define menu items based on user role
  const getMenuItems = () => {
    if (!user) return [];

    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home }
    ];

    switch (user.role) {
      case 'patient':
        return [
          ...baseItems,
          { id: 'appointments', label: 'My Appointments', icon: Calendar },
          { id: 'service-history', label: 'Service History', icon: History },
          { id: 'billing-history', label: 'Billing History', icon: CreditCard },
          { id: 'medical-records', label: 'Medical Records', icon: Heart },
          { id: 'profile', label: 'My Profile', icon: User }
        ];
        
      case 'dentist':
        return [
          ...baseItems,
          { id: 'appointments', label: 'Appointments', icon: Calendar },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'services', label: 'Services Catalog', icon: Wrench },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'profile', label: 'My Profile', icon: User }
        ];
        
      case 'admin':
        return [
          ...baseItems,
          { id: 'appointments', label: 'Appointments', icon: Calendar },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'billing', label: 'Billing', icon: Receipt },
          { id: 'services', label: 'Services Catalog', icon: Wrench },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'admin/users', label: 'User Management', icon: Shield },
          //ADDITIONAL FOR DEBUG ONLY
          { id: 'service-history', label: 'Service History', icon: History },
          { id: 'billing-history', label: 'Billing History', icon: CreditCard },
          { id: 'medical-records', label: 'Medical Records', icon: Heart },
          //ADDITIONAL FOR DEBUG ONLY
          { id: 'profile', label: 'My Profile', icon: User }
        ];
        
      default: // staff
        return [
          ...baseItems,
          { id: 'appointments', label: 'Appointments', icon: Calendar },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'billing', label: 'Billing', icon: Receipt },
          { id: 'services', label: 'Services Catalog', icon: Wrench },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'profile', label: 'My Profile', icon: User }
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMobileMenu}
          className="bg-CustomPink3 shadow-md hover:bg-gray-50"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <div className={`
        fixed lg:relative top-0 left-0 z-40 h-screen bg-CustomPink3 shadow-lg
        transition-transform duration-300 ease-in-out
        w-64 flex flex-col flex-shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      role="navigation"
      aria-label="Main navigation"
      >
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-CustomPink1">
                {user?.role === 'patient' ? 'Patient Portal' : 'Dental Clinic'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, {user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role === 'admin' ? 'Dentist (Admin)' : user?.role}
              </p>
            </div>
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden"
              aria-label="Close navigation menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'outline' : 'ghost'}
                  className="w-full justify-start font-bold text-CustomPink1"
                  onClick={() => handleMenuItemClick(item.id)}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </nav>
        
        {/* Sign Out Button */}
        <div className="p-4 border-t space-y-2">
          <Button
            variant="outline_pink"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
};