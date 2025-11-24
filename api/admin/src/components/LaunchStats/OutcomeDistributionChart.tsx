import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface OutcomeDistributionChartProps {
  data: {
    total_successes: number;
    total_failures: number;
    total_partial_failures: number;
    total_tbd: number;
  };
  title?: string;
}

const COLORS = {
  success: '#2e7d32',
  failure: '#d32f2f',
  partial: '#ed6c02',
  tbd: '#757575'
};

const OutcomeDistributionChart: React.FC<OutcomeDistributionChartProps> = ({ 
  data,
  title = 'Launch Outcome Distribution'
}) => {
  const chartData = [
    { name: 'Success', value: data.total_successes || 0, color: COLORS.success },
    { name: 'Failure', value: data.total_failures || 0, color: COLORS.failure },
    { name: 'Partial', value: data.total_partial_failures || 0, color: COLORS.partial },
    { name: 'TBD', value: data.total_tbd || 0, color: COLORS.tbd },
  ].filter(item => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: 300, mt: 2 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Total: {total.toLocaleString()} launches
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OutcomeDistributionChart;

