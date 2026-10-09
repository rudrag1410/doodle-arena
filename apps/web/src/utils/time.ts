import { ceil } from 'lodash-es'

import { MS_PER_SECOND } from '@/constants/timing'

export const secondsLeft = (ms: number) => ceil(ms / MS_PER_SECOND)
