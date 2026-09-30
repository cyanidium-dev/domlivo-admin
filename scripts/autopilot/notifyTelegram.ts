/**
 * Sends one message to the owner's Telegram chat through the Bot API.
 *
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID. Without them the script prints
 * the message and exits 0, so a missing token never breaks the run that
 * produced the news. Text is sent as plain text (no Markdown parsing), so
 * figures with underscores and asterisks arrive as written.
 *
 * Run:
 *   npx tsx scripts/autopilot/notifyTelegram.ts "text"
 *   echo "text" | npx tsx scripts/autopilot/notifyTelegram.ts
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return ''
  const chunks: Buffer[] = []
  for await (const c of process.stdin) chunks.push(Buffer.from(c))
  return Buffer.concat(chunks).toString('utf8')
}

async function main() {
  const text = (process.argv.slice(2).join(' ') || (await readStdin())).trim()
  if (!text) throw new Error('nothing to send')
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const chat = process.env.TELEGRAM_CHAT_ID?.trim()
  if (!token || !chat) {
    console.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing; message not sent:\n' + text)
    return
  }
  // Telegram caps a message at 4096 characters.
  const body = text.length > 4000 ? `${text.slice(0, 3990)}\n…` : text
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({chat_id: chat, text: body, disable_web_page_preview: true}),
    signal: AbortSignal.timeout(30_000),
  })
  const json = (await res.json()) as {ok: boolean; description?: string}
  if (!json.ok) throw new Error(`telegram: ${res.status} ${json.description ?? ''}`)
  console.log('sent to Telegram')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
