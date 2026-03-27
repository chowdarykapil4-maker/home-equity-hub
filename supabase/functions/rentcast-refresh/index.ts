import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get settings
    const { data: settings, error: settingsErr } = await supabase
      .from('auto_refresh_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (settingsErr || !settings) {
      return new Response(JSON.stringify({ error: 'No settings found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!settings.rentcast_api_key) {
      return new Response(JSON.stringify({ error: 'No RentCast API key configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body for address
    const body = await req.json();
    const address = body.address;

    if (!address) {
      return new Response(JSON.stringify({ error: 'Address is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = settings.rentcast_api_key;
    const encodedAddress = encodeURIComponent(address);
    let apiCallCount = 0;

    // Call RentCast AVM Value
    let avmValue = null;
    try {
      const avmRes = await fetch(
        `https://api.rentcast.io/v1/avm/value?address=${encodedAddress}`,
        { headers: { 'X-Api-Key': apiKey, Accept: 'application/json' } }
      );
      if (avmRes.ok) {
        const avmData = await avmRes.json();
        avmValue = avmData.price || avmData.priceRangeLow || null;
      }
      apiCallCount++;
    } catch (e) {
      console.error('AVM value call failed:', e);
    }

    // Call RentCast Long-term Rent
    let rentEstimate = null;
    try {
      const rentRes = await fetch(
        `https://api.rentcast.io/v1/avm/rent/long-term?address=${encodedAddress}`,
        { headers: { 'X-Api-Key': apiKey, Accept: 'application/json' } }
      );
      if (rentRes.ok) {
        const rentData = await rentRes.json();
        rentEstimate = rentData.rent || rentData.rentRangeLow || null;
      }
      apiCallCount++;
    } catch (e) {
      console.error('Rent estimate call failed:', e);
    }

    // Call RentCast Market data
    let marketData = null;
    try {
      const marketRes = await fetch(
        `https://api.rentcast.io/v1/market?address=${encodedAddress}`,
        { headers: { 'X-Api-Key': apiKey, Accept: 'application/json' } }
      );
      if (marketRes.ok) {
        marketData = await marketRes.json();
      }
      apiCallCount++;
    } catch (e) {
      console.error('Market data call failed:', e);
    }

    // Update refresh tracking
    const now = new Date().toISOString().split('T')[0];
    const currentMonthStart = now.substring(0, 7) + '-01';
    const resetMonth = settings.api_calls_month_start !== currentMonthStart;

    await supabase
      .from('auto_refresh_settings')
      .update({
        last_auto_refresh_date: now,
        api_calls_this_month: resetMonth ? apiCallCount : (settings.api_calls_this_month + apiCallCount),
        api_calls_month_start: currentMonthStart,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'default');

    return new Response(JSON.stringify({
      success: true,
      avmValue,
      rentEstimate,
      marketData,
      apiCallsUsed: apiCallCount,
      refreshDate: now,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('RentCast refresh error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
