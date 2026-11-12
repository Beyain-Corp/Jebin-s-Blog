'use client';

import React, { useEffect, useState } from 'react';
import { TocHeading } from '@/types/blog';
import { ListFilter, ChevronRight } from 'lucide-react';

interface TableOfContentsProps {
  headings: TocHeading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (!headings || headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '0px 0px -70% 0px',
        threshold: 0.1,
      }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (!headings || headings.length === 0) return null;

  return (
    <nav className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm space-y-4">
      <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 pb-2 border-b border-zinc-800">
        <ListFilter className="w-3.5 h-3.5 text-cyan-400" />
        <span>Table of Contents</span>
      </div>

      <ul className="space-y-1.5 text-xs">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          const indentClass =
            heading.level === 3 ? 'pl-6' : heading.level === 2 ? 'pl-3' : 'pl-0';

          return (
            <li key={heading.id} className={indentClass}>
              <a
                href={`#${heading.id}`}
                className={`group flex items-start gap-1.5 py-1 transition-all ${
                  isActive
                    ? 'text-cyan-400 font-semibold translate-x-1'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ChevronRight
                  className={`w-3 h-3 mt-0.5 flex-shrink-0 transition-transform ${
                    isActive ? 'text-cyan-400 rotate-90' : 'text-zinc-600 group-hover:text-zinc-400'
                  }`}
                />
                <span className="line-clamp-2 leading-snug">{heading.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

