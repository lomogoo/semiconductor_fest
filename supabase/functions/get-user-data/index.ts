import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, registrationType } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if user exists
    let { data: user, error: userError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single()

    // If user doesn't exist, create new user
    if (userError || !user) {
      console.log('[get-user-data] User not found, creating new user:', userId)

      // Determine registration type
      const finalRegistrationType = registrationType || 'on_site'

      // Get the next user_number
      const { data: maxUserData, error: maxError } = await supabase
        .from('app_users')
        .select('user_number')
        .order('user_number', { ascending: false })
        .limit(1)
        .single()

      const nextUserNumber = maxUserData ? (maxUserData.user_number + 1) : 1

      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('app_users')
        .insert({
          id: userId,
          user_number: nextUserNumber,
          registration_type: finalRegistrationType,
          points: 0,
          total_points: 0,
          redeemable_points: 0,
          survey_completed: false,
          acquired_stamps: [],
          claimed_rewards: [],
        })
        .select()
        .single()

      if (createError) {
        console.error('[get-user-data] Failed to create user:', createError)
        throw new Error('Failed to create user')
      }

      user = newUser
      console.log('[get-user-data] User created successfully:', user)
    }

    // Get acquired stamps from the array column
    const acquiredBooths = user.acquired_stamps || []

    // Return user data with progress
    const response = {
      user: {
        id: user.id,
        user_number: user.user_number,
        registration_type: user.registration_type,
        survey_completed: user.survey_completed,
        created_at: user.created_at,
        points: user.points,
        total_points: user.total_points,
        redeemable_points: user.redeemable_points,
        acquired_stamps: acquiredBooths,
        claimed_rewards: user.claimed_rewards || [],
      },
      progress: {
        acquiredBooths,
      }
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[get-user-data] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
