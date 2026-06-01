export interface Coach {
  id: string
  name: string
  lineUserId: string
  avatar: string
  phone: string
  specialties: string[]
}

export const coaches: Coach[] = [
  {
    id: "c1",
    name: "陳志豪",
    lineUserId: "Ucoach001",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=陳志豪&backgroundColor=06C755&fontColor=ffffff",
    phone: "0912-345-678",
    specialties: ["TRX", "功能性訓練"],
  },
  {
    id: "c2",
    name: "林美華",
    lineUserId: "Ucoach002",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=林美華&backgroundColor=06C755&fontColor=ffffff",
    phone: "0923-456-789",
    specialties: ["瑜伽", "皮拉提斯"],
  },
]
