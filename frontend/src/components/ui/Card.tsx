import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          "bg-white overflow-hidden shadow rounded-lg",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          "px-4 py-5 sm:px-6 border-b border-gray-200",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge("px-4 py-5 sm:p-6", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          "px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
CardHeader.displayName = "CardHeader";
CardBody.displayName = "CardBody";
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardBody, CardFooter };
