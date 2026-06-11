import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()
  return { supabase, user, profile }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, profile } = await getProfile()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!profile) return NextResponse.json({ error: 'No restaurant' }, { status: 404 })

  const { id } = await params
  const body = await request.json()

  const allowed = ['meal_period', 'table_size', 'leftover_ratio', 'reason_tags', 'notes', 'record_date']
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { data, error } = await supabase
    .from('leftover_records')
    .update(updates)
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
    .select('*, menu_item:menu_items(id, name, category)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '记录不存在或无权限' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, profile } = await getProfile()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!profile) return NextResponse.json({ error: 'No restaurant' }, { status: 404 })

  const { id } = await params

  const { error } = await supabase
    .from('leftover_records')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
