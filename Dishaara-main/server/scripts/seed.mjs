/**
 * Firestore Seed Script
 * Seeds the database with initial data for development/testing
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { db } from '../firebase/firebase.js';
// Note: We don't use Firebase Auth API for seeding to avoid permission issues
// Users should be created through frontend or Firebase Console

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedDatabase() {
  try {
    console.log('🚀 Starting Firestore database seeding...');

    // Clear existing data (optional - comment out if you want to preserve data)
    console.log('🗑️  Clearing existing data...');
    const collections = ['users', 'guides', 'events', 'vehicles', 'tripPlans'];
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Hash password helper
    const hashPassword = async (password) => {
      const salt = await bcrypt.genSalt(10);
      return bcrypt.hash(password, salt);
    };

    // Create admin user in Firestore only
    // Note: Firebase Auth users should be created through the frontend or Firebase Console
    // For seeding, we'll create Firestore documents with a placeholder UID
    console.log('👤 Creating admin user...');
    
    // Generate a consistent UID for the admin user
    // In production, create this user through Firebase Console or frontend registration
    const adminUserId = 'admin-' + Date.now().toString(36);

    const adminPasswordHash = await hashPassword('admin123');
    await db.collection('users').doc(adminUserId).set({
      name: 'Admin User',
      email: 'admin@dishaara.com',
      password: adminPasswordHash,
      role: 'admin',
      isVerified: true,
      phone: '+91-9876543210',
      avatar: null,
      preferences: {
        travelStyle: 'cultural',
        budget: 'mid'
      },
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Admin user created in Firestore');
    console.log('   ⚠️  Note: Create Firebase Auth user manually or through frontend');
    console.log(`   Email: admin@dishaara.com, Password: admin123`);

    // Create sample users
    console.log('👥 Creating sample users...');
    const users = [];
    for (let i = 1; i <= 5; i++) {
      // Generate consistent UID for seed users
      // In production, these should be created through frontend registration
      const userId = `user${i}-${Date.now().toString(36)}`;

      const passwordHash = await hashPassword('password123');
      const userData = {
        name: `User ${i}`,
        email: `user${i}@example.com`,
        password: passwordHash,
        role: 'user',
        isVerified: true,
        phone: `+91-987654321${i}`,
        preferences: {
          travelStyle: ['cultural', 'adventure', 'nature'][i % 3],
          budget: ['low', 'mid', 'high'][i % 3]
        },
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('users').doc(userId).set(userData);
      users.push({ _id: userId, ...userData });
    }
    console.log(`✅ Created ${users.length} users`);

    // Create guide users
    console.log('🎯 Creating guide users...');
    const guideUsers = [];
    const guideNames = ['Rajesh Kumar', 'Priya Sharma', 'Arjun Singh'];
    const guideEmails = [
      'rajesh.kumar@dishaara.com',
      'priya.sharma@dishaara.com',
      'arjun.singh@dishaara.com'
    ];

    for (let i = 0; i < 3; i++) {
      // Generate consistent UID for guide users
      const userId = `guide${i + 1}-${Date.now().toString(36)}`;

      const passwordHash = await hashPassword('password123');
      const userData = {
        name: guideNames[i],
        email: guideEmails[i],
        password: passwordHash,
        role: 'guide',
        isVerified: true,
        phone: `+91-987654322${i + 1}`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('users').doc(userId).set(userData);
      guideUsers.push({ _id: userId, ...userData });
    }
    console.log(`✅ Created ${guideUsers.length} guide users`);

    // Create guide profiles
    console.log('📝 Creating guide profiles...');
    const guides = [];
    const specialties = [
      ['cultural', 'history'],
      ['adventure', 'nature'],
      ['food', 'photography']
    ];
    const cities = ['Delhi', 'Mumbai', 'Bangalore'];
    const guideBios = [
      "Passionate about Delhi's rich history and culture. I love sharing the stories behind every monument.",
      'Adventure enthusiast and nature lover from Mumbai. I specialize in outdoor activities and wildlife tours.',
      'Food and photography expert from Bangalore. I combine my love for local cuisine with photography skills.'
    ];

    for (let i = 0; i < guideUsers.length; i++) {
      const guideRef = db.collection('guides').doc();
      const guideData = {
        user: guideUsers[i]._id,
        bio: guideBios[i],
        specialties: specialties[i],
        languages: [
          { language: 'English', proficiency: 'fluent' },
          { language: 'Hindi', proficiency: 'native' }
        ],
        experience: {
          years: 5 + i,
          description: `Professional guide with ${5 + i} years of experience`
        },
        pricing: {
          hourlyRate: 500 + (i * 200),
          dailyRate: 3000 + (i * 1000),
          currency: 'INR'
        },
        ratings: {
          average: 4.5 + (i * 0.1),
          count: 10 + (i * 5)
        },
        location: {
          city: cities[i],
          state: i === 0 ? 'Delhi' : i === 1 ? 'Maharashtra' : 'Karnataka',
          country: 'India',
          coordinates: {
            lat: 28.6139 + (i * 0.1),
            lng: 77.2090 + (i * 0.1)
          }
        },
        isVerified: true,
        isActive: true,
        profileImage: `/images/guid${i + 1}.${i === 2 ? 'jpg' : 'png'}`,
        gallery: [
          {
            image: `/images/guid${i + 1}.${i === 2 ? 'jpg' : 'png'}`,
            caption: `Professional photo of ${cities[i]} guide`,
            uploadedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await guideRef.set(guideData);
      guides.push({ _id: guideRef.id, ...guideData });
    }
    console.log(`✅ Created ${guides.length} guide profiles`);

    // Create sample events
    console.log('🎉 Creating sample events...');
    const events = [];
    const eventData = [
      {
        title: 'Diwali Festival Celebration',
        description: 'Experience the vibrant Diwali festival with traditional celebrations.',
        category: 'festival',
        location: { name: 'Red Fort, Delhi', city: 'Delhi', state: 'Delhi' },
        schedule: { startDate: new Date('2024-11-01'), endDate: new Date('2024-11-01') },
        pricing: { adultPrice: 500, childPrice: 250, currency: 'INR' }
      },
      {
        title: 'Himalayan Trek Adventure',
        description: 'Join us for an exciting trek through the beautiful Himalayan trails.',
        category: 'adventure',
        location: { name: 'Manali, Himachal Pradesh', city: 'Manali', state: 'Himachal Pradesh' },
        schedule: { startDate: new Date('2024-12-15'), endDate: new Date('2024-12-20') },
        pricing: { adultPrice: 15000, childPrice: 10000, currency: 'INR' }
      },
      {
        title: 'Food Tour of Mumbai',
        description: 'Explore the diverse culinary scene of Mumbai with local food experts.',
        category: 'food',
        location: { name: 'Crawford Market, Mumbai', city: 'Mumbai', state: 'Maharashtra' },
        schedule: { startDate: new Date('2024-10-20'), endDate: new Date('2024-10-20') },
        pricing: { adultPrice: 2000, childPrice: 1000, currency: 'INR' }
      }
    ];

    for (const eventInfo of eventData) {
      const eventRef = db.collection('events').doc();
      const event = {
        ...eventInfo,
        organizer: {
          name: 'Dishaara Events',
          email: 'events@dishaara.com',
          phone: '+91-9876543210'
        },
        capacity: {
          maxAttendees: 50,
          currentBookings: Math.floor(Math.random() * 20)
        },
        status: 'published',
        isFeatured: Math.random() > 0.5,
        tags: ['popular'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await eventRef.set(event);
      events.push({ _id: eventRef.id, ...event });
    }
    console.log(`✅ Created ${events.length} events`);

    // Create sample vehicles
    console.log('🚗 Creating sample vehicles...');
    const vehicles = [];
    const vehicleData = [
      { type: 'car', make: 'Toyota', model: 'Innova Crysta', capacity: { passengers: 7 }, dailyRate: 2500 },
      { type: 'bike', make: 'Royal Enfield', model: 'Classic 350', capacity: { passengers: 2 }, dailyRate: 800 },
      { type: 'car', make: 'Maruti', model: 'Swift Dzire', capacity: { passengers: 5 }, dailyRate: 1800 }
    ];

    for (let i = 0; i < vehicleData.length; i++) {
      const vehicleRef = db.collection('vehicles').doc();
      const vehicle = {
        ...vehicleData[i],
        owner: users[i]._id,
        year: 2020 + i,
        registrationNumber: `DL${i + 1}AB${1000 + i}`,
        color: ['White', 'Black', 'Red'][i],
        features: {
          ac: true,
          music: true,
          gps: i === 0
        },
        location: {
          city: ['Delhi', 'Mumbai', 'Bangalore'][i],
          state: ['Delhi', 'Maharashtra', 'Karnataka'][i],
          country: 'India'
        },
        pricing: {
          hourlyRate: vehicleData[i].dailyRate / 8,
          dailyRate: vehicleData[i].dailyRate,
          currency: 'INR'
        },
        status: 'active',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await vehicleRef.set(vehicle);
      vehicles.push({ _id: vehicleRef.id, ...vehicle });
    }
    console.log(`✅ Created ${vehicles.length} vehicles`);

    // Create sample trip plans
    console.log('🗺️  Creating sample trip plans...');
    const tripPlans = [];
    for (let i = 0; i < 3; i++) {
      const tripPlanRef = db.collection('tripPlans').doc();
      const tripPlan = {
        user: users[i]._id,
        title: `Amazing Trip to ${['Delhi', 'Mumbai', 'Goa'][i]}`,
        destination: {
          city: ['Delhi', 'Mumbai', 'Goa'][i],
          state: ['Delhi', 'Maharashtra', 'Goa'][i],
          country: 'India'
        },
        duration: {
          startDate: new Date('2024-11-01'),
          endDate: new Date('2024-11-05'),
          days: 5
        },
        preferences: {
          theme: ['cultural', 'adventure', 'beaches'][i],
          style: 'moderate',
          budget: 'mid',
          travelers: 2
        },
        status: 'planned',
        isPublic: true,
        aiGenerated: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await tripPlanRef.set(tripPlan);
      tripPlans.push({ _id: tripPlanRef.id, ...tripPlan });
    }
    console.log(`✅ Created ${tripPlans.length} trip plans`);

    console.log('\n✅ Database seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - 1 admin user`);
    console.log(`   - ${users.length} regular users`);
    console.log(`   - ${guideUsers.length} guide users`);
    console.log(`   - ${guides.length} guide profiles`);
    console.log(`   - ${events.length} events`);
    console.log(`   - ${vehicles.length} vehicles`);
    console.log(`   - ${tripPlans.length} trip plans`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
