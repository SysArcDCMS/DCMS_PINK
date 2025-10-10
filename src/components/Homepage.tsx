'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { HomeBookingForm } from './HomeBookingForm';
import { Calendar, Clock, Shield, Star, Phone, Mail, MapPin, Facebook } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface HomepageProps {
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
  onBookingSuccess?: () => void;
}

export function Homepage({ onLoginClick, onSignUpClick, onBookingSuccess }: HomepageProps) {
  const router = useRouter();

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      router.push('/login');
    }
  };

  const handleSignUpClick = () => {
    if (onSignUpClick) {
      onSignUpClick();
    } else {
      router.push('/signup');
    }
  };

  const scrollToBooking = () => {
    const bookingSection = document.getElementById('booking-section');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToAboutUs= () => {
    const bookingSection = document.getElementById('aboutus-section');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-CustomPink1">Go-Goyagoy</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline_pink" onClick={handleLoginClick}>
                Sign In
              </Button>
              <Button variant="outline_pink" onClick={handleSignUpClick}>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-pink-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-CustomPink1 sm:text-5xl">
                Get the Smile You've
                <span className="text-CustomPink1"> Always Wanted!</span>
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Book Your visit today and Let Us bring out Your best Smile!
              </p>
              <div className="mt-8 flex space-x-4">
                <Button size="lg" onClick={scrollToBooking}>
                  Book Appointment
                </Button>
                <Button variant="outline" size="lg" onClick={scrollToAboutUs}>
                  Learn More
                </Button>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <ImageWithFallback
                src = 'https://raw.githubusercontent.com/Shion1916/dcms-resources/refs/heads/main/img/Services/Homepage/5.png'
                alt = "Modern dental office"
                className="rounded-lg shadow-xl w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-CustomPink1">
              Why Choose Go-Goyagoy?
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              At Go-Goyagoy Dental Clinic, you’ll experience safe, convenient, and personalized dental care.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center">
                <Calendar className="h-12 w-12 text-CustomPink1" />
              </div>
              <h4 className="mt-4 text-lg font-semibold">Easy Booking</h4>
              <p className="mt-2 text-gray-600">
                You can schedule your appointment online anytime.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <Shield className="h-12 w-12 text-CustomPink1" />
              </div>
              <h4 className="mt-4 text-lg font-semibold">Safe & Secure</h4>
              <p className="mt-2 text-gray-600">
                Your health and privacy are always protected with our strict safety protocols.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <Star className="h-12 w-12 text-CustomPink1" />
              </div>
              <h4 className="mt-4 text-lg font-semibold">Expert Care</h4>
              <p className="mt-2 text-gray-600">
                You’ll receive personalized treatment from experienced dentists who truly care about your smile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-10 bg-pink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-CustomPink1">
              Our Services
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              Comprehensive dental care for the whole family
            </p>
          </div>


          <div className="mt-16 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'General Dentistry',
                img: 'https://raw.githubusercontent.com/Shion1916/dcms-resources/refs/heads/main/img/Services/Homepage/1.png',
              },
              {
                title: 'Cosmetic Dentistry',
                img: 'https://raw.githubusercontent.com/Shion1916/dcms-resources/refs/heads/main/img/Services/Homepage/2.png',
              },
              {
                title: 'Orthodontics',
                img: 'https://raw.githubusercontent.com/Shion1916/dcms-resources/refs/heads/main/img/Services/Homepage/3.png',
              },
              {
                title: 'Oral Surgery',
                img: 'https://raw.githubusercontent.com/Shion1916/dcms-resources/refs/heads/main/img/Services/Homepage/4.png',
              },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-pink-100 p-6 rounded-lg shadow-sm border flex flex-col items-center text-center"
              >
                <img
                  src={service.img}
                  alt={service.title}
                  className="w-50 h-50 object-contain mb-4"
                />
                <h4 className="text-lg font-semibold text-CustomPink1">{service.title}</h4>
                <p className="mt-2 text-gray-600">
                  Professional {service.title.toLowerCase()} services with the latest techniques and technology.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking-section" className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-extrabold text-CustomPink1">
              Book Your Appointment
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              Fill out the form below and your appointment will be confirmed instantly
            </p>
          </div>

          <div className="flex justify-center ">
            <HomeBookingForm 
              isOpen={true} 
              onClose={() => {}} 
              onSuccess={onBookingSuccess || (() => {})} 
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="aboutus-section" className="py-5 bg-CustomPink2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-extrabold text-CustomPink1">
              Contact Us
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              Get in touch with our friendly team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center">
                <Phone className="h-8 w-8 text-CustomPink1" />
              </div>
              <h4 className="mt-4 font-semibold">Phone</h4>
              <p className="mt-2 text-gray-600">(02)8671 9697</p>
              <p className="mt-2 text-gray-600">0962 850 1012</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <Mail className="h-8 w-8 text-CustomPink1" />
              </div>
              <h4 className="mt-4 font-semibold">Email</h4>
              <p className="mt-2 text-gray-600">lorylie_go@yahoo.com</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <Facebook className="h-8 w-8 text-CustomPink1" />
              </div>
              <h4 className="mt-4 font-semibold">Social Media</h4>
              <p className="mt-2 text-gray-600">Go-Goyagoy Dental Clinic</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <MapPin className="h-8 w-8 text-CustomPink1" />
              </div>
              <h4 className="mt-4 font-semibold">Location</h4>
              <p className="mt-2 text-gray-600">98 Malolos Avenue<br />Bagong Barrio, Caloocan City</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-CustomPink1 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h4 className="text-lg font-semibold">Go-Goyagoy</h4>
            <p className="mt-2 font-semibold">
              © 2024 Go-Goyagoy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}