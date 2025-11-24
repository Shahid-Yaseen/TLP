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

interface LaunchCountChartProps {
  data: Array<{
    year?: number;
    month?: string;
    total_launches: number;
    successes?: number;
    failures?: number;
  }>;
  title?: string;
  type?: 'year' | 'month';
}

const LaunchCountChart: React.FC<LaunchCountChartProps> = ({ 
  data, 
  title = 'Launch Count Over Time',
  type = 'year'
}) => {
  const formatXAxis = (value: any) => {
    if (type === 'month' && typeof value === 'string') {
      return value.substring(5); // Show just MM from YYYY-MM
    }
    return value;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: 300, mt: 2 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={type === 'year' ? 'year' : 'month'}
                tickFormatter={formatXAxis}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total_launches" 
                stroke="#1976d2" 
                strokeWidth={2}
                name="Total Launches"
              />
              {data[0]?.successes !== undefined && (
                <Line 
                  type="monotone" 
                  dataKey="successes" 
                  stroke="#2e7d32" 
                  strokeWidth={2}
                  name="Successful"
                />
              )}
              {data[0]?.failures !== undefined && (
                <Line 
                  type="monotone" 
                  dataKey="failures" 
                  stroke="#d32f2f" 
                  strokeWidth={2}
                  name="Failed"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LaunchCountChart;

