import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, secondaryAuth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Card, SectionHeader, StatusBadge, EmptyState, Spinner, Button, Modal, Input, Select, ErrorBanner, SuccessBanner, Checkbox } from './ui';
import { ShieldCheck, Users, Plus, Edit2 } from 'lucide-react';

export function AdminModules() {
    const { userData, setActiveTenant, logout } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);

    const [createModal, setCreateModal] = useState(false);
    const [editModal, setEditModal] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (userData?.rol !== 'admin') return;
        const ref = collection(db, 'usuarios');
        const unsub = onSnapshot(ref, (snap) => {
            setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, [userData]);

    const handleCreateUser = async () => {
        if (!form.email || !form.password || !form.nombreBodega) {
            setError('Email, contraseña y nombre son obligatorios'); return;
        }
        setSaving(true); setError('');
        try {
            const credential = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
            const uid = credential.user.uid;
            await setDoc(doc(db, 'usuarios', uid), {
                email: form.email,
                rol: 'tenant',
                tenant_id: uid,
                status: form.status || 'active',
                plan: form.plan || 'mensual',
                vencimiento: form.vencimiento || new Date().toISOString().split('T')[0],
                bodega_info: { nombre: form.nombreBodega },
                modulos: form.modulos || {
                    dashboard: true,
                    produccion: true,
                    bodega: true,
                    equipos: true,
                    reportes: true,
                    catalogos: true,
                    cuenta: true
                }
            });
            setSuccess('Usuario creado exitosamente.');
            setCreateModal(false); setForm({});
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) { setError(e); }
        finally { setSaving(false); }
    };

    const handleEditUser = async () => {
        setSaving(true); setError('');
        try {
            await updateDoc(doc(db, 'usuarios', editModal.id), {
                status: form.status,
                plan: form.plan,
                vencimiento: form.vencimiento,
                modulos: form.modulos
            });
            setSuccess('Usuario actualizado.');
            setEditModal(null);
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) { setError(e); }
        finally { setSaving(false); }
    };

    const openEdit = (u) => {
        setForm({
            status: u.status || 'active',
            plan: u.plan || 'mensual',
            vencimiento: u.vencimiento || '',
            modulos: u.modulos || {
                dashboard: true,
                produccion: true,
                bodega: true,
                equipos: true,
                reportes: true,
                catalogos: true,
                cuenta: true
            }
        });
        setEditModal(u);
    };

    if (userData?.rol !== 'admin') return <EmptyState icon={ShieldCheck} message="Acceso Denegado" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Panel de Súper Administrador</h1>
                    <p className="text-sm text-slate-500">Gestión Global de Usuarios y Suscripciones</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => logout()} className="text-red-500 border-red-100 hover:bg-red-50 capitalize">
                        Cerrar Sesión
                    </Button>
                    <Button onClick={() => { setForm({}); setError(''); setCreateModal(true); }}>
                        <Plus className="w-4 h-4 mr-2" /> Crear Usuario
                    </Button>
                </div>
            </div>
            <SuccessBanner message={success} />

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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" /> Cuentas Registradas
                    </h3>
                    <Input
                        placeholder="Buscar por email o bodega..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full sm:w-72"
                    />
                </div>
                {loading ? <Spinner /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Email / ID</th>
                                    <th className="px-4 py-3">Rol</th>
                                    <th className="px-4 py-3">Tenant ID / Info</th>
                                    <th className="px-4 py-3 text-center">Suscripción</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {usuarios
                                    .filter(u => {
                                        if (!searchTerm) return true;
                                        const s = searchTerm.toLowerCase();
                                        return u.email?.toLowerCase().includes(s) ||
                                            u.bodega_info?.nombre?.toLowerCase().includes(s);
                                    })
                                    .map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-slate-900">{u.email}</p>
                                                <p className="text-xs text-slate-400 font-mono">{u.id}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={u.rol === 'admin' ? 'admin' : 'tenant'} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-slate-700 font-medium">{u.bodega_info?.nombre || 'Sin configurar'}</p>
                                                <p className="font-mono text-xs text-slate-500">{u.tenant_id || 'N/A'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {u.rol === 'tenant' ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {u.status === 'active' ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                        <p className="text-xs text-slate-500">{u.plan} · {u.vencimiento}</p>
                                                    </div>
                                                ) : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {u.rol === 'tenant' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            className="px-2 py-1 text-slate-400 hover:text-blue-600"
                                                            onClick={() => openEdit(u)}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            className="px-3 py-1 text-xs font-semibold"
                                                            onClick={() => setActiveTenant(u)}
                                                            disabled={u.status !== 'active'}
                                                        >
                                                            Gestionar
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal de Crear Usuario */}
            <Modal open={createModal} onClose={() => setCreateModal(false)} title="Crear Nuevo Usuario (Tenant)">
                <div className="space-y-4">
                    <ErrorBanner error={error} />
                    <Input label="Correo Electrónico" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <Input label="Contraseña Temporal" type="password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} />
                    <Input label="Nombre de la Bodega/Empresa" value={form.nombreBodega || ''} onChange={e => setForm({ ...form, nombreBodega: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                        <Select label="Plan" options={[{ value: 'mensual', label: 'Mensual' }, { value: 'anual', label: 'Anual' }]} value={form.plan || 'mensual'} onChange={e => setForm({ ...form, plan: e.target.value })} />
                        <Input label="Vencimiento" type="date" value={form.vencimiento || ''} onChange={e => setForm({ ...form, vencimiento: e.target.value })} />
                    </div>
                    <Select label="Estado" options={[{ value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' }]} value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })} />

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-3">Habilitar Módulos</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Checkbox label="Dashboard" checked={form.modulos?.dashboard} onChange={v => setForm({ ...form, modulos: { ...form.modulos, dashboard: v } })} />
                            <Checkbox label="Producción" checked={form.modulos?.produccion} onChange={v => setForm({ ...form, modulos: { ...form.modulos, produccion: v } })} />
                            <Checkbox label="Bodega/Ventas" checked={form.modulos?.bodega} onChange={v => setForm({ ...form, modulos: { ...form.modulos, bodega: v } })} />
                            <Checkbox label="Equipos" checked={form.modulos?.equipos} onChange={v => setForm({ ...form, modulos: { ...form.modulos, equipos: v } })} />
                            <Checkbox label="Reportes" checked={form.modulos?.reportes} onChange={v => setForm({ ...form, modulos: { ...form.modulos, reportes: v } })} />
                            <Checkbox label="Catálogos" checked={form.modulos?.catalogos} onChange={v => setForm({ ...form, modulos: { ...form.modulos, catalogos: v } })} />
                            <Checkbox label="Mi Cuenta" checked={form.modulos?.cuenta} onChange={v => setForm({ ...form, modulos: { ...form.modulos, cuenta: v } })} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancelar</Button>
                        <Button loading={saving} onClick={handleCreateUser}>Crear Usuario</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Editar Usuario */}
            <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Editar Suscripción">
                <div className="space-y-4">
                    <ErrorBanner error={error} />
                    <p className="text-sm text-slate-500 mb-2">Editando a: <strong>{editModal?.email}</strong></p>
                    <Select label="Estado de Acceso" options={[{ value: 'active', label: 'Activo (Permitido)' }, { value: 'inactive', label: 'Inactivo (Bloqueado)' }]} value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                        <Select label="Plan" options={[{ value: 'mensual', label: 'Mensual' }, { value: 'anual', label: 'Anual' }]} value={form.plan || 'mensual'} onChange={e => setForm({ ...form, plan: e.target.value })} />
                        <Input label="Vencimiento" type="date" value={form.vencimiento || ''} onChange={e => setForm({ ...form, vencimiento: e.target.value })} />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-3">Funciones Habilitadas</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Checkbox label="Dashboard" checked={form.modulos?.dashboard} onChange={v => setForm({ ...form, modulos: { ...form.modulos, dashboard: v } })} />
                            <Checkbox label="Producción" checked={form.modulos?.produccion} onChange={v => setForm({ ...form, modulos: { ...form.modulos, produccion: v } })} />
                            <Checkbox label="Bodega/Ventas" checked={form.modulos?.bodega} onChange={v => setForm({ ...form, modulos: { ...form.modulos, bodega: v } })} />
                            <Checkbox label="Equipos" checked={form.modulos?.equipos} onChange={v => setForm({ ...form, modulos: { ...form.modulos, equipos: v } })} />
                            <Checkbox label="Reportes" checked={form.modulos?.reportes} onChange={v => setForm({ ...form, modulos: { ...form.modulos, reportes: v } })} />
                            <Checkbox label="Catálogos" checked={form.modulos?.catalogos} onChange={v => setForm({ ...form, modulos: { ...form.modulos, catalogos: v } })} />
                            <Checkbox label="Mi Cuenta" checked={form.modulos?.cuenta} onChange={v => setForm({ ...form, modulos: { ...form.modulos, cuenta: v } })} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setEditModal(null)}>Cancelar</Button>
                        <Button loading={saving} onClick={handleEditUser}>Guardar Cambios</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
