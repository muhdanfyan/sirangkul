import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SectionAccordionProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const SectionAccordion: React.FC<SectionAccordionProps> = ({
  title,
  icon,
  badge,
  defaultOpen = true,
  children,
  className = '',
  contentClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        {icon && <div className="text-gray-400">{icon}</div>}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
        {badge}
        <div className="text-gray-400">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {isOpen && (
        <div className={`border-t border-gray-200 px-5 py-5 ${contentClassName}`}>
          {children}
        </div>
      )}
    </section>
  );
};

export default SectionAccordion;
