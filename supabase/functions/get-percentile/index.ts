import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user's total points
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userPoints = user.total_points || 0

    // Count total users
    const { count: totalUsers, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('[get-percentile] Error counting users:', countError)
      throw new Error('Failed to count users')
    }

    // Count users with fewer points
    const { count: lowerUsers, error: lowerError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lt('total_points', userPoints)

    if (lowerError) {
      console.error('[get-percentile] Error counting lower users:', lowerError)
      throw new Error('Failed to count lower users')
    }

    // Calculate percentile
    let percentile = 0
    if (totalUsers && totalUsers > 0) {
      percentile = Math.round(((lowerUsers || 0) / totalUsers) * 100)
    }

    return new Response(
      JSON.stringify({ percentile }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[get-percentile] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
