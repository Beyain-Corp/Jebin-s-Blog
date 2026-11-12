'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { NotionBlock, RichTextItem } from '@/types/blog';
import { Copy, Check, Terminal, ExternalLink, Hash, Info, AlertTriangle, Lightbulb } from 'lucide-react';
import { slugify } from '@/lib/utils';

interface NotionRendererProps {
  blocks: NotionBlock[];
}

/**
 * Rich Text Formatter with support for bold, italic, underline, code, color, links
 */
export function RenderRichText({ richText }: { richText: RichTextItem[] }) {
  if (!richText || richText.length === 0) return null;

  return (
    <>
      {richText.map((item, idx) => {
        let content: React.ReactNode = item.plain_text;

        if (item.annotations.bold) {
          content = <strong key={`b-${idx}`} className="font-semibold text-white">{content}</strong>;
        }
        if (item.annotations.italic) {
          content = <em key={`i-${idx}`} className="italic">{content}</em>;
        }
        if (item.annotations.strikethrough) {
          content = <s key={`s-${idx}`} className="line-through">{content}</s>;
        }
        if (item.annotations.underline) {
          content = <u key={`u-${idx}`} className="underline underline-offset-4">{content}</u>;
        }
        if (item.annotations.code) {
          content = (
            <code
              key={`c-${idx}`}
              className="px-1.5 py-0.5 rounded-md text-xs font-mono bg-zinc-800 text-cyan-300 border border-zinc-700/60"
            >
              {content}
            </code>
          );
        }

        if (item.href || item.text?.link) {
          const url = item.href || item.text?.link?.url || '';
          const isExternal = url.startsWith('http');
          content = (
            <a
              key={`a-${idx}`}
              href={url}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 inline-flex items-center gap-0.5"
            >
              {content}
              {isExternal && <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-70" />}
            </a>
          );
        }

        return <React.Fragment key={idx}>{content}</React.Fragment>;
      })}
    </>
  );
}

/**
 * Interactive Code Block with Copy-to-Clipboard
 */
function CodeBlock({ block }: { block: any }) {
  const [copied, setCopied] = useState(false);
  const codeContent = block.code?.rich_text?.map((t: any) => t.plain_text).join('') || '';
  const language = block.code?.language || 'text';

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-6 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-400">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase text-[11px] font-semibold text-zinc-300 tracking-wider">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-[11px]"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono text-zinc-200 leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700">
        <code>{codeContent}</code>
      </pre>
    </div>
  );
}

/**
 * Single Block Renderer
 */
