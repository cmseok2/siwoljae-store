import type { Metadata } from "next";
import "./globals.css";
import "./payment.css";
export const metadata:Metadata={metadataBase:new URL("https://commerce-store.cmsuk93.chatgpt.site"),title:"커머스 스토어",description:"삶의 흐름을 읽는 프리미엄 사주 큐레이션, 시월재",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"},openGraph:{title:"시월재 | 프리미엄 사주 큐레이션",description:"당신의 시간을 읽고, 더 나은 내일을 엽니다.",images:[{url:"/og.png",width:1200,height:630,alt:"시월재 — 당신의 시간을 읽고, 더 나은 내일을 엽니다."}]},twitter:{card:"summary_large_image",title:"시월재 | 프리미엄 사주 큐레이션",description:"당신의 시간을 읽고, 더 나은 내일을 엽니다.",images:["/og.png"]}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><body>{children}</body></html>}
