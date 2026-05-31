import type { Metadata } from "next";
import DonateLanding from "./DonateLanding";

export const metadata: Metadata = {
  title: "捐血救人一命 | 你的 250cc 能給別人第二次機會",
  description:
    "一次捐血最多能救 3 條命。250cc，15 分鐘，走進附近捐血點，就是那麼簡單。立刻查詢全台捐血活動、贈品與捐血站地點。",
  openGraph: {
    title: "捐血救人一命 | 你的 250cc 能給別人第二次機會",
    description:
      "一次捐血最多能救 3 條命。250cc，15 分鐘，走進附近捐血點，就是那麼簡單。",
    type: "website",
  },
};

export default function DonatePage() {
  return <DonateLanding />;
}
