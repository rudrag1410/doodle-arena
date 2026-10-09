const WORD_CHAR = /[\p{L}\p{N}]/u
export const isWordChar = (ch: string) => WORD_CHAR.test(ch)
