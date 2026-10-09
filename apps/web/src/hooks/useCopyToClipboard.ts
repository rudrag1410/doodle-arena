import { useCopyToClipboard as useCopy, useTimeout } from 'usehooks-ts'
import { COPIED_FLASH_MS } from '../constants/timing'
export const useCopyToClipboard = () => {
  const [copiedText, copy] = useCopy()
  useTimeout(() => void copy(''), copiedText ? COPIED_FLASH_MS : null)
  return { copied: !!copiedText, copy }
}
