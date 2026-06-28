import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jgyvrhsvyiuvwkjhuxro.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpneXZyaHN2eWl1dndramh1eHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTQzNjIsImV4cCI6MjA5ODE3MDM2Mn0.HNj6ZGLFTPH9JAy4Pn1wWSZCZSIsPl46gcWic-8irOw'

export const supabase = createClient(supabaseUrl, supabaseKey)
