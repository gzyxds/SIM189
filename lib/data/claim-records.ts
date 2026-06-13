/**
 * 号卡领取虚拟数据
 * 用于首页底部滚动展示，格式：手机号脱敏 + 姓名脱敏 + 领取成功
 */

export interface ClaimRecord {
  /** 脱敏手机号，如 135****9980 */
  phone: string;
  /** 脱敏姓名，如 吴** */
  name: string;
  /** 领取的套餐名称 */
  plan: string;
}

export const CLAIM_RECORDS: ClaimRecord[] = [
  { phone: "135****9980", name: "吴**", plan: "移动29元套餐" },
  { phone: "158****2341", name: "李**", plan: "电信19元套餐" },
  { phone: "187****6673", name: "张**", plan: "联通39元套餐" },
  { phone: "139****4452", name: "王**", plan: "移动19元套餐" },
  { phone: "176****8821", name: "陈**", plan: "广电29元套餐" },
  { phone: "152****3309", name: "刘**", plan: "电信39元套餐" },
  { phone: "183****7745", name: "赵**", plan: "移动29元套餐" },
  { phone: "137****5561", name: "黄**", plan: "联通19元套餐" },
  { phone: "159****0028", name: "周**", plan: "电信19元套餐" },
  { phone: "188****4417", name: "林**", plan: "移动39元套餐" },
  { phone: "130****6693", name: "何**", plan: "联通29元套餐" },
  { phone: "177****2235", name: "郑**", plan: "广电19元套餐" },
  { phone: "153****8874", name: "徐**", plan: "移动19元套餐" },
  { phone: "186****1102", name: "孙**", plan: "电信29元套餐" },
  { phone: "131****7756", name: "高**", plan: "联通39元套餐" },
  { phone: "155****3318", name: "朱**", plan: "移动29元套餐" },
  { phone: "189****9943", name: "胡**", plan: "广电29元套餐" },
  { phone: "136****4480", name: "马**", plan: "电信19元套餐" },
  { phone: "178****6629", name: "曹**", plan: "联通19元套餐" },
  { phone: "157****2267", name: "罗**", plan: "移动39元套餐" },
];
