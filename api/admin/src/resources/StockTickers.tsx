import {
  List, Create, Edit, Show, SimpleForm,
  TextInput, NumberInput, BooleanInput,
  Datagrid, TextField, NumberField,
  ShowButton, EditButton, DeleteButton,
  useRecordContext, FunctionField
} from 'react-admin';
import { BackButtonActions } from '../components/BackButtonActions';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getApiUrl } from '../config/api';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNotify, useDataProvider, SelectInput, required } from 'react-admin';
import { useFormContext } from 'react-hook-form';
import { Button } from '@mui/material';

const SPACE_STOCKS = [
  { id: 'RKLB', name: 'Rocket Lab USA, Inc.', symbol: 'RKLB' },
  { id: 'LUNR', name: 'Intuitive Machines, Inc.', symbol: 'LUNR' },
  { id: 'PL', name: 'Planet Labs PBC', symbol: 'PL' },
  { id: 'SPIR', name: 'Spire Global, Inc.', symbol: 'SPIR' },
  { id: 'SPCE', name: 'Virgin Galactic Holdings, Inc.', symbol: 'SPCE' },
  { id: 'ASTR', name: 'Astra Space, Inc.', symbol: 'ASTR' },
  { id: 'ASTS', name: 'AST SpaceMobile, Inc.', symbol: 'ASTS' },
  { id: 'RDW', name: 'Redwire Corporation', symbol: 'RDW' },
  { id: 'LLAP', name: 'Terran Orbital Corporation', symbol: 'LLAP' },
  { id: 'BKSY', name: 'BlackSky Technology Inc.', symbol: 'BKSY' },
  { id: 'SATL', name: 'Satellogic Inc.', symbol: 'SATL' },
  { id: 'MNTS', name: 'Momentus Inc.', symbol: 'MNTS' },
  { id: 'SIDU', name: 'Sidus Space, Inc.', symbol: 'SIDU' },
  { id: 'VSAT', name: 'Viasat, Inc.', symbol: 'VSAT' },
  { id: 'BA', name: 'The Boeing Company', symbol: 'BA' },
  { id: 'LMT', name: 'Lockheed Martin Corporation', symbol: 'LMT' },
  { id: 'NOC', name: 'Northrop Grumman Corporation', symbol: 'NOC' },
  { id: 'LHX', name: 'L3Harris Technologies, Inc.', symbol: 'LHX' },
  { id: 'SATS', name: 'EchoStar Corporation', symbol: 'SATS' },
];

const AutoPullButton = ({ symbolSource = 'symbol' }: { symbolSource?: string }) => {
  const notify = useNotify();
  const { setValue, watch } = useFormContext();
  const symbol = watch(symbolSource);

  const handleFetch = async () => {
    if (!symbol) {
      notify('Please enter a symbol first', { type: 'warning' });
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${getApiUrl()}/api/stock-tickers/quote/${symbol}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch quote');

      const data = await response.json();
      setValue('name', data.name, { shouldDirty: true });
      setValue('price', data.price, { shouldDirty: true });
      setValue('change', data.change, { shouldDirty: true });
      setValue('change_percent', data.change_percent, { shouldDirty: true });
      if (data.exchange) setValue('exchange', data.exchange, { shouldDirty: true });

      notify('Successfully pulled stock data', { type: 'success' });
    } catch (error) {
      notify('Error pulling stock data: ' + (error as Error).message, { type: 'error' });
    }
  };

  return (
    <Button
      variant="outlined"
      color="primary"
      size="small"
      onClick={handleFetch}
      startIcon={<RefreshIcon />}
      sx={{ mt: 1 }}
    >
      Auto-Pull Data
    </Button>
  );
};

