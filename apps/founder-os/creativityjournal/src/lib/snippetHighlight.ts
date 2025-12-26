import { Mark, mergeAttributes } from '@tiptap/core';
import { getTextColor } from './colorUtils';

export interface SnippetHighlightOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    snippetHighlight: {
      setSnippetHighlight: (attributes: { backgroundColor: string; snippetId: number }) => ReturnType;
      toggleSnippetHighlight: (attributes: { backgroundColor: string; snippetId: number }) => ReturnType;
      unsetSnippetHighlight: () => ReturnType;
    };
  }
}

export const SnippetHighlight = Mark.create<SnippetHighlightOptions>({
  name: 'snippetHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      backgroundColor: {
        default: null,
        parseHTML: element => element.style.backgroundColor,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            style: `background-color: ${attributes.backgroundColor}; color: ${getTextColor(attributes.backgroundColor)};`,
          };
        },
      },
      snippetId: {
        default: null,
        parseHTML: element => element.getAttribute('data-snippet-id'),
        renderHTML: attributes => {
          if (!attributes.snippetId) {
            return {};
          }
          return {
            'data-snippet-id': attributes.snippetId,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-snippet-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setSnippetHighlight:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleSnippetHighlight:
        attributes =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetSnippetHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
}); 