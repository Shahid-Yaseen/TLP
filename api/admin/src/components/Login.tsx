import { useState } from 'react';
import { useLogin, useNotify } from 'react-admin';
import { Box, Card, CardContent, TextField, Button, Typography } from '@mui/material';

export const Login = () => {
  const login = useLogin();
  const notify = useNotify();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      notify('Login successful', { type: 'success' });
    } catch (err: any) {
      const errorMessage = err.message || 'Invalid email or password';
      setError(errorMessage);
      notify(errorMessage, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
      }}
    >
      <Card sx={{ minWidth: 400, maxWidth: 500 }}>
        <CardContent sx={{ padding: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3, fontWeight: 'bold' }}>
            TLP Platform Admin
          </Typography>
          
          {error && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                bgcolor: 'error.light',
                color: 'error.contrastText',
                borderRadius: 1,
              }}
            >
              {error}
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
