import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return NextResponse.json({ message: 'User registered successfully.' }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}