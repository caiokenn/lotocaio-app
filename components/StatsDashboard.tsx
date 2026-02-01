import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Activity, Scale, Sigma } from 'lucide-react';

const StatsDashboard: React.FC = () => {
  const frequencyData = [
    { name: '04', freq: 40 },
    { name: '01', freq: 36 },
    { name: '08', freq: 36 },
    { name: '20', freq: 36 },
    { name: '02', freq: 33 },
    { name: '15', freq: 33 },
    { name: '23', freq: 32 },
    { name: '10', freq: 32 },
    { name: '14', freq: 24 },
  ];

  const oddEvenData = [
    { name: '7 Ímpares', value: 48, color: '#4f46e5' }, // Indigo
    { name: '8 Ímpares', value: 52, color: '#10b981' }, // Emerald
  ];

  const sumData = [
    { range: '160-170', count: 5, color: '#94a3b8' },
    { range: '170-180', count: 8, color: '#64748b' },
    { range: '180-200', count: 28, label: 'Ideal', color: '#0f172a' }, // Dark Slate
    { range: '200-220', count: 8, color: '#64748b' },
    { range: '220+', count: 2, color: '#94a3b8' },
  ];

  // Colors for frequency bar chart gradient effect
  const barColors = ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9'];

  const CardHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) => (
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary-600 shadow-sm">
            <Icon size={18} />
        </div>
        <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{subtitle}</p>}
        </div>
      </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Frequency Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <CardHeader icon={Activity} title="Frequência das Dezenas" subtitle="Top 9 - Últimos 51 Concursos" />
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={frequencyData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="freq" name="Ocorrências" radius={[6, 6, 6, 6]} barSize={32}>
                {frequencyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index < 3 ? '#4f46e5' : '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Odd/Even Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <CardHeader icon={Scale} title="Paridade (Ímpares/Pares)" subtitle="Equilíbrio Recente" />
          
          <div className="h-48 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={oddEvenData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={6}
                >
                  {oddEvenData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-slate-400">Ratio</span>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 mt-2">
               {oddEvenData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                     <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></div>
                     {d.name} ({d.value}%)
                  </div>
               ))}
            </div>
        </div>

        {/* Sum Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <CardHeader icon={Sigma} title="Soma das Dezenas" subtitle="Faixas de Calor" />
          
           <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sumData} layout="vertical" margin={{ left: 0, right: 10 }}>
                 <XAxis type="number" hide />
                 <YAxis dataKey="range" type="category" width={60} tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} tickLine={false} axisLine={false} />
                 <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }} 
                 />
                 <Bar dataKey="count" name="Jogos" barSize={16} radius={[0, 4, 4, 0]}>
                  {sumData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                 </Bar>
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;