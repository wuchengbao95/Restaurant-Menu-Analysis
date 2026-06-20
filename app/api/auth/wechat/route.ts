export const runtime = 'edge'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function openidToEmail(openid: string) {
  return `wx_${openid}@wx.app`
}

async function openidToPassword(openid: string): Promise<string> {
  const secret = process.env.WECHAT_APP_SECRET!
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(openid))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

async function adminFetch(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res
}

async function signIn(email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  })
  return res.json()
}

async function createUser(email: string, password: string) {
  const res = await adminFetch('/auth/v1/admin/users', 'POST', {
    email,
    password,
    email_confirm: true,
  })
  const data = await res.json()
  if (res.ok) return { user: data, error: null }
  return { user: null, error: data }
}

async function updateUserPassword(userId: string, password: string) {
  await adminFetch(`/auth/v1/admin/users/${userId}`, 'PUT', { password })
}

async function getProfileById(userId: string) {
  const res = await adminFetch(
    `/rest/v1/user_profiles?id=eq.${userId}&select=id&limit=1`
  )
  const rows: any[] = await res.json()
  return rows?.[0] ?? null
}

async function getUserByEmail(email: string) {
  const res = await adminFetch(
    `/auth/v1/admin/users?email=${encodeURIComponent(email)}&limit=1`
  )
  const data = await res.json()
  return data?.users?.[0] ?? null
}

export async function POST(request: Request) {
  const { code } = await request.json()
  if (!code) {
    return Response.json({ error: '参数缺失' }, { status: 400 })
  }

  // 1. 换取 openid
  const wxRes = await fetch(
    `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WECHAT_APPID}&secret=${process.env.WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`
  )
  const wxData = await wxRes.json()

  if (wxData.errcode) {
    console.error('WeChat jscode2session error:', wxData)
    return Response.json({ error: '微信登录失败，请重试' }, { status: 400 })
  }

  const { openid } = wxData
  const email = openidToEmail(openid)
  const password = await openidToPassword(openid)

  // 2. 尝试创建用户
  const { user: newUser, error: createError } = await createUser(email, password)

  let userId: string
  let isNewUser: boolean

  if (newUser) {
    userId = newUser.id
    isNewUser = true
  } else {
    // 用户已存在，尝试直接登录
    const session = await signIn(email, password)
    if (session?.access_token) {
      const profile = await getProfileById(session.user.id)
      return Response.json({
        ok: true,
        userId: session.user.id,
        isNewUser: !profile,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
    }

    // 旧密码，找到用户 ID 后更新密码
    const existingUser = await getUserByEmail(email)
    if (!existingUser) {
      console.error('createUser error:', createError)
      return Response.json({ error: '登录失败，请重试' }, { status: 500 })
    }
    userId = existingUser.id
    await updateUserPassword(userId, password)

    const profile = await getProfileById(userId)
    isNewUser = !profile
  }

  // 3. 登录拿 token
  const session = await signIn(email, password)
  if (!session?.access_token) {
    return Response.json({ error: '获取登录凭证失败，请重试' }, { status: 500 })
  }

  return Response.json({
    ok: true,
    userId,
    isNewUser,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })
}
