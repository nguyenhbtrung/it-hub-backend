export function extractPlainText(content: any): string {
  let text = '';

  function traverse(node?: any) {
    if (!node) return;

    if (node.type === 'text' && typeof node.text === 'string') {
      text += node.text + ' ';
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        traverse(child);
      }
    }
  }

  traverse(content);

  return text.trim();
}

export function estimateDurationFromContent(content: any, wordsPerMinute = 200) {
  const plainText = extractPlainText(content);

  if (!plainText) {
    return {
      wordCount: 0,
      durationMinutes: 0,
      durationSeconds: 0,
    };
  }

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  const durationMinutes = wordCount / wordsPerMinute;
  const durationSeconds = Math.ceil(durationMinutes * 60);

  return {
    wordCount,
    durationMinutes: Math.ceil(durationMinutes),
    durationSeconds,
  };
}

export function jsonContentToText(node: any, depth = 0): string {
  if (!node) return '';

  switch (node.type) {
    case 'doc':
      return node.content?.map((n: any) => jsonContentToText(n)).join('\n\n') ?? '';

    case 'heading': {
      const level = node.attrs?.level ?? 1;
      return `${'#'.repeat(level)} ${extractText(node)}`;
    }

    case 'paragraph':
      return extractText(node);

    case 'bulletList':
      return node.content?.map((item: any) => `- ${jsonContentToText(item)}`).join('\n') ?? '';

    case 'orderedList':
      return node.content?.map((item: any, i: number) => `${i + 1}. ${jsonContentToText(item)}`).join('\n') ?? '';

    case 'listItem':
      return node.content?.map((n: any) => jsonContentToText(n)).join(' ') ?? '';

    case 'blockquote':
      return `> ${extractText(node)}`;

    case 'codeBlock':
      return `\`\`\`${node.attrs?.language ?? ''}\n${extractText(node)}\n\`\`\``;

    case 'figure':
      return `[Image] ${extractText(node)}`;

    case 'callout':
      return `${node.attrs?.type?.toUpperCase() ?? 'NOTE'}: ${extractText(node)}`;

    default:
      return extractText(node);
  }
}

export function extractText(node: any): string {
  if (!node.content) return '';
  return node.content.map((c: any) => (c.type === 'text' ? c.text : extractText(c))).join('');
}

export function extractFileIdsFromContent(doc: any): string[] {
  const ids = new Set<string>();

  function walk(node?: any) {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const n of node) walk(n);
      return;
    }
    // node is object
    const attrs = node.attrs;
    if (attrs && typeof attrs.fileId === 'string' && attrs.fileId.trim() !== '') {
      ids.add(attrs.fileId);
    }
    if (node.content) walk(node.content);
  }

  // doc có thể là toàn bộ object hoặc mảng
  if (Array.isArray((doc as any).content)) {
    walk((doc as any).content);
  } else {
    walk(doc);
  }

  return Array.from(ids);
}

export function diffFileIds(oldContent: any, newContent: any): { removed: string[]; added: string[] } {
  const oldIds = new Set(extractFileIdsFromContent(oldContent));
  const newIds = new Set(extractFileIdsFromContent(newContent));

  const removed: string[] = [];
  const added: string[] = [];

  for (const id of oldIds) {
    if (!newIds.has(id)) removed.push(id);
  }

  for (const id of newIds) {
    if (!oldIds.has(id)) added.push(id);
  }

  return { removed, added };
}

export function JsonContentToMarkdown(node: any): string {
  if (!node) return '';

  // Text node
  if (node.type === 'text') {
    let text = node.text || '';

    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            text = `**${text}**`;
            break;
          case 'italic':
            text = `*${text}*`;
            break;
          case 'underline':
            text = `__${text}__`;
            break;
          case 'code':
            text = `\`${text}\``;
            break;
          case 'link':
            text = `[${text}](${mark.attrs?.href || ''})`;
            break;
        }
      }
    }

    return text;
  }

  // Đệ quy children
  const childrenText = (node.content || []).map((child: any) => JsonContentToMarkdown(child)).join('');

  switch (node.type) {
    case 'heading': {
      const level = node.attrs?.level || 1;
      return `${'#'.repeat(level)} ${childrenText}\n\n`;
    }

    case 'paragraph':
      return `${childrenText}\n\n`;

    case 'bulletList':
      return `${node.content.map((item: any) => JsonContentToMarkdown(item)).join('')}\n`;

    case 'orderedList':
      return `${node.content.map((item: any, idx: number) => JsonContentToMarkdown({ ...item, order: idx + 1 })).join('')}\n`;

    case 'listItem': {
      const prefix = node.order ? `${node.order}. ` : '- ';
      const text = (node.content || [])
        .map((c: any) => JsonContentToMarkdown(c))
        .join('')
        .trim();
      return `${prefix}${text}\n`;
    }

    case 'blockquote':
      return `> ${childrenText}\n\n`;

    case 'codeBlock':
      return `\`\`\`\n${childrenText}\n\`\`\`\n\n`;

    case 'figure':
      return node.content?.[0]?.text
        ? `![Figure](${node.attrs.src})\n${node.content[0].text}\n\n`
        : `![Figure](${node.attrs?.src || ''})\n\n`;

    case 'video':
      return `Video: ${node.attrs?.src || ''}\n\n`;

    case 'callout':
      return `> ${node.attrs?.type?.toUpperCase() ?? 'NOTE'}: ${childrenText}\n\n`;

    default:
      return childrenText;
  }
}
