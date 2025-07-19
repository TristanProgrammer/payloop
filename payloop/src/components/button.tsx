import * as React from "react";

export const Button = ({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={`bg-black text-white py-2 px-4 rounded-md hover:opacity-90 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
