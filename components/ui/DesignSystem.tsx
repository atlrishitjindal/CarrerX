import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

// --- BUTTONS ---
interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  children, 
  disabled, 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/20 border border-transparent",
    secondary: "bg-white text-slate-700 hover:text-brand-700 hover:border-brand-200 border border-slate-200 shadow-sm",
    outline: "bg-transparent text-slate-600 border border-slate-300 hover:border-brand-500 hover:text-brand-600",
    ghost: "bg-transparent text-slate-600 hover:text-brand-700 hover:bg-brand-50",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300",
    link: "bg-transparent text-brand-600 underline-offset-4 hover:underline p-0 h-auto"
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3 text-base",
    xl: "px-10 py-4 text-lg"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.99 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </motion.button>
  );
};

// --- CARDS ---
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn("bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-soft transition-shadow duration-300", className)} {...props}>
    {children}
  </div>
);

// --- INPUTS ---
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      className={cn(
        "flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all disabled:bg-slate-50 disabled:text-slate-500",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

// --- TEXTAREA ---
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all disabled:bg-slate-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// --- BADGES ---
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'brand';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'neutral', children, ...props }) => {
  const variants = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
    brand: "bg-brand-50 text-brand-700 border-brand-200"
  };
  
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", variants[variant], className)} {...props}>
      {children}
    </div>
  );
};