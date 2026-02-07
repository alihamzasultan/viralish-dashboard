import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSourceUrls() {
    const { data, error } = await supabase
        .from('source_videos')
        .select('id, video_page_url')
        .limit(3)

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Source Video URLs:', data)
    }
}

checkSourceUrls()
