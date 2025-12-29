import { 
  List, Create, Edit, Show, SimpleForm, 
  TextInput, NumberInput, BooleanInput, 
  Datagrid, TextField, NumberField, BooleanField, 
  ShowButton, EditButton, DeleteButton,
  useRecordContext, FunctionField
} from 'react-admin';
import { BackButtonActions } from '../components/BackButtonActions';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

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
          <TextInput 
            source="symbol" 
            required 
            fullWidth
            label="Stock Symbol"
            helperText="e.g., RKLB, SPCE, BA"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextInput 
            source="name" 
            required 
            fullWidth
            label="Company Name"
            helperText="Full company name"
          />
        </Grid>
      </Grid>
      
      <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Price Information</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <NumberInput 
            source="price" 
            required 
            fullWidth
            min={0}
            step={0.01}
            label="Current Price"
            helperText="Current stock price in USD"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <NumberInput 
            source="change" 
            required 
            fullWidth
            step={0.01}
            label="Price Change"
            helperText="Positive for increase, negative for decrease"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <NumberInput 
            source="change_percent" 
            required 
            fullWidth
            label="Change Percentage"
            step={0.01}
            helperText="e.g., 0.03 for 0.03% or -0.03 for -0.03%"
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
          <TextInput 
            source="symbol" 
            required 
            fullWidth
            label="Stock Symbol"
            helperText="e.g., RKLB, SPCE, BA"
          />
        </Grid>
        <Grid item xs={12}>
          <TextInput 
            source="name" 
            required 
            fullWidth
            label="Company Name"
            helperText="Full company name"
          />
        </Grid>
      </Grid>
      
      <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Price Information</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <NumberInput 
            source="price" 
            required 
            fullWidth
            min={0}
            step={0.01}
            label="Current Price"
            helperText="Current stock price in USD"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <NumberInput 
            source="change" 
            required 
            fullWidth
            step={0.01}
            label="Price Change"
            helperText="Positive for increase, negative for decrease"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <NumberInput 
            source="change_percent" 
            required 
            fullWidth
            label="Change Percentage"
            step={0.01}
            helperText="e.g., 0.03 for 0.03% or -0.03 for -0.03%"
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

