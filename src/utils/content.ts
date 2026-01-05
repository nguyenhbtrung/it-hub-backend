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
