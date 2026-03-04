import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, SectionHeader, ErrorBanner, SuccessBanner, RadioGroup } from './ui';
import { Settings, LogOut } from 'lucide-react';

export function AccountModule() {
    const { user, userData, logout } = useAuth();
    const [form, setForm] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        tipo_produccion: 'Caja'
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (userData?.bodega_info) {
            setForm(prev => ({ ...prev, ...userData.bodega_info }));
        }
    }, [userData]);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const ref = doc(db, 'usuarios', user.uid);
            await updateDoc(ref, { bodega_info: form });
            setSuccess('Datos actualizados correctamente.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-6">
            <div className="flex justify-between items-center">
                <SectionHeader title="Mi Cuenta y Bodega" />
                <Button variant="danger" onClick={logout} className="text-sm px-4 py-2">
                    <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
                </Button>
            </div>

            <Card>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                        <Settings className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">{userData?.email}</p>
                        <p className="text-sm text-slate-500 font-mono">Tenant ID: {userData?.tenant_id}</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <h3 className="font-medium text-slate-800">Información de la Bodega</h3>
                    <ErrorBanner error={error} />
                    <SuccessBanner message={success} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nombre de la Bodega / Empresa"
                            value={form.nombre}
                            onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                        />
                        <Input
                            label="Teléfono de Contacto"
                            value={form.telefono}
                            onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                        />
                    </div>

                    <Input
                        label="Dirección Física"
                        value={form.direccion}
                        onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))}
                    />

                    <RadioGroup
                        label="Producción Predominante"
                        options={[
                            { value: 'Caja', label: 'Cajas', icon: '📦' },
                            { value: 'Kilo', label: 'Kilos a Granel', icon: '⚖️' }
                        ]}
                        value={form.tipo_produccion}
                        onChange={val => setForm(p => ({ ...p, tipo_produccion: val }))}
                    />

                    <div className="pt-4 flex justify-end">
                        <Button loading={saving} onClick={handleSave}>Guardar Cambios</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
