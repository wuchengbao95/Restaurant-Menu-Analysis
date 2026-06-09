import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'No restaurant' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')

  let query = supabase
    .from('leftover_records')
    .select('*, menu_item:menu_items(id, name, category)')
    .eq('restaurant_id', profile.restaurant_id)
    .order('record_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (startDate) query = query.gte('record_date', startDate)
  if (endDate) query = query.lte('record_date', endDate)

  const { data, error } = await query.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'No restaurant' }, { status: 404 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('leftover_records')
    .insert({
      ...body,
      restaurant_id: profile.restaurant_id,
      recorded_by: user.id,
    })
    .select('*, menu_item:menu_items(id, name, category)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
