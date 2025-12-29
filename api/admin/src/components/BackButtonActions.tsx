import { TopToolbar, useRedirect, ShowActions } from 'react-admin';
import { IconButton, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface BackButtonActionsProps {
  resource: string;
  showActions?: boolean;
  children?: React.ReactNode;
}

export const BackButtonActions = ({ resource, showActions, children }: BackButtonActionsProps) => {
  const redirect = useRedirect();
  
  return (
    <TopToolbar sx={{ position: 'relative', justifyContent: 'space-between', pl: 0 }}>
      <IconButton
        onClick={() => redirect(`/${resource}`)}
        sx={{ 
          position: 'absolute',
          left: 0,
          ml: 0,
          zIndex: 1
        }}
        aria-label={`Back to ${resource} list`}
      >
        <ArrowBackIcon />
      </IconButton>
      <Box sx={{ flex: 1 }} />
      {showActions && <ShowActions />}
      {children}
    </TopToolbar>
  );
};

