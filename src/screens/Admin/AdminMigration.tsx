import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';
import { functions, db, auth } from '../../firebase';

// Interfaces
interface UserData {
    id: string;
    email: string;
    aiQuotas?: any;
    _migrated?: boolean;
}

interface MigrationResult {
    userId: string;
    success: boolean;
    message?: string;
    alreadyMigrated?: boolean;
}

export default function AdminMigration() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<MigrationResult[]>([]);
    const [migrating, setMigrating] = useState(false);

    // Cargar usuarios que necesitan migración
    useEffect(() => {
        loadUnmigratedUsers();
    }, []);

    const checkStatus = async () => {
        try {
            const token = await auth.currentUser?.getIdTokenResult(true);
            const isAdmin = !!token?.claims.admin;
            alert(`Email: ${auth.currentUser?.email}\nAdmin Claim: ${isAdmin}\nFull Claims: ${JSON.stringify(token?.claims)}`);
        } catch (e: any) {
            alert('Error checking status: ' + e.message);
        }
    };

    const makeMeAdmin = async () => {
        try {
            console.log("Calling makeMeAdmin function...");
            const func = httpsCallable(functions, 'makeMeAdmin');
            const result = await func();
            console.log("Function result:", result);
            const data = result.data as any;
            if (data.success) {
                alert("SUCCESS: " + data.message);
                window.location.reload();
            } else {
                alert("FAILED: " + JSON.stringify(data));
            }
        } catch (error: any) {
            console.error("makeMeAdmin error:", error);
            alert('ERROR calling function: ' + error.message);
        }
    };

    const loadUnmigratedUsers = async () => {
        setLoading(true);
        try {
            // Usamos Cloud Function para saltarnos las reglas de Firestore (que pueden estar bloqueadas)
            const getUnmigrated = httpsCallable(functions, 'getUsersToMigrate');
            const result = await getUnmigrated();
            const data = result.data as any;

            if (data.success) {
                setUsers(data.users);
                console.log(`Encontrados ${data.users.length} usuarios sin migrar`);
            } else {
                throw new Error(data.message || 'Error desconocido');
            }

        } catch (error: any) {
            console.error('Error cargando usuarios:', error);
            alert('Error cargando usuarios: ' + (error.message || error));
        } finally {
            setLoading(false);
        }
    };

    const migrateUser = async (userId: string) => {
        try {
            setMigrating(true);
            const migrate = httpsCallable(functions, 'migrateExistingUser');
            const result = await migrate({ userId });
            const data = result.data as any;

            setResults(prev => [...prev, {
                userId,
                success: data.success,
                message: data.message,
                alreadyMigrated: data.alreadyMigrated
            }]);

            // Actualizar lista local
            setUsers(prev => prev.filter(u => u.id !== userId));

        } catch (error: any) {
            console.error('Error:', error);
            alert(`❌ Error migrando ${userId}: ${error.message}`);
            setResults(prev => [...prev, {
                userId,
                success: false,
                message: error.message
            }]);
        } finally {
            setMigrating(false);
        }
    };

    const migrateAll = async () => {
        if (!confirm(`¿Migrar ${users.length} usuarios? Esto puede tardar varios minutos.`)) {
            return;
        }

        setMigrating(true);

        // Copia de usuarios para iterar
        const usersToMigrate = [...users];

        for (const user of usersToMigrate) {
            try {
                const migrate = httpsCallable(functions, 'migrateExistingUser');
                const result = await migrate({ userId: user.id });
                const data = result.data as any;

                setResults(prev => [...prev, {
                    userId: user.id,
                    success: data.success,
                    message: data.message
                }]);

                // Quitar de la lista visual
                setUsers(prev => prev.filter(u => u.id !== user.id));

                // Esperar un poco para no saturar
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error: any) {
                console.error(`Error migrando ${user.id}:`, error);
                setResults(prev => [...prev, {
                    userId: user.id,
                    success: false,
                    message: error.message
                }]);
            }
        }

        setMigrating(false);
        alert('✅ Proceso completado');
    };

    if (loading && users.length === 0) {
        return <div className="p-6 text-center">Cargando usuarios...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h1 className="text-2xl font-bold mb-4 text-gray-900">
                    Panel de Migración Automática
                </h1>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={makeMeAdmin}
                        className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
                    >
                        👑 Hacerme Admin (Solo Dev)
                    </button>
                    <button
                        onClick={checkStatus}
                        className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200"
                    >
                        🕵️ Verificar Status
                    </button>
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <h2 className="font-semibold text-blue-800 mb-2">Información:</h2>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• La migración es automática y segura (Cloud Functions)</li>
                        <li>• Los campos viejos se borran después de 7 días</li>
                        <li>• Requiere permisos de administrador</li>
                    </ul>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-lg">
                        Usuarios pendientes: <span className="text-purple-600">{users.length}</span>
                    </h3>

                    <div className="space-x-4">
                        <button
                            onClick={loadUnmigratedUsers}
                            className="text-gray-600 hover:text-gray-900 underline text-sm"
                            disabled={migrating}
                        >
                            Recargar lista
                        </button>

                        {users.length > 0 && (
                            <button
                                onClick={migrateAll}
                                disabled={migrating}
                                className={`bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl font-medium transition-all ${migrating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {migrating ? 'Migrando...' : 'Migrar Todos'}
                            </button>
                        )}
                    </div>
                </div>

                {users.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                        <p className="text-gray-500 text-lg">✅ No hay usuarios pendientes de migración</p>
                    </div>
                ) : (
                    <div className="space-y-3 mb-8">
                        {users.map(user => (
                            <div
                                key={user.id}
                                className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{user.email}</p>
                                    <p className="text-xs text-gray-500 font-mono mt-1">
                                        ID: {user.id}
                                    </p>
                                    <div className="text-xs text-gray-600 flex gap-2 mt-1">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                                            Plan: {user.aiQuotas.monthly || user.aiQuotas.total} créditos
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => migrateUser(user.id)}
                                    disabled={migrating}
                                    className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                >
                                    Migrar
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {results.length > 0 && (
                    <div className="mt-8 border-t pt-6">
                        <h2 className="font-bold mb-4 text-gray-900">Log de Resultados</h2>
                        <div className="bg-gray-900 text-gray-300 p-4 rounded-xl text-xs font-mono overflow-auto max-h-64 space-y-1">
                            {results.map((res, i) => (
                                <div key={i} className={res.success ? 'text-green-400' : 'text-red-400'}>
                                    [{new Date().toLocaleTimeString()}] {res.success ? 'SUCCESS' : 'ERROR'} - {res.userId}: {res.message}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
