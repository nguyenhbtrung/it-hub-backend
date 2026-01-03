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
