import { useEffect, useRef, useState } from 'react'
import { xor } from 'lodash-es'
import { useDebounceCallback } from 'usehooks-ts'
import clsx from 'clsx'
import { LIMITS, MIN_CUSTOM_WORDS_ONLY, SETTING_BOUNDS, WORD_PACKS, type RoomSettings } from '@doodle/shared'

import { COPY } from '@/constants/copy'
import { SETTINGS_DEBOUNCE_MS } from '@/constants/timing'
import { RangeField } from '../RangeField'
import { sendSettings, parseWords } from '@/utils/settings'

interface Props {
  settings: RoomSettings
  customWordCount: number
  editable: boolean
}

export const SettingsPanel = ({ settings, customWordCount, editable }: Props) => {
  const serverWords = settings.customWords.join(', ')
  const [words, setWords] = useState(serverWords)
  const wordsInput = useRef<HTMLTextAreaElement>(null)
  const commitWords = useDebounceCallback((text: string) => sendSettings({ customWords: parseWords(text) }), SETTINGS_DEBOUNCE_MS * 2)

  useEffect(() => {
    if (document.activeElement !== wordsInput.current) setWords(serverWords)
  }, [serverWords])

  const { rounds, drawTime } = SETTING_BOUNDS

  return (
    <fieldset disabled={!editable} className="flex min-h-0 flex-1 flex-col gap-3 disabled:opacity-90">
      <RangeField
        id="rounds"
        label={COPY.lobby.rounds}
        value={settings.rounds}
        min={rounds.min}
        max={rounds.max}
        hint={COPY.lobby.roundsHint}
        onCommit={(v) => sendSettings({ rounds: v })}
      />
      <RangeField
        id="time"
        label={COPY.lobby.drawTime}
        value={settings.drawTime}
        min={drawTime.min}
        max={drawTime.max}
        step={drawTime.step}
        suffix={COPY.lobby.drawTimeSuffix}
        onCommit={(v) => sendSettings({ drawTime: v })}
      />

      <div>
        <div className="label mb-1.5">{COPY.lobby.packs}</div>
        <div className="flex flex-wrap gap-1.5">
          {WORD_PACKS.map(({ id, emoji, label }) => (
            <button
              key={id}
              type="button"
              className="chip !px-2.5 !py-1 !text-xs sm:!text-sm"
              aria-pressed={!settings.customOnly && settings.packs.includes(id)}
              disabled={settings.customOnly}
              onClick={() => sendSettings({ packs: xor(settings.packs, [id]) })}
            >
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="custom">
            {COPY.lobby.customWords}
          </label>
          <span className="text-xs font-bold text-ink-soft">{COPY.lobby.customSaved(customWordCount)}</span>
        </div>
        <textarea
          id="custom"
          ref={wordsInput}
          className={clsx('input mt-1 min-h-12 flex-1 resize-none !py-2 text-sm sm:text-base')}
          placeholder={COPY.lobby.customPlaceholder}
          value={words}
          maxLength={LIMITS.customWordsInputLen}
          onChange={(e) => {
            setWords(e.target.value)
            commitWords(e.target.value)
          }}
        />
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-bold sm:text-base">
          <input
            type="checkbox"
            className="size-5 accent-tomato"
            checked={settings.customOnly}
            disabled={customWordCount < MIN_CUSTOM_WORDS_ONLY}
            onChange={(e) => sendSettings({ customOnly: e.target.checked })}
          />
          {COPY.lobby.customOnly} <span className="text-xs font-semibold text-ink-soft">{COPY.lobby.customOnlyNeeds}</span>
        </label>
      </div>
    </fieldset>
  )
}
