export function splitHighlight(text: string, highlight: string): [string, string, string] | null {
  if (!highlight) return null
  const index = text.indexOf(highlight)
  if (index < 0) return null
  return [text.slice(0, index), text.slice(index, index + highlight.length), text.slice(index + highlight.length)]
}
