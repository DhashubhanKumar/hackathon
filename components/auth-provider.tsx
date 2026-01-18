'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type UserRole = 'ATTENDEE' | 'ORGANIZER' | null;

interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    login: (role: UserRole, userData?: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check for existing session in localStorage
        if (typeof window !== 'undefined') {
            const userDataStr = localStorage.getItem('user_data');
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    setUser(userData);
                } catch (e) {
                    // Invalid data, clear storage
                    localStorage.removeItem('user_data');
                }
            }
        }
    }, []);

    const login = (role: UserRole, userData?: User) => {
        if (!role) return;

        if (userData) {
            // Real user data from database
            if (typeof window !== 'undefined') {
                localStorage.setItem('user_data', JSON.stringify(userData));
            }
            setUser(userData);
        } else {
            // Fallback for old code (shouldn't happen with new login)
            const mockUser: User = {
                id: 'mock-id',
                name: role === 'ORGANIZER' ? 'Demo Organizer' : 'Demo Attendee',
                email: 'demo@example.com',
                phone: null,
                role
            };
            if (typeof window !== 'undefined') {
                localStorage.setItem('user_data', JSON.stringify(mockUser));
            }
            setUser(mockUser);
        }

        router.push(role === 'ORGANIZER' ? '/dashboard' : '/');
        router.refresh();
    };

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user_data');
        }
        setUser(null);
        router.push('/');
        router.refresh();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
