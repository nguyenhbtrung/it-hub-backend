import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// Hàm extract text từ node Tiptap
function extractText(node: any): string {
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
  const childrenText = (node.content || []).map((child: any) => extractText(child)).join('');

  switch (node.type) {
    case 'heading': {
      const level = node.attrs?.level || 1;
      return `${'#'.repeat(level)} ${childrenText}\n\n`;
    }

    case 'paragraph':
      return `${childrenText}\n\n`;

    case 'bulletList':
      return `${node.content.map((item: any) => extractText(item)).join('')}\n`;

    case 'orderedList':
      return `${node.content.map((item: any, idx: number) => extractText({ ...item, order: idx + 1 })).join('')}\n`;

    case 'listItem': {
      const prefix = node.order ? `${node.order}. ` : '- ';
      const text = (node.content || [])
        .map((c: any) => extractText(c))
        .join('')
        .trim();
      return `${prefix}${text}\n`;
    }

    case 'blockquote':
      return `> ${childrenText}\n\n`;

    case 'codeBlock':
      return `\`\`\`\n${childrenText}\n\`\`\`\n\n`;

    case 'figure':
      return node.attrs?.caption
        ? `![Figure](${node.attrs.src})\n${node.attrs.caption}\n\n`
        : `![Figure](${node.attrs?.src || ''})\n\n`;

    case 'video':
      return `Video: ${node.attrs?.src || ''}\n\n`;

    case 'callout':
      return `> ${node.attrs?.type?.toUpperCase() ?? 'NOTE'}: ${childrenText}\n\n`;

    default:
      return childrenText;
  }
}

// Hàm countTokens (demo: đếm từ, thực tế gọi Gemini tokenizer)
async function countTokens(text: string): Promise<number> {
  // TODO: thay bằng Gemini tokenizer thực tế
  return text.split(/\s+/).length;
}

async function chunkJsonContent(docJson: any) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
    separators: ['\n\n', '\n', ' ', ''],
    lengthFunction: async (text: string) => {
      return await countTokens(text);
    },
  });

  const fullText = extractText(docJson);
  const chunks = await splitter.splitText(fullText);

  return chunks;
}

// Ví dụ input từ Tiptap
const docJson = {
  type: 'doc',
  content: [
    { type: 'heading', content: [{ type: 'text', text: 'Giới thiệu' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Đây là đoạn văn ngắn.' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Đây là một đoạn văn rất dài '.repeat(200) }] },
    {
      type: 'codeBlock',
      attrs: { language: 'ts' },
      content: [{ type: 'text', text: "function hello() {\n  console.log('Hello World');\n}" }],
    },
  ],
};

(async () => {
  const chunks = await chunkJsonContent(docJson);
  chunks.forEach((c, i) => {
    console.log(`Chunk ${i + 1} (${c.split(/\s+/).length} tokens): ${c.slice(0, 80)}...`);
  });

  // TODO: gửi từng chunk vào Gemini embedding API
  // const embeddings = await Promise.all(chunks.map(c => geminiEmbed(c)));
})();
