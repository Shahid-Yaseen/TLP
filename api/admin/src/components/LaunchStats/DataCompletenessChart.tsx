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

interface DataCompletenessChartProps {
  data: {
    total_launches: number;
    has_raw_data?: number;
    has_status_json?: number;
    has_rocket_json?: number;
    has_mission_json?: number;
    has_pad_json?: number;
    has_image_json?: number;
    has_external_id?: number;
    has_slug?: number;
    has_details?: number;
    has_mission_description?: number;
  };
  title?: string;
}

const DataCompletenessChart: React.FC<DataCompletenessChartProps> = ({ 
  data,
  title = 'Data Completeness Metrics'
}) => {
  const total = data.total_launches || 1;
  
  const chartData = [
    { 
      name: 'Raw Data', 
      count: data.has_raw_data || 0, 
      percentage: ((data.has_raw_data || 0) / total * 100).toFixed(1) 
    },
    { 
      name: 'Status JSON', 
      count: data.has_status_json || 0, 
      percentage: ((data.has_status_json || 0) / total * 100).toFixed(1) 
    },
    { 
      name: 'Rocket JSON', 
      count: data.has_rocket_json || 0, 
      percentage: ((data.has_rocket_json || 0) / total * 100).toFixed(1) 
    },
    { 
      name: 'Mission JSON', 
      count: data.has_mission_json || 0, 
      percentage: ((data.has_mission_json || 0) / total * 100).toFixed(1) 
    },
    { 
      name: 'Pad JSON', 
      count: data.has_pad_json || 0, 
      percentage: ((data.has_pad_json || 0) / total * 100).toFixed(1) 
    },
    { 
      name: 'Image JSON', 
      count: data.has_image_json || 0, 
      percentage: ((data.has_image_json || 0) / total * 100).toFixed(1) 
    },
    { 
      name: 'External ID', 
      count: data.has_external_id || 0, 
      percentage: ((data.has_external_id || 0) / total * 100).toFixed(1) 
    },
    { 
      name: 'Slug', 
      count: data.has_slug || 0, 
      percentage: ((data.has_slug || 0) / total * 100).toFixed(1) 
    },
    { 
      name: 'Details', 
      count: data.has_details || 0, 
      percentage: ((data.has_details || 0) / total * 100).toFixed(1) 
    },
    { 
      name: 'Mission Description', 
      count: data.has_mission_description || 0, 
      percentage: ((data.has_mission_description || 0) / total * 100).toFixed(1) 
    },
  ];

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
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={140}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Completion']}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.name === label);
                  return item ? `${label} (${item.count}/${total})` : label;
                }}
              />
              <Legend />
              <Bar 
                dataKey="percentage" 
                fill="#1976d2" 
                name="Completion %"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Total Launches: {total.toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DataCompletenessChart;

