/*import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Enable CORS for all routes
app.use('*', cors({
  origin: '*',
  allowHeaders: [
    '*'
  ],
  allowMethods: [
    '*'
  ]
}));

// Add logging
app.use('*', logger(console.log));

// Auth endpoints
app.post('/make-server-c89a26e4/auth/signin', async (c)=>{
  try {
    const { email, password } = await c.req.json();
    console.log('Sign-in attempt for email:', email);
    
    if (!email || !password) {
      console.log('Missing email or password');
      return c.json({
        error: 'Email and password are required'
      }, 400);
    }

    // Check server-side login attempts tracking
    const attemptKey = `dcms:login-attempts:${email}`;
    const lockoutKey = `dcms:lockout:${email}`;

    // Check if user is currently locked out
    const lockoutData = await kv.get(lockoutKey);
    if (lockoutData) {
      const lockoutTime = new Date(lockoutData.lockedUntil);
      if (new Date() < lockoutTime) {
        const remainingTime = Math.ceil((lockoutTime.getTime() - new Date().getTime()) / 1000 / 60);
        console.log(`Login blocked - user ${email} is locked out for ${remainingTime} more minutes`);
        return c.json({
          error: `Too many failed login attempts. Please try again in ${remainingTime} minute${remainingTime !== 1 ? 's' : ''}.`
        }, 429); // Too Many Requests
      } else {
        // Lockout expired, clear it
        await kv.del(lockoutKey);
        await kv.del(attemptKey);
        console.log(`Lockout expired for ${email}, clearing records`);
      }
    }

    // Get user from KV store
    const userKey = `dcms:user:${email}`;
    const user = await kv.get(userKey);
    
    if (!user) {
      console.log('User not found for email:', email);
      // Track failed attempt for non-existent user
      await trackFailedLoginAttempt(email, attemptKey, lockoutKey);
      return c.json({
        error: 'No account exists with this email address'
      }, 401);
    }

    // Check if user is allowed to login (walk-in patients cannot login until they register)
    if (user.canLogin === false) {
      console.log('Login denied - user cannot login (walk-in patient):', email);
      return c.json({
        error: 'This account was created as a walk-in patient. Please register first to create your password and enable login access. Contact our staff if you need assistance.'
      }, 403);
    }

    if (user.password !== password) {
      console.log('Incorrect password for email:', email);
      // Track failed attempt for incorrect password
      await trackFailedLoginAttempt(email, attemptKey, lockoutKey);
      return c.json({
        error: 'Incorrect password. Please check your password and try again.'
      }, 401);
    }

    // Successful login - clear any failed attempts
    await kv.del(attemptKey);
    await kv.del(lockoutKey);

    console.log('Sign-in successful for:', email, 'Role:', user.role);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return c.json({
      user: userWithoutPassword
    });
  } catch (error) {
    console.log('Sign-in error:', error);
    return c.json({
      error: 'Authentication failed'
    }, 500);
  }
});

app.post('/make-server-c89a26e4/auth/signup', async (c)=>{
  try {
    const { email, password, first_name, last_name, phone, requireEmailValidation, domain } = await c.req.json();
    
    if (!email || !password || !first_name || !last_name) {
      return c.json({
        error: 'Email, password, first name, and last name are required'
      }, 400);
    }

    // Check if user already exists
    const existingUser = await kv.get(`dcms:user:${email}`);
    if (existingUser && existingUser.registrationType == 'registered') {
      return c.json({
        error: 'User with this email already exists as reg'
      }, 409);
    }

    // Generate validation token if email validation is required
    let validationToken = null;
    let validationLink = null;
    
    if (requireEmailValidation) {
      validationToken = crypto.randomUUID();
      validationLink = `${domain || 'http://localhost:3000'}/validate-email?token=${validationToken}&email=${encodeURIComponent(email)}`;
      
      // Store validation token with expiry (24 hours)
      const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await kv.set(`dcms:email-validation:${validationToken}`, {
        email,
        first_name,
        last_name,
        password,
        phone: phone || null,
        expiresAt: expiryTime.toISOString(),
        createdAt: new Date().toISOString()
      });
      
      // Create index for easier lookup
      await kv.set(`dcms:email-validation-index:${email}`, validationToken);
    }

    // Create user object with computed name field for backward compatibility
    const fullName = `${first_name} ${last_name}`.trim();
    const userId = `user-${crypto.randomUUID()}`;
    const newUser = {
      id: userId,
      email,
      password,
      first_name,
      last_name,
      name: fullName,
      phone: phone || null,
      role: 'patient',
      canLogin: requireEmailValidation ? false : true,
      registrationType: 'registered',
      emailValidated: requireEmailValidation ? false : true,
      validationToken: requireEmailValidation ? validationToken : null,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString()
    };

    if (requireEmailValidation) {
      // Don't create the user yet, just return validation info
      console.log(`Signup initiated for ${email} - email validation required`);
      return c.json({
        success: true,
        emailValidationRequired: true,
        validationLink,
        message: 'Please check your email for validation link'
      });
    } else {
      // Create user immediately (fallback behavior)
      await kv.set(`dcms:user:${email}`, newUser);
      console.log(`Created user: ${email} (${newUser.role})`);
      return c.json({
        success: true,
        user: {
          ...newUser,
          password: undefined // Don't return password
        }
      });
    }
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({
      error: 'Failed to create account'
    }, 500);
  }
});

app.post('/make-server-c89a26e4/auth/validate-email', async (c)=>{
  try {
    const { token, email } = await c.req.json();
    
    if (!token || !email) {
      return c.json({
        error: 'Missing validation token or email'
      }, 400);
    }

    // Get validation data
    const validationData = await kv.get(`dcms:email-validation:${token}`);
    if (!validationData) {
      return c.json({
        error: 'Invalid or expired validation token'
      }, 400);
    }

    if (validationData.email !== email) {
      return c.json({
        error: 'Token does not match email'
      }, 400);
    }

    // Check if token has expired
    const expiryTime = new Date(validationData.expiresAt);
    if (new Date() > expiryTime) {
      // Clean up expired token and index
      await kv.del(`dcms:email-validation:${token}`);
      await kv.del(`dcms:email-validation-index:${email}`);
      return c.json({
        error: 'Validation token has expired'
      }, 400);
    }

    // Check if user already exists (might have been created through other means)
    const existingUser = await kv.get(`dcms:user:${email}`);
    if (existingUser && existingUser.canLogin) {
      return c.json({
        error: 'Email has already been validated'
      }, 400);
    }

    // Create the validated user
    const fullName = `${validationData.first_name} ${validationData.last_name}`.trim();
    const userId = `user-${crypto.randomUUID()}`;
    const newUser = {
      id: userId,
      email: validationData.email,
      password: validationData.password,
      first_name: validationData.first_name,
      last_name: validationData.last_name,
      name: fullName,
      phone: validationData.phone,
      role: 'patient',
      canLogin: true,
      registrationType: 'registered',
      emailValidated: true,
      validationToken: null,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString()
    };

    await kv.set(`dcms:user:${email}`, newUser);
    
    // Clean up validation token and index
    await kv.del(`dcms:email-validation:${token}`);
    await kv.del(`dcms:email-validation-index:${email}`);

    console.log(`Email validated and user created: ${email}`);

    return c.json({
      success: true,
      message: 'Email validated successfully. You can now sign in.',
      user: {
        ...newUser,
        password: undefined // Don't return password
      }
    });
  } catch (error) {
    console.log('Email validation error:', error);
    return c.json({
      error: 'Failed to validate email'
    }, 500);
  }
});

app.post('/make-server-c89a26e4/auth/resend-validation', async (c)=>{
  try {
    const { email, domain } = await c.req.json();
    
    if (!email) {
      return c.json({
        error: 'Email is required'
      }, 400);
    }

    // We need to get all validation tokens and find the one for this email
    // Since getByPrefix returns only values, we'll need to use a different approach
    // Let's use a helper key to track validation tokens by email
    const emailValidationKey = `dcms:email-validation-index:${email}`;
    const existingTokenId = await kv.get(emailValidationKey);
    
    let validationData = null;
    if (existingTokenId) {
      validationData = await kv.get(`dcms:email-validation:${existingTokenId}`);
    }

    // If no existing validation data found, return error
    if (!validationData) {
      return c.json({
        error: 'No pending registration found for this email'
      }, 404);
    }

    // Check if user already exists and is validated
    const existingUser = await kv.get(`dcms:user:${email}`);
    if (existingUser && existingUser.canLogin) {
      return c.json({
        error: 'This email has already been validated'
      }, 400);
    }

    // Generate new validation token
    const newValidationToken = crypto.randomUUID();
    const validationLink = `${domain || 'http://localhost:3000'}/validate-email?token=${newValidationToken}&email=${encodeURIComponent(email)}`;
    
    // Update with new token and extend expiry
    const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const updatedValidationData = {
      ...validationData,
      expiresAt: expiryTime.toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Delete old token and create new one
    if (existingTokenId) {
      await kv.del(`dcms:email-validation:${existingTokenId}`);
    }
    
    // Store new validation data and update index
    await kv.set(`dcms:email-validation:${newValidationToken}`, updatedValidationData);
    await kv.set(emailValidationKey, newValidationToken);

    console.log(`Validation email resent for ${email} with new token: ${newValidationToken}`);

    return c.json({
      success: true,
      validationLink,
      message: 'Validation email sent successfully'
    });
  } catch (error) {
    console.log('Resend validation error:', error);
    return c.json({
      error: 'Failed to resend validation email'
    }, 500);
  }
});

// Appointments Endpoint
app.get('/make-server-c89a26e4/appointments', async (c)=>{
  try {
    const userEmail = c.req.query('userEmail');
    const role = c.req.query('role');
    const currentDateOnly = c.req.query('currentDateOnly');
    
    // Get current date in YYYY-MM-DD format for filtering
    const currentDate = new Date().toISOString().split('T')[0];

    if (role === 'patient' && userEmail) {
      // Get patient's appointments only
      const appointmentIds = await kv.get(`dcms:user-appointments:${userEmail}`) || [];
      const appointments = [];
      
      for (const id of appointmentIds){
        const appointment = await kv.get(`dcms:appointment:${id}`);
        if (appointment) {
          // Filter by current date if requested
          if (currentDateOnly === 'true') {
            const appointmentDate = appointment.appointmentDate || appointment.requestedDate;
            if (appointmentDate === currentDate) {
              appointments.push(appointment);
            }
          } else {
            appointments.push(appointment);
          }
        }
      }
      
      return c.json({
        appointments
      });
    } else {
      // Staff/Dentist/Admin can see all appointments
      const allAppointments = await kv.getByPrefix('dcms:appointment:');
      
      // Filter by current date if requested
      let appointments = allAppointments;
      if (currentDateOnly === 'true') {
        appointments = allAppointments.filter((appointment)=>{
          const appointmentDate = appointment.appointmentDate || appointment.requestedDate;
          return appointmentDate === currentDate;
        });
      }
      
      return c.json({
        appointments
      });
    }
  } catch (error) {
    console.log('Get appointments error:', error);
    return c.json({
      error: 'Failed to fetch appointments'
    }, 500);
  }
});

app.post('/make-server-c89a26e4/appointments', async (c)=>{
  try {
    const appointmentData = await c.req.json();
    const appointmentId = crypto.randomUUID();

    // Handle user creation for home booking requests
    if ((appointmentData.type === 'home_booking_request' || appointmentData.type === 'logged_in_booking_request') && appointmentData.patientEmail && !appointmentData.existingUserId) {
      // Check if user already exists
      const existingUser = await kv.get(`dcms:user:${appointmentData.patientEmail}`);
      
      if (!existingUser) {
        // Create new anonymous patient record
        const userId = `user-${crypto.randomUUID()}`;
        const [firstName, ...lastNameParts] = appointmentData.patientName.split(' ');
        const lastName = lastNameParts.join(' ');
        
        const newUser = {
          id: userId,
          first_name: firstName,
          last_name: lastName,
          role: 'patient',
          email: appointmentData.patientEmail,
          phone: appointmentData.patientPhone || null,
          canLogin: false,
          password: null,
          registrationType: 'anonymous',
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString()
        };
        
        await kv.set(`dcms:user:${appointmentData.patientEmail}`, newUser);
        console.log(`Created new anonymous user: ${appointmentData.patientEmail}`);
      }
    }

    const appointment = {
      id: appointmentId,
      ...appointmentData,
      status: 'booked',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // All appointments are auto-confirmed
      appointmentDate: appointmentData.requestedDate || appointmentData.appointmentDate,
      appointmentTime: appointmentData.requestedTimeSlot ? appointmentData.requestedTimeSlot.split('-')[0] : appointmentData.appointmentTime,
      // Only assign dentist if not from patient-initiated booking
      dentistName: appointmentData.type === 'home_booking_request' || appointmentData.type === 'logged_in_booking_request' ? undefined : appointmentData.dentistName || 'Dr. Sarah Johnson',
      // Include serviceDetails if provided
      serviceDetails: appointmentData.serviceDetails || null
    };

    await kv.set(`dcms:appointment:${appointmentId}`, appointment);

    // Add to user's appointments list
    if (appointmentData.patientEmail) {
      const userAppointments = await kv.get(`dcms:user-appointments:${appointmentData.patientEmail}`) || [];
      userAppointments.push(appointmentId);
      await kv.set(`dcms:user-appointments:${appointmentData.patientEmail}`, userAppointments);
    }

    return c.json({
      appointment
    });
  } catch (error) {
    console.log('Create appointment error:', error);
    return c.json({
      error: 'Failed to create appointment'
    }, 500);
  }
});

app.get('/make-server-c89a26e4/appointments/:id', async (c)=>{
  try {
    const appointmentId = c.req.param('id');
    const appointment = await kv.get(`dcms:appointment:${appointmentId}`);
    
    if (!appointment) {
      return c.json({
        error: 'Appointment not found'
      }, 404);
    }

    return c.json({
      appointment
    });
  } catch (error) {
    console.log('Get single appointment error:', error);
    return c.json({
      error: 'Failed to fetch appointment'
    }, 500);
  }
});

app.put('/make-server-c89a26e4/appointments/:id', async (c)=>{
  try {
    const appointmentId = c.req.param('id');
    const updates = await c.req.json();
    
    const appointment = await kv.get(`dcms:appointment:${appointmentId}`);
    if (!appointment) {
      return c.json({
        error: 'Appointment not found'
      }, 404);
    }

    const updatedAppointment = {
      ...appointment,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // If status is being updated to cancelled, ensure we have a cancellation reason
    if (updates.status === 'cancelled' && !updates.cancellationReason) {
      updatedAppointment.cancellationReason = 'other';
    }

    await kv.set(`dcms:appointment:${appointmentId}`, updatedAppointment);

    return c.json({
      appointment: updatedAppointment
    });
  } catch (error) {
    console.log('Update appointment error:', error);
    return c.json({
      error: 'Failed to update appointment'
    }, 500);
  }
});

const handleAppointmentComplete = async (c)=>{
  try {
    const appointmentId = c.req.param('id');
    const updatedAppointmentData = await c.req.json();
    
    const existingAppointment = await kv.get(`dcms:appointment:${appointmentId}`);
    if (!existingAppointment) {
      return c.json({
        error: 'Appointment not found'
      }, 404);
    }

    // Validate serviceDetails
    if (!updatedAppointmentData.serviceDetails || !Array.isArray(updatedAppointmentData.serviceDetails) || updatedAppointmentData.serviceDetails.length === 0) {
      return c.json({
        error: 'At least one service is required in serviceDetails'
      }, 400);
    }

    // Validate each service has required fields
    for (const service of updatedAppointmentData.serviceDetails){
      if (!service.name || service.name.trim() === '') {
        return c.json({
          error: 'All services must have a name'
        }, 400);
      }

      // Additional validation for treatment services
      if (service.has_treatment_detail && service.treatments && service.treatments.length > 0) {
        const hasValidTreatment = service.treatments.some((treatment)=>treatment.detail && treatment.detail.trim() !== '');
        if (!hasValidTreatment) {
          return c.json({
            error: 'Treatment services must have at least one valid treatment detail'
          }, 400);
        }
      }
    }

    const completedAppointment = {
      ...existingAppointment,
      ...updatedAppointmentData,
      status: 'completed',
      completedAt: new Date().toISOString(),
      statusUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`dcms:appointment:${appointmentId}`, completedAppointment);

    console.log(`Appointment ${appointmentId} completed with ${updatedAppointmentData.serviceDetails.length} services by ${updatedAppointmentData.completedBy}`);

    return c.json({
      appointment: completedAppointment
    });
  } catch (error) {
    console.log('Complete appointment error:', error);
    return c.json({
      error: 'Failed to complete appointment'
    }, 500);
  }
};

app.put('/make-server-c89a26e4/appointments/:id/complete', handleAppointmentComplete);
app.patch('/make-server-c89a26e4/appointments/:id/complete', handleAppointmentComplete);

app.put('/make-server-c89a26e4/appointments/:id/status', async (c)=>{
  try {
    const appointmentId = c.req.param('id');
    const { status, updatedBy, cancellationReason, cancellationNotes, cancelledBy } = await c.req.json();
    
    const appointment = await kv.get(`dcms:appointment:${appointmentId}`);
    if (!appointment) {
      return c.json({
        error: 'Appointment not found'
      }, 404);
    }

    const updatedAppointment = {
      ...appointment,
      status,
      updatedBy: updatedBy || cancelledBy,
      statusUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Handle cancellation-specific fields
    if (status === 'cancelled') {
      updatedAppointment.cancellationReason = cancellationReason || 'other';
      updatedAppointment.cancellationNotes = cancellationNotes;
      updatedAppointment.cancelledAt = new Date().toISOString();
      updatedAppointment.cancelledBy = cancelledBy || updatedBy;
    }

    // Handle completion-specific fields
    if (status === 'completed') {
      updatedAppointment.completedAt = new Date().toISOString();
    }

    await kv.set(`dcms:appointment:${appointmentId}`, updatedAppointment);

    return c.json({
      appointment: updatedAppointment
    });
  } catch (error) {
    console.log('Update appointment status error:', error);
    return c.json({
      error: 'Failed to update appointment status'
    }, 500);
  }
});

app.post('/make-server-c89a26e4/available-slots', async (c)=>{
  try {
    const { date, serviceDuration = 60, bufferTime = 15 } = await c.req.json();
    
    if (!date) {
      return c.json({
        error: 'Date is required'
      }, 400);
    }

    console.log(`📅 Calculating slots for ${date}, duration: ${serviceDuration}min, buffer: ${bufferTime}min`);

    // --- Load appointments ---
    const allAppointments = await kv.getByPrefix('dcms:appointment:');
    const dayAppointments = allAppointments.filter((apt)=>{
      const appointmentDate = apt.date || apt.requestedDate;
      return appointmentDate === date && apt.status === 'booked';
    });

    console.log(`Found ${dayAppointments.length} booked appointments for ${date}`);

    // --- Work hours ---
    let workStart = 9 * 60; // 9:00 AM
    const workEnd = 17 * 60; // 5:00 PM
    const slotInterval = 15; // slots every 15 minutes
    const totalSlotTime = serviceDuration + bufferTime;

    // --- Break times (from 1272) ---
    //const breakTimes = [
    //  {
    //    start: '12:00',
    //    end: '13:00',
    //    name: 'Lunch Break'
    //  }
    //];

    //const breakTimesParsed = breakTimes.map((b)=>({
    //    startMinutes: parseInt(b.start.split(':')[0]) * 60 + parseInt(b.start.split(':')[1]),
    //    endMinutes: parseInt(b.end.split(':')[0]) * 60 + parseInt(b.end.split(':')[1]),
    //    name: b.name
    //  }));

    // --- Skip past slots if today ---
    const now = new Date();
    const localNow = new Date(now.getTime() + 8 * 60 * 60 * 1000); // UTC+8
    const localToday = localNow.toISOString().slice(0, 10);

    if (date === localToday) {
      const currentMinutes = localNow.getHours() * 60 + localNow.getMinutes();
      workStart = Math.max(workStart, Math.ceil(currentMinutes / 5) * 5); // round up to next 5 min
    }

    const availableSlots = [];

    // --- Generate slots ---
    for(let startMinutes = workStart; startMinutes < workEnd; startMinutes += slotInterval){
      const slotEndMinutes = startMinutes + totalSlotTime;
      if (slotEndMinutes > workEnd) continue; // past business hours

      const startTime = formatMinutesToTime(startMinutes);
      const endTime = formatMinutesToTime(slotEndMinutes);

      let hasConflict = false;
      let conflictReason = '';

      // Check break times
      //for (const b of breakTimesParsed){
      //  if (startMinutes < b.endMinutes && slotEndMinutes > b.startMinutes) {
      //    hasConflict = true;
      //    conflictReason = `Conflicts with ${b.name}`;
      //    break;
      //  }
      //}

      // Check booked appointments
      if (!hasConflict) {
        for (const apt of dayAppointments){
          let aptStartTime, aptDuration = 60, aptBuffer = 15;

          if (apt.time) {
            aptStartTime = apt.time;
            aptDuration = apt.serviceDuration || 60;
            aptBuffer = apt.bufferTime || 15;
          } else if (apt.requestedTimeSlot) {
            const [startTimeStr] = apt.requestedTimeSlot.split('-');
            aptStartTime = startTimeStr;
            aptDuration = apt.serviceDuration || 60;
            aptBuffer = apt.bufferTime || 15;
          } else {
            continue;
          }

          const aptStart = timeToMinutes(aptStartTime);
          const aptEnd = aptStart + aptDuration + aptBuffer;

          if (!(slotEndMinutes <= aptStart || startMinutes >= aptEnd)) {
            hasConflict = true;
            conflictReason = `Conflicts with booked appointment at ${aptStartTime}`;
            break;
          }
        }
      }

      availableSlots.push({
        startTime,
        endTime,
        available: !hasConflict,
        conflictReason: hasConflict ? conflictReason : undefined
      });
    }

    const availableOnlySlots = availableSlots.filter((slot)=>slot.available);
    console.log(`Generated ${availableSlots.length} slots, ${availableSlots.filter((s)=>s.available).length} available`);

    return c.json({
      slots: availableOnlySlots,
      metadata: {
        date,
        serviceDuration,
        bufferTime,
        totalSlotTime,
        existingAppointments: dayAppointments.length
      }
    });
  } catch (error) {
    console.error('Available slots error:', error);
    return c.json({
      error: 'Failed to calculate available slots'
    }, 500);
  }
});

// Appointment email check endpoint
app.post('/make-server-c89a26e4/appointments/check-email', async (c)=>{
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({
        error: 'Email is required'
      }, 400);
    }

    // Get all appointments for this email
    const userAppointments = await kv.get(`dcms:user-appointments:${email}`) || [];
    
    // Check if user has any non-cancelled appointments
    let hasExistingBooking = false;
    for (const appointmentId of userAppointments){
      const appointment = await kv.get(`dcms:appointment:${appointmentId}`);
      if (appointment && appointment.status !== 'cancelled' && appointment.status !== 'completed') {
        hasExistingBooking = true;
        break;
      }
    }

    return c.json({
      hasExistingBooking
    });
  } catch (error) {
    console.log('Check email error:', error);
    return c.json({
      error: 'Failed to check email'
    }, 500);
  }
});

// Patients endpoint - get all patients for staff/admin
app.get('/make-server-c89a26e4/patients', async (c)=>{
  try {
    const allUsers = await kv.getByPrefix('dcms:user:');
    const patients = allUsers.filter((user)=>user.role === 'patient').map((user)=>{
      // Add computed name field for backward compatibility
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const patientWithName = {
        ...user,
        name: user.name || fullName || user.email
      };
      return patientWithName;
    });

    return c.json({
      patients
    });
  } catch (error) {
    console.log('Get patients error:', error);
    return c.json({
      error: 'Failed to fetch patients'
    }, 500);
  }
});

// Profile update endpoint
app.put('/make-server-c89a26e4/profile/:email', async (c)=>{
  try {
    const email = c.req.param('email');
    const updates = await c.req.json();
    
    const user = await kv.get(`dcms:user:${email}`);
    if (!user) {
      return c.json({
        error: 'User not found'
      }, 404);
    }

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`dcms:user:${email}`, updatedUser);

    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    return c.json({
      user: userWithoutPassword
    });
  } catch (error) {
    console.log('Profile update error:', error);
    return c.json({
      error: 'Failed to update profile'
    }, 500);
  }
});

// Medical Records Endpoints
// Get medical records by patient
app.get('/make-server-c89a26e4/medical-records', async (c)=>{
  try {
    const patientEmail = c.req.query('patientEmail');
    
    if (!patientEmail) {
      return c.json({
        error: 'Patient email is required'
      }, 400);
    }

    const allRecords = await kv.getByPrefix('dcms:medical_record:');
    const patientRecords = allRecords.filter((record)=>record.patientEmail === patientEmail && record.isActive);

    // Group records by type
    const medicalInfo = patientRecords.filter((record)=>record.type === 'medical_info');
    const allergies = patientRecords.filter((record)=>record.type === 'allergy');
    const medications = patientRecords.filter((record)=>record.type === 'medication');

    // Attach files to each record
    const allFiles = await kv.getByPrefix('dcms:file:');
    for (const record of patientRecords){
      record.files = allFiles.filter((file)=>file.recordId === record.id && file.isActive);
    }

    return c.json({
      medicalInfo,
      allergies,
      medications
    });
  } catch (error) {
    console.log('Get medical records error:', error);
    return c.json({
      error: 'Failed to fetch medical records'
    }, 500);
  }
});

// Correction Requests Endpoints
app.get('/make-server-c89a26e4/correction-requests/:patientEmail', async (c)=>{
  try {
    const patientEmail = c.req.param('patientEmail');
    const allRequests = await kv.getByPrefix('dcms:correction-request:');
    const patientRequests = allRequests.filter((req)=>req.patientEmail === patientEmail);

    return c.json({
      requests: patientRequests.sort((a, b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    });
  } catch (error) {
    console.log('Get correction requests error:', error);
    return c.json({
      error: 'Failed to fetch correction requests'
    }, 500);
  }
});

// Patient validation endpoint
app.post('/make-server-c89a26e4/patients/validate', async (c)=>{
  try {
    const { email, firstName, lastName, phone } = await c.req.json();
    
    if (!email) {
      return c.json({
        error: 'Email is required'
      }, 400);
    }

    // Check if user exists by email
    const existingUser = await kv.get(`dcms:user:${email}`);
    
    if (!existingUser) {
      // User doesn't exist - can proceed with booking (user will be created during booking)
      return c.json({
        canBook: true,
        hasOutstandingBalance: false,
        existingUser: null,
        message: 'New patient - ready to book'
      });
    }

    // User exists - check if they can login (registered user)
    if (existingUser.canLogin) {
      return c.json({
        canBook: false,
        hasOutstandingBalance: false,
        existingUser,
        message: 'This email is already registered. Please log in to continue.'
      });
    }

    // Check for outstanding balances
    const allBills = await kv.getByPrefix('dcms:bill:');
    const userBills = allBills.filter((bill)=>bill.patientEmail === email && bill.outstandingBalance > 0);
    const totalOutstanding = userBills.reduce((sum, bill)=>sum + bill.outstandingBalance, 0);

    if (totalOutstanding > 0) {
      return c.json({
        canBook: false,
        hasOutstandingBalance: true,
        outstandingAmount: totalOutstanding,
        existingUser,
        message: `Outstanding balance of ₱${totalOutstanding.toLocaleString()}`
      });
    }

    // Check if data matches existing record
    const dataMatches = existingUser.first_name === firstName && existingUser.last_name === lastName && (existingUser.phone === phone || !existingUser.phone && !phone);

    if (!dataMatches) {
      // Data doesn't match - use existing data
      return c.json({
        canBook: true,
        hasOutstandingBalance: false,
        existingUser,
        shouldUseExistingData: true,
        message: 'We found an existing patient record for this email. Booking will proceed under that record.'
      });
    }

    // Everything matches - proceed with booking
    return c.json({
      canBook: true,
      hasOutstandingBalance: false,
      existingUser,
      message: 'Patient validated successfully'
    });
  } catch (error) {
    console.log('Patient validation error:', error);
    return c.json({
      error: 'Failed to validate patient'
    }, 500);
  }
});

// Services catalog endpoints
app.get('/make-server-c89a26e4/services', async (c)=>{
  try {
    const includeInactive = c.req.query('includeInactive') === 'true';
    const allServices = await kv.getByPrefix('dcms:service-catalog:');
    
    // Ensure all services have is_active field (default to true for existing services)
    const servicesWithActiveStatus = allServices.map(service => ({
      ...service,
      is_active: service.is_active !== undefined ? service.is_active : true
    }));
    
    // Filter based on includeInactive parameter
    const filteredServices = includeInactive 
      ? servicesWithActiveStatus 
      : servicesWithActiveStatus.filter(service => service.is_active);
    
    return c.json({
      services: filteredServices
    });
  } catch (error) {
    console.log('Get services error:', error);
    return c.json({
      error: 'Failed to fetch services'
    }, 500);
  }
});

app.post('/make-server-c89a26e4/services', async (c)=>{
  try {
    const serviceData = await c.req.json();
    const serviceId = crypto.randomUUID();
    
    const service = {
      id: serviceId,
      ...serviceData,
      is_active: serviceData.is_active !== undefined ? serviceData.is_active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`dcms:service-catalog:${serviceId}`, service);

    // Create activity log
    await createServiceLog(
      serviceId,
      service.name,
      'add',
      serviceData.createdBy || 'system',
      `Service created: ${service.name} - ₱${service.base_price} (${service.estimated_duration}m + ${service.buffer_time}m buffer)`
    );

    return c.json({
      service
    });
  } catch (error) {
    console.log('Create service error:', error);
    return c.json({
      error: 'Failed to create service'
    }, 500);
  }
});

app.put('/make-server-c89a26e4/services/:id', async (c)=>{
  try {
    const serviceId = c.req.param('id');
    const updates = await c.req.json();
    
    const service = await kv.get(`dcms:service-catalog:${serviceId}`);
    if (!service) {
      return c.json({
        error: 'Service not found'
      }, 404);
    }

    // Ensure the service has is_active field (default to true for existing services)
    const serviceWithActiveStatus = {
      ...service,
      is_active: service.is_active !== undefined ? service.is_active : true
    };

    const updatedService = {
      ...serviceWithActiveStatus,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`dcms:service-catalog:${serviceId}`, updatedService);

    // Create activity log - check if this is an archive/activate action
    let action = 'edit';
    let changes = '';
    
    if ('is_active' in updates && updates.is_active !== serviceWithActiveStatus.is_active) {
      action = updates.is_active ? 'activate' : 'archive';
      changes = updates.is_active ? 
        `Service activated: ${service.name}` : 
        `Service archived: ${service.name}`;
    } else {
      // Regular edit - track specific changes
      const changedFields = [];
      if (updates.name && updates.name !== service.name) changedFields.push(`name: "${service.name}" → "${updates.name}"`);
      if (updates.base_price && updates.base_price !== service.base_price) changedFields.push(`price: ₱${service.base_price} → ₱${updates.base_price}`);
      if (updates.estimated_duration && updates.estimated_duration !== service.estimated_duration) changedFields.push(`duration: ${service.estimated_duration}m → ${updates.estimated_duration}m`);
      if (updates.buffer_time && updates.buffer_time !== service.buffer_time) changedFields.push(`buffer: ${service.buffer_time}m → ${updates.buffer_time}m`);
      
      changes = changedFields.length > 0 ? 
        `Service updated: ${changedFields.join(', ')}` : 
        `Service updated: ${service.name}`;
    }

    await createServiceLog(
      serviceId,
      updatedService.name,
      action,
      updates.updatedBy || 'system',
      changes
    );

    return c.json({
      service: updatedService
    });
  } catch (error) {
    console.log('Update service error:', error);
    return c.json({
      error: 'Failed to update service'
    }, 500);
  }
});

app.delete('/make-server-c89a26e4/services/:id', async (c)=>{
  try {
    const serviceId = c.req.param('id');
    
    const service = await kv.get(`dcms:service-catalog:${serviceId}`);
    if (!service) {
      return c.json({
        error: 'Service not found'
      }, 404);
    }

    await kv.del(`dcms:service-catalog:${serviceId}`);

    return c.json({
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.log('Delete service error:', error);
    return c.json({
      error: 'Failed to delete service'
    }, 500);
  }
});

// Service suggestion endpoint
app.post('/make-server-c89a26e4/services/:id/suggest', async (c)=>{
  try {
    const serviceId = c.req.param('id');
    const { suggestion, suggestedBy } = await c.req.json();
    
    const service = await kv.get(`dcms:service-catalog:${serviceId}`);
    if (!service) {
      return c.json({
        error: 'Service not found'
      }, 404);
    }

    const suggestionId = crypto.randomUUID();
    const suggestionData = {
      id: suggestionId,
      serviceId,
      serviceName: service.name,
      suggestion,
      suggestedBy,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await kv.set(`dcms:service-suggestion:${suggestionId}`, suggestionData);

    // Create activity log
    await createServiceLog(
      serviceId,
      service.name,
      'suggest',
      suggestedBy,
      `Service update suggested: ${suggestion.substring(0, 100)}${suggestion.length > 100 ? '...' : ''}`
    );

    return c.json({
      message: 'Suggestion submitted successfully',
      suggestion: suggestionData
    });
  } catch (error) {
    console.log('Create service suggestion error:', error);
    return c.json({
      error: 'Failed to submit suggestion'
    }, 500);
  }
});

// Service logs endpoint
app.get('/make-server-c89a26e4/service-logs', async (c)=>{
  try {
    const allLogs = await kv.getByPrefix('dcms:service-log:');
    
    // Sort logs by timestamp (newest first)
    const sortedLogs = allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({
      logs: sortedLogs
    });
  } catch (error) {
    console.log('Get service logs error:', error);
    return c.json({
      error: 'Failed to fetch service logs'
    }, 500);
  }
});



// Service suggestions endpoints
app.get('/make-server-c89a26e4/service-suggestions', async (c)=>{
  try {
    const allSuggestions = await kv.getByPrefix('dcms:service-suggestion:');
    
    // Sort suggestions by createdAt (newest first)
    const sortedSuggestions = allSuggestions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return c.json({
      suggestions: sortedSuggestions
    });
  } catch (error) {
    console.log('Get service suggestions error:', error);
    return c.json({
      error: 'Failed to fetch service suggestions'
    }, 500);
  }
});

app.put('/make-server-c89a26e4/service-suggestions/:id', async (c)=>{
  try {
    const suggestionId = c.req.param('id');
    const { action, reviewedBy, reviewNotes } = await c.req.json();
    
    const suggestion = await kv.get(`dcms:service-suggestion:${suggestionId}`);
    if (!suggestion) {
      return c.json({
        error: 'Service suggestion not found'
      }, 404);
    }

    const updatedSuggestion = {
      ...suggestion,
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy: reviewedBy,
      reviewedByName: reviewedBy, // For now, using email as name
      reviewedAt: new Date().toISOString(),
      reviewNotes: reviewNotes || null
    };

    await kv.set(`dcms:service-suggestion:${suggestionId}`, updatedSuggestion);

    // Create activity log for the review
    await createServiceLog(
      suggestion.serviceId,
      suggestion.serviceName,
      action === 'approve' ? 'suggest_approved' : 'suggest_rejected',
      reviewedBy,
      `Service suggestion ${action === 'approve' ? 'approved' : 'rejected'}${reviewNotes ? `: ${reviewNotes}` : ''}`
    );

    return c.json({
      suggestion: updatedSuggestion
    });
  } catch (error) {
    console.log('Update service suggestion error:', error);
    return c.json({
      error: 'Failed to update service suggestion'
    }, 500);
  }
});

// Helper function to create service log
async function createServiceLog(serviceId, serviceName, action, changedBy, changes) {
  try {
    const logId = crypto.randomUUID();
    const logData = {
      id: logId,
      serviceId,
      serviceName,
      action,
      changedBy,
      changedByName: changedBy, // For now, using email as name
      changes,
      timestamp: new Date().toISOString()
    };

    await kv.set(`dcms:service-log:${logId}`, logData);
    return logData;
  } catch (error) {
    console.error('Error creating service log:', error);
    // Don't throw error for logging - just log and continue
  }
}

// Helper function to convert snake_case inventory item to camelCase
function transformInventoryItem(item) {
  if (!item) return null;
  
  return {
    id: item.id,
    itemName: item.item_name || item.itemName,
    category: item.category,
    quantity: item.quantity || 0,
    unit: item.unit,
    purchaseUnit: item.purchase_unit || item.purchaseUnit,
    conversionFactor: item.conversion_factor || item.conversionFactor || 1,
    minThreshold: item.min_threshold || item.minThreshold || 0,
    maxThreshold: item.max_threshold || item.maxThreshold || 0,
    lastRestocked: item.last_restocked || item.lastRestocked,
    createdAt: item.created_at || item.createdAt,
    updatedAt: item.updated_at || item.updatedAt
  };
}

// Helper function to convert snake_case restock request to camelCase
function transformRestockRequest(request) {
  if (!request) return null;
  
  return {
    id: request.id,
    itemId: request.item_id || request.itemId,
    itemName: request.item_name || request.itemName,
    purchaseQuantity: request.purchase_quantity || request.purchaseQuantity || 0,
    usageQuantity: request.usage_quantity || request.usageQuantity || 0,
    notes: request.notes,
    requestedBy: request.requested_by || request.requestedBy,
    requestedByName: request.requested_by_name || request.requestedByName || 'Unknown',
    status: request.status || 'pending',
    createdAt: request.created_at || request.createdAt,
    reviewedBy: request.reviewed_by || request.reviewedBy,
    reviewedByName: request.reviewed_by_name || request.reviewedByName,
    reviewedAt: request.reviewed_at || request.reviewedAt,
    reviewNotes: request.review_notes || request.reviewNotes
  };
}

// Helper function to convert snake_case log to camelCase
function transformInventoryLog(log) {
  if (!log) return null;
  
  return {
    id: log.id,
    itemId: log.item_id || log.itemId,
    itemName: log.item_name || log.itemName,
    action: log.action,
    changedBy: log.changed_by || log.changedBy,
    changedByName: log.changed_by_name || log.changedByName || 'Unknown',
    changes: log.changes,
    timestamp: log.timestamp
  };
}

// Inventory endpoints
app.get('/make-server-c89a26e4/inventory', async (c)=>{
  try {
    const includeRequests = c.req.query('includeRequests') !== 'false';
    const includeLogs = c.req.query('includeLogs') !== 'false';

    // Fetch all inventory items
    const rawItems = await kv.getByPrefix('dcms:inventory:');
    const items = rawItems.map(transformInventoryItem).filter(item => item !== null);
    
    let restockRequests = [];
    if (includeRequests) {
      const allRequests = await kv.getByPrefix('dcms:restock-request:');
      // Sort by created_at descending and transform
      restockRequests = allRequests
        .sort((a, b) => {
          const aDate = new Date(a.created_at || a.createdAt || 0).getTime();
          const bDate = new Date(b.created_at || b.createdAt || 0).getTime();
          return bDate - aDate;
        })
        .map(transformRestockRequest)
        .filter(req => req !== null);
    }

    let logs = [];
    if (includeLogs) {
      const allLogs = await kv.getByPrefix('dcms:inventory-log:');
      // Sort by timestamp descending, limit to 100, and transform
      logs = allLogs
        .sort((a, b) => {
          const aDate = new Date(a.timestamp || 0).getTime();
          const bDate = new Date(b.timestamp || 0).getTime();
          return bDate - aDate;
        })
        .slice(0, 100)
        .map(transformInventoryLog)
        .filter(log => log !== null);
    }

    return c.json({
      items,
      restockRequests,
      logs
    });
  } catch (error) {
    console.log('Get inventory error:', error);
    return c.json({
      error: 'Failed to fetch inventory'
    }, 500);
  }
});

app.post('/make-server-c89a26e4/inventory', async (c)=>{
  try {
    const { itemName, category, quantity, unit, purchaseUnit, conversionFactor, minThreshold, maxThreshold, addedBy } = await c.req.json();

    const itemId = crypto.randomUUID();
    const item = {
      id: itemId,
      item_name: itemName,
      category,
      quantity,
      unit,
      purchase_unit: purchaseUnit,
      conversion_factor: conversionFactor,
      min_threshold: minThreshold,
      max_threshold: maxThreshold,
      last_restocked: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(`dcms:inventory:${itemId}`, item);

    // Get user info for log
    const user = await kv.get(`dcms:user:${addedBy}`);
    const userName = user ? `${user.first_name} ${user.last_name}` : addedBy;

    // Create log entry
    const logId = crypto.randomUUID();
    const log = {
      id: logId,
      item_id: itemId,
      item_name: itemName,
      action: 'add',
      changed_by: addedBy,
      changed_by_name: userName,
      changes: `Added ${itemName} with initial stock of ${quantity} ${unit} (${Math.ceil(quantity / conversionFactor)} ${purchaseUnit}s)`,
      timestamp: new Date().toISOString()
    };

    await kv.set(`dcms:inventory-log:${logId}`, log);

    console.log(`Created inventory item: ${itemName} by ${userName}`);

    return c.json({ item: transformInventoryItem(item) });
  } catch (error) {
    console.log('Create inventory item error:', error);
    return c.json({
      error: 'Failed to create inventory item'
    }, 500);
  }
});

app.get('/make-server-c89a26e4/inventory/:id', async (c)=>{
  try {
    const itemId = c.req.param('id');
    const item = await kv.get(`dcms:inventory:${itemId}`);

    if (!item) {
      return c.json({
        error: 'Inventory item not found'
      }, 404);
    }

    return c.json({ item: transformInventoryItem(item) });
  } catch (error) {
    console.log('Get inventory item error:', error);
    return c.json({
      error: 'Failed to fetch inventory item'
    }, 500);
  }
});

app.put('/make-server-c89a26e4/inventory/:id', async (c)=>{
  try {
    const itemId = c.req.param('id');
    const { itemName, category, unit, purchaseUnit, conversionFactor, minThreshold, maxThreshold, updatedBy } = await c.req.json();

    // Get old item for logging
    const oldItem = await kv.get(`dcms:inventory:${itemId}`);
    if (!oldItem) {
      return c.json({
        error: 'Inventory item not found'
      }, 404);
    }

    // Update item
    const item = {
      ...oldItem,
      item_name: itemName,
      category,
      unit,
      purchase_unit: purchaseUnit,
      conversion_factor: conversionFactor,
      min_threshold: minThreshold,
      max_threshold: maxThreshold,
      updated_at: new Date().toISOString()
    };

    await kv.set(`dcms:inventory:${itemId}`, item);

    // Create detailed change log
    const changes = [];
    if (oldItem.item_name !== itemName) changes.push(`Name: ${oldItem.item_name} → ${itemName}`);
    if (oldItem.category !== category) changes.push(`Category: ${oldItem.category} → ${category}`);
    if (oldItem.unit !== unit) changes.push(`Unit: ${oldItem.unit} → ${unit}`);
    if (oldItem.purchase_unit !== purchaseUnit) changes.push(`Purchase unit: ${oldItem.purchase_unit} → ${purchaseUnit}`);
    if (oldItem.conversion_factor !== conversionFactor) changes.push(`Conversion: ${oldItem.conversion_factor} → ${conversionFactor}`);
    if (oldItem.min_threshold !== minThreshold) changes.push(`Min threshold: ${oldItem.min_threshold} → ${minThreshold}`);
    if (oldItem.max_threshold !== maxThreshold) changes.push(`Max threshold: ${oldItem.max_threshold} → ${maxThreshold}`);

    // Get user info for log
    const user = await kv.get(`dcms:user:${updatedBy}`);
    const userName = user ? `${user.first_name} ${user.last_name}` : updatedBy;

    // Create log entry
    const logId = crypto.randomUUID();
    const log = {
      id: logId,
      item_id: itemId,
      item_name: itemName,
      action: 'edit',
      changed_by: updatedBy,
      changed_by_name: userName,
      changes: changes.join(', '),
      timestamp: new Date().toISOString()
    };

    await kv.set(`dcms:inventory-log:${logId}`, log);

    console.log(`Updated inventory item: ${itemName} by ${userName}`);

    return c.json({ item: transformInventoryItem(item) });
  } catch (error) {
    console.log('Update inventory item error:', error);
    return c.json({
      error: 'Failed to update inventory item'
    }, 500);
  }
});

app.delete('/make-server-c89a26e4/inventory/:id', async (c)=>{
  try {
    const itemId = c.req.param('id');
    
    const item = await kv.get(`dcms:inventory-item:${itemId}`);
    if (!item) {
      return c.json({
        error: 'Inventory item not found'
      }, 404);
    }

    await kv.del(`dcms:inventory-item:${itemId}`);

    console.log(`Deleted inventory item: ${item.item_name}`);

    return c.json({ 
      success: true,
      message: 'Inventory item deleted successfully' 
    });
  } catch (error) {
    console.log('Delete inventory item error:', error);
    return c.json({
      error: 'Failed to delete inventory item'
    }, 500);
  }
});

app.post('/make-server-c89a26e4/inventory/:id/restock', async (c)=>{
  try {
    const itemId = c.req.param('id');
    const { quantity, purchaseQuantity, notes, restockedBy } = await c.req.json();

    // Get current item
    const item = await kv.get(`dcms:inventory:${itemId}`);
    if (!item) {
      return c.json({
        error: 'Inventory item not found'
      }, 404);
    }

    const newQuantity = item.quantity + quantity;

    // Update item
    const updatedItem = {
      ...item,
      quantity: newQuantity,
      last_restocked: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(`dcms:inventory:${itemId}`, updatedItem);

    // Get user info for log
    const user = await kv.get(`dcms:user:${restockedBy}`);
    const userName = user ? `${user.first_name} ${user.last_name}` : restockedBy;

    // Create log entry
    const logId = crypto.randomUUID();
    const log = {
      id: logId,
      item_id: itemId,
      item_name: item.item_name,
      action: 'restock',
      changed_by: restockedBy,
      changed_by_name: userName,
      changes: `Restocked ${purchaseQuantity} ${item.purchase_unit}s (${quantity} ${item.unit}). Previous: ${item.quantity}, New: ${newQuantity}${notes ? `. Notes: ${notes}` : ''}`,
      timestamp: new Date().toISOString()
    };

    await kv.set(`dcms:inventory-log:${logId}`, log);

    console.log(`Restocked inventory item: ${item.item_name} by ${userName}`);

    return c.json({ item: transformInventoryItem(updatedItem) });
  } catch (error) {
    console.log('Restock inventory item error:', error);
    return c.json({
      error: 'Failed to restock inventory item'
    }, 500);
  }
});

app.get('/make-server-c89a26e4/inventory/restock-requests', async (c)=>{
  try {
    const allRequests = await kv.getByPrefix('dcms:restock-request:');
    
    // Sort by created_at descending and transform
    const requests = allRequests
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(transformRestockRequest);

    return c.json({ requests });
  } catch (error) {
    console.log('Get restock requests error:', error);
    return c.json({
      error: 'Failed to fetch restock requests'
    }, 500);
  }
});

app.post('/make-server-c89a26e4/inventory/restock-requests', async (c)=>{
  try {
    const { itemId, itemName, purchaseQuantity, usageQuantity, notes, requestedBy } = await c.req.json();

    // Get user info
    const user = await kv.get(`dcms:user:${requestedBy}`);
    const userName = user ? `${user.first_name} ${user.last_name}` : requestedBy;

    // Create restock request
    const requestId = crypto.randomUUID();
    const request = {
      id: requestId,
      item_id: itemId,
      item_name: itemName,
      purchase_quantity: purchaseQuantity,
      usage_quantity: usageQuantity,
      notes,
      requested_by: requestedBy,
      requested_by_name: userName,
      status: 'pending',
      created_at: new Date().toISOString(),
      reviewed_by: null,
      reviewed_by_name: null,
      reviewed_at: null,
      review_notes: null
    };

    await kv.set(`dcms:restock-request:${requestId}`, request);

    // Create log entry
    const logId = crypto.randomUUID();
    const log = {
      id: logId,
      item_id: itemId,
      item_name: itemName,
      action: 'restock_request',
      changed_by: requestedBy,
      changed_by_name: userName,
      changes: `Requested restock of ${purchaseQuantity} units (${usageQuantity} usage units)${notes ? `. Notes: ${notes}` : ''}`,
      timestamp: new Date().toISOString()
    };

    await kv.set(`dcms:inventory-log:${logId}`, log);

    console.log(`Created restock request for ${itemName} by ${userName}`);

    return c.json({ request: transformRestockRequest(request) });
  } catch (error) {
    console.log('Create restock request error:', error);
    return c.json({
      error: 'Failed to create restock request'
    }, 500);
  }
});

app.put('/make-server-c89a26e4/inventory/restock-requests/:id', async (c)=>{
  try {
    const requestId = c.req.param('id');
    const { action, reviewedBy, reviewNotes } = await c.req.json();

    // Get the request
    const request = await kv.get(`dcms:restock-request:${requestId}`);
    if (!request) {
      return c.json({
        error: 'Restock request not found'
      }, 404);
    }

    if (request.status !== 'pending') {
      return c.json({
        error: 'Request has already been processed'
      }, 400);
    }

    // Get reviewer info
    const user = await kv.get(`dcms:user:${reviewedBy}`);
    const reviewerName = user ? `${user.first_name} ${user.last_name}` : reviewedBy;

    if (action === 'approve') {
      // Update inventory quantity
      const item = await kv.get(`dcms:inventory:${request.item_id}`);
      if (!item) {
        return c.json({
          error: 'Inventory item not found'
        }, 404);
      }

      const newQuantity = item.quantity + request.usage_quantity;

      const updatedItem = {
        ...item,
        quantity: newQuantity,
        last_restocked: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await kv.set(`dcms:inventory:${request.item_id}`, updatedItem);

      // Create approval log
      const logId = crypto.randomUUID();
      const log = {
        id: logId,
        item_id: request.item_id,
        item_name: request.item_name,
        action: 'restock_approved',
        changed_by: reviewedBy,
        changed_by_name: reviewerName,
        changes: `Approved restock request from ${request.requested_by_name}. Added ${request.purchase_quantity} units (${request.usage_quantity} usage units). Previous: ${item.quantity}, New: ${newQuantity}${reviewNotes ? `. Review notes: ${reviewNotes}` : ''}`,
        timestamp: new Date().toISOString()
      };

      await kv.set(`dcms:inventory-log:${logId}`, log);

      console.log(`Approved restock request for ${request.item_name} by ${reviewerName}`);
    } else if (action === 'reject') {
      // Create rejection log
      const logId = crypto.randomUUID();
      const log = {
        id: logId,
        item_id: request.item_id,
        item_name: request.item_name,
        action: 'restock_rejected',
        changed_by: reviewedBy,
        changed_by_name: reviewerName,
        changes: `Rejected restock request from ${request.requested_by_name}. Requested: ${request.purchase_quantity} units${reviewNotes ? `. Reason: ${reviewNotes}` : ''}`,
        timestamp: new Date().toISOString()
      };

      await kv.set(`dcms:inventory-log:${logId}`, log);

      console.log(`Rejected restock request for ${request.item_name} by ${reviewerName}`);
    }

    // Update request status
    const updatedRequest = {
      ...request,
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: reviewedBy,
      reviewed_by_name: reviewerName,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes
    };

    await kv.set(`dcms:restock-request:${requestId}`, updatedRequest);

    return c.json({ request: transformRestockRequest(updatedRequest) });
  } catch (error) {
    console.log('Update restock request error:', error);
    return c.json({
      error: 'Failed to update restock request'
    }, 500);
  }
});

app.get('/make-server-c89a26e4/billing', async (c)=>{
  try {
    // Get all bills from database
    const allBills = await kv.getByPrefix('dcms:bill:');
    console.log(`Retrieved ${allBills.length} bills`);

    return c.json({
      success: true,
      bills: allBills
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return c.json({
      error: 'Failed to fetch bills'
    }, 500);
  }
});

app.put('/make-server-c89a26e4/billing/:id', async (c)=>{
  try {
    const billId = c.req.param('id');
    const updateData = await c.req.json();

    // Get existing bill
    const existingBill = await kv.get(`dcms:bill:${billId}`);
    if (!existingBill) {
      return c.json({
        error: 'Bill not found'
      }, 404);
    }

    // Handle payment history updates
    let updatedPaymentHistory = existingBill.paymentHistory || [];
    
    // If there's a new payment, add it to payment history
    if (updateData.newPayment) {
      updatedPaymentHistory.push(updateData.newPayment);
    }

    // Calculate new amounts
    const newPaidAmount = updateData.paidAmount || existingBill.paidAmount;
    const newOutstandingBalance = existingBill.totalAmount - newPaidAmount;
    const newStatus = newPaidAmount >= existingBill.totalAmount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'pending';

    // Update bill
    const updatedBill = {
      ...existingBill,
      paidAmount: newPaidAmount,
      outstandingBalance: newOutstandingBalance,
      paymentMethod: updateData.paymentMethod || existingBill.paymentMethod,
      status: newStatus,
      notes: updateData.notes !== undefined ? updateData.notes : existingBill.notes,
      paymentHistory: updatedPaymentHistory,
      updatedBy: updateData.updatedBy || 'system',
      updatedAt: new Date().toISOString()
    };

    // Save updated bill
    await kv.set(`dcms:bill:${billId}`, updatedBill);

    console.log(`Updated bill: ${billId} - Status: ${newStatus}, Paid: ${newPaidAmount}`);

    return c.json({
      success: true,
      bill: updatedBill
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    return c.json({
      error: 'Failed to update bill'
    }, 500);
  }
});

app.get('/make-server-c89a26e4/billing/stats', async (c)=>{
  try {
    const allBills = await kv.getByPrefix('dcms:bill:');
    const today = new Date().toISOString().split('T')[0];
    const todayBills = allBills.filter((bill)=>bill.createdAt && bill.createdAt.startsWith(today));

    const totalBilledToday = todayBills.reduce((sum, bill)=>sum + bill.totalAmount, 0);
    const paymentsReceivedToday = todayBills.reduce((sum, bill)=>sum + bill.paidAmount, 0);
    const outstandingBalances = allBills.reduce((sum, bill)=>sum + bill.outstandingBalance, 0);

    return c.json({
      stats: {
        totalBilledToday,
        paymentsReceivedToday,
        outstandingBalances
      }
    });
  } catch (error) {
    console.log('Get billing stats error:', error);
    return c.json({
      error: 'Failed to fetch billing stats'
    }, 500);
  }
});

// Helper function to track failed login attempts
async function trackFailedLoginAttempt(email, attemptKey, lockoutKey) {
  try {
    const attemptData = await kv.get(attemptKey) || {
      count: 0,
      firstAttempt: new Date().toISOString()
    };

    attemptData.count += 1;
    attemptData.lastAttempt = new Date().toISOString();

    if (attemptData.count >= 3) {
      // Lock out user for 15 minutes
      const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
      await kv.set(lockoutKey, {
        lockedUntil: lockoutUntil.toISOString(),
        attempts: attemptData.count,
        email: email
      });
      await kv.del(attemptKey); // Clear attempts as user is now locked out
      console.log(`User ${email} locked out after ${attemptData.count} failed attempts until ${lockoutUntil.toISOString()}`);
    } else {
      await kv.set(attemptKey, attemptData);
      console.log(`Failed login attempt ${attemptData.count}/3 for ${email}`);
    }
  } catch (error) {
    console.error('Error tracking failed login attempt:', error);
  }
}

// Helper function to convert minutes to HH:MM format
function formatMinutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Helper function to convert HH:MM format to minutes
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Catch-all for undefined routes
app.all('*', (c)=>{
  return c.json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'POST /make-server-c89a26e4/auth/signin',
      'POST /make-server-c89a26e4/auth/signup',
      'GET /make-server-c89a26e4/appointments',
      'POST /make-server-c89a26e4/available-slots',
      'GET /make-server-c89a26e4/patients'
    ]
  }, 404);
});

export default app;
*/