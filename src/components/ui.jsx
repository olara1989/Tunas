import React from 'react';
import { AlertCircle, X, Loader2, Search } from 'lucide-react';

export function SearchableSelect({ label, options = [], value, onChange, placeholder = "-- Seleccionar --", className }) {
    const [search, setSearch] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);

    const filtered = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selected = options.find(opt => opt.value === value);

    return (
        <div className={cn("flex flex-col gap-1.5 relative", className)}>
            {label && <label className="text-sm font-medium text-slate-600">{label}</label>}
            <div
                className={cn(
                    "border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm bg-white cursor-pointer flex justify-between items-center transition-all",
                    isOpen && "ring-2 ring-green-500 border-transparent"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={cn(!selected && "text-slate-400")}>
                    {selected ? selected.label : placeholder}
                </span>
                <Search className="w-4 h-4 text-slate-400" />
            </div>

            {isOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[60] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                autoFocus
                                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-400">Sin resultados</div>
                        ) : (
                            filtered.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={cn(
                                        "px-4 py-2.5 text-sm cursor-pointer hover:bg-green-50 transition-colors",
                                        value === opt.value ? "bg-green-50 text-green-700 font-bold" : "text-slate-700"
                                    )}
                                    onClick={() => {
                                        onChange({ target: { value: opt.value } });
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
            {isOpen && <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />}
        </div>
    );
}


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

export const Modal = ({ open, onClose, title, children, size = "lg" }) => {
    if (!open) return null;
    const sizes = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-4xl",
        "2xl": "max-w-6xl",
        "3xl": "max-w-7xl",
        "4xl": "max-w-[90vw]",
        "5xl": "max-w-[95vw]",
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className={cn("relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto", sizes[size])}>
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
