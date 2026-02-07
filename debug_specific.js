import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function findVideo() {
    console.log('Searching for PERFECT Landing...')
    const { data, error } = await supabase
        .from('generated_videos')
        .select(`
        id,
        video_title,
        source_video_id,
        source_videos (
            video_page_url
        )
    `)
        .ilike('video_title', '%PERFECT Landing%')
        .limit(1)

    if (error) {
        console.error('Error fetching:', error)
    } else {
        if (data && data.length > 0) {
            console.log('Found Video:', JSON.stringify(data[0], null, 2))
        } else {
            console.log('Video not found.')
        }
    }
}

findVideo()
