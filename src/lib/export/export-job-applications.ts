import * as XLSX from 'xlsx';
import { RESULT_TYPE_LABELS, stageLabel, type TimelineEntryWithApplication } from '@/lib/db/job-application-repo';
import { describeTimelineChange, formatDate, formatDateTime } from '@/lib/format';
import type { JobApplication } from '@/types';

export function exportJobApplicationsToExcel(
  applications: JobApplication[],
  entries: TimelineEntryWithApplication[]
): void {
  const summarySheet = XLSX.utils.json_to_sheet(
    applications.map((app) => ({
      公司: app.company,
      岗位: app.position,
      当前阶段: stageLabel(app),
      投递日期: formatDate(app.appliedDate),
      下一步日期: app.nextActionDate ? formatDateTime(app.nextActionDate) : '',
      结果: app.resultType ? RESULT_TYPE_LABELS[app.resultType] : '',
    }))
  );

  const detailSheet = XLSX.utils.json_to_sheet(
    entries.map((entry) => ({
      公司: entry.company,
      岗位: entry.position,
      变更时间: formatDateTime(entry.eventDate),
      变更内容: describeTimelineChange(entry),
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, '岗位汇总');
  XLSX.utils.book_append_sheet(workbook, detailSheet, '更新明细');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `秋招投递记录-${today}.xlsx`);
}
