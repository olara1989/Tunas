import React, { useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Button, SuccessBanner, ErrorBanner } from './ui';

export function SeedManager() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const { addNode: addProductor } = useFirestore('productores');
    const { addNode: addHuerta } = useFirestore('huertas');
    const { addNode: addCliente } = useFirestore('clientes');
    const { addNode: addVariedad } = useFirestore('variedades');
    const { addNode: addEntrada } = useFirestore('registro_entradas');
    const { addNode: addDetalle } = useFirestore('detalle_entradas');

    const handleSeed = async () => {
        setLoading(true); setError('');
        try {
            // 1. Variedades
            const v1 = await addVariedad({ nombre: 'Cristalina', precio_compra: 150, precio_venta: 280, presentacion_default: 'Caja' });
            const v2 = await addVariedad({ nombre: 'Roja', precio_compra: 180, precio_venta: 320, presentacion_default: 'Caja' });
            const v3 = await addVariedad({ nombre: 'Amarilla', precio_compra: 120, precio_venta: 220, presentacion_default: 'Kilo' });

            // 2. Productores
            const p1 = await addProductor({ nombre: 'Carlos Mendoza', direccion: 'Rancho El Consuelo, Zacatecas', telefono: '4921234567' });
            const p2 = await addProductor({ nombre: 'Maria Lopez', direccion: 'Huerta Las Tunas, SLP', telefono: '4441234567' });

            // 3. Huertas
            const h1 = await addHuerta({ nombre: 'El Consuelo', superficie: 15, ubicacion: 'Pinos, Zacatecas', fecha_plantacion: '2020-05-15', variedades_ids: [v1.id, v2.id] });
            const h2 = await addHuerta({ nombre: 'La Bonanza', superficie: 10, ubicacion: 'Villa de Arriaga, SLP', fecha_plantacion: '2021-03-10', variedades_ids: [v3.id] });

            // 4. Clientes
            await addCliente({ nombre: 'Central de Abastos CDMX', direccion: 'Iztapalapa, CDMX', telefono: '5559876543' });
            await addCliente({ nombre: 'Exportadora del Norte', direccion: 'Monterrey, NL', telefono: '8119876543' });

            // 5. Entradas y Lotes
            const fecha = new Date().toISOString().split('T')[0];
            const e1 = await addEntrada({ productor_id: p1.id, fecha, monto_total_productor: 0, status: 'pendiente' });

            await addDetalle({
                registro_entrada_id: e1.id,
                variedad_id: v1.id,
                cantidad_recibida: 50,
                precio_compra: 150,
                tarima_no: 1,
                cantidad_vendida: 0,
                merma: 0,
                status: 'almacenada',
                presentacion: 'Caja'
            });

            await addDetalle({
                registro_entrada_id: e1.id,
                variedad_id: v2.id,
                cantidad_recibida: 50,
                precio_compra: 180,
                tarima_no: 2,
                cantidad_vendida: 0,
                merma: 0,
                status: 'almacenada',
                presentacion: 'Caja'
            });

            setSuccess('Datos de ejemplo cargados exitosamente.');
            setTimeout(() => setSuccess(''), 5000);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-xl text-white">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900">¿Necesitas datos de ejemplo?</h4>
                        <p className="text-sm text-slate-600">Esto cargará registros ficticios de huertas, productores, clientes y variedades para probar el sistema.</p>
                    </div>
                </div>
                <Button onClick={handleSeed} loading={loading} variant="secondary" className="whitespace-nowrap">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Cargar Datos Demo
                </Button>
            </div>
            <SuccessBanner message={success} />
            <ErrorBanner error={error} />
        </div>
    );
}

const Plus = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);
