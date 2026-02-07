import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugFetcheBetter() {
    console.log('Fetching videos with join [Better Debug]...')
    const { data, error } = await supabase
        .from('generated_videos')
        .select(`
        id,
        video_title,
        source_videos (
            video_page_url
        )
    `)
        .limit(3)

    if (error) {
        console.error('Error fetching:', error)
    } else {
        data.forEach((v, i) => {
            console.log(`Video ${i}:`, v.video_title)
            console.log(` - Source Type:`, Array.isArray(v.source_videos) ? 'Array' : typeof v.source_videos)
            console.log(` - Source Value:`, v.source_videos)
        })
    }
}

debugFetcheBetter()
