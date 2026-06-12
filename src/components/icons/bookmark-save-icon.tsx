export const BookmarkSaveIcon: React.FC<React.SVGAttributes<{}>> = (props) => {
  const { fill, strokeWidth = 1.5, ...restProps } = props;
  const isFilled = fill === 'currentColor' || fill === 'white' || fill === '#fff';
  
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...restProps}
    >
      {/* Квадрат */}
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill={isFilled ? "currentColor" : "none"}
      />
      {/* Стрелка вниз */}
      <path
        d="M8 12L12 16L16 12"
        stroke={isFilled ? "white" : "currentColor"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 8V16"
        stroke={isFilled ? "white" : "currentColor"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

