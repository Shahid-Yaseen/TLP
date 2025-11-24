import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TimelineTrendsChartProps {
  data: Array<{
    month: string;
    year: number;
    month_num: number;
    launches: number;
    previous_month_launches?: number;
    growth_percentage?: number;
  }>;
  title?: string;
}

const TimelineTrendsChart: React.FC<TimelineTrendsChartProps> = ({ 
  data, 
  title = 'Launch Timeline Trends with Growth'
}) => {
  const formatMonth = (month: string) => {
    if (!month) return '';
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: 300, mt: 2 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month"
                tickFormatter={formatMonth}
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'growth_percentage') {
                    return [`${value > 0 ? '+' : ''}${value}%`, 'Growth'];
                  }
                  return [value.toLocaleString(), name === 'launches' ? 'Launches' : 'Previous Month'];
                }}
                labelFormatter={(label) => `Month: ${formatMonth(label)}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="launches" 
                stroke="#1976d2" 
                strokeWidth={2}
                name="Launches"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="previous_month_launches" 
                stroke="#757575" 
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Previous Month"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
        {data.length > 0 && data[0].growth_percentage !== null && data[0].growth_percentage !== undefined && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Latest Growth: {data[0].growth_percentage > 0 ? '+' : ''}{data[0].growth_percentage}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineTrendsChart;

