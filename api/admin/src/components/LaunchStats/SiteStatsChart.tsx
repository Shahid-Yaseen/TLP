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

interface SiteStatsChartProps {
  data: Array<{
    site_name: string;
    site_country?: string;
    total_launches: number;
    successes: number;
    failures: number;
  }>;
  title?: string;
  limit?: number;
}

const SiteStatsChart: React.FC<SiteStatsChartProps> = ({ 
  data, 
  title = 'Launches by Launch Site',
  limit = 10
}) => {
  const chartData = data.slice(0, limit).map(item => ({
    name: item.site_name.length > 25 ? item.site_name.substring(0, 25) + '...' : item.site_name,
    fullName: item.site_name,
    country: item.site_country || 'Unknown',
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
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={140}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                formatter={(value: number) => value.toLocaleString()}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.name === label);
                  return item ? `${item.fullName} (${item.country})` : label;
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

export default SiteStatsChart;