export const StockTickerList = (props: any) => {
  const theme = useTheme();

  return (
    <List {...props} sort={{ field: 'display_order', order: 'ASC' }}>
      <Datagrid rowClick="show" sx={{
        '& .RaDatagrid-headerCell': {
          fontWeight: 600,
          backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
        }
      }}>
        <NumberField source="id" label="ID" />
        <TextField
          source="symbol"
          label="Symbol"
          sx={{ fontWeight: 600 }}
        />
        <TextField source="name" label="Company Name" />
        <FunctionField
          source="price"
          label="Price"
          render={(record: any) => {
            const price = parseFloat(record.price) || 0;
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(price);
          }}
        />
        <FunctionField
          source="change"
          label="Change"
          render={(record: any) => {
            const change = parseFloat(record.change) || 0;
            const isPositive = change >= 0;
            const formatted = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
              signDisplay: 'always'
            }).format(change);

            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isPositive ? (
                  <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: '#f44336', fontSize: 18 }} />
                )}
                <Typography
                  component="span"
                  sx={{
                    color: isPositive ? '#4caf50' : '#f44336',
                    fontWeight: 600
                  }}
                >
                  {formatted}
                </Typography>
              </Box>
            );
          }}
        />
        <FunctionField
          source="change_percent"
          label="Change %"
          render={(record: any) => {
            const changePercent = parseFloat(record.change_percent) || 0;
            const isPositive = changePercent >= 0;
            const formatted = new Intl.NumberFormat('en-US', {
              style: 'percent',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
              signDisplay: 'always'
            }).format(changePercent / 100);

            return (
              <Typography
                component="span"
                sx={{
                  color: isPositive ? '#4caf50' : '#f44336',
                  fontWeight: 600
                }}
              >
                {formatted}
              </Typography>
            );
          }}
        />
        <TextField source="exchange" label="Exchange" />
        <FunctionField
          source="is_active"
          label="Status"
          render={(record: any) => (
            <Chip
              icon={record.is_active ? <CheckCircleIcon /> : <CancelIcon />}
              label={record.is_active ? 'Active' : 'Inactive'}
              color={record.is_active ? 'success' : 'default'}
              size="small"
              sx={{ fontWeight: 500 }}
            />
          )}
        />
        <NumberField source="display_order" label="Order" />
        <ShowButton />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export const StockTickerCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="stock_tickers" />}>
    <SimpleForm>
      <Typography variant="h6" sx={{ mb: 2, mt: 1 }}>Basic Information</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <SelectInput
            source="symbol"
            choices={SPACE_STOCKS}
            label="Select Company"
            validate={[required()]}
            fullWidth
          />
          <AutoPullButton />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextInput
            source="name"
            validate={[required()]}
            fullWidth
            label="Company Name"
            helperText="Auto-filled from API"
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Price Information (Auto-filled)</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <NumberInput
            source="price"
            fullWidth
            readOnly
            label="Current Price (USD)"
            helperText="Pulled from API"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <NumberInput
            source="change"
            fullWidth
            readOnly
            label="Price Change"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <NumberInput
            source="change_percent"
            fullWidth
            readOnly
            label="Change Percentage (%)"
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Display Settings</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextInput
            source="exchange"
            defaultValue="NASDAQ"
            fullWidth
            label="Stock Exchange"
            helperText="e.g., NASDAQ, NYSE, AMEX"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <BooleanInput
            source="is_active"
            defaultValue={true}
            label="Active"
            helperText="Show on frontend"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <NumberInput
            source="display_order"
            defaultValue={0}
            fullWidth
            label="Display Order"
            helperText="Lower numbers appear first"
          />
        </Grid>
      </Grid>
    </SimpleForm>
  </Create>
);

export const StockTickerEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="stock_tickers" />}>
    <SimpleForm>
      <Typography variant="h6" sx={{ mb: 2, mt: 1 }}>Basic Information</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <NumberInput source="id" disabled label="ID" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <SelectInput
            source="symbol"
            choices={SPACE_STOCKS}
            label="Stock Symbol"
            validate={[required()]}
            fullWidth
          />
          <AutoPullButton />
        </Grid>
        <Grid item xs={12}>
          <TextInput
            source="name"
            validate={[required()]}
            fullWidth
            label="Company Name"
            helperText="Auto-filled from API"
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Price Information (Auto-filled)</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <NumberInput
            source="price"
            fullWidth
            readOnly
            label="Current Price (USD)"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <NumberInput
            source="change"
            fullWidth
            readOnly
            label="Price Change"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <NumberInput
            source="change_percent"
            fullWidth
            readOnly
            label="Change Percentage (%)"
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Display Settings</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextInput
            source="exchange"
            fullWidth
            label="Stock Exchange"
            helperText="e.g., NASDAQ, NYSE, AMEX"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <BooleanInput
            source="is_active"
            label="Active"
            helperText="Show on frontend"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <NumberInput
            source="display_order"
            fullWidth
            label="Display Order"
            helperText="Lower numbers appear first"
          />
        </Grid>
      </Grid>
    </SimpleForm>
  </Edit>
);

