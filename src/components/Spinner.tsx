import React from "react";

interface SpinnerProps {
  size?: "small" | "medium" | "large";
  overlay?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = "medium",
  overlay = false,
}) => {
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12",
    large: "w-16 h-16",
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} border-4 border-purple-500 border-t-transparent rounded-full animate-spin`}
    />
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center py-16">
      {spinner}
    </div>
  );
};

export default Spinner;
