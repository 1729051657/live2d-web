import type { ModelManifest, TipText, WidgetTipsConfig } from "./types.js";

export const defaultIdleMessages = [
  "好久不见，日子过得好快呢……",
  "嗨，快来和我玩一会儿吧。",
  "别一直盯着屏幕啦，记得活动活动肩膀。",
  "我会在这里一直等你回来。"
];

export const defaultTips: WidgetTipsConfig = {
  mouseover: [
    {
      selector: ".l2d-widget__canvas",
      text: ["干嘛呢你，快把手拿开。", "鼠标放错地方了吧。", "想和我打招呼吗？"]
    },
    {
      selector: '[data-live2d-action="talk"]',
      text: ["猜猜我要说什么？", "点我就会讲一句新台词。"]
    },
    {
      selector: '[data-live2d-action="next"]',
      text: ["要切换到下一个模型吗？", "看看我的新朋友吧。"]
    },
    {
      selector: '[data-live2d-action="shuffle"]',
      text: ["来点随机惊喜？", "下一位会是谁呢？"]
    },
    {
      selector: '[data-live2d-action="photo"]',
      text: ["准备拍照了吗？", "记得选一个好看的表情。"]
    },
    {
      selector: '[data-live2d-action="info"]',
      text: ["想知道这个插件怎么接入吗？", "点这里可以打开说明链接。"]
    },
    {
      selector: '[data-live2d-action="hide"]',
      text: ["要暂时和我说再见了吗？", "下次记得早点叫我出来。"]
    }
  ],
  click: [
    {
      selector: ".l2d-widget__canvas",
      text: ["是……是不小心碰到了吧？", "别摸我，我会害羞的。", "再点一下我可要抗议了。"]
    },
    {
      selector: '[data-live2d-action="talk"]',
      text: ["这次轮到我说话啦。"]
    },
    {
      selector: '[data-live2d-action="next"]',
      text: ["正在切换到下一个模型。"]
    },
    {
      selector: '[data-live2d-action="shuffle"]',
      text: ["让我给你随机挑一个。"]
    }
  ],
  seasons: [
    { date: "01/01", text: "<span>元旦</span>快乐，{year} 年也请多关照。" },
    { date: "02/14", text: "<span>情人节</span>到了，今天也要开心一点。" },
    { date: "03/08", text: "今天是<span>国际妇女节</span>。" },
    { date: "04/01", text: "今天是<span>愚人节</span>，要小心一点哦。" },
    { date: "05/01", text: "<span>劳动节</span>快乐，辛苦啦。" },
    { date: "06/01", text: "<span>儿童节</span>快乐，偶尔幼稚一点也没关系。" },
    { date: "09/10", text: "<span>教师节</span>，别忘了感谢老师。" },
    { date: "10/01", text: "<span>国庆节</span>快乐。" },
    { date: "12/20-12/31", text: "这几天是<span>圣诞节</span>季，记得给生活一点仪式感。" }
  ]
};

export const defaultDemoManifest: ModelManifest = {
  models: ["models/uiharu", "models/wed_16"],
  messages: ["初春饰利登场。", "婚纱版 wed_16 已经准备好了。"]
};

export function resolveTipText(text: TipText): string {
  return Array.isArray(text)
    ? text[Math.floor(Math.random() * text.length)]
    : text;
}
