'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export function Modal({ isOpen, onClose, title, description, children, footer, className }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={cn(
                    "bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200",
                    className
                )}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
