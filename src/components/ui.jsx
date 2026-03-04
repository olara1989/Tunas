/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { AlertCircle, X, Loader2 } from 'lucide-react';

export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export const Card = ({ children, className }) => (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-200 p-5", className)}>
        {children}
    </div>
);

export const Button = ({ children, variant = "primary", className, loading, ...props }) => {
    const variants = {
        primary: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
        danger: "bg-red-50 text-red-600 hover:bg-red-100",
        outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
        ghost: "text-slate-600 hover:bg-slate-100",
        yellow: "bg-yellow-500 text-white hover:bg-yellow-600",
    };
    return (
        <button
            className={cn(
                "px-4 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed",
                variants[variant], className
            )}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
};

export const Input = ({ label, error, className, ...props }) => (
    <div className={cn("flex flex-col gap-1.5", className)}>
        {label && <label className="text-sm font-medium text-slate-600">{label}</label>}
        <input
            className={cn(
                "border rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all",
                error ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
            )}
            {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

export const Textarea = ({ label, className, ...props }) => (
    <div className={cn("flex flex-col gap-1.5", className)}>
        {label && <label className="text-sm font-medium text-slate-600">{label}</label>}
        <textarea
            rows={3}
            className="border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white resize-none"
            {...props}
        />
    </div>
);

export const Select = ({ label, options = [], className, ...props }) => (
    <div className={cn("flex flex-col gap-1.5", className)}>
        {label && <label className="text-sm font-medium text-slate-600">{label}</label>}
        <select
            className="border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            {...props}
        >
            <option value="">-- Seleccionar --</option>
            {options.map((opt, i) => (
                <option key={i} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

export const ErrorBanner = ({ error }) => {
    if (!error) return null;
    return (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
        </div>
    );
};

export const SuccessBanner = ({ message }) => {
    if (!message) return null;
    return (
        <div className="bg-green-50 text-green-700 p-3 rounded-xl flex items-center gap-2 mb-4 text-sm border border-green-200">
            <span>✓ {message}</span>
        </div>
    );
};

export const StatusBadge = ({ status }) => {
    const map = {
        pendiente: "bg-yellow-100 text-yellow-700",
        pagado: "bg-green-100 text-green-700",
        almacenada: "bg-blue-100 text-blue-700",
        en_proceso: "bg-orange-100 text-orange-700",
        completa: "bg-green-100 text-green-700",
    };
    const labels = {
        pendiente: "Pendiente", pagado: "Pagado",
        almacenada: "Almacenada", en_proceso: "En Proceso", completa: "Completa"
    };
    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", map[status] || "bg-slate-100 text-slate-600")}>
            {labels[status] || status}
        </span>
    );
};

export const Modal = ({ open, onClose, title, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
};

export const RadioGroup = ({ label, options, value, onChange, className }) => (
    <div className={cn("flex flex-col gap-1.5", className)}>
        {label && <label className="text-sm font-medium text-slate-600">{label}</label>}
        <div className="flex gap-3">
            {options.map((opt) => (
                <label
                    key={opt.value}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all select-none flex-1 justify-center font-medium text-sm",
                        value === opt.value
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    )}
                >
                    <input
                        type="radio"
                        className="hidden"
                        value={opt.value}
                        checked={value === opt.value}
                        onChange={() => onChange(opt.value)}
                    />
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                </label>
            ))}
        </div>
    </div>
);

export const EmptyState = ({ icon: Icon, message }) => (

    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        {Icon && <Icon className="w-12 h-12 mb-3 opacity-40" />}
        <p className="text-sm">{message}</p>
    </div>
);

export const Spinner = () => (
    <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
    </div>
);

export const SectionHeader = ({ title, action }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {action}
    </div>
);
