import React from 'react';
import { Menu, MenuItemLink } from 'react-admin';
import { BarChart as BarChartIcon } from '@mui/icons-material';

const CustomMenu = (props: any) => {
  return (
    <Menu {...props}>
      {/* Launch Statistics as the main dashboard item */}
      <MenuItemLink
        to="/launch-statistics"
        primaryText="Launch Statistics"
        leftIcon={<BarChartIcon />}
      />
      {/* Automatically render all resource menu items */}
      <Menu.ResourceItems />
    </Menu>
  );
};

export default CustomMenu;

