import React from 'react';

export const MenuDotsHorizontalIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <svg
    viewBox="0 0 20 20"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="5" cy="10" r="2" />
    <circle cx="10" cy="10" r="2" />
    <circle cx="15" cy="10" r="2" />
  </svg>
);

export default MenuDotsHorizontalIcon; 