import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase URL or Anon Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkVideoData() {
    console.log('Fetching latest 5 generated videos...')

    const { data: videos, error } = await supabase
        .from('generated_videos')
        .select('id, url, secure_url, google_drive_url, video_title')
        .order('generated_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error fetching videos:', error)
        return
    }

    if (!videos || videos.length === 0) {
        console.log('No videos found.')
        return
    }

    console.log('--- Video Data Analysis ---')
    videos.forEach((video, index) => {
        console.log(`\nVideo #${index + 1} (ID: ${video.id})`)
        console.log(`Title: ${video.video_title}`)
        console.log(`URL: ${video.url}`)
        console.log(`Secure URL: ${video.secure_url}`)
        console.log(`Google Drive URL: ${video.google_drive_url}`)
    })
}

checkVideoData()
