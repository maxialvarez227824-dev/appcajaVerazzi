import React, { useState, useEffect } from 'react';
import { DailyReport, MoneyBreakdown } from '../types';
import { Save, X, AlertTriangle, Calculator, AlertCircle } from 'lucide-react';

interface ReportEditorProps {
  report: DailyReport;
  onSave: (report: DailyReport) => void;
  onCancel: () => void;
}

export const ReportEditor: React.FC<ReportEditorProps> = ({ report, onSave, onCancel }) => {
  const [data, setData] = useState<DailyReport>(report);

  // Recalculate totals whenever breakdowns change
  useEffect(() => {
    const sysTotal = 
        data.systemBreakdown.cash + 
        data.systemBreakdown.electronic + 
        data.systemBreakdown.deliveryApps + 
        data.systemBreakdown.currentAccount + 
        data.systemBreakdown.other;

    const realTotal = 
        data.realBreakdown.cash + 
        data.realBreakdown.electronic + 
        data.realBreakdown.deliveryApps + 
        data.realBreakdown.currentAccount + 
        data.expenses +
        data.realBreakdown.other;

    const diff = realTotal - sysTotal;
    
    let status: DailyReport['status'] = 'BALANCED';
    if (data.warnings.length > 0) status = 'REVIEW_REQUIRED';
    else if (diff < -50) status = 'SHORTAGE';
    else if (diff > 50) status = 'SURPLUS';

    setData(prev => ({
        ...prev,
        systemTotal: sysTotal,
        realTotal: realTotal,
        difference: diff,
        status: status
    }));
  }, [
    data.systemBreakdown, 
    data.realBreakdown, 
    data.expenses, 
    data.warnings
  ]);

  const updateBreakdown = (
    type: 'system' | 'real', 
    field: keyof MoneyBreakdown, 
    value: number
  ) => {
    setData(prev => ({
        ...prev,
        [type === 'system' ? 'systemBreakdown' : 'realBreakdown']: {
            ...prev[type === 'system' ? 'systemBreakdown' : 'realBreakdown'],
            [field]: value
        }
    }));
  };

  const handleDismissWarning = (index: number) => {
    const newWarnings = [...data.warnings];
    newWarnings.splice(index, 1);
    setData(prev => ({ ...prev, warnings: newWarnings }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calculator className="text-orange-600" />
                Revisión de Cierre
            </h2>
            <p className="text-sm text-gray-500">Valida los datos extraídos o corrige manualmente.</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Validation Warnings */}
          {data.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-yellow-800 flex items-center gap-2 mb-2">
                <AlertTriangle size={16} />
                Atención Requerida
              </h3>
              <ul className="space-y-2">
                {data.warnings.map((w, idx) => (
                  <li key={idx} className="flex items-start justify-between text-sm text-yellow-700">
                    <span>• {w}</span>
                    <button 
                        onClick={() => handleDismissWarning(idx)}
                        className="text-xs text-yellow-600 hover:text-yellow-900 underline ml-4"
                    >
                        Ignorar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* General Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input 
                    type="date" 
                    value={data.date}
                    onChange={(e) => setData({...data, date: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turno / N° Cierre</label>
                <input 
                    type="text" 
                    value={data.shiftNumber}
                    onChange={(e) => setData({...data, shiftNumber: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                />
            </div>
          </div>

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* System Column */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                    🖥️ Sistema (Predeterminada)
                </h3>
                <div className="space-y-3">
                    <InputRow label="Efectivo" 
                        val={data.systemBreakdown.cash} 
                        onChange={(v) => updateBreakdown('system', 'cash', v)} 
                    />
                    <InputRow label="Tarjetas / Electrónico" 
                        val={data.systemBreakdown.electronic} 
                        onChange={(v) => updateBreakdown('system', 'electronic', v)} 
                    />
                    <InputRow label="Apps Delivery (Rappi/Py)" 
                        val={data.systemBreakdown.deliveryApps} 
                        onChange={(v) => updateBreakdown('system', 'deliveryApps', v)} 
                    />
                    <InputRow label="Cuenta Corriente" 
                        val={data.systemBreakdown.currentAccount} 
                        onChange={(v) => updateBreakdown('system', 'currentAccount', v)} 
                    />
                    <div className="pt-3 border-t border-blue-200 mt-3 flex justify-between items-center">
                        <span className="font-bold text-blue-900">Total Sistema</span>
                        <span className="font-bold text-xl text-blue-900">${data.systemTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Real Column */}
            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                    💵 Arqueo Real (Físico)
                </h3>
                <div className="space-y-3">
                    <InputRow label="Efectivo Contado" 
                        val={data.realBreakdown.cash} 
                        onChange={(v) => updateBreakdown('real', 'cash', v)} 
                    />
                    <InputRow label="Comprobantes Tarjeta" 
                        val={data.realBreakdown.electronic} 
                        onChange={(v) => updateBreakdown('real', 'electronic', v)} 
                    />
                    <InputRow label="Comprobantes Delivery" 
                        val={data.realBreakdown.deliveryApps} 
                        onChange={(v) => updateBreakdown('real', 'deliveryApps', v)} 
                    />
                    <InputRow label="Vales Cuenta Cte" 
                        val={data.realBreakdown.currentAccount} 
                        onChange={(v) => updateBreakdown('real', 'currentAccount', v)} 
                    />
                     <div className="my-2 p-2 bg-orange-50 rounded border border-orange-100">
                        <InputRow label="Gastos (Tickets)" 
                            val={data.expenses} 
                            onChange={(v) => setData({...data, expenses: v})} 
                            color="text-orange-700"
                        />
                    </div>
                    <div className="pt-3 border-t border-green-200 mt-3 flex justify-between items-center">
                        <span className="font-bold text-green-900">Total Arqueo (+Gastos)</span>
                        <span className="font-bold text-xl text-green-900">${data.realTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>
          </div>

          {/* Results Bar */}
          <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 
            ${data.difference >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3">
                 <div className={`p-3 rounded-full ${data.difference >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {data.difference >= 0 ? <Save className="text-green-600"/> : <AlertCircle className="text-red-600"/>}
                 </div>
                 <div>
                    <p className="text-sm text-gray-600">Diferencia Final</p>
                    <p className={`text-2xl font-bold ${data.difference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {data.difference > 0 ? '+' : ''}{data.difference.toLocaleString()}
                    </p>
                 </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
                <button 
                    onClick={onCancel}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                    Cancelar
                </button>
                <button 
                    onClick={() => onSave(data)}
                    className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-lg hover:shadow-xl transition-all"
                >
                    Confirmar y Guardar
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputRow = ({ label, val, onChange, color = "text-gray-700" }: { label: string, val: number, onChange: (n: number) => void, color?: string }) => (
    <div className="flex justify-between items-center">
        <label className={`text-sm ${color}`}>{label}</label>
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input 
                type="number" 
                value={val}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                className="w-32 pl-6 pr-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 text-right font-mono"
            />
        </div>
    </div>
);