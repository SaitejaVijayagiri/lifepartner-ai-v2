import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input = ({ label, className = '', ...props }: InputProps) => {
    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
            <input
                className={`flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 ${className}`}
                {...props}
            />
        </div>
    );
};
