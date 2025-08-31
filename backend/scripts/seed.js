const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const WorkoutPlan = require('../models/WorkoutPlan');
const Meal = require('../models/Meal');
const HealthProfessional = require('../models/HealthProfessional');
const Order = require('../models/Order');
const Booking = require('../models/Booking');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maskon-health');
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  try {
    await User.deleteMany({});
    await WorkoutPlan.deleteMany({});
    await Meal.deleteMany({});
    await HealthProfessional.deleteMany({});
    await Order.deleteMany({});
    await Booking.deleteMany({});
    console.log('Existing data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    const users = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+254712345678',
        password: 'password123',
        location: 'Nairobi',
        role: 'user',
        isVerified: true,
        healthProfile: {
          height: 175,
          weight: 70,
          bloodType: 'O+',
          allergies: ['Peanuts'],
          medicalConditions: [],
          medications: []
        },
        preferences: {
          fitnessGoals: ['Weight Loss', 'Muscle Building'],
          dietaryRestrictions: ['Vegetarian'],
          preferredLanguage: 'english'
        }
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+254723456789',
        password: 'password123',
        location: 'Kisumu',
        role: 'user',
        isVerified: true,
        healthProfile: {
          height: 160,
          weight: 55,
          bloodType: 'A+',
          allergies: [],
          medicalConditions: ['Asthma'],
          medications: ['Inhaler']
        },
        preferences: {
          fitnessGoals: ['Cardio Fitness'],
          dietaryRestrictions: [],
          preferredLanguage: 'swahili'
        }
      },
      {
        name: 'Dr. Grace Wanjiku',
        email: 'grace@example.com',
        phone: '+254734567890',
        password: 'password123',
        location: 'Maseno',
        role: 'health_professional',
        isVerified: true,
        healthProfile: {
          height: 165,
          weight: 60,
          bloodType: 'B+',
          allergies: [],
          medicalConditions: [],
          medications: []
        }
      },
      {
        name: 'Nutritionist Mary Akinyi',
        email: 'mary@example.com',
        phone: '+254745678901',
        password: 'password123',
        location: 'Maseno',
        role: 'health_professional',
        isVerified: true,
        healthProfile: {
          height: 170,
          weight: 65,
          bloodType: 'AB+',
          allergies: [],
          medicalConditions: [],
          medications: []
        }
      },
      {
        name: 'Admin User',
        email: 'admin@maskonhealth.com',
        phone: '+254756789012',
        password: 'admin123',
        location: 'Nairobi',
        role: 'admin',
        isVerified: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users seeded`);
    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    return [];
  }
};

// Seed workout plans
const seedWorkoutPlans = async (users) => {
  try {
    const workoutPlans = [
      {
        title: 'Morning Yoga Flow',
        description: 'Start your day with gentle stretches and mindful breathing',
        category: 'yoga',
        difficulty: 'beginner',
        duration: 30,
        exercises: [
          {
            name: 'Sun Salutation A',
            description: 'Basic sun salutation sequence',
            duration: 300,
            sets: 3,
            reps: 1,
            restTime: 30,
            muscleGroups: ['Full Body'],
            instructions: ['Start in mountain pose', 'Flow through the sequence', 'Repeat 3 times']
          },
          {
            name: 'Downward Dog',
            description: 'Inverted V pose for stretching',
            duration: 60,
            sets: 1,
            reps: 1,
            restTime: 30,
            muscleGroups: ['Shoulders', 'Hamstrings'],
            instructions: ['Form an inverted V shape', 'Press through your hands', 'Lengthen your spine']
          }
        ],
        caloriesBurn: 150,
        targetMuscleGroups: ['Full Body'],
        equipment: ['Yoga Mat'],
        image: 'https://r2-pub.rork.com/generated-images/6a9812fc-ee2d-4b4b-becd-19fe122d49c6.png',
        instructor: {
          name: 'Yoga Master Sarah',
          bio: 'Certified yoga instructor with 10 years of experience',
          image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=150&h=150&fit=crop'
        },
        tags: ['morning', 'yoga', 'flexibility', 'mindfulness'],
        isFeatured: true,
        language: 'english',
        createdBy: users[0]._id
      },
      {
        title: 'HIIT Cardio Blast',
        description: 'High-intensity interval training for maximum calorie burn',
        category: 'hiit',
        difficulty: 'intermediate',
        duration: 25,
        exercises: [
          {
            name: 'Burpees',
            description: 'Full body exercise combining squat, push-up, and jump',
            duration: 45,
            sets: 4,
            reps: 10,
            restTime: 15,
            muscleGroups: ['Full Body'],
            instructions: ['Start standing', 'Drop into squat', 'Kick feet back', 'Do push-up', 'Jump up']
          },
          {
            name: 'Mountain Climbers',
            description: 'Dynamic cardio exercise',
            duration: 30,
            sets: 4,
            reps: 20,
            restTime: 15,
            muscleGroups: ['Core', 'Shoulders'],
            instructions: ['Start in plank position', 'Alternate bringing knees to chest', 'Keep core engaged']
          }
        ],
        caloriesBurn: 300,
        targetMuscleGroups: ['Full Body'],
        equipment: [],
        image: 'https://r2-pub.rork.com/generated-images/7f7a6044-b88e-4ca0-8ee7-cae00e963542.png',
        instructor: {
          name: 'Fitness Coach Mike',
          bio: 'Certified personal trainer specializing in HIIT',
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop'
        },
        tags: ['cardio', 'hiit', 'fat-burning', 'strength'],
        isFeatured: true,
        language: 'english',
        createdBy: users[0]._id
      },
      {
        title: 'Strength Building',
        description: 'Build muscle and increase strength with bodyweight exercises',
        category: 'strength',
        difficulty: 'advanced',
        duration: 45,
        exercises: [
          {
            name: 'Push-ups',
            description: 'Classic upper body strength exercise',
            duration: 60,
            sets: 4,
            reps: 15,
            restTime: 60,
            muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
            instructions: ['Start in plank position', 'Lower body to ground', 'Push back up', 'Keep body straight']
          },
          {
            name: 'Pull-ups',
            description: 'Upper body pulling exercise',
            duration: 45,
            sets: 3,
            reps: 8,
            restTime: 90,
            muscleGroups: ['Back', 'Biceps'],
            instructions: ['Hang from bar', 'Pull chin over bar', 'Lower with control', 'Repeat']
          }
        ],
        caloriesBurn: 250,
        targetMuscleGroups: ['Upper Body'],
        equipment: ['Pull-up Bar'],
        image: 'https://r2-pub.rork.com/generated-images/7f7a6044-b88e-4ca0-8ee7-cae00e963542.png',
        instructor: {
          name: 'Strength Coach David',
          bio: 'Former competitive bodybuilder and strength coach',
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop'
        },
        tags: ['strength', 'muscle-building', 'bodyweight', 'advanced'],
        isFeatured: false,
        language: 'english',
        createdBy: users[0]._id
      }
    ];

    const createdWorkouts = await WorkoutPlan.insertMany(workoutPlans);
    console.log(`${createdWorkouts.length} workout plans seeded`);
    return createdWorkouts;
  } catch (error) {
    console.error('Error seeding workout plans:', error);
    return [];
  }
};

// Seed meals
const seedMeals = async (users) => {
  try {
    const meals = [
      {
        name: 'Ugali with Sukuma Wiki',
        description: 'Traditional cornmeal staple served with collard greens cooked in onions and tomatoes',
        category: 'main_course',
        subcategory: 'ugali',
        price: 150,
        prepTime: '25 min',
        servingSize: '1 serving',
        ingredients: [
          { name: 'Maize flour', quantity: '2', unit: 'cups', isLocal: true },
          { name: 'Collard greens', quantity: '1', unit: 'bunch', isLocal: true },
          { name: 'Onions', quantity: '2', unit: 'medium', isLocal: true },
          { name: 'Tomatoes', quantity: '3', unit: 'medium', isLocal: true },
          { name: 'Cooking oil', quantity: '2', unit: 'tbsp', isLocal: true }
        ],
        nutrition: {
          calories: 320,
          protein: '12g',
          carbs: '58g',
          fat: '8g',
          fiber: '6g',
          sugar: '4g',
          sodium: '450mg',
          vitamins: ['Vitamin A', 'Vitamin C', 'Vitamin K'],
          minerals: ['Iron', 'Calcium', 'Potassium']
        },
        healthBenefits: ['High in fiber', 'Rich in vitamins', 'Good source of iron'],
        traditionalUses: ['Staple food', 'Energy source', 'Digestive health'],
        image: 'https://r2-pub.rork.com/generated-images/64d5bc5a-2fb2-477d-92fc-47d8dbf21897.png',
        recipe: {
          instructions: [
            'Boil water in a large pot',
            'Gradually add maize flour while stirring',
            'Cook until thick and smooth',
            'Wash and chop sukuma wiki',
            'Sauté onions and tomatoes',
            'Add sukuma wiki and cook until tender'
          ],
          cookingTime: 25,
          difficulty: 'easy',
          servings: 4
        },
        allergens: [],
        dietaryTags: ['vegetarian', 'vegan', 'gluten-free'],
        origin: {
          region: 'Kenya',
          tribe: 'Multiple',
          culturalSignificance: 'National staple food'
        },
        availability: 'in_stock',
        supplier: {
          name: 'Local Farmers Market',
          location: 'Nairobi',
          phone: '+254700000000',
          isVerified: true
        },
        isFeatured: true,
        language: 'english',
        createdBy: users[0]._id
      },
      {
        name: 'Nyama Choma with Kachumbari',
        description: 'Grilled meat served with fresh tomato and onion salad',
        category: 'main_course',
        subcategory: 'nyama_choma',
        price: 450,
        prepTime: '40 min',
        servingSize: '1 serving',
        ingredients: [
          { name: 'Beef', quantity: '500', unit: 'g', isLocal: true },
          { name: 'Tomatoes', quantity: '4', unit: 'medium', isLocal: true },
          { name: 'Onions', quantity: '2', unit: 'medium', isLocal: true },
          { name: 'Coriander', quantity: '1', unit: 'bunch', isLocal: true },
          { name: 'Lemon juice', quantity: '2', unit: 'tbsp', isLocal: true }
        ],
        nutrition: {
          calories: 480,
          protein: '35g',
          carbs: '12g',
          fat: '32g',
          fiber: '3g',
          sugar: '6g',
          sodium: '280mg',
          vitamins: ['Vitamin B12', 'Vitamin C', 'Iron'],
          minerals: ['Iron', 'Zinc', 'Selenium']
        },
        healthBenefits: ['High protein', 'Rich in iron', 'Good source of B vitamins'],
        traditionalUses: ['Celebration food', 'Social gatherings', 'Protein source'],
        image: 'https://r2-pub.rork.com/generated-images/f35b6d80-143d-4bb0-ae1e-d0028c75f170.png',
        recipe: {
          instructions: [
            'Marinate beef with spices',
            'Grill over charcoal until cooked',
            'Chop tomatoes and onions finely',
            'Mix with coriander and lemon juice',
            'Serve meat with kachumbari on the side'
          ],
          cookingTime: 40,
          difficulty: 'medium',
          servings: 2
        },
        allergens: [],
        dietaryTags: ['high-protein', 'keto-friendly'],
        origin: {
          region: 'Kenya',
          tribe: 'Multiple',
          culturalSignificance: 'Popular social food'
        },
        availability: 'in_stock',
        supplier: {
          name: 'Fresh Meat Suppliers',
          location: 'Nairobi',
          phone: '+254700000001',
          isVerified: true
        },
        isFeatured: true,
        language: 'english',
        createdBy: users[0]._id
      },
      {
        name: 'Moringa Leaves Tea',
        description: 'Dried moringa leaves rich in vitamins, minerals, and antioxidants for immune support',
        category: 'traditional_medicine',
        subcategory: 'moringa',
        price: 200,
        prepTime: '10 min',
        servingSize: '1 cup',
        ingredients: [
          { name: 'Dried moringa leaves', quantity: '1', unit: 'tsp', isLocal: true },
          { name: 'Hot water', quantity: '1', unit: 'cup', isLocal: true },
          { name: 'Honey', quantity: '1', unit: 'tsp', isLocal: true }
        ],
        nutrition: {
          calories: 5,
          protein: '1g',
          carbs: '1g',
          fat: '0g',
          fiber: '0.5g',
          sugar: '0g',
          sodium: '5mg',
          vitamins: ['Vitamin A', 'Vitamin C', 'Vitamin E'],
          minerals: ['Iron', 'Calcium', 'Potassium']
        },
        healthBenefits: ['Immune support', 'Antioxidant rich', 'Anti-inflammatory'],
        traditionalUses: ['Malaria prevention', 'Blood pressure control', 'Diabetes management'],
        image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop',
        recipe: {
          instructions: [
            'Boil water',
            'Add dried moringa leaves',
            'Steep for 5-7 minutes',
            'Strain and add honey if desired',
            'Drink warm or cold'
          ],
          cookingTime: 10,
          difficulty: 'easy',
          servings: 1
        },
        allergens: [],
        dietaryTags: ['vegan', 'gluten-free', 'antioxidant'],
        origin: {
          region: 'Kenya',
          tribe: 'Multiple',
          culturalSignificance: 'Traditional medicine'
        },
        availability: 'in_stock',
        supplier: {
          name: 'Traditional Medicine Center',
          location: 'Kisumu',
          phone: '+254700000002',
          isVerified: true
        },
        isFeatured: true,
        language: 'english',
        createdBy: users[0]._id
      }
    ];

    const createdMeals = await Meal.insertMany(meals);
    console.log(`${createdMeals.length} meals seeded`);
    return createdMeals;
  } catch (error) {
    console.error('Error seeding meals:', error);
    return [];
  }
};

// Seed health professionals
const seedHealthProfessionals = async (users) => {
  try {
    const healthProfessionals = [
      {
        user: users[2]._id, // Dr. Grace Wanjiku
        specialty: 'general_practitioner',
        subSpecialty: ['Preventive Care', 'Community Health'],
        experience: {
          years: 8,
          description: 'Experienced general practitioner with focus on preventive care'
        },
        qualifications: [
          {
            degree: 'MBChB - University of Nairobi',
            institution: 'University of Nairobi',
            year: 2015,
            isVerified: true
          },
          {
            degree: 'Diploma in Public Health',
            institution: 'Kenya Medical Training College',
            year: 2017,
            isVerified: true
          }
        ],
        licenses: [
          {
            number: 'GP001234',
            issuingAuthority: 'Medical Practitioners and Dentists Board',
            expiryDate: new Date('2025-12-31'),
            isActive: true
          }
        ],
        bio: 'Experienced general practitioner with a focus on preventive care and community health. Fluent in English, Swahili, and Luo.',
        services: [
          {
            name: 'General Consultation',
            description: 'Comprehensive health check-up and consultation',
            duration: 30,
            price: 1500,
            currency: 'KES'
          },
          {
            name: 'Vaccination',
            description: 'Immunization services for all ages',
            duration: 15,
            price: 800,
            currency: 'KES'
          }
        ],
        consultationFee: 1500,
        availability: [
          {
            day: 'monday',
            startTime: '08:00',
            endTime: '17:00',
            isAvailable: true
          },
          {
            day: 'tuesday',
            startTime: '08:00',
            endTime: '17:00',
            isAvailable: true
          },
          {
            day: 'wednesday',
            startTime: '08:00',
            endTime: '17:00',
            isAvailable: true
          },
          {
            day: 'thursday',
            startTime: '08:00',
            endTime: '17:00',
            isAvailable: true
          },
          {
            day: 'friday',
            startTime: '08:00',
            endTime: '17:00',
            isAvailable: true
          },
          {
            day: 'saturday',
            startTime: '09:00',
            endTime: '13:00',
            isAvailable: true
          }
        ],
        languages: ['english', 'swahili', 'luo'],
        location: {
          address: 'Maseno Health Center',
          city: 'Maseno',
          county: 'Kisumu',
          coordinates: {
            latitude: -0.0236,
            longitude: 34.5822
          }
        },
        contact: {
          phone: '+254712345678',
          email: 'grace@example.com',
          whatsapp: '+254712345678',
          emergencyContact: '+254712345679'
        },
        profileImage: 'https://r2-pub.rork.com/generated-images/0b7cfeb9-cd92-4846-bb78-a2a9affe9547.png',
        specializations: ['Preventive Medicine', 'Community Health', 'Family Medicine'],
        insuranceAccepted: ['NHIF', 'AAR', 'CIC'],
        paymentMethods: ['cash', 'mpesa', 'bank_transfer', 'insurance'],
        emergencyServices: true,
        homeVisits: true,
        onlineConsultation: true,
        isVerified: true,
        verificationStatus: 'verified',
        createdBy: users[2]._id
      },
      {
        user: users[3]._id, // Nutritionist Mary Akinyi
        specialty: 'clinical_nutritionist',
        subSpecialty: ['Traditional Nutrition', 'Diabetes Management'],
        experience: {
          years: 5,
          description: 'Specialized in traditional Kenyan nutrition and dietary planning'
        },
        qualifications: [
          {
            degree: 'BSc Nutrition - Kenyatta University',
            institution: 'Kenyatta University',
            year: 2018,
            isVerified: true
          },
          {
            degree: 'Certified Diabetes Educator',
            institution: 'International Diabetes Federation',
            year: 2019,
            isVerified: true
          }
        ],
        bio: 'Specialized in traditional Kenyan nutrition and dietary planning. Helps clients achieve optimal health through culturally appropriate meal plans.',
        services: [
          {
            name: 'Nutrition Consultation',
            description: 'Personalized nutrition assessment and meal planning',
            duration: 45,
            price: 1200,
            currency: 'KES'
          },
          {
            name: 'Diabetes Management',
            description: 'Specialized nutrition for diabetes patients',
            duration: 60,
            price: 1500,
            currency: 'KES'
          }
        ],
        consultationFee: 1200,
        availability: [
          {
            day: 'tuesday',
            startTime: '09:00',
            endTime: '16:00',
            isAvailable: true
          },
          {
            day: 'wednesday',
            startTime: '09:00',
            endTime: '16:00',
            isAvailable: true
          },
          {
            day: 'thursday',
            startTime: '09:00',
            endTime: '16:00',
            isAvailable: true
          },
          {
            day: 'friday',
            startTime: '09:00',
            endTime: '16:00',
            isAvailable: true
          },
          {
            day: 'saturday',
            startTime: '09:00',
            endTime: '13:00',
            isAvailable: true
          }
        ],
        languages: ['english', 'swahili'],
        location: {
          address: 'Maseno University Clinic',
          city: 'Maseno',
          county: 'Kisumu',
          coordinates: {
            latitude: -0.0236,
            longitude: 34.5822
          }
        },
        contact: {
          phone: '+254723456789',
          email: 'mary@example.com',
          whatsapp: '+254723456789'
        },
        profileImage: 'https://r2-pub.rork.com/generated-images/b21456e8-3ed2-4c7b-a954-7fab25bf0b65.png',
        specializations: ['Traditional Nutrition', 'Diabetes Management', 'Sports Nutrition'],
        insuranceAccepted: ['NHIF', 'AAR'],
        paymentMethods: ['cash', 'mpesa', 'bank_transfer'],
        emergencyServices: false,
        homeVisits: false,
        onlineConsultation: true,
        isVerified: true,
        verificationStatus: 'verified',
        createdBy: users[3]._id
      }
    ];

    const createdProfessionals = await HealthProfessional.insertMany(healthProfessionals);
    console.log(`${createdProfessionals.length} health professionals seeded`);
    return createdProfessionals;
  } catch (error) {
    console.error('Error seeding health professionals:', error);
    return [];
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    await clearData();
    
    const users = await seedUsers();
    await seedWorkoutPlans(users);
    await seedMeals(users);
    await seedHealthProfessionals(users);
    
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
