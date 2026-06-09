import OpenAI from 'openai'

function getClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  })
}

export interface AnalysisInput {
  restaurantName: string
  periodStart: string
  periodEnd: string
  records: {
    dishName: string
    category: string
    totalRecords: number
    leftoverRate: number
    commonReasons: string[]
    avgTableSize: number
    lunchLeftoverRate: number
    dinnerLeftoverRate: number
  }[]
}

export async function generateAnalysis(input: AnalysisInput): Promise<string> {
  const prompt = buildPrompt(input)

  const client = getClient()
  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: `你是一名专业的餐饮运营顾问，擅长通过剩菜数据发现菜品问题并给出可操作的优化建议。
你的分析要：
1. 直接指出最严重的问题菜品
2. 结合数据给出具体归因
3. 提出可立即执行的优化动作
4. 预测调整后的效果
语言简洁有力，避免废话，像给老板做汇报一样。`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  return response.choices[0].message.content ?? ''
}

function buildPrompt(input: AnalysisInput): string {
  const dishSummaries = input.records
    .sort((a, b) => b.leftoverRate - a.leftoverRate)
    .map(
      (r) =>
        `- ${r.dishName}（${r.category}）：剩余率${(r.leftoverRate * 100).toFixed(0)}%，` +
        `共记录${r.totalRecords}次，平均桌均人数${r.avgTableSize}人，` +
        `午市剩余率${(r.lunchLeftoverRate * 100).toFixed(0)}%，晚市${(r.dinnerLeftoverRate * 100).toFixed(0)}%` +
        (r.commonReasons.length > 0 ? `，客人反馈：${r.commonReasons.join('、')}` : '')
    )
    .join('\n')

  return `餐厅名称：${input.restaurantName}
分析周期：${input.periodStart} 至 ${input.periodEnd}

各菜品剩余情况：
${dishSummaries}

请基于以上数据：
1. 找出3个最需要关注的问题菜品，说明原因
2. 分析剩余的核心原因（分量/口味/上菜时机/客群等）
3. 给出每道问题菜品的具体优化方案（可执行，不要泛泛而谈）
4. 建议优先调整的顺序和理由
5. 说明哪些菜是表现良好的，建议如何推广`
}
