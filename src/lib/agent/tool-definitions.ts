import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export const agentTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_applications',
      description:
        '搜索用户的投递记录。可以按公司名、岗位名、阶段等条件筛选。当用户问"我投了哪些公司""腾讯那个到哪一步了"时使用。',
      parameters: {
        type: 'object',
        properties: {
          company: {
            type: 'string',
            description: '公司名关键词（模糊匹配），如"字节""腾讯"',
          },
          position: {
            type: 'string',
            description: '岗位名关键词（模糊匹配），如"后端""产品"',
          },
          mainStage: {
            type: 'string',
            enum: ['applied', 'written_test', 'interviewing', 'result'],
            description: '按阶段筛选',
          },
          resultType: {
            type: 'string',
            enum: ['offer', 'rejected', 'withdrawn'],
            description: '按结果类型筛选（仅当 mainStage 为 result 时有效）',
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_statistics',
      description: '获取投递统计数据。当用户问"我总共投了多少""通过率多少""给我一个总结"时使用。',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_application',
      description: '新增一条投递记录。当用户说"我投了XX公司的XX岗位"且该公司+岗位组合不存在时使用。',
      parameters: {
        type: 'object',
        properties: {
          company: { type: 'string', description: '公司名称' },
          position: { type: 'string', description: '岗位名称' },
          mainStage: {
            type: 'string',
            enum: ['applied', 'written_test', 'interviewing', 'result'],
            description: '当前阶段，默认 applied',
          },
          subStage: {
            type: 'string',
            description: '面试子阶段，如"一面""二面""HR面"，仅当 mainStage 为 interviewing 时填写',
          },
          resultType: {
            type: 'string',
            enum: ['offer', 'rejected', 'withdrawn'],
            description: '结果类型，仅当 mainStage 为 result 时填写',
          },
          nextActionDate: {
            type: 'string',
            description: '下一步日期时间，ISO 8601 格式，如 "2026-08-25T14:00:00+08:00"',
          },
          source: {
            type: 'string',
            description: '投递渠道，如"官网""内推""Boss直聘"',
          },
        },
        required: ['company', 'position'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_application',
      description:
        '更新一条已有的投递记录的阶段或信息。当用户说"腾讯那个进面试了""字节挂了"时使用。必须先用 search_applications 确认目标记录存在。',
      parameters: {
        type: 'object',
        properties: {
          applicationId: {
            type: 'string',
            description: '要更新的投递记录 ID（从 search_applications 结果中获取）',
          },
          mainStage: {
            type: 'string',
            enum: ['applied', 'written_test', 'interviewing', 'result'],
            description: '新的阶段',
          },
          subStage: {
            type: 'string',
            description: '面试子阶段',
          },
          resultType: {
            type: 'string',
            enum: ['offer', 'rejected', 'withdrawn'],
            description: '结果类型',
          },
          nextActionDate: {
            type: 'string',
            description: '下一步日期时间，ISO 8601 格式',
          },
          source: {
            type: 'string',
            description: '投递渠道',
          },
        },
        required: ['applicationId'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_upcoming_events',
      description: '获取即将到来的面试、笔试等事件。当用户问"接下来有什么安排""这周有面试吗"时使用。',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: '查询未来多少天内的事件，默认 7',
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
];
