import { 
  List, 
  Datagrid, 
  TextField, 
  DateField, 
  BooleanField,
  Filter,
  TextInput,
  SelectInput,
  TopToolbar,
  ExportButton,
  Button,
  useNotify,
  useRefresh
} from 'react-admin';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField as MuiTextField, Button as MuiButton, CircularProgress } from '@mui/material';
import { useState } from 'react';
import SendIcon from '@mui/icons-material/Send';
import { getApiUrl } from '../config/api';

const SubscriptionFilters = (props: any) => (
  <Filter {...props}>
    <TextInput label="Search Email" source="email" alwaysOn />
    <SelectInput 
      source="is_active" 
      choices={[
        { id: 'true', name: 'Active' },
        { id: 'false', name: 'Inactive' }
      ]}
      alwaysOn
    />
    <TextInput label="Source Page" source="source_page" />
  </Filter>
);

const SendUpdateEmailButton = () => {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const notify = useNotify();
  const refresh = useRefresh();

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      notify('Please fill in both subject and message', { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${getApiUrl()}/api/subscribers/send-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject, message })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        notify(`Update email sent to ${data.stats.successful} subscribers!`, { type: 'success' });
        setOpen(false);
        setSubject('');
        setMessage('');
        refresh();
      } else {
        notify(data.error || 'Failed to send emails', { type: 'error' });
      }
    } catch (error: any) {
      notify('Error sending emails: ' + error.message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        label="Send Update Email"
        onClick={() => setOpen(true)}
        startIcon={<SendIcon />}
        sx={{ marginLeft: 1 }}
      />
      <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Update Email to All Subscribers</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <MuiTextField
              label="Subject"
              fullWidth
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
              required
            />
            <MuiTextField
              label="Message"
              fullWidth
              multiline
              rows={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              required
              placeholder="Enter your update message here. You can use HTML for formatting."
            />
            <Typography variant="body2" color="text.secondary">
              This will send an email to all active subscribers.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleSend} 
            variant="contained" 
            disabled={loading || !subject.trim() || !message.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {loading ? 'Sending...' : 'Send Email'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

const SubscriptionListActions = () => (
  <TopToolbar>
    <SendUpdateEmailButton />
    <ExportButton />
  </TopToolbar>
);

export const SubscriptionsList = () => {
  return (
    <List 
      filters={<SubscriptionFilters />}
      actions={<SubscriptionListActions />}
      perPage={50}
    >
      <Datagrid rowClick="show">
        <TextField source="email" />
        <TextField source="source_page" label="Source Page" />
        <DateField source="subscribed_at" label="Subscribed" showTime />
        <BooleanField source="is_active" label="Active" />
        <DateField source="created_at" label="Created" showTime />
      </Datagrid>
    </List>
  );
};

