import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { listJobsForUser, publicRefreshJob } from "@/lib/job-engine";
import { queryLimit, runApi } from "../_lib/http";

export async function GET(request: Request): Promise<Response> {
  request.headers.get("user-agent");
  return runApi(async () => {
    const user = await requireUser();
    const jobs = await listJobsForUser(user.id, queryLimit(request));
    return NextResponse.json({ jobs: jobs.map(publicRefreshJob) });
  });
}
