export const PlusCircleIcon: React.FC<React.SVGAttributes<{}>> = ({
  className = '',
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      className={className}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="11"
        fill="currentColor"
      />
      <path
        d="M17 12h-5m0 0H7m5 0V7m0 5v5"
        stroke="#131313"
        strokeLinecap="round"
        strokeWidth="2.5"
        fill="none"
      />
    </svg>
  );
};

