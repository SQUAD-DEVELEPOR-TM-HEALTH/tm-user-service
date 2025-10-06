import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Hash password for dummy users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create dummy users
  const users = [
    {
      name: 'John Doe',
      nik: '3201234567890001',
      email: 'john.doe@example.com',
      dob: new Date('1990-01-15'),
      gender: 'male',
      agreement: true,
      password: hashedPassword,
      link_photo: 'https://i.pravatar.cc/150?img=1',
      phoneNumber: '8123456789',
      phoneCode: '+62',
      tokenFcm: null,
    },
    {
      name: 'Jane Smith',
      nik: '3201234567890002',
      email: 'jane.smith@example.com',
      dob: new Date('1992-05-20'),
      gender: 'female',
      agreement: true,
      password: hashedPassword,
      link_photo: 'https://i.pravatar.cc/150?img=5',
      phoneNumber: '8129876543',
      phoneCode: '+62',
      tokenFcm: null,
    },
    {
      name: 'Ahmad Wijaya',
      nik: '3201234567890003',
      email: 'ahmad.wijaya@example.com',
      dob: new Date('1988-08-10'),
      gender: 'male',
      agreement: true,
      password: hashedPassword,
      link_photo: 'https://i.pravatar.cc/150?img=12',
      phoneNumber: '8121112233',
      phoneCode: '+62',
      tokenFcm: null,
    },
    {
      name: 'Siti Nurhaliza',
      nik: '3201234567890004',
      email: 'siti.nurhaliza@example.com',
      dob: new Date('1995-03-25'),
      gender: 'female',
      agreement: true,
      password: hashedPassword,
      link_photo: 'https://i.pravatar.cc/150?img=9',
      phoneNumber: '8134445566',
      phoneCode: '+62',
      tokenFcm: null,
    },
    {
      name: 'Budi Santoso',
      nik: '3201234567890005',
      email: 'budi.santoso@example.com',
      dob: new Date('1985-12-05'),
      gender: 'male',
      agreement: false,
      password: hashedPassword,
      link_photo: null,
      phoneNumber: '8147778899',
      phoneCode: '+62',
      tokenFcm: null,
    },
  ];

  // Insert users one by one to handle unique constraints
  for (const userData of users) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`User already exists: ${userData.email}`);
        continue;
      }

      // Create new user
      const user = await prisma.user.create({
        data: userData,
      });
      console.log(`Created user: ${user.email}`);
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error.message);
    }
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
