/**
 * Transforma códigos de error de Firebase y errores genéricos en mensajes amigables en español.
 */
export const getErrorMessage = (error) => {
    if (!error) return "";

    // Si ya es un string, lo devolvemos (o lo procesamos si parece un código)
    const code = error.code || (typeof error === 'string' ? error : error.message);

    const errorMap = {
        // Firebase Auth
        'auth/invalid-email': 'El correo electrónico no es válido.',
        'auth/user-disabled': 'Este usuario ha sido deshabilitado.',
        'auth/user-not-found': 'No se encontró ninguna cuenta con este correo.',
        'auth/wrong-password': 'La contraseña es incorrecta.',
        'auth/email-already-in-use': 'Ya existe una cuenta con este correo electrónico.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/operation-not-allowed': 'El inicio de sesión con este método no está permitido.',
        'auth/network-request-failed': 'Error de red. Verifica tu conexión a internet.',
        'auth/too-many-requests': 'Demasiados intentos fallidos. Inténtalo más tarde.',
        'auth/invalid-credential': 'Credenciales inválidas. Revisa tu correo y contraseña.',

        // Firestore
        'permission-denied': 'No tienes permisos suficientes para realizar esta acción.',
        'unauthenticated': 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
        'already-exists': 'Este registro ya existe.',
        'not-found': 'El registro solicitado no existe.',
        'unavailable': 'El servidor está temporalmente fuera de servicio. Inténtalo de nuevo.',

        // App Custom Errors (Si se usan códigos específicos)
        'required-fields': 'Por favor, completa todos los campos obligatorios.',
        'invalid-amount': 'La cantidad ingresada no es válida.',
        'no-items': 'Debes agregar al menos un elemento para continuar.',
    };

    // Si el error es un objeto de error (Error, FirebaseError)
    if (errorMap[code]) {
        return errorMap[code];
    }

    // Si no está en el mapa, intentar limpiar el mensaje de Firebase "Firebase: Error (auth/xxx)"
    if (typeof code === 'string' && code.includes('auth/')) {
        const extracted = code.match(/auth\/[a-z-]+/);
        if (extracted && errorMap[extracted[0]]) {
            return errorMap[extracted[0]];
        }
    }

    // Por defecto, devolver un mensaje genérico si no reconocemos el error
    return error.message || error.toString() || 'Ha ocurrido un error inesperado. Por favor intente de nuevo.';
};
