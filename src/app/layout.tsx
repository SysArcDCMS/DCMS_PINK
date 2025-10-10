import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/AuthContext';
import { PatientProvider } from '../contexts/PatientContext';
import { AppointmentProvider } from '../contexts/AppointmentContext';
import { ServiceProvider } from '../contexts/ServiceContext';
import { Toaster } from '../components/ui/sonner';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Go-Goyagoy - Modern Dental Clinic Management',
  description: 'Complete dental clinic management system for appointments, patient records, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          <PatientProvider>
            <AppointmentProvider>
              <ServiceProvider>
                <div className="min-h-screen bg-gray-50">
                  {children}
                  <Toaster />
                </div>
              </ServiceProvider>
            </AppointmentProvider>
          </PatientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}