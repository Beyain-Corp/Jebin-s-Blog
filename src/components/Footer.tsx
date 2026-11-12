import React from 'react';
import Link from 'next/link';
import { Terminal, Heart, Sparkles, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800/80 bg-zinc-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-white text-base">Jebin&apos;s Blog</span>
            </div>
            <p className="text-sm text-zinc-400 max-w-sm mb-4 leading-relaxed">
              Technical guides, architectural deep-dives, and production playbooks covering Active Directory, Windows Server, Linux Samba interoperability, and endpoint security.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Notion Database Connected
            </div>
          </div>

          {/* Quick Topics */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">Core Topics</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/category/Active%20Directory%20in%20Windows%20Server%202025" className="hover:text-cyan-400 transition-colors">
                  Windows Server 2025
                </Link>
              </li>
              <li>
                <Link href="/category/Samba4" className="hover:text-cyan-400 transition-colors">
                  Linux Samba4 AD
                </Link>
              </li>
              <li>
                <Link href="/category/GPMC" className="hover:text-cyan-400 transition-colors">
                  Group Policy &amp; Security
                </Link>
              </li>
              <li>
                <Link href="/category/Integration" className="hover:text-cyan-400 transition-colors">
                  Enterprise Integration
                </Link>
              </li>
            </ul>
          </div>

          {/* Stack Info */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">Built With</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                <span>Notion Database API</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                <span>Next.js 16 (App Router)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                <span>Tailwind CSS</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                <span>TypeScript</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Jebin. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" /> &amp; synced from Notion
          </p>
        </div>
      </div>
    </footer>
  );
}

