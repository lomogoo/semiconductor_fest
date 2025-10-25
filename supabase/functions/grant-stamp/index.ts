import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, stampId } = await req.json()

    if (!userId || !stampId) {
      return new Response(
        JSON.stringify({ error: 'userId and stampId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if stamp already acquired
    const { data: existingStamp } = await supabase
      .from('user_stamps')
      .select('*')
      .eq('user_id', userId)
      .eq('stamp_id', stampId)
      .single()

    if (existingStamp) {
      return new Response(
        JSON.stringify({ error: 'Stamp already acquired', alreadyGranted: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert stamp record
    const { error: stampError } = await supabase
      .from('user_stamps')
      .insert({
        user_id: userId,
        stamp_id: stampId,
      })

    if (stampError) {
      console.error('[grant-stamp] Error inserting stamp:', stampError)
      throw new Error('Failed to grant stamp')
    }

    // Update user points (+1 point per stamp)
    const newTotalPoints = user.total_points + 1
    const newRedeemablePoints = user.redeemable_points + 1

    const { error: updateError } = await supabase
      .from('users')
      .update({
        total_points: newTotalPoints,
        redeemable_points: newRedeemablePoints,
        points: newRedeemablePoints, // Keep points in sync with redeemable_points
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[grant-stamp] Error updating points:', updateError)
      throw new Error('Failed to update points')
    }

    console.log(`[grant-stamp] Granted stamp ${stampId} to user ${userId}`)

    return new Response(
      JSON.stringify({
        success: true,
        stampId,
        newTotalPoints,
        newRedeemablePoints,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[grant-stamp] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
