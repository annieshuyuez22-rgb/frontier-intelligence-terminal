import { after } from "next/server";
import { executeRefreshJob } from "@/lib/job-engine";

export function scheduleRefreshExecution(jobId: string): void {
  after(async () => {
    try {
      await executeRefreshJob(jobId);
    } catch (error) {
      console.error("后台刷新执行失败", error instanceof Error ? error.message : "未知错误");
    }
  });
}
