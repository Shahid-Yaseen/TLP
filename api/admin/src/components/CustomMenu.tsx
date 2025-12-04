import React from 'react';
import { Menu, MenuItemLink } from 'react-admin';
import { BarChart as BarChartIcon, Map as MapIcon } from '@mui/icons-material';

const CustomMenu = (props: any) => {
  return (
    <Menu {...props}>
      {/* Launch Statistics as the main dashboard item */}
      <MenuItemLink
        to="/launch-statistics"
        primaryText="Launch Statistics"
        leftIcon={<BarChartIcon />}
      />
      <MenuItemLink
        to="/crew-map"
        primaryText="Crew Location Map"
        leftIcon={<MapIcon />}
      />
      {/* Automatically render all resource menu items */}
      <Menu.ResourceItems />
    </Menu>
  );
};

export default CustomMenu;

