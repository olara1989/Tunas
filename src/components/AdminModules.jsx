import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Card, SectionHeader, StatusBadge, EmptyState, Spinner } from './ui';
import { ShieldCheck, Users } from 'lucide-react';

export function AdminModules() {
    const { userData, setActiveTenant } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userData?.rol !== 'admin') return;
        const ref = collection(db, 'usuarios');
        const unsub = onSnapshot(ref, (snap) => {
            setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, [userData]);

    if (userData?.rol !== 'admin') return <EmptyState icon={ShieldCheck} message="Acceso Denegado" />;

    return (
        <div className="space-y-6">
            <SectionHeader title="Panel de Súper Administrador" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <p className="text-slate-400 font-medium text-sm">Total Usuarios</p>
                    <p className="text-3xl font-bold mt-1">{usuarios.length}</p>
                </Card>
                <Card className="bg-gradient-to-br from-green-600 to-green-500 text-white">
                    <p className="text-green-100 font-medium text-sm">Bodegas Activas</p>
                    <p className="text-3xl font-bold mt-1">{usuarios.filter(u => u.rol === 'tenant').length}</p>
                </Card>
            </div>

            <Card>
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-400" /> Cuentas Registradas
                </h3>
                {loading ? <Spinner /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Email / ID</th>
                                    <th className="px-4 py-3">Rol</th>
                                    <th className="px-4 py-3">Tenant ID</th>
                                    <th className="px-4 py-3">Info Bodega</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {usuarios.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-900">{u.email}</p>
                                            <p className="text-xs text-slate-400 font-mono">{u.id}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={u.rol === 'admin' ? 'admin' : 'tenant'} />
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                            {u.tenant_id || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-slate-700 font-medium">{u.bodega_info?.nombre || 'Sin configurar'}</p>
                                            {u.bodega_info?.telefono && <p className="text-xs text-slate-500">{u.bodega_info.telefono}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {u.rol === 'tenant' && (
                                                <Button
                                                    variant="secondary"
                                                    className="px-3 py-1 text-xs"
                                                    onClick={() => setActiveTenant({ id: u.tenant_id, email: u.email, nombre: u.bodega_info?.nombre })}
                                                >
                                                    Gestionar
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
