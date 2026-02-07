import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumns() {
    const { data: generated, error: genError } = await supabase
        .from('generated_videos')
        .select('cloudinary_video_url')
        .limit(1)

    const { data: source, error: srcError } = await supabase
        .from('source_videos')
        .select('cloudinary_video_url') // Try to select it to see if it exists
        .limit(1)

    console.log('Generated Videos Column Check:', genError ? 'Error (likely missing)' : 'Exists')
    console.log('Source Videos Column Check:', srcError ? 'Error (likely missing)' : 'Exists')
}

checkColumns()