function RenderBlock({ block }: { block: NotionBlock }) {
  switch (block.type) {
    case 'heading_1': {
      const text = block.heading_1?.rich_text?.map((t: any) => t.plain_text).join('') || '';
      const anchorId = slugify(text);
      return (
        <h2
          id={anchorId}
          className="group scroll-mt-24 mt-12 mb-4 text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2 border-b border-zinc-800 pb-3"
        >
          <span>
            <RenderRichText richText={block.heading_1?.rich_text} />
          </span>
          <a
            href={`#${anchorId}`}
            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-cyan-400 transition-opacity"
            aria-label="Direct link to heading"
          >
            <Hash className="w-5 h-5" />
          </a>
        </h2>
      );
    }

    case 'heading_2': {
      const text = block.heading_2?.rich_text?.map((t: any) => t.plain_text).join('') || '';
      const anchorId = slugify(text);
      return (
        <h3
          id={anchorId}
          className="group scroll-mt-24 mt-8 mb-3 text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2"
        >
          <span>
            <RenderRichText richText={block.heading_2?.rich_text} />
          </span>
          <a
            href={`#${anchorId}`}
            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-cyan-400 transition-opacity"
            aria-label="Direct link to section"
          >
            <Hash className="w-4 h-4" />
          </a>
        </h3>
      );
    }

    case 'heading_3': {
      const text = block.heading_3?.rich_text?.map((t: any) => t.plain_text).join('') || '';
      const anchorId = slugify(text);
      return (
        <h4
          id={anchorId}
          className="group scroll-mt-24 mt-6 mb-2 text-lg font-semibold tracking-tight text-zinc-100 flex items-center gap-2"
        >
          <span>
            <RenderRichText richText={block.heading_3?.rich_text} />
          </span>
          <a
            href={`#${anchorId}`}
            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-cyan-400 transition-opacity"
            aria-label="Direct link to sub-section"
          >
            <Hash className="w-3.5 h-3.5" />
          </a>
        </h4>
      );
    }

    case 'paragraph': {
      const rt = block.paragraph?.rich_text || [];
      if (rt.length === 0) {
        return <div className="h-4" />;
      }
      return (
        <p className="my-3 text-zinc-300 text-base leading-relaxed">
          <RenderRichText richText={rt} />
        </p>
      );
    }

    case 'bulleted_list_item': {
      return (
        <li className="ml-6 list-disc my-1.5 text-zinc-300 text-base leading-relaxed pl-1 marker:text-indigo-400">
          <RenderRichText richText={block.bulleted_list_item?.rich_text} />
          {block.children && block.children.length > 0 && (
            <div className="mt-2 space-y-2">
              {block.children.map((child) => (
                <RenderBlock key={child.id} block={child} />
              ))}
            </div>
          )}
        </li>
      );
    }

    case 'numbered_list_item': {
      return (
        <li className="ml-6 list-decimal my-1.5 text-zinc-300 text-base leading-relaxed pl-1 marker:text-indigo-400 marker:font-mono">
          <RenderRichText richText={block.numbered_list_item?.rich_text} />
          {block.children && block.children.length > 0 && (
            <div className="mt-2 space-y-2">
              {block.children.map((child) => (
                <RenderBlock key={child.id} block={child} />
              ))}
            </div>
          )}
        </li>
      );
    }

    case 'code': {
      return <CodeBlock block={block} />;
    }

    case 'callout': {
      const icon = block.callout?.icon?.emoji || '💡';
      return (
        <div className="my-6 p-4 sm:p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-zinc-300 flex items-start gap-4 shadow-lg shadow-indigo-950/20">
          <div className="text-2xl select-none flex-shrink-0 pt-0.5">{icon}</div>
          <div className="flex-1 text-sm sm:text-base leading-relaxed">
            <RenderRichText richText={block.callout?.rich_text} />
          </div>
        </div>
      );
    }

    case 'quote': {
      return (
        <blockquote className="my-6 pl-4 border-l-4 border-cyan-500/80 bg-zinc-900/40 py-2.5 pr-4 rounded-r-xl italic text-zinc-300 text-base sm:text-lg">
          <RenderRichText richText={block.quote?.rich_text} />
        </blockquote>
      );
    }

    case 'image': {
      const imgUrl = block.image?.localUrl || block.image?.file?.url || block.image?.external?.url;
      const caption = block.image?.caption?.map((t: any) => t.plain_text).join('') || '';
      if (!imgUrl) return null;

      return (
        <figure className="my-8 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
          <img
            src={imgUrl}
            alt={caption || 'Blog illustration'}
            className="w-full h-auto object-cover max-h-[500px]"
            loading="lazy"
          />
          {caption && (
            <figcaption className="p-3 text-center text-xs font-mono text-zinc-400 bg-zinc-900/80 border-t border-zinc-800">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'divider': {
      return <hr className="my-8 border-zinc-800" />;
    }

    default:
      return null;
  }
}

export default function NotionRenderer({ blocks }: NotionRendererProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 font-mono text-sm">
        No content available for this post.
      </div>
    );
  }

  // Group consecutive list items into ul / ol for clean semantics
  const renderedElements: React.ReactNode[] = [];
  let currentListType: 'bulleted' | 'numbered' | null = null;
  let currentListItems: NotionBlock[] = [];

  const flushList = () => {
    if (!currentListType || currentListItems.length === 0) return;
    if (currentListType === 'bulleted') {
      renderedElements.push(
        <ul key={`ul-${currentListItems[0].id}`} className="my-4 space-y-1">
          {currentListItems.map((item) => (
            <RenderBlock key={item.id} block={item} />
          ))}
        </ul>
      );
    } else {
      renderedElements.push(
        <ol key={`ol-${currentListItems[0].id}`} className="my-4 space-y-1">
          {currentListItems.map((item) => (
            <RenderBlock key={item.id} block={item} />
          ))}
        </ol>
      );
    }
    currentListType = null;
    currentListItems = [];
  };

  blocks.forEach((block) => {
    if (block.type === 'bulleted_list_item') {
      if (currentListType && currentListType !== 'bulleted') flushList();
      currentListType = 'bulleted';
      currentListItems.push(block);
    } else if (block.type === 'numbered_list_item') {
      if (currentListType && currentListType !== 'numbered') flushList();
      currentListType = 'numbered';
      currentListItems.push(block);
    } else {
      flushList();
      renderedElements.push(<RenderBlock key={block.id} block={block} />);
    }
  });

  flushList();

  return <div className="space-y-1 leading-relaxed text-zinc-300">{renderedElements}</div>;
}

