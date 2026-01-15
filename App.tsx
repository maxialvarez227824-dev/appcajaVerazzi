import React, { useState, useEffect } from 'react';
import { DailyReport } from './types';
import { analyzeCashCloseImage, fileToBase64 } from './services/geminiService';
import { saveReportToDB, getReportsFromDB } from './dbService'; // Importamos los servicios de base de datos
import { Dashboard } from './components/Dashboard';
import { ReportList } from './components/ReportList';
import { ReportEditor } from './components/ReportEditor';
import { Upload, Loader2, Store, LayoutDashboard, History, Plus } from 'lucide-react';

const App: React.FC = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'upload'>('dashboard');
  const [error, setError] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);

  // --- CARGA AUTOMÁTICA AL INICIAR LA APP ---
  useEffect(() => {
    const cargarHistorialReal = async () => {
      try {
        const datosDB = await getReportsFromDB();
        if (datosDB && datosDB.length > 0) {
          setReports(datosDB);
        }
      } catch (err) {
        console.error("Error al cargar datos iniciales:", err);
      }
    };
    cargarHistorialReal();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsProcessing(true);
    setError(null);

    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type;
      const newReport = await analyzeCashCloseImage(base64, mimeType);
      setEditingReport(newReport);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al procesar el archivo.");
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  // --- GUARDADO EN PANTALLA Y EN BASE DE DATOS ---
  const handleSaveReport = async (updatedReport: DailyReport) => { 
    // 1. Actualizamos la pantalla (Estado local)
    setReports(prev => {
        const exists = prev.find(r => r.id === updatedReport.id);
        if (exists) {
            return prev.map(r => r.id === updatedReport.id ? updatedReport : r);
        }
        return [updatedReport, ...prev]; // Los nuevos aparecen primero
    });

    // 2. Guardado permanente en Neon
    try {
        await saveReportToDB(updatedReport);
        console.log("Guardado en la nube con éxito");
    } catch (err) {
        console.error("Error de persistencia:", err);
        setError("El reporte se guardó en pantalla pero no en la nube. Revisa tu conexión.");
    }

    setEditingReport(null);
    setActiveTab('dashboard');
  };

  // Función para datos de prueba (opcional, por si quieres ver cómo luce con datos)
  const loadDemoData = () => {
    const demoReports: DailyReport[] = [
        {
            id: 'demo1', date: new Date().toISOString().split('T')[0], shiftNumber: 'DEMO', 
            systemTotal: 50000, systemBreakdown: { cash: 30000, electronic: 20000, deliveryApps: 0, currentAccount: 0, other: 0 },
            realTotal: 50000, realBreakdown: { cash: 30000, electronic: 20000, deliveryApps: 0, currentAccount: 0, other: 0 },
            expenses: 0, difference: 0, status: 'BALANCED', warnings: []
        }
    ];
    setReports(demoReports);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {editingReport && (
        <ReportEditor 
            report={editingReport} 
            onSave={handleSaveReport} 
            onCancel={() => setEditingReport(null)} 
        />
      )}

      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg">
                <Store size={24} className="text-white" />
            </div>
            <div>
                <h1 className="font-bold text-lg leading-tight">Panadería AI</h1>
                <p className="text-xs text-slate-400">Control de Caja</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            Dashboard General
          </button>
          
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <History size={20} />
            Historial Cierres
          </button>

          <label 
            className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:bg-slate-800 hover:text-white mt-8 border border-dashed border-slate-700`}
          >
            <Plus size={20} />
            Nuevo Cierre (Subir)
            <input 
                type="file" 
                className="hidden" 
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                disabled={isProcessing}
            />
          </label>
        </nav>

        <div className="p-4 border-t border-slate-800">
             <button onClick={loadDemoData} className="text-xs text-slate-500 hover:text-slate-300 underline">
                Ver ejemplo visual
             </button>
             <p className="text-xs text-slate-600 mt-2">v1.2.0 • DB Connected</p>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm">
             <div className="flex items-center gap-2">
                <Store size={20} className="text-orange-500" />
                <span className="font-bold">Panadería AI</span>
             </div>
             <div className="flex gap-2">
                 <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded ${activeTab === 'dashboard' ? 'bg-orange-100 text-orange-600' : 'text-gray-500'}`}>
                    <LayoutDashboard size={20} />
                 </button>
                 <button onClick={() => setActiveTab('history')} className={`p-2 rounded ${activeTab === 'history' ? 'bg-orange-100 text-orange-600' : 'text-gray-500'}`}>
                    <History size={20} />
                 </button>
             </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'dashboard' ? 'Resumen Global' : 'Historial de Cierres'}
                </h2>
                <p className="text-gray-500">
                    {activeTab === 'dashboard' 
                        ? 'Rendimiento real basado en tus cierres guardados.' 
                        : 'Lista de cierres recuperados de la base de datos.'}
                </p>
            </div>
            
            <div className="flex items-center gap-3">
                {isProcessing ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                        <Loader2 className="animate-spin" size={18} />
                        Procesando AI...
                    </div>
                ) : (
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm font-medium">
                        <Upload size={18} />
                        <span className="hidden md:inline">Subir Reporte</span>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                        />
                    </label>
                )}
            </div>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
                <p className="text-sm font-medium">{error}</p>
            </div>
        )}

        <div className="space-y-6">
            {activeTab === 'dashboard' && <Dashboard reports={reports} />}
            {(activeTab === 'history' || activeTab === 'dashboard') && reports.length > 0 && (
                <ReportList 
                    reports={reports} 
                    onEditReport={(r) => setEditingReport(r)} 
                />
            )}
            {reports.length === 0 && !isProcessing && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400">No hay reportes guardados aún. Sube el primero.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;