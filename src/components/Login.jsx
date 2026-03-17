import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, Input, Button, ErrorBanner } from './ui';

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl overflow-hidden p-2">
                        <img src="/logo.png" alt="Harvest Pro" className="w-full h-full object-contain" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Harvest Pro
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Gestión Integral Agrícola
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="px-4 py-8 sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <ErrorBanner error={error} />

                        <Input
                            label="Correo Electrónico"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Input
                            label="Contraseña"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <Button type="submit" className="w-full py-2.5" loading={loading}>
                            <LogIn className="w-4 h-4 mr-2" /> Iniciar Sesión
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
