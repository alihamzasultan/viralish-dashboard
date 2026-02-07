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

const targetTables = [
    'account_daily_stats',
    'daily_stats',
    'generated_videos',
    'source_videos'
]

async function fetchTableStructures() {
    console.log('--- Schema Analysis ---')

    for (const table of targetTables) {
        console.log(`\nTable: ${table}`)
        const { data, error } = await supabase.from(table).select('*').limit(1)

        if (error) {
            console.error(`Error: ${error.message}`)
        } else if (data && data.length > 0) {
            const keys = Object.keys(data[0])
            console.log('Columns:')
            keys.forEach(key => {
                console.log(`  - ${key} (${typeof data[0][key]})`)
            })
        } else {
            console.log('Table is empty.')
        }
    }
}

fetchTableStructures()
