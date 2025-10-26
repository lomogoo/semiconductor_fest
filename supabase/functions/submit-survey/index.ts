import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, surveyData } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user
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

    // Check if survey already completed
    if (user.survey_completed) {
      return new Response(
        JSON.stringify({ error: 'Survey already completed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Award bonus point for completing survey
    const bonusPoints = 1
    const newTotalPoints = user.total_points + bonusPoints
    const newRedeemablePoints = user.redeemable_points + bonusPoints

    // Update user: mark survey as completed and add bonus points
    const { error: updateError } = await supabase
      .from('app_users')
      .update({
        survey_completed: true,
        total_points: newTotalPoints,
        redeemable_points: newRedeemablePoints,
        points: newRedeemablePoints,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[submit-survey] Error updating user:', updateError)
      throw new Error('Failed to update user')
    }

    console.log(`[submit-survey] Survey submitted by user ${userId}, awarded ${bonusPoints} bonus points`)

    return new Response(
      JSON.stringify({
        success: true,
        bonusPoints,
        newTotalPoints,
        newRedeemablePoints,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[submit-survey] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
