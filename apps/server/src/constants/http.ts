export enum HttpStatus {
  Ok = 200,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
}

export enum HttpMethod {
  Get = 'GET',
  Head = 'HEAD',
}

export enum Header {
  ContentType = 'content-type',
  CacheControl = 'cache-control',
  XForwardedFor = 'x-forwarded-for',
}

export enum ContentType {
  Json = 'application/json',
  Text = 'text/plain',
}

export enum CacheControl {
  NoStore = 'no-store',
  NoCache = 'no-cache',
  Immutable = 'public, max-age=31536000, immutable',
}

export const ASSETS_DIR = 'assets'
export const FALLBACK_BASE_URL = 'http://x'
