import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('--- Debug Info ---')
console.log('URL:', supabaseUrl)
console.log('Service Key Length:', supabaseServiceKey ? supabaseServiceKey.length : 'undefined')
console.log('Anon Key Length:', supabaseAnonKey ? supabaseAnonKey.length : 'undefined')

async function testConnection(keyType, key) {
    console.log(`\nTesting with ${keyType} Key...`)
    if (!key) {
        console.log('Key is missing.')
        return
    }

    const supabase = createClient(supabaseUrl, key)

    // Try to fetch one table
    const { data, error } = await supabase.from('generated_videos').select('*').limit(1)

    if (error) {
        console.error(`Error: ${error.message} (Code: ${error.code})`)
        if (error.localizedDescription) console.log('Details:', error.localizedDescription)
    } else {
        console.log('Success! Table accessed.')
        if (data && data.length > 0) {
            console.log('Sample Data Keys:', Object.keys(data[0]))
        } else {
            console.log('Table is empty.')
        }
    }
}

async function run() {
    await testConnection('Service Role', supabaseServiceKey)
    await testConnection('Anon', supabaseAnonKey)
}

run()
