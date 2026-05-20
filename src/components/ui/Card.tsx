import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverGlow?: boolean;
  animate?: boolean;
  glowColor?: 'purple' | 'blue' | 'indigo' | 'emerald' | 'amber';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverGlow = true,
  animate = true,
  glowColor = 'purple',
  ...props
}) => {
  const glowStyles = {
    purple: 'hover:border-purple-500/30 hover:shadow-purple-500/5',
    blue: 'hover:border-cyan-500/30 hover:shadow-cyan-500/5',
    indigo: 'hover:border-indigo-500/30 hover:shadow-indigo-500/5',
    emerald: 'hover:border-emerald-500/30 hover:shadow-emerald-500/5',
    amber: 'hover:border-amber-500/30 hover:shadow-amber-500/5',
  };

  if (animate) {
    return (
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        className={twMerge(
          clsx(
            'glass-panel rounded-2xl p-6 transition-all duration-300 relative overflow-hidden',
            hoverGlow && glowStyles[glowColor],
            className
          )
        )}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={twMerge(
        clsx(
          'glass-panel rounded-2xl p-6 transition-all duration-300 relative overflow-hidden',
          hoverGlow && glowStyles[glowColor],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={twMerge('mb-4 flex items-center justify-between', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3
    className={twMerge(
      'font-heading text-lg font-semibold tracking-tight text-[#f3f4f6] light-theme:text-gray-900',
      className
    )}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={twMerge('text-sm text-gray-400 light-theme:text-gray-500', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => <div className={twMerge('text-sm', className)} {...props}>{children}</div>;
