import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface RocketStatsChartProps {
  data: Array<{
    rocket_name: string;
    total_launches: number;
    successes: number;
    failures: number;
    success_rate?: number;
  }>;
  title?: string;
  limit?: number;
}

const RocketStatsChart: React.FC<RocketStatsChartProps> = ({ 
  data, 
  title = 'Launches by Rocket',
  limit = 10
}) => {
  const chartData = data.slice(0, limit).map(item => ({
    name: item.rocket_name.length > 20 ? item.rocket_name.substring(0, 20) + '...' : item.rocket_name,
    fullName: item.rocket_name,
    total: item.total_launches,
    successes: item.successes,
    failures: item.failures,
    successRate: item.success_rate || 0
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: 400, mt: 2 }}>
          <ResponsiveContainer>
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={110}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'successRate') {
                    return [`${value.toFixed(1)}%`, 'Success Rate'];
                  }
                  return [value.toLocaleString(), name === 'total' ? 'Total' : name === 'successes' ? 'Successful' : 'Failed'];
                }}
                labelFormatter={(label) => `Rocket: ${chartData.find(d => d.name === label)?.fullName || label}`}
              />
              <Legend />
              <Bar dataKey="total" fill="#1976d2" name="Total Launches" />
              <Bar dataKey="successes" fill="#2e7d32" name="Successful" />
              <Bar dataKey="failures" fill="#d32f2f" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RocketStatsChart;

