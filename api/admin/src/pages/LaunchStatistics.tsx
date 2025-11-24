import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  RocketLaunch,
  CheckCircle,
  Cancel,
  Schedule,
  TrendingUp
} from '@mui/icons-material';
import { fetchLaunchStatistics } from '../dataProvider';
import StatCard from '../components/LaunchStats/StatCard';
import LaunchCountChart from '../components/LaunchStats/LaunchCountChart';
import OutcomeDistributionChart from '../components/LaunchStats/OutcomeDistributionChart';
import ProviderStatsChart from '../components/LaunchStats/ProviderStatsChart';
import RocketStatsChart from '../components/LaunchStats/RocketStatsChart';
import SiteStatsChart from '../components/LaunchStats/SiteStatsChart';
import OrbitStatsChart from '../components/LaunchStats/OrbitStatsChart';
import DataCompletenessChart from '../components/LaunchStats/DataCompletenessChart';
import TimelineTrendsChart from '../components/LaunchStats/TimelineTrendsChart';

const LaunchStatistics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await fetchLaunchStatistics();
        setData(stats);
      } catch (err: any) {
        setError(err.message || 'Failed to load statistics');
        console.error('Error loading statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">No statistics data available</Alert>
      </Container>
    );
  }

  const overall = data.overall || {};
  const successRate = typeof overall.success_rate === 'string' 
    ? parseFloat(overall.success_rate) 
    : (overall.success_rate || 0);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Launch Statistics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Comprehensive analysis of launch data from the database
        </Typography>
        {data.generated_at && (
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date(data.generated_at).toLocaleString()}
          </Typography>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Launches"
            value={overall.total_launches || 0}
            icon={<RocketLaunch />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Success Rate"
            value={`${successRate.toFixed(1)}%`}
            subtitle={`${overall.total_successes || 0} successful`}
            icon={<CheckCircle />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Failed Launches"
            value={overall.total_failures || 0}
            icon={<Cancel />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Launches"
            value={data.date_range?.upcoming_launches || 0}
            subtitle="Scheduled for future"
            icon={<Schedule />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Additional Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Last 7 Days"
            value={overall.launches_last_7_days || 0}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Last 30 Days"
            value={overall.launches_last_30_days || 0}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Featured Launches"
            value={overall.featured_launches || 0}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="With Raw Data"
            value={overall.launches_with_raw_data || 0}
            subtitle={`${overall.total_launches ? ((overall.launches_with_raw_data / overall.total_launches) * 100).toFixed(1) : 0}% coverage`}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={4}>
        {/* Launch Count Over Time */}
        <Grid item xs={12} md={6}>
          <LaunchCountChart
            data={data.by_year || []}
            title="Launches by Year"
            type="year"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <LaunchCountChart
            data={data.by_month || []}
            title="Launches by Month (Last 12 Months)"
            type="month"
          />
        </Grid>

        {/* Outcome Distribution */}
        <Grid item xs={12} md={6}>
          <OutcomeDistributionChart
            data={overall}
            title="Launch Outcome Distribution"
          />
        </Grid>

        {/* Timeline Trends */}
        <Grid item xs={12} md={6}>
          <TimelineTrendsChart
            data={data.timeline_trends || []}
            title="Monthly Launch Trends with Growth"
          />
        </Grid>

        {/* Provider Statistics */}
        <Grid item xs={12}>
          <ProviderStatsChart
            data={data.by_provider || []}
            title="Top 10 Providers by Launch Count"
            limit={10}
          />
        </Grid>

        {/* Rocket Statistics */}
        <Grid item xs={12}>
          <RocketStatsChart
            data={data.by_rocket || []}
            title="Top 10 Rockets by Launch Count"
            limit={10}
          />
        </Grid>

        {/* Site Statistics */}
        <Grid item xs={12} md={6}>
          <SiteStatsChart
            data={data.by_site || []}
            title="Top 10 Launch Sites"
            limit={10}
          />
        </Grid>

        {/* Orbit Statistics */}
        <Grid item xs={12} md={6}>
          <OrbitStatsChart
            data={data.by_orbit || []}
            title="Launches by Orbit Type"
          />
        </Grid>

        {/* Data Completeness */}
        <Grid item xs={12}>
          <DataCompletenessChart
            data={data.data_completeness || {}}
            title="Data Completeness Metrics"
          />
        </Grid>
      </Grid>

      {/* Detailed Statistics Tables */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom fontWeight="bold" mt={4} mb={2}>
          Detailed Breakdowns
        </Typography>

        {/* Provider Breakdown Table */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Provider Statistics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Provider</TableCell>
                    <TableCell align="right">Total Launches</TableCell>
                    <TableCell align="right">Successful</TableCell>
                    <TableCell align="right">Failed</TableCell>
                    <TableCell align="right">Success Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.by_provider || []).map((provider: any) => (
                    <TableRow key={provider.id}>
                      <TableCell>{provider.provider_name}</TableCell>
                      <TableCell align="right">{provider.total_launches}</TableCell>
                      <TableCell align="right">
                        <Chip label={provider.successes} size="small" color="success" />
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={provider.failures} size="small" color="error" />
                      </TableCell>
                      <TableCell align="right">
                        {provider.success_rate ? `${provider.success_rate}%` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {/* Rocket Breakdown Table */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Rocket Statistics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rocket</TableCell>
                    <TableCell align="right">Total Launches</TableCell>
                    <TableCell align="right">Successful</TableCell>
                    <TableCell align="right">Failed</TableCell>
                    <TableCell align="right">Success Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.by_rocket || []).slice(0, 20).map((rocket: any) => (
                    <TableRow key={rocket.id}>
                      <TableCell>{rocket.rocket_name}</TableCell>
                      <TableCell align="right">{rocket.total_launches}</TableCell>
                      <TableCell align="right">
                        <Chip label={rocket.successes} size="small" color="success" />
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={rocket.failures} size="small" color="error" />
                      </TableCell>
                      <TableCell align="right">
                        {rocket.success_rate ? `${rocket.success_rate}%` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {/* Status Distribution Table */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Status Distribution</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.status_distribution || []).map((status: any, index: number) => {
                    const percentage = overall.total_launches 
                      ? ((status.count / overall.total_launches) * 100).toFixed(1)
                      : '0';
                    return (
                      <TableRow key={status.id || index}>
                        <TableCell>
                          {status.status_name || status.status_abbrev || 'Unknown'}
                        </TableCell>
                        <TableCell align="right">{status.count}</TableCell>
                        <TableCell align="right">{percentage}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Explanations Section */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom fontWeight="bold" mt={4} mb={2}>
          Understanding the Statistics
        </Typography>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Overall Metrics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              <strong>Total Launches:</strong> The complete count of all launch records in the database, 
              including historical, upcoming, and scheduled launches.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Success Rate:</strong> Calculated as the percentage of successful launches out of 
              all launches with a known outcome (success, failure, or partial). This metric excludes 
              launches marked as "TBD" (To Be Determined).
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Raw Data Coverage:</strong> Indicates how many launches have complete API response 
              data stored in the raw_data JSONB column. Higher coverage means more detailed information 
              is available for analysis.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Time-Based Statistics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              <strong>Launches by Year/Month:</strong> Shows the distribution of launches over time, 
              helping identify trends, seasonal patterns, and growth in launch frequency. The line charts 
              display both total launches and breakdowns by outcome (successful vs failed).
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Timeline Trends:</strong> Includes month-over-month growth percentages, showing 
              whether launch activity is increasing or decreasing. Positive growth indicates an expanding 
              launch cadence.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Provider & Rocket Statistics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              <strong>Provider Statistics:</strong> Breaks down launches by launch service provider 
              (e.g., SpaceX, NASA, Roscosmos). Shows total launches, success rates, and failure counts 
              for each provider, helping identify the most active and reliable providers.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Rocket Statistics:</strong> Analyzes launches by specific rocket models. This helps 
              identify which rockets are most frequently used and their reliability rates. Rockets with 
              high launch counts and high success rates are considered proven and reliable.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Launch Sites & Orbits</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              <strong>Launch Sites:</strong> Shows which launch facilities are most active. This can 
              reveal geographic patterns in space activity and identify key spaceports around the world.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Orbit Types:</strong> Breaks down launches by their target orbit (LEO, GEO, SSO, etc.). 
              This helps understand mission types and the distribution of different orbital destinations.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Data Completeness</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              <strong>Data Completeness Metrics:</strong> Measures how complete the launch records are. 
              Each bar shows the percentage of launches that have data for specific fields:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li><strong>Raw Data:</strong> Complete API response stored as JSONB</li>
              <li><strong>Status JSON:</strong> Launch status information</li>
              <li><strong>Rocket JSON:</strong> Rocket configuration and details</li>
              <li><strong>Mission JSON:</strong> Mission objectives and payload information</li>
              <li><strong>Pad JSON:</strong> Launch pad details and location</li>
              <li><strong>Image JSON:</strong> Mission images and media</li>
              <li><strong>External ID:</strong> Unique identifier from source API</li>
              <li><strong>Slug:</strong> URL-friendly identifier</li>
            </Typography>
            <Typography variant="body2" paragraph sx={{ mt: 2 }}>
              Higher completeness percentages indicate better data quality and more detailed records 
              available for analysis and display.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Container>
  );
};

export default LaunchStatistics;

