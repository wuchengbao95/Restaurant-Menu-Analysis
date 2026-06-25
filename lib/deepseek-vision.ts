import OpenAI from 'openai'

function getClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  })
}

export interface MenuItemExtracted {
  name: string
  category: string
}

export async function extractMenuItems(imageUrl: string): Promise<MenuItemExtracted[]> {
  const client = getClient()

  const response = await client.chat.completions.create({
    model: 'deepseek-vl2',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          {
            type: 'text',
            text: `这是一张餐厅菜单照片（纸质菜单、菜单展示牌等）。

请提取照片中所有菜品名称，并为每道菜分配合适的分类。

分类只能从以下选择：凉菜、热菜、汤类、主食、海鲜、烧烤、饮品、甜品、其他

要求：
- 只提取菜品名称，不要包含价格、克重、备注等信息
- 名称保持原始写法，不要翻译或修改
- 如果无法判断分类，归入"其他"
- 最多返回100个菜品

以JSON数组格式返回，不要任何其他文字：
[{"name":"菜品名","category":"分类"},...]`,
          },
        ] as never,
      },
    ],
    max_tokens: 2000,
    temperature: 0.1,
  })

  const text = response.choices[0].message.content ?? ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('AI返回格式异常')

  const items: MenuItemExtracted[] = JSON.parse(match[0])
  return items.filter((item) => item.name && item.category)
}

export interface IdentifyResult {
  dish_name: string
  leftover_ratio: 'none' | 'little' | 'half' | 'most' | 'all'
  confidence: number
}

export async function identifyLeftover(
  imageUrl: string,
  menuItems: { id: string; name: string; category: string }[]
): Promise<IdentifyResult> {
  const client = getClient()
  const menuList = menuItems.map((m) => `${m.name}（${m.category}）`).join('、')

  const response = await client.chat.completions.create({
    model: 'deepseek-vl2',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
          {
            type: 'text',
            text: `这是一道餐厅菜品收台时拍的照片。

餐厅菜单：${menuList}

请识别：
1. 照片中是菜单里的哪道菜？从菜单中选最接近的一个
2. 盘中剩余程度（none=全部吃完, little=少量剩余约两成, half=约半盘, most=大部分剩约八成, all=几乎未动）

以JSON格式返回，不要任何其他文字：
{"dish_name":"菜单中的菜品名","leftover_ratio":"none|little|half|most|all","confidence":0.0到1.0}`,
          },
        ] as never,
      },
    ],
    max_tokens: 200,
    temperature: 0.1,
  })

  const text = response.choices[0].message.content ?? ''
  const match = text.match(/\{[^}]+\}/)
  if (!match) throw new Error('AI返回格式异常')

  const result = JSON.parse(match[0])
  return {
    dish_name: result.dish_name ?? '',
    leftover_ratio: result.leftover_ratio ?? 'half',
    confidence: typeof result.confidence === 'number' ? result.confidence : 0.8,
  }
}
