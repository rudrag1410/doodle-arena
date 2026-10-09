import { useState } from 'react'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { ArrowRight, Brush, Crown, Loader2, MessageCircle, Plus, Users } from 'lucide-react'
import { LIMITS, ROOM_CODE, ROOM_PATH_PREFIX } from '@doodle/shared'
import { COPY } from '../../constants/copy'
import { AUTOCOMPLETE_NICKNAME } from '../../constants/dom'
import { ENTRY_DELAY_S, SPRING, STAGGER_MS, STEP_BASE_DELAY_S } from '../../constants/motion'
import { CODE_INPUT_MAX_LEN } from '../../constants/ui'
import { useCreateRoom, useJoinRoom } from '../../hooks'
import { useProfileStore } from '../../store'
import { AvatarPicker, Logo, Screen } from '../common'
import { Doodles, Underline } from './HomeDecor'
const STEP_ICONS = [
  { icon: Brush, color: 'bg-bubble' },
  { icon: MessageCircle, color: 'bg-sky' },
  { icon: Crown, color: 'bg-sunny' },
]
const extractRoomCode = (input: string) =>
  input
    .trim()
    .toUpperCase()
    .replace(new RegExp(`^.*${ROOM_PATH_PREFIX}`), '')
export const Home = () => {
  const stored = useProfileStore()
  const [profile, setProfile] = useState({ name: stored.name, avatar: stored.avatar })
  const [code, setCode] = useState('')
  const [touched, setTouched] = useState(false)
  const create = useCreateRoom()
  const join = useJoinRoom()
  const name = profile.name.trim()
  const busy = create.isPending || join.isPending
  const error = create.error ?? join.error
  const onCreate = () => {
    setTouched(true)
    if (name) create.mutate({ profile: { ...profile, name } })
  }
  const onJoin = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const roomId = extractRoomCode(code)
    if (name && roomId.length >= ROOM_CODE.minLength) join.mutate({ roomId, profile: { ...profile, name } })
  }
  return (
    <Screen className="items-center justify-center gap-4 p-4 landscape:flex-row landscape:gap-8 short:gap-6 short:p-2 lg:gap-16 lg:px-10">
      <Doodles />
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 flex flex-col items-center text-center landscape:items-start landscape:text-left"
      >
        <Logo size="lg" />
        <p className="mt-2 font-display text-lg font-medium text-ink-soft sm:mt-4 sm:text-2xl">
          {COPY.brand.tagline}{' '}
          <span className="relative inline-block text-ink">
            {COPY.brand.taglineAccent}
            <Underline />
          </span>
        </p>
        <div className="mt-8 hidden w-full max-w-md gap-3 lg:grid">
          {COPY.home.steps.map((step, i) => {
            const { icon: Icon, color } = STEP_ICONS[i]
            return (
              <motion.div
                key={step.title}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: STEP_BASE_DELAY_S + i * STAGGER_MS }}
                className="card flex items-start gap-3 p-3"
              >
                <span className={clsx('grid size-10 shrink-0 place-items-center rounded-xl border-[2.5px] border-ink', color)}>
                  <Icon size={20} />
                </span>
                <div>
                  <h3 className="text-lg leading-tight font-semibold">{step.title}</h3>
                  <p className="text-sm font-semibold text-ink-soft">{step.text}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
        <p className="mt-4 hidden items-center gap-2 text-sm font-bold text-ink-soft sm:flex">
          <Users size={16} /> {COPY.home.audience}
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: ENTRY_DELAY_S, ...SPRING.gentle }}
        className="card relative z-10 w-full max-w-md shrink-0 p-4 short:p-3 sm:p-6"
      >
        <label className="label" htmlFor="name">
          {COPY.common.nameLabel}
        </label>
        <input
          id="name"
          className={clsx('input mt-1', touched && !name && 'border-tomato')}
          placeholder={COPY.common.namePlaceholder}
          maxLength={LIMITS.nameLen}
          value={profile.name}
          autoFocus
          autoComplete={AUTOCOMPLETE_NICKNAME}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && onCreate()}
        />
        {touched && !name && <p className="mt-1 text-sm font-bold text-tomato">{COPY.home.nameRequired}</p>}

        <div className="label mt-3 mb-1.5 short:mt-1.5 short:mb-1 sm:mt-4">{COPY.common.buddyLabel}</div>
        <AvatarPicker value={profile.avatar} onChange={(avatar) => setProfile({ ...profile, avatar })} />

        <button className="btn btn-primary mt-4 w-full py-3 text-lg short:mt-2 short:py-2 sm:py-4 sm:text-xl" onClick={onCreate} disabled={busy}>
          {create.isPending ? <Loader2 className="animate-spin" /> : <Plus size={22} strokeWidth={3} />} {COPY.home.create}
        </button>

        <div className="my-3 flex items-center short:my-1.5 gap-3 text-sm font-extrabold text-ink-soft">
          <span className="h-0.5 flex-1 rounded bg-line" /> {COPY.home.orJoin} <span className="h-0.5 flex-1 rounded bg-line" />
        </div>

        <form onSubmit={onJoin} className="flex gap-2">
          <input
            className="input text-center font-display text-lg tracking-[0.25em] uppercase"
            placeholder={COPY.home.codePlaceholder}
            aria-label={COPY.home.codeLabel}
            value={code}
            maxLength={CODE_INPUT_MAX_LEN}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="btn btn-sunny px-4" type="submit" disabled={busy} aria-label={COPY.home.joinLabel}>
            {join.isPending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
          </button>
        </form>
        {error && <p className="mt-2 text-center text-sm font-bold text-tomato">{error.message}</p>}
      </motion.div>
    </Screen>
  )
}