const StockTickerTitle = () => {
  const record = useRecordContext();
  return record ? (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="h5" component="span" sx={{ fontWeight: 600 }}>
        {record.symbol}
      </Typography>
      <Typography variant="body1" component="span" sx={{ color: 'text.secondary' }}>
        {record.name}
      </Typography>
    </Box>
  ) : null;
};

export const StockTickerShow = (props: any) => {
  const theme = useTheme();
  const isDark = theme?.palette?.mode === 'dark' || false;
  const bgCard = isDark ? '#2a2a2a' : '#ffffff';
  const borderColor = isDark ? '#404040' : '#e0e0e0';
  const textPrimary = isDark ? '#e0e0e0' : '#1a1a1a';
  const textSecondary = isDark ? '#b0b0b0' : '#666';

  return (
    <Show {...props} title={<StockTickerTitle />} actions={<BackButtonActions resource="stock_tickers" showActions />}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: textPrimary }}>
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>
                  ID
                </Typography>
                <FunctionField
                  source="id"
                  render={(record: any) => (
                    <Typography variant="body1" sx={{ color: textPrimary, fontWeight: 500, mt: 0.5 }}>
                      {record.id}
                    </Typography>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Symbol
                </Typography>
                <FunctionField
                  source="symbol"
                  render={(record: any) => (
                    <Typography variant="body1" sx={{ color: textPrimary, fontWeight: 600, fontSize: '1.2rem', mt: 0.5 }}>
                      {record.symbol}
                    </Typography>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Company Name
                </Typography>
                <FunctionField
                  source="name"
                  render={(record: any) => (
                    <Typography variant="body1" sx={{ color: textPrimary, fontWeight: 500, mt: 0.5 }}>
                      {record.name}
                    </Typography>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Exchange
                </Typography>
                <FunctionField
                  source="exchange"
                  render={(record: any) => (
                    <Typography variant="body1" sx={{ color: textPrimary, fontWeight: 500, mt: 0.5 }}>
                      {record.exchange || 'N/A'}
                    </Typography>
                  )}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: textPrimary }}>
              Price Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Current Price
                </Typography>
                <FunctionField
                  source="price"
                  render={(record: any) => {
                    const price = parseFloat(record.price) || 0;
                    return (
                      <Typography variant="h5" sx={{ color: textPrimary, fontWeight: 700, mt: 0.5 }}>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }).format(price)}
                      </Typography>
                    );
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Change
                </Typography>
                <FunctionField
                  source="change"
                  render={(record: any) => {
                    const change = parseFloat(record.change) || 0;
                    const isPositive = change >= 0;
                    const formatted = new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                      signDisplay: 'always'
                    }).format(change);

                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        {isPositive ? (
                          <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                        ) : (
                          <TrendingDownIcon sx={{ color: '#f44336', fontSize: 20 }} />
                        )}
                        <Typography
                          variant="h6"
                          component="span"
                          sx={{
                            color: isPositive ? '#4caf50' : '#f44336',
                            fontWeight: 700
                          }}
                        >
                          {formatted}
                        </Typography>
                      </Box>
                    );
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Change %
                </Typography>
                <FunctionField
                  source="change_percent"
                  render={(record: any) => {
                    const changePercent = parseFloat(record.change_percent) || 0;
                    const isPositive = changePercent >= 0;
                    const formatted = new Intl.NumberFormat('en-US', {
                      style: 'percent',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                      signDisplay: 'always'
                    }).format(changePercent / 100);

                    return (
                      <Typography
                        variant="h6"
                        component="span"
                        sx={{
                          color: isPositive ? '#4caf50' : '#f44336',
                          fontWeight: 700,
                          mt: 0.5,
                          display: 'block'
                        }}
                      >
                        {formatted}
                      </Typography>
                    );
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: textPrimary }}>
              Display Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Status
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <FunctionField
                    source="is_active"
                    render={(record: any) => (
                      <Chip
                        icon={record.is_active ? <CheckCircleIcon /> : <CancelIcon />}
                        label={record.is_active ? 'Active' : 'Inactive'}
                        color={record.is_active ? 'success' : 'default'}
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Display Order
                </Typography>
                <FunctionField
                  source="display_order"
                  render={(record: any) => (
                    <Typography variant="body1" sx={{ color: textPrimary, fontWeight: 500, mt: 0.5 }}>
                      {record.display_order ?? 0}
                    </Typography>
                  )}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Show>
  );
};

