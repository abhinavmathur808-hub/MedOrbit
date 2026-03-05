

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

const maleNames = [
    'Dr. Aarav Sharma', 'Dr. Rahul Patel', 'Dr. Vikram Singh', 'Dr. Arjun Reddy',
    'Dr. Rohan Gupta', 'Dr. Aditya Verma', 'Dr. Karthik Iyer', 'Dr. Suresh Kumar',
    'Dr. Manoj Desai', 'Dr. Ankit Joshi', 'Dr. Sanjay Mishra', 'Dr. Rakesh Agarwal',
    'Dr. Deepak Choudhary', 'Dr. Nikhil Saxena', 'Dr. Amit Kapoor', 'Dr. Vivek Malhotra',
    'Dr. Harsh Mehta', 'Dr. Gaurav Pandey', 'Dr. Ashish Tiwari', 'Dr. Rajesh Nair',
    'Dr. Pranav Kulkarni', 'Dr. Siddharth Rao', 'Dr. Abhishek Chatterjee', 'Dr. Varun Bhatia',
    'Dr. Mohit Srivastava'
];

const femaleNames = [
    'Dr. Priya Sharma', 'Dr. Sneha Patel', 'Dr. Ananya Gupta', 'Dr. Kavya Reddy',
    'Dr. Meera Iyer', 'Dr. Pooja Verma', 'Dr. Shruti Kumar', 'Dr. Neha Desai',
    'Dr. Divya Joshi', 'Dr. Ritika Agarwal', 'Dr. Swati Mishra', 'Dr. Nisha Kapoor',
    'Dr. Tanvi Choudhary', 'Dr. Aishwarya Rao', 'Dr. Pallavi Nair', 'Dr. Rashmi Kulkarni',
    'Dr. Sonali Pandey', 'Dr. Deepika Mehta', 'Dr. Anjali Tiwari', 'Dr. Vandana Bhatia',
    'Dr. Kriti Saxena', 'Dr. Bhavna Malhotra', 'Dr. Shalini Chatterjee', 'Dr. Aditi Srivastava',
    'Dr. Rekha Singh'
];

const specializations = [
    'General Physician',
    'Gynecologist',
    'Dermatologist',
    'Pediatrician',
    'Neurologist',
    'Gastroenterologist',
    'Cardiologist',
    'Orthopedic',
    'ENT Specialist',
    'Psychiatrist'
];

const degrees = ['MBBS', 'MD', 'MS', 'DM', 'DNB', 'FRCS'];

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];

const hospitalPrefixes = ['Apollo', 'Fortis', 'Max', 'Medanta', 'AIIMS', 'Manipal', 'Narayana'];

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomFees = () => getRandomNumber(6, 30) * 50; // 300 to 1500

const getRandomQualifications = () => {
    const numDegrees = getRandomNumber(1, 3);
    const shuffled = [...degrees].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numDegrees);
};

const getRandomRating = () => {
    const rating = 3.8 + Math.random() * 1.2; // 3.8 to 5.0
    return Math.round(rating * 10) / 10;
};

const getRandomAvailability = () => {
    const numDays = getRandomNumber(3, 5);
    const shuffledDays = [...weekDays].sort(() => 0.5 - Math.random()).slice(0, numDays);

    return shuffledDays.map(day => {
        const startHour = getRandomNumber(8, 11);
        const endHour = getRandomNumber(16, 20);
        return {
            day,
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${endHour.toString().padStart(2, '0')}:00`
        };
    });
};

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            tls: true,
            tlsAllowInvalidCertificates: false,
        });
    } catch (error) {
        process.exit(1);
    }
};

const seedDoctors = async () => {
    try {

        await connectDB();

        const seededDoctorUsers = await User.find({
            role: 'doctor',
            email: { $regex: /^doctor\d+@healthconnect\.com$/ }
        });

        const seededUserIds = seededDoctorUsers.map(user => user._id);

        await Doctor.deleteMany({ userId: { $in: seededUserIds } });

        await User.deleteMany({
            role: 'doctor',
            email: { $regex: /^doctor\d+@healthconnect\.com$/ }
        });

        const usersToCreate = [];
        const doctorsToCreate = [];

        for (let i = 0; i < 50; i++) {
            const isMale = i % 2 === 0 || Math.random() > 0.5;
            const gender = isMale ? 'male' : 'female';

            const nameArray = isMale ? maleNames : femaleNames;
            const nameIndex = Math.floor(i / 2) % nameArray.length;
            const name = nameArray[nameIndex];

            const email = `doctor${i + 1}@healthconnect.com`;

            const portraitType = isMale ? 'men' : 'women';
            const portraitIndex = (i % 50) + 1;
            const photo = `https://randomuser.me/api/portraits/${portraitType}/${portraitIndex}.jpg`;

            const specialization = getRandomItem(specializations);
            const experience = getRandomNumber(1, 25);
            const fees = getRandomFees();
            const qualifications = getRandomQualifications();

            const city = getRandomItem(cities);
            const hospitalPrefix = getRandomItem(hospitalPrefixes);
            const hospitalAddress = `${hospitalPrefix} Hospital, ${city}`;

            const userObj = {
                name,
                email,
                password: '$2a$10$XQCpKQsGIIJvlGz8OmC6POSUwp0nYD0ywK0g0bqVKNxNJ3w8M9Fze', // hashed "password123"
                role: 'doctor',
                gender,
                phone: `+91 ${getRandomNumber(70000, 99999)}${getRandomNumber(10000, 99999)}`,
                photo,
                isVerified: Math.random() > 0.3, // 70% verified
            };

            usersToCreate.push(userObj);

            doctorsToCreate.push({
                index: i,
                specialization,
                qualifications,
                experience,
                fees,
                hospitalAddress,
                availability: getRandomAvailability(),
                isVerified: Math.random() > 0.2, // 80% verified
                averageRating: getRandomRating(),
                totalRatings: getRandomNumber(20, 150),
            });
        }

        const createdUsers = await User.insertMany(usersToCreate);

        const doctorDocuments = doctorsToCreate.map((doc, index) => ({
            userId: createdUsers[index]._id,
            specialization: doc.specialization,
            qualifications: doc.qualifications,
            experience: doc.experience,
            fees: doc.fees,
            hospitalAddress: doc.hospitalAddress,
            availability: doc.availability,
            isVerified: doc.isVerified,
            averageRating: doc.averageRating,
            totalRatings: doc.totalRatings,
        }));

        const createdDoctors = await Doctor.insertMany(doctorDocuments);

        const specCounts = {};
        doctorDocuments.forEach(doc => {
            specCounts[doc.specialization] = (specCounts[doc.specialization] || 0) + 1;
        });
        Object.entries(specCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([spec, count]) => {
            });

        process.exit(0);

    } catch (error) {
        process.exit(1);
    }
};

seedDoctors();
