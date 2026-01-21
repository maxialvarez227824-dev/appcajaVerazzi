import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { DailyReport } from '../types';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';

interface DashboardProps {
  reports: DailyReport[];
}

const COLORS = ['#0088FE', '#00C49F', '#FF8042', '#FFBB28', '#8884d8'];

export const Dashboard: React.FC<DashboardProps> = ({ reports }) => {
  // Aggregate calculations
  const totalSales = reports.reduce((acc, curr) => acc + curr.systemTotal, 0);
  const totalDifference = reports.reduce((acc, curr) => acc + curr.difference, 0);
  const totalExpenses = reports.reduce((acc, curr) => acc + curr.expenses, 0);
  
  const paymentMethodData = [
    { name: 'Efectivo', value: reports.reduce((acc, curr) => acc + curr.realBreakdown.cash, 0) },
    { name: 'Electrónico', value: reports.reduce((acc, curr) => acc + curr.realBreakdown.electronic, 0) },
    { name: 'Delivery Apps', value: reports.reduce((acc, curr) => acc + curr.realBreakdown.deliveryApps, 0) },
    { name: 'Cta Cte', value: reports.reduce((acc, curr) => acc + curr.realBreakdown.currentAccount, 0) },
  ].filter(d => d.value > 0);

  // Sort reports by date for the timeline
  const sortedReports = [...reports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dataOverTime = sortedReports.map(r => ({
    date: r.date,
    Ventas: r.systemTotal,
    Real: r.realTotal,
    Gastos: r.expenses
  }));

  const formatCurrency = (val: number) => `$${val.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm p-8">
        <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg">No hay reportes cargados para mostrar en el dashboard.</p>
        <p className="text-sm">Sube una imagen o PDF para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Ventas Totales</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                    <DollarSign size={20} />
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Gastos Registrados</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
                    <TrendingDown size={20} />
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Balance Caja (Dif)</p>
                    <p className={`text-2xl font-bold ${totalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalDifference > 0 ? '+' : ''}{formatCurrency(totalDifference)}
                    </p>
                </div>
                <div className={`p-3 rounded-full ${totalDifference >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <TrendingUp size={20} />
                </div>
            </div>
        </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Reportes Procesados</p>
                    <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                    <CreditCard size={20} />
                </div>
            </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendencia de Ventas (Sistema vs Real)</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dataOverTime}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{fontSize: 12}} />
                        <YAxis tickFormatter={(val) => `$${val}`} tick={{fontSize: 12}} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="Ventas" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="Real" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Medios de Pago (Acumulado)</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={paymentMethodData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {paymentMethodData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};
