declare global {
  interface Env {
    JWT_SECRET: string
    SALT_ROUNDS: string
    TURNSTILE_SECRET_KEY?: string
    MEDIA_PUBLIC_URL?: string
  }
}

export {}
