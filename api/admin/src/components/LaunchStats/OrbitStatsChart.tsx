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

interface OrbitStatsChartProps {
  data: Array<{
    orbit_code: string;
    orbit_name?: string;
    total_launches: number;
    successes: number;
    failures: number;
  }>;
  title?: string;
}

const OrbitStatsChart: React.FC<OrbitStatsChartProps> = ({ 
  data, 
  title = 'Launches by Orbit Type'
}) => {
  const chartData = data.map(item => ({
    name: item.orbit_code,
    fullName: item.orbit_name || item.orbit_code,
    total: item.total_launches,
    successes: item.successes,
    failures: item.failures
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
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => value.toLocaleString()}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.name === label);
                  return item ? item.fullName : label;
                }}
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

export default OrbitStatsChart;

