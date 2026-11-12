import React from "react";

export const Select = ({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
    {...props}
  >
    {children}
  </select>
);

export const SelectTrigger = ({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex items-center ${className}`} {...props}>
    {children}
  </div>
);

export const SelectContent = ({
  children,
}: {
  children: React.ReactNode;
}) => <>{children}</>;

export const SelectItem = ({
  children,
  ...props
}: React.OptionHTMLAttributes<HTMLOptionElement>) => (
  <option {...props}>{children}</option>
);