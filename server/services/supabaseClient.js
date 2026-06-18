// Supabase server client placeholder
const { createClient } = require('@supabase/supabase-js')

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
	console.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set')
}

const supabase = createClient(url, key)

module.exports = supabase
