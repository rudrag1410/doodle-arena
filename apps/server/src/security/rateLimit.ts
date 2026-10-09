import { TokenBucket } from 'limiter'
import { LRUCache } from 'lru-cache'
import { mapValues } from 'lodash-es'
import { RATES, RateName } from '../config/rates'

const bucketFor = ({ capacity, refillPerSec }: (typeof RATES)[RateName]) => {
  const bucket = new TokenBucket({ bucketSize: capacity, tokensPerInterval: refillPerSec, interval: 'second' })

  bucket.content = capacity

  return bucket
}

export const createRateLimiter = () => {
  const buckets = mapValues(RATES, bucketFor)

  return { allow: (name: RateName) => buckets[name].tryRemoveTokens(1) }
}

export const createIpGate = (enabled: boolean, maxTracked: number) => {
  const buckets = new LRUCache<string, TokenBucket>({ max: maxTracked })

  return {
    allow: (ip: string) => {
      if (!enabled) return true

      const bucket = buckets.get(ip) ?? bucketFor(RATES[RateName.Join])

      buckets.set(ip, bucket)

      return bucket.tryRemoveTokens(1)
    },
  }
}

export type IpGate = ReturnType<typeof createIpGate>
