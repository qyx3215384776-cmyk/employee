import type { InterviewTip, JobApplication, TimelineEntry, TimelineEntryType } from '@/types';
import { getDb } from './dexie-client';

function daysFromNow(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function dateTimeFromNow(offsetDays: number, hour: number, minute: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function buildDemoApplications(): JobApplication[] {
  const now = new Date().toISOString();
  return [
    // ---- 已投递（3 条）----
    {
      id: 'demo-01',
      company: '小红书',
      position: '前端开发工程师',
      mainStage: 'applied',
      appliedDate: daysFromNow(-3),
      source: '官网',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-02',
      company: '网易',
      position: '游戏客户端开发',
      mainStage: 'applied',
      appliedDate: daysFromNow(-5),
      source: 'Boss直聘',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-03',
      company: '拼多多',
      position: '后端开发工程师',
      mainStage: 'applied',
      appliedDate: daysFromNow(-1),
      source: '内推',
      createdAt: now,
      updatedAt: now,
    },

    // ---- 笔试阶段（2 条）----
    {
      id: 'demo-04',
      company: '美团',
      position: '后端开发工程师',
      mainStage: 'written_test',
      appliedDate: daysFromNow(-14),
      nextActionDate: dateTimeFromNow(2, 14, 0),
      source: '官网',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-05',
      company: '百度',
      position: '搜索算法工程师',
      mainStage: 'written_test',
      appliedDate: daysFromNow(-10),
      nextActionDate: dateTimeFromNow(5, 10, 0),
      source: '校招官网',
      createdAt: now,
      updatedAt: now,
    },

    // ---- 面试中（4 条）----
    {
      id: 'demo-06',
      company: '字节跳动',
      position: '前端开发工程师',
      mainStage: 'interviewing',
      subStage: '二面',
      appliedDate: daysFromNow(-21),
      nextActionDate: dateTimeFromNow(1, 15, 30),
      source: '内推',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-07',
      company: '腾讯',
      position: '后端开发工程师',
      mainStage: 'interviewing',
      subStage: '一面',
      appliedDate: daysFromNow(-18),
      nextActionDate: dateTimeFromNow(3, 10, 0),
      source: '官网',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-08',
      company: '阿里巴巴',
      position: '全栈开发工程师',
      mainStage: 'interviewing',
      subStage: 'HR面',
      appliedDate: daysFromNow(-25),
      nextActionDate: dateTimeFromNow(4, 14, 0),
      source: '内推',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-09',
      company: '京东',
      position: '前端开发工程师',
      mainStage: 'interviewing',
      subStage: '三面',
      appliedDate: daysFromNow(-20),
      source: '校招官网',
      createdAt: now,
      updatedAt: now,
    },

    // ---- 有结果（6 条）----
    {
      id: 'demo-10',
      company: '华为',
      position: '软件开发工程师',
      mainStage: 'result',
      resultType: 'offer',
      appliedDate: daysFromNow(-30),
      source: '校招官网',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-11',
      company: '米哈游',
      position: '游戏引擎开发',
      mainStage: 'result',
      resultType: 'offer',
      appliedDate: daysFromNow(-28),
      source: '官网',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-12',
      company: '快手',
      position: '推荐算法工程师',
      mainStage: 'result',
      resultType: 'rejected',
      appliedDate: daysFromNow(-22),
      source: 'Boss直聘',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-13',
      company: '滴滴',
      position: '后端开发工程师',
      mainStage: 'result',
      resultType: 'rejected',
      appliedDate: daysFromNow(-19),
      source: '官网',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-14',
      company: 'OPPO',
      position: '系统开发工程师',
      mainStage: 'result',
      resultType: 'rejected',
      appliedDate: daysFromNow(-16),
      source: '校招官网',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-15',
      company: '商汤科技',
      position: 'CV 算法实习转正',
      mainStage: 'result',
      resultType: 'withdrawn',
      appliedDate: daysFromNow(-24),
      source: '实验室推荐',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

interface TimelineBeat {
  offsetDays: number;
  hour?: number;
  minute?: number;
  type: TimelineEntryType;
  from?: string;
  to: string;
  note?: string;
}

// One narrative per application: applied-only records get a single creation
// beat, further-along records get the stage progression that led there, and
// records with a nextActionDate end with the upcoming written_test/interview
// slot. Offsets are relative to today so the demo always looks fresh.
const TIMELINE_BEATS: Record<string, TimelineBeat[]> = {
  'demo-01': [{ offsetDays: -3, type: 'status_change', to: '已投递', note: '创建岗位记录' }],
  'demo-02': [{ offsetDays: -5, type: 'status_change', to: '已投递', note: '创建岗位记录' }],
  'demo-03': [{ offsetDays: -1, type: 'status_change', to: '已投递', note: '创建岗位记录' }],

  'demo-04': [
    { offsetDays: -14, type: 'status_change', to: '已投递', note: '创建岗位记录' },
    { offsetDays: -7, type: 'status_change', from: '已投递', to: '笔试中' },
    { offsetDays: 2, hour: 14, type: 'interview_scheduled', to: '笔试中', note: '笔试' },
  ],
  'demo-05': [
    { offsetDays: -10, type: 'status_change', to: '已投递', note: '创建岗位记录' },
    { offsetDays: -5, type: 'status_change', from: '已投递', to: '笔试中' },
    { offsetDays: 5, hour: 10, type: 'interview_scheduled', to: '笔试中', note: '笔试' },
  ],

  'demo-06': [
    { offsetDays: -21, type: 'status_change', to: '已投递', note: '创建岗位记录' },
    { offsetDays: -18, type: 'status_change', from: '已投递', to: '面试中·一面' },
    { offsetDays: -3, type: 'status_change', from: '面试中·一面', to: '面试中·二面' },
    { offsetDays: 1, hour: 15, minute: 30, type: 'interview_scheduled', to: '面试中·二面', note: '二面' },
  ],
  'demo-07': [
    { offsetDays: -18, type: 'status_change', to: '已投递', note: '创建岗位记录' },
    { offsetDays: -13, type: 'status_change', from: '已投递', to: '笔试中' },
    { offsetDays: -8, type: 'status_change', from: '笔试中', to: '面试中·一面' },
    { offsetDays: 3, hour: 10, type: 'interview_scheduled', to: '面试中·一面', note: '一面' },
  ],
  'demo-08': [
    { offsetDays: -25, type: 'status_change', to: '已投递', note: '创建岗位记录' },
    { offsetDays: -21, type: 'status_change', from: '已投递', to: '面试中·一面' },
    { offsetDays: -15, type: 'status_change', from: '面试中·一面', to: '面试中·二面' },
    { offsetDays: -7, type: 'status_change', from: '面试中·二面', to: '面试中·HR面' },
    { offsetDays: 4, hour: 14, type: 'interview_scheduled', to: '面试中·HR面', note: 'HR面' },
  ],
  'demo-09': [
    { offsetDays: -20, type: 'status_change', to: '已投递', note: '创建岗位记录' },
    { offsetDays: -15, type: 'status_change', from: '已投递', to: '笔试中' },
    { offsetDays: -11, type: 'status_change', from: '笔试中', to: '面试中·一面' },
    { offsetDays: -7, type: 'status_change', from: '面试中·一面', to: '面试中·二面' },
    { offsetDays: -3, type: 'status_change', from: '面试中·二面', to: '面试中·三面' },
  ],

  'demo-10': [
    { offsetDays: -30, type: 'status_change', to: '已投递', note: '创建岗位记录' },
    { offsetDays: -24, type: 'status_change', from: '已投递', to: '面试中' },
    { offsetDays: -8, type: 'status_change', from: '面试中', to: '结果·Offer' },
  ],
  'demo-11': [
    { offsetDays: -28, type: 'status_change', to: '已投递', note: '创建岗位记录' },
    { offsetDays: -21, type: 'status_change', from: '已投递', to: '面试中' },
    { offsetDays: -6, type: 'status_change', from: '面试中', to: '结果·Offer' },
  ],
  'demo-12': [
    { offsetDays: -22, type: 'status_change', to: '已投递', note: '创建岗位记录' },
    { offsetDays: -16, type: 'status_change', from: '已投递', to: '面试中' },
    { offsetDays: -9, type: 'status_change', from: '面试中', to: '结果·未通过' },
  ],
  'demo-13': [
    { offsetDays: -19, type: 'status_change', to: '已投递', note: '创建岗位记录' },
    { offsetDays: -13, type: 'status_change', from: '已投递', to: '面试中' },
    { offsetDays: -5, type: 'status_change', from: '面试中', to: '结果·未通过' },
  ],
  'demo-14': [
    { offsetDays: -16, type: 'status_change', to: '已投递', note: '创建岗位记录' },
    { offsetDays: -11, type: 'status_change', from: '已投递', to: '面试中' },
    { offsetDays: -4, type: 'status_change', from: '面试中', to: '结果·未通过' },
  ],
  'demo-15': [
    { offsetDays: -24, type: 'status_change', to: '已投递', note: '创建岗位记录' },
    { offsetDays: -18, type: 'status_change', from: '已投递', to: '面试中' },
    { offsetDays: -10, type: 'status_change', from: '面试中', to: '结果·已婉拒', note: '个人决定婉拒' },
  ],
};

export function buildDemoTimelineEntries(): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  let counter = 0;

  for (const [jobApplicationId, beats] of Object.entries(TIMELINE_BEATS)) {
    for (const beat of beats) {
      counter += 1;
      const eventDate = dateTimeFromNow(beat.offsetDays, beat.hour ?? 9, beat.minute ?? 0);
      entries.push({
        id: `demo-timeline-${counter}`,
        jobApplicationId,
        type: beat.type,
        fromStage: beat.from,
        toStage: beat.to,
        eventDate,
        note: beat.note,
        createdAt: eventDate,
      });
    }
  }

  return entries;
}

export function buildDemoInterviewTips(): InterviewTip[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'demo-tip-01',
      jobApplicationId: 'demo-06',
      content:
        '一面问了 React fiber 的原理、虚拟 DOM diff 算法，还有一道 LRU Cache 的手撕。面试官人很好，追问比较深但会引导。建议提前复习 React 源码相关和常见数据结构。',
      tags: ['前端', '算法', '字节跳动'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-tip-02',
      jobApplicationId: 'demo-10',
      content:
        '综合面聊了项目经历和职业规划，技术面重点考察了操作系统和网络基础。华为的流程比较长，从投递到 offer 花了将近一个月。准备的时候多看看计算机基础。',
      tags: ['综合面', '计算机基础', '华为'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-tip-03',
      jobApplicationId: 'demo-12',
      content:
        '挂在了算法面，出了一道动态规划的变体题，当时没有理清状态转移方程。反思：DP 类题目还是练得太少，尤其是区间 DP 和状态压缩。下次遇到先画状态表。',
      tags: ['算法', '动态规划', '复盘'],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export async function seedDemoData(): Promise<void> {
  const db = getDb();

  const existingCount = await db.jobApplications.count();
  if (existingCount > 0) return;

  const applications = buildDemoApplications();
  const timelineEntries = buildDemoTimelineEntries();
  const interviewTips = buildDemoInterviewTips();

  await db.transaction('rw', db.jobApplications, db.timelineEntries, db.interviewTips, async () => {
    await db.jobApplications.bulkAdd(applications);
    await db.timelineEntries.bulkAdd(timelineEntries);
    await db.interviewTips.bulkAdd(interviewTips);
  });
}

export async function resetDemoData(): Promise<void> {
  const db = getDb();
  await db.transaction('rw', db.jobApplications, db.timelineEntries, db.interviewTips, async () => {
    await db.jobApplications.clear();
    await db.timelineEntries.clear();
    await db.interviewTips.clear();
  });
  await seedDemoData();
}
