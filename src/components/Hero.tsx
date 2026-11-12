import React from 'react';
import { Terminal, Shield, Cpu, Server, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-8">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto text-center space-y-6">
        {/* Author badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Jebin&apos;s Engineering Notes</span>
          <span className="text-zinc-600">•</span>
          <span className="text-indigo-400">Enterprise Systems &amp; Security</span>
        </div>

        {/* Hero headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
          Architecting Enterprise{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Infrastructure &amp; Identity
          </span>
        </h1>

        {/* Description */}
        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Comprehensive step-by-step guides, operational playbooks, and configuration benchmarks for Windows Server 2025, Samba4 Active Directory, Group Policy restrictions, and enterprise toolchains.
        </p>

        {/* Key Competencies Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Directory &amp; Domain Controllers</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Linux Samba4 Interop</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>GPMC &amp; Endpoint Hardening</span>
          </div>
        </div>
      </div>
    </section>
  );
}

