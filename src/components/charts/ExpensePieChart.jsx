import { ResponsivePie } from '@nivo/pie';
import { motion } from 'framer-motion';
import { useExpenseStore } from '../../store/expenseStore';
import { formatCurrency } from '../../lib/utils';

export const ExpensePieChart = () => {
  const darkMode = useExpenseStore((state) => state.darkMode);
  const categoryTotals = useExpenseStore((state) => state.getCategoryTotals());

  const data = categoryTotals.map((item, index) => ({
    id: item.category,
    label: item.category,
    value: item.total,
    color: `hsl(${(index * 360) / categoryTotals.length}, 70%, 50%)`,
  }));

  const theme = {
    text: {
      fill: darkMode ? '#e5e7eb' : '#1f2937',
      fontSize: 12,
    },
    tooltip: {
      container: {
        background: darkMode ? '#1f2937' : '#ffffff',
        color: darkMode ? '#e5e7eb' : '#1f2937',
        fontSize: 12,
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    },
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No hay datos para mostrar</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="h-64"
    >
      <ResponsivePie
        data={data}
        theme={theme}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        innerRadius={0.6}
        padAngle={1}
        cornerRadius={4}
        activeOuterRadiusOffset={8}
        colors={{ scheme: 'paired' }}
        borderWidth={2}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 0.2]],
        }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor={darkMode ? '#e5e7eb' : '#1f2937'}
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{
          from: 'color',
          modifiers: [['darker', 2]],
        }}
        valueFormat={(value) => formatCurrency(value)}
        tooltip={({ datum }) => (
          <div className="flex items-center gap-2 px-3 py-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: datum.color }}
            />
            <span className="font-medium">{datum.label}:</span>
            <span className="font-bold">{formatCurrency(datum.value)}</span>
          </div>
        )}
        legends={[]}
      />
    </motion.div>
  );
};
