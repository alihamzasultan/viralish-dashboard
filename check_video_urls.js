import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fetch from 'node-fetch'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase URL or Anon Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkVideos() {
    console.log('Fetching latest 3 generated videos to test URLs...')

    const { data: videos, error } = await supabase
        .from('generated_videos')
        .select('id, url, secure_url')
        .order('generated_at', { ascending: false })
        .limit(3)

    if (error) {
        console.error('Error fetching videos:', error)
        return
    }

    if (!videos || videos.length === 0) {
        console.log('No videos found.')
        return
    }

    for (const video of videos) {
        console.log(`\nChecking Video ID: ${video.id}`)
        const urlToTest = video.secure_url || video.url

        if (!urlToTest) {
            console.log('  No URL found for this video.')
            continue
        }

        console.log(`  URL: ${urlToTest}`)

        try {
            const response = await fetch(urlToTest, { method: 'HEAD' })
            console.log(`  Status: ${response.status} ${response.statusText}`)
            console.log(`  Content-Type: ${response.headers.get('content-type')}`)
            console.log(`  Content-Length: ${response.headers.get('content-length')}`)
        } catch (err) {
            console.error(`  Error fetching URL: ${err.message}`)
        }
    }
}

checkVideos()
