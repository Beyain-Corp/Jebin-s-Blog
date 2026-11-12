/**
 * Pure client-safe utility functions
 */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function getNotionColorStyles(color?: string): string {
  switch (color) {
    case 'blue':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'green':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'red':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'purple':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'yellow':
    case 'orange':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'pink':
      return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
    case 'brown':
      return 'bg-stone-500/10 text-stone-300 border-stone-500/20';
    case 'gray':
    default:
      return 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50';
  }
}

