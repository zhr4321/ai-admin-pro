import { http, HttpResponse } from 'msw'
import type { StreamChatParams } from '@/types/aiChat'

function buildMockReply(userMessage: string): string {
  const topic = userMessage.trim() || '你的问题'
  return [
    `## 关于「${topic}」`,
    '',
    '这是 **MSW Mock** 流式回复，演示 Markdown 渲染：',
    '',
    '- 支持列表与加粗',
    '- 支持代码块高亮',
    '',
    '示例代码：',
    '',
    '```typescript',
    'const answer = "Hello, AI Admin Pro!"',
    'console.log(answer)',
    '```',
    '',
    '如需连接真实 DeepSeek，请配置 `VITE_AI_API_KEY` 并部署 BFF 转发。',
  ].join('\n')
}

function chunkText(text: string, size = 4): string[] {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size))
  }
  return chunks
}

function createSseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let index = 0

  return new ReadableStream({
    start(controller) {
      const timer = setInterval(() => {
        if (index >= chunks.length) {
          clearInterval(timer)
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          return
        }
        const payload = `data: ${JSON.stringify({ content: chunks[index] })}\n\n`
        controller.enqueue(encoder.encode(payload))
        index += 1
      }, 50)
    },
  })
}

export const aiChatHandlers = [
  http.post('/api/ai/chat/stream', async ({ request }) => {
    const body = (await request.json()) as StreamChatParams

    const lastUser = [...body.messages].reverse().find((m) => m.role === 'user')
    const reply = buildMockReply(lastUser?.content ?? '')
    const chunks = chunkText(reply, 4)

    return new HttpResponse(createSseStream(chunks), {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }),
]
