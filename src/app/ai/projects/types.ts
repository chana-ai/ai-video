export interface ProjectFormData {
    name: string;
    aspect: string;
    theme: string;
    style: string;
    audiences: string;
    narration: boolean;
    purpose: string;
  }
  
export interface ScriptGenerationData {
  type: 'subject' | 'script';
  content: string;
  characters: string;
  scenes: string;
}
  
export interface ProjectMetaInfo {
  name?: string;
  audience?: string;
  theme?: string;
  style?: string;
  purpose?: string;
  aspect?: string;
  narration?: boolean;
}



export const themeMap = {
  advertise: {
    name: "广告",
    description: "请补充额外的一些信息，比如产品简洁，最重要的功能和卖点，产品使用场景，解决的痛点等"
  },
  story: {
    name: "故事",
    description: "请补充额外的一些信息，比如故事的背景，人物关系，故事的情节，故事的结局等"
  },
  education: {
    name: "科普",
    description: "请补充额外的一些信息，比如科普的目标，科普的内容，科普的方式，科普的预期效果等"
  },
  ip_channel: {
    name: "个人IP",
    description: "请补充额外的一些信息，比如个人IP的目标，个人IP的内容，个人IP的方式，个人IP的预期效果等"
  },
  // other: {
  //   name: "其他",
  //   description: "请补充额外的一些信息，比如其他的目标，其他的内容，其他的方式，其他的预期效果等"
  // }
}

export const styleMap = {
  cinematic: "影视",
  disney: "迪士尼",
  pixar: "皮克斯",
  dreamworks: "梦工厂",
  other: "其他"
}
