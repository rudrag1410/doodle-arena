import { motion } from 'motion/react'
import { Check, Copy, Share2 } from 'lucide-react'

import { COPY } from '@/constants/copy'
import { useCopyToClipboard } from '@/hooks'
import { useInviteLink } from '@/hooks/useInviteLink'

export const InviteBanner = ({ roomId }: { roomId: string }) => {
  const link = useInviteLink(roomId)
  const { copied, copy } = useCopyToClipboard()
  const share = () => navigator.share?.({ title: COPY.lobby.shareTitle, text: COPY.lobby.shareText, url: link }).catch(() => {})

  return (
    <motion.section
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="card flex shrink-0 items-center gap-3 bg-sunny p-3 sm:px-5"
    >
      <div className="min-w-0 flex-1">
        <div className="label !text-ink/70">{COPY.lobby.invite}</div>
        <div className="flex items-center gap-x-4">
          <span className="font-display text-2xl font-bold tracking-[0.18em] sm:text-3xl">{roomId}</span>
          <code className="hidden max-w-full truncate rounded-lg border-2 border-ink bg-white px-3 py-1 text-sm font-bold md:block">{link}</code>
        </div>
      </div>
      <button className="btn btn-sm shrink-0" onClick={() => copy(link)}>
        {copied ? <Check size={18} className="text-mint" /> : <Copy size={18} />} {copied ? COPY.lobby.copied : COPY.lobby.copyLink}
      </button>
      {'share' in navigator && (
        <button className="btn btn-sm btn-icon shrink-0" onClick={share} aria-label={COPY.lobby.share}>
          <Share2 size={18} />
        </button>
      )}
    </motion.section>
  )
}
