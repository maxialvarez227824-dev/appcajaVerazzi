import React from 'react';
import { DailyReport } from '../types';
import { FileDown, AlertTriangle, CheckCircle, ArrowDown, ArrowUp } from 'lucide-react';

interface ReportListProps {
  reports: DailyReport[];
  onEditReport: (report: DailyReport) => void;
}

export const ReportList: React.FC<ReportListProps> = ({ reports, onEditReport }) => {
  const exportToCSV = () => {
    if (reports.length === 0) return;

    const headers = [
      "Fecha", "Turno", "Ventas Sistema", "Efectivo Sistema", "Electrónico Sistema", "Delivery Sistema",
      "Total Real", "Efectivo Real", "Electrónico Real", "Delivery Real", "Gastos", "Diferencia", "Estado"
    ];

    const rows = reports.map(r => [
      r.date,
      r.shiftNumber,
      r.systemTotal,
      r.systemBreakdown.cash,
      r.systemBreakdown.electronic,
      r.systemBreakdown.deliveryApps,
      r.realTotal,
      r.realBreakdown.cash,
      r.realBreakdown.electronic,
      r.realBreakdown.deliveryApps,
      r.expenses,
      r.difference,
      r.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cierre_de_caja_reporte.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (reports.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Detalle de Cierres Diarios</h3>
        <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
        >
            <FileDown size={16} />
            Exportar a Sheets (CSV)
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-4">Fecha / Turno</th>
              <th className="px-6 py-4 text-right">Sistema (Predet.)</th>
              <th className="px-6 py-4 text-right">Arqueo Real</th>
              <th className="px-6 py-4 text-right">Gastos</th>
              <th className="px-6 py-4 text-right">Diferencia</th>
              <th className="px-6 py-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((report) => (
              <tr 
                key={report.id} 
                className="hover:bg-blue-50 transition-colors cursor-pointer group"
                onClick={() => onEditReport(report)}
                title="Click para ver detalle y editar"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                      {report.date}
                      {report.warnings.length > 0 && <AlertTriangle size={14} className="text-yellow-500" />}
                  </div>
                  <div className="text-xs text-gray-500">#{report.shiftNumber}</div>
                </td>
                <td className="px-6 py-4 text-right text-gray-700">
                  ${report.systemTotal.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">
                   ${report.realTotal.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right text-orange-600">
                   ${report.expenses.toLocaleString()}
                </td>
                <td className={`px-6 py-4 text-right font-bold ${report.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                   {report.difference > 0 ? '+' : ''}{report.difference.toLocaleString()}
                </td>
                <td className="px-6 py-4 flex justify-center">
                    {report.status === 'BALANCED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={12} /> OK
                        </span>
                    )}
                    {report.status === 'SHORTAGE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <ArrowDown size={12} /> Faltante
                        </span>
                    )}
                    {report.status === 'SURPLUS' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <ArrowUp size={12} /> Sobrante
                        </span>
                    )}
                    {report.status === 'REVIEW_REQUIRED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <AlertTriangle size={12} /> Revisar
                        </span>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-gray-50 text-xs text-gray-500 text-center">
        Haz clic en una fila para ver el desglose completo o editar valores.
      </div>
    </div>
  );
};