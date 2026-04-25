import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Returns null until .env is filled in — app degrades gracefully
export const supabase =
  url && key && !url.includes('your-project-id')
    ? createClient(url, key)
    : null
