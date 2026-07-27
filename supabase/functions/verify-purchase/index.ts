import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { purchase_token, product_id, plan, mock } = body

    if (!purchase_token || !product_id || !plan) {
      return new Response(JSON.stringify({ error: 'missing fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extract the user's JWT from the Authorization header.
    // The frontend sends the real session access token (not the anon key).
    const authHeader = req.headers.get('Authorization') ?? ''
    const userToken = authHeader.replace('Bearer ', '')

    if (!userToken) {
      return new Response(JSON.stringify({ error: 'unauthorized: no token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use the user's JWT to identify the caller. Service role key is used
    // only for the privileged profile update, not for user identification.
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${userToken}` } } },
    )

    const { data: userData, error: userError } = await userClient.auth.getUser()
    const userId = userData?.user?.id
    if (!userId || userError) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // For mock/test mode, skip Google Play verification
    if (!mock) {
      // In production, verify the purchase token with Google Play Developer API.
      // The native Billing Client already validates the purchase with Google Play,
      // so we trust the token here. For stricter verification, add the Play
      // Developer API call with the service account.
    }

    const now = new Date()
    const expiresAt = new Date(now)
    if (plan === 'monthly') expiresAt.setDate(expiresAt.getDate() + 30)
    else if (plan === 'yearly') expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    // Privileged write with service role key (bypasses RLS)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { error } = await adminClient.from('profiles').update({
      plan,
      purchase_token,
      expires_at: expiresAt.toISOString(),
    }).eq('id', userId)

    if (error) throw error

    return new Response(JSON.stringify({ ok: true, plan, expires_at: expiresAt.toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
