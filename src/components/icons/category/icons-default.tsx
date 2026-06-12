import React from 'react';

export const CategoryDefault: React.FC<React.SVGAttributes<{}>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width="24"
    height="24"
    {...props}
  >
    <path d="M10 3H5c-1.1 0-2 .9-2 2v5h7V3zM21 10V5c0-1.1-.9-2-2-2h-5v7h7zM3 19c0 1.1.9 2 2 2h5v-7H3v5zM14 21h5c1.1 0 2-.9 2-2v-5h-7v7z" />
  </svg>
);


