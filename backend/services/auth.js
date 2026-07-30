import { prisma } from '../config/prisma.js';
import bcrypt from 'bcrypt';

export async function registerUser(email, password, displayName = null) {
    if (!email || !password) {
        throw new Error('Email and password are required');
    }

    if (await checkUserExists(email)) {
        throw new Error('User already exists');
    }

    const newUser = await prisma.user.create({
        data: {
            email,
            username: email,
            displayName: typeof displayName === 'string' ? displayName.trim() || null : null,
            passwordHash: await bcrypt.hash(password, 12)
        }
    });
    return newUser;
}

export async function authenticateUser(email, password) {
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user || !user.passwordHash) {
        throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }
    
    return user;
}

export async function checkUserExists(email) {
    const user = await prisma.user.findUnique({
        where: { email }
    });
    return user !== null;
}

