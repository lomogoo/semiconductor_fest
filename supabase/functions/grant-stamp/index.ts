import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, boothId, stampCode } = await req.json()
    let stampId = stampCode || boothId

    if (!userId || !stampId) {
      return new Response(
        JSON.stringify({ error: 'userId and stampId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert to uppercase to match BOOTH_DATA
    let finalStampId = stampId.toUpperCase()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already acquired
    const acquiredStamps = user.acquired_stamps || []
    if (acquiredStamps.includes(finalStampId)) {
      return new Response(
        JSON.stringify({ error: '既に取得済みです', alreadyGranted: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate stamp ID (A-F for booths, or event stamps)
    const validStamps = ['A', 'B', 'C', 'D', 'E', 'F', 'STAGE', 'TALKSESSION', 'PRESENTATION']
    if (!validStamps.includes(finalStampId)) {
      return new Response(
        JSON.stringify({ error: '未対応のスタンプIDです' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add to acquired stamps array
    const newAcquiredStamps = [...acquiredStamps, finalStampId]

    // Update user points (+1 point per stamp)
    const pointsToAdd = 1
    const newTotalPoints = (user.total_points || 0) + pointsToAdd
    const newRedeemablePoints = (user.redeemable_points || 0) + pointsToAdd

    const { error: updateError } = await supabase
      .from('app_users')
      .update({
        acquired_stamps: newAcquiredStamps,
        total_points: newTotalPoints,
        redeemable_points: newRedeemablePoints,
        points: newRedeemablePoints,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[grant-stamp] Error updating:', updateError)
      throw new Error('Failed to grant stamp')
    }

    console.log(`[grant-stamp] Granted stamp ${finalStampId} to user ${userId}`)

    return new Response(
      JSON.stringify({
        success: true,
        stampId: finalStampId,
        pointsAdded: pointsToAdd,
        newTotalPoints,
        newRedeemablePoints,
        acquiredStamps: newAcquiredStamps,
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
