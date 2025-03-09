import React from "react";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
