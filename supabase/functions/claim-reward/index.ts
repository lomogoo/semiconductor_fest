import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, rewardType, pointsCost } = await req.json()

    if (!userId || !rewardType || pointsCost === undefined) {
      return new Response(
        JSON.stringify({ error: 'userId, rewardType, and pointsCost are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user
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

    // Check if user has enough points
    if (user.redeemable_points < pointsCost) {
      return new Response(
        JSON.stringify({ error: 'Insufficient points' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deduct points
    const newRedeemablePoints = user.redeemable_points - pointsCost

    // Record the reward claim
    const { error: rewardError } = await supabase
      .from('user_rewards')
      .insert({
        user_id: userId,
        reward_type: rewardType,
        points_spent: pointsCost,
      })

    if (rewardError) {
      console.error('[claim-reward] Error recording reward:', rewardError)
      throw new Error('Failed to record reward')
    }

    // Update user points
    const { error: updateError } = await supabase
      .from('users')
      .update({
        redeemable_points: newRedeemablePoints,
        points: newRedeemablePoints,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[claim-reward] Error updating points:', updateError)
      throw new Error('Failed to update points')
    }

    console.log(`[claim-reward] User ${userId} claimed reward ${rewardType}, spent ${pointsCost} points`)

    return new Response(
      JSON.stringify({
        success: true,
        rewardType,
        pointsSpent: pointsCost,
        newRedeemablePoints,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[claim-reward] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
