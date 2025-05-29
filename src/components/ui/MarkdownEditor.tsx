'use client';

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Type,
  Bold,
  Italic,
  List,
  Link2,
  Image,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your proposal description...',
  className,
  error,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById(
      'markdown-textarea'
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering for preview
    return text
      .replace(
        /^### (.*$)/gim,
        '<h3 class="text-lg font-semibold text-patriotWhite mb-2">$1</h3>'
      )
      .replace(
        /^## (.*$)/gim,
        '<h2 class="text-xl font-semibold text-patriotWhite mb-3">$1</h2>'
      )
      .replace(
        /^# (.*$)/gim,
        '<h1 class="text-2xl font-bold text-patriotWhite mb-4">$1</h1>'
      )
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold text-patriotWhite">$1</strong>'
      )
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-patriotRed hover:text-red-400 underline">$1</a>'
      )
      .replace(/\n/g, '<br>');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-backgroundLight border border-patriotBlue/30 rounded-t-lg p-3">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('**', '**')}
            className="h-8 w-8 p-0"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('*', '*')}
            className="h-8 w-8 p-0"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('## ', '')}
            className="h-8 w-8 p-0"
          >
            <Type className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('* ', '')}
            className="h-8 w-8 p-0"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('[Link Text](', ')')}
            className="h-8 w-8 p-0"
          >
            <Link2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('![Alt Text](', ')')}
            className="h-8 w-8 p-0"
          >
            <Image className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant={activeTab === 'write' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('write')}
          >
            Write
          </Button>
          <Button
            type="button"
            variant={activeTab === 'preview' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </Button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="relative">
        {activeTab === 'write' ? (
          <textarea
            id="markdown-textarea"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'w-full h-64 bg-backgroundLight border border-patriotBlue/30 rounded-b-lg p-4 text-textBase placeholder-textSecondary resize-none focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent',
              error && 'border-patriotRed'
            )}
          />
        ) : (
          <div className="w-full h-64 bg-backgroundLight border border-patriotBlue/30 rounded-b-lg p-4 overflow-y-auto">
            {value ? (
              <div
                className="prose prose-invert max-w-none text-textSecondary"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
              />
            ) : (
              <p className="text-textSecondary italic">
                Nothing to preview yet...
              </p>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-patriotRed text-sm">{error}</p>}

      {/* Markdown Help */}
      <div className="text-xs text-textSecondary bg-backgroundLight/50 rounded-lg p-3">
        <p className="font-medium mb-2">Markdown formatting:</p>
        <div className="grid grid-cols-2 gap-2">
          <span>**bold text**</span>
          <span>*italic text*</span>
          <span># Heading 1</span>
          <span>## Heading 2</span>
          <span>* List item</span>
          <span>[Link](url)</span>
        </div>
      </div>
    </div>
  );
};
