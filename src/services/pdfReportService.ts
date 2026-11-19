import { jsPDF } from 'jspdf';
import { TaskItem, UserProfile } from '../types/task';
import { ProductivityInsightsResponse } from './genieService';

export interface WeeklyBarPoint {
  day: string;
  dateStr: string;
  total: number;
  completed: number;
  focusMinutes: number;
  isCurrent: boolean;
}

export interface PdfReportInput {
  currentUser: UserProfile;
  timeRangeLabel: string;
  tasks: TaskItem[];
  metrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    overdueTasks: number;
    completionPercentage: number;
    onTimePercentage: number;
    totalFocusMinutes: number;
    totalFocusHours: string;
    efficiencyScore: number;
    highPriorityCount: number;
    mediumPriorityCount: number;
    lowPriorityCount: number;
  };
  weeklyData: WeeklyBarPoint[];
  categoryBreakdown: Record<string, { count: number; minutes: number }>;
  aiInsights: ProductivityInsightsResponse | null;
  includeAiInsights?: boolean;
  includeTaskLedger?: boolean;
}

const drawVectorArc = (
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number,
  lineWidth: number,
  rgb: [number, number, number]
) => {
  if (Math.abs(endDeg - startDeg) < 0.5) return;
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  doc.setLineWidth(lineWidth);
  doc.setLineCap('round');

  const steps = Math.max(12, Math.ceil(Math.abs(endDeg - startDeg) / 3));
  const stepAngle = (endDeg - startDeg) / steps;

  for (let i = 0; i < steps; i++) {
    const a1 = ((startDeg + i * stepAngle) * Math.PI) / 180;
    const a2 = ((startDeg + (i + 1) * stepAngle) * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy + radius * Math.sin(a1);
    const x2 = cx + radius * Math.cos(a2);
    const y2 = cy + radius * Math.sin(a2);
    doc.line(x1, y1, x2, y2);
  }
};

export class PdfReportService {
  static buildPerformancePdf(input: PdfReportInput): jsPDF {
    const {
      currentUser,
      timeRangeLabel,
      tasks,
      metrics,
      weeklyData,
      categoryBreakdown,
      aiInsights,
      includeAiInsights = true,
      includeTaskLedger = true,
    } = input;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const todayFormatted = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // ------------------------------------------------------------------
    // 1. HEADER BANNER
    // ------------------------------------------------------------------
    doc.setFillColor(9, 9, 11); // zinc-950
    doc.rect(0, 0, pageWidth, 34, 'F');

    // Brand monogram box
    doc.setFillColor(39, 39, 42); // zinc-800
    doc.roundedRect(margin, 8, 12, 12, 2.5, 2.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TG', margin + 6, 15.5, { align: 'center' });

    // Title & Metadata
    doc.setFontSize(15);
    doc.text('Task Genie — Performance Report', margin + 16, 13.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(161, 161, 170); // zinc-400
    doc.text(
      `Prepared for ${currentUser.name} (${currentUser.title})  ·  Period: ${timeRangeLabel}  ·  ${todayFormatted}`,
      margin + 16,
      20
    );

    // Right Efficiency Index Badge
    doc.setFillColor(24, 24, 27);
    doc.setDrawColor(63, 63, 70);
    doc.roundedRect(pageWidth - margin - 42, 8.5, 42, 17, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(161, 161, 170);
    doc.text('EFFICIENCY INDEX', pageWidth - margin - 21, 13.5, { align: 'center' });
    doc.setFontSize(13);
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text(`${metrics.efficiencyScore} / 100`, pageWidth - margin - 21, 21.5, { align: 'center' });

    let y = 41;

    // ------------------------------------------------------------------
    // 2. KPI SUMMARY CARDS ROW (4 Cards)
    // ------------------------------------------------------------------
    const kpiGap = 3.5;
    const kpiWidth = (contentWidth - kpiGap * 3) / 4;
    const kpiCards = [
      {
        label: 'COMPLETION RATE',
        value: `${metrics.completionPercentage}%`,
        sub: `${metrics.completedTasks} of ${metrics.totalTasks} tasks`,
        accent: [16, 185, 129] as [number, number, number],
      },
      {
        label: 'ON-TIME DELIVERY',
        value: `${metrics.onTimePercentage}%`,
        sub: `${metrics.overdueTasks} overdue items`,
        accent: metrics.overdueTasks > 0 ? ([244, 63, 94] as [number, number, number]) : ([16, 185, 129] as [number, number, number]),
      },
      {
        label: 'DEEP FOCUS LOGGED',
        value: `${metrics.totalFocusHours}h`,
        sub: `${metrics.totalFocusMinutes} total mins`,
        accent: [245, 158, 11] as [number, number, number],
      },
      {
        label: 'ACTIVE WORKLOAD',
        value: `${metrics.inProgressTasks + metrics.todoTasks}`,
        sub: `${metrics.inProgressTasks} active · ${metrics.todoTasks} queued`,
        accent: [99, 102, 241] as [number, number, number],
      },
    ];

    kpiCards.forEach((card, idx) => {
      const cx = margin + idx * (kpiWidth + kpiGap);
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(228, 228, 231);
      doc.roundedRect(cx, y, kpiWidth, 22, 2.5, 2.5, 'FD');

      // Top accent bar
      doc.setFillColor(card.accent[0], card.accent[1], card.accent[2]);
      doc.rect(cx + 3, y + 2.5, 10, 1.1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(113, 113, 122);
      doc.text(card.label, cx + 3, y + 7.5);

      doc.setFontSize(13);
      doc.setTextColor(24, 24, 27);
      doc.text(card.value, cx + 3, y + 14.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(113, 113, 122);
      doc.text(card.sub, cx + 3, y + 19.5);
    });

    y += 28;

    // ------------------------------------------------------------------
    // 3. VISUAL CHARTS ROW: Weekly Bar Chart (Left) + Status Donut (Right)
    // ------------------------------------------------------------------
    const leftColW = 108;
    const rightColW = contentWidth - leftColW - 4;
    const chartBoxH = 68;

    // Left Card: Weekly Task Completion Trend Bar Chart
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(228, 228, 231);
    doc.roundedRect(margin, y, leftColW, chartBoxH, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(24, 24, 27);
    doc.text('WEEKLY TASK COMPLETION TREND', margin + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text('Scheduled vs Completed Tasks', margin + 4, y + 11.5);

    // Chart plot area
    const plotX = margin + 10;
    const plotY = y + 17;
    const plotW = leftColW - 15;
    const plotH = 38;
    const maxVal = Math.max(...weeklyData.map((d) => d.total), 4);

    // Gridlines
    for (let g = 0; g <= 2; g++) {
      const gy = plotY + (plotH * g) / 2;
      doc.setDrawColor(244, 244, 245);
      doc.setLineWidth(0.3);
      doc.line(plotX, gy, plotX + plotW, gy);
      const gridLabel = Math.round(maxVal * (1 - g / 2));
      doc.setFontSize(6.5);
      doc.setTextColor(161, 161, 170);
      doc.text(`${gridLabel}`, plotX - 2, gy + 1, { align: 'right' });
    }

    // Bars
    const slotW = plotW / weeklyData.length;
    const barW = 7.5;
    weeklyData.forEach((d, idx) => {
      const bx = plotX + idx * slotW + (slotW - barW) / 2;
      const totalH = Math.max((d.total / maxVal) * plotH, d.total > 0 ? 4 : 2);
      const doneH = d.total > 0 ? (d.completed / d.total) * totalH : 0;

      // Background total bar
      doc.setFillColor(d.isCurrent ? 212 : 228, d.isCurrent ? 212 : 228, d.isCurrent ? 216 : 231);
      doc.roundedRect(bx, plotY + plotH - totalH, barW, totalH, 1.2, 1.2, 'F');

      // Foreground completed bar
      if (doneH > 0) {
        doc.setFillColor(16, 185, 129); // emerald-500
        doc.roundedRect(bx, plotY + plotH - doneH, barW, doneH, 1.2, 1.2, 'F');
      }

      // Value above bar
      if (d.total > 0) {
        doc.setFontSize(6);
        doc.setTextColor(82, 82, 91);
        doc.text(`${d.completed}/${d.total}`, bx + barW / 2, plotY + plotH - totalH - 1.5, {
          align: 'center',
        });
      }

      // Day label
      doc.setFont('helvetica', d.isCurrent ? 'bold' : 'normal');
      doc.setFontSize(7);
      doc.setTextColor(d.isCurrent ? 24 : 113, d.isCurrent ? 24 : 113, d.isCurrent ? 27 : 122);
      doc.text(d.day, bx + barW / 2, plotY + plotH + 4.5, { align: 'center' });
    });

    // Legend
    doc.setFillColor(16, 185, 129);
    doc.rect(margin + 24, y + chartBoxH - 5.5, 3, 2.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(82, 82, 91);
    doc.text('Completed', margin + 28.5, y + chartBoxH - 3.3);

    doc.setFillColor(212, 212, 216);
    doc.rect(margin + 50, y + chartBoxH - 5.5, 3, 2.5, 'F');
    doc.text('Total Scheduled', margin + 54.5, y + chartBoxH - 3.3);

    // Right Card: Status Breakdown Vector Donut
    const rightX = margin + leftColW + 4;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(228, 228, 231);
    doc.roundedRect(rightX, y, rightColW, chartBoxH, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(24, 24, 27);
    doc.text('STATUS BREAKDOWN', rightX + 4, y + 7);

    const donutCx = rightX + rightColW / 2;
    const donutCy = y + 29;
    const donutR = 14.5;

    // Base ring
    drawVectorArc(doc, donutCx, donutCy, donutR, 0, 360, 4.2, [244, 244, 245]);

    const safeTotal = Math.max(metrics.totalTasks, 1);
    const segments: Array<{ count: number; color: [number, number, number]; label: string }> = [
      { count: metrics.completedTasks, color: [16, 185, 129], label: 'Completed' },
      { count: metrics.inProgressTasks, color: [99, 102, 241], label: 'In Progress' },
      { count: metrics.todoTasks, color: [161, 161, 170], label: 'To Do' },
      { count: metrics.overdueTasks, color: [244, 63, 94], label: 'Overdue' },
    ];

    let cursorDeg = -90;
    segments.forEach((seg) => {
      if (seg.count <= 0) return;
      const sweep = (seg.count / safeTotal) * 360;
      drawVectorArc(doc, donutCx, donutCy, donutR, cursorDeg, cursorDeg + sweep, 4.2, seg.color);
      cursorDeg += sweep;
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(24, 24, 27);
    doc.text(`${metrics.completionPercentage}%`, donutCx, donutCy + 1, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(113, 113, 122);
    doc.text('DONE', donutCx, donutCy + 4.8, { align: 'center' });

    // Donut Legend 2x2
    segments.forEach((seg, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const lx = rightX + 5 + col * 33;
      const ly = y + 51 + row * 6.5;
      doc.setFillColor(seg.color[0], seg.color[1], seg.color[2]);
      doc.circle(lx + 1.5, ly - 1, 1.3, 'F');
      doc.setFontSize(7);
      doc.setTextColor(63, 63, 70);
      doc.text(`${seg.label} (${seg.count})`, lx + 4.2, ly);
    });

    y += chartBoxH + 5;

    // ------------------------------------------------------------------
    // 4. SECOND VISUAL ROW: Priority Urgency Split + Category Time Allocation
    // ------------------------------------------------------------------
    const splitBoxH = 52;
    const halfW = (contentWidth - 4) / 2;

    // Left: Priority Urgency Split
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(228, 228, 231);
    doc.roundedRect(margin, y, halfW, splitBoxH, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(24, 24, 27);
    doc.text('PRIORITY URGENCY SPLIT', margin + 4, y + 7);

    const priorityRows = [
      { label: 'High Priority', count: metrics.highPriorityCount, color: [244, 63, 94] as [number, number, number] },
      { label: 'Medium Priority', count: metrics.mediumPriorityCount, color: [245, 158, 11] as [number, number, number] },
      { label: 'Low Priority', count: metrics.lowPriorityCount, color: [113, 113, 122] as [number, number, number] },
    ];

    priorityRows.forEach((row, idx) => {
      const ry = y + 15 + idx * 12;
      const pct = metrics.totalTasks > 0 ? Math.round((row.count / metrics.totalTasks) * 100) : 0;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(39, 39, 42);
      doc.text(row.label, margin + 4, ry);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(113, 113, 122);
      doc.text(`${row.count} (${pct}%)`, margin + halfW - 4, ry, { align: 'right' });

      // Progress track
      const trackW = halfW - 8;
      doc.setFillColor(244, 244, 245);
      doc.roundedRect(margin + 4, ry + 2.2, trackW, 3, 1.5, 1.5, 'F');
      if (pct > 0) {
        doc.setFillColor(row.color[0], row.color[1], row.color[2]);
        doc.roundedRect(margin + 4, ry + 2.2, Math.max(3, (pct / 100) * trackW), 3, 1.5, 1.5, 'F');
      }
    });

    // Right: Category Time Allocation
    const catX = margin + halfW + 4;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(228, 228, 231);
    doc.roundedRect(catX, y, halfW, splitBoxH, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(24, 24, 27);
    doc.text('CATEGORY TIME ALLOCATION', catX + 4, y + 7);

    const catEntries = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1].minutes - a[1].minutes || b[1].count - a[1].count)
      .slice(0, 4);

    if (catEntries.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170);
      doc.text('No categorized tasks in this range.', catX + 4, y + 20);
    } else {
      catEntries.forEach(([cat, data], idx) => {
        const cy = y + 14 + idx * 9.5;
        const pct =
          metrics.totalFocusMinutes > 0
            ? Math.round((data.minutes / metrics.totalFocusMinutes) * 100)
            : Math.round((data.count / Math.max(metrics.totalTasks, 1)) * 100);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(39, 39, 42);
        doc.text(cat, catX + 4, cy);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(113, 113, 122);
        doc.text(`${data.minutes}m · ${data.count} tasks`, catX + halfW - 4, cy, { align: 'right' });

        const trackW = halfW - 8;
        doc.setFillColor(244, 244, 245);
        doc.roundedRect(catX + 4, cy + 1.8, trackW, 2.4, 1.2, 1.2, 'F');
        doc.setFillColor(24, 24, 27);
        doc.roundedRect(catX + 4, cy + 1.8, Math.max(3, (pct / 100) * trackW), 2.4, 1.2, 1.2, 'F');
      });
    }

    y += splitBoxH + 5;

    // ------------------------------------------------------------------
    // 5. AI PERFORMANCE INSIGHTS CALLOUT (Optional)
    // ------------------------------------------------------------------
    if (includeAiInsights && aiInsights) {
      const insightsLines = aiInsights.insights.slice(0, 3);
      const boxH = 38;
      doc.setFillColor(244, 244, 245);
      doc.setDrawColor(212, 212, 216);
      doc.roundedRect(margin, y, contentWidth, boxH, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(24, 24, 27);
      doc.text('ASK GENIE AUTOMATED PERFORMANCE AUDIT', margin + 4, y + 6.5);

      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129);
      doc.text(`STATUS: ${aiInsights.status.toUpperCase()}`, pageWidth - margin - 4, y + 6.5, {
        align: 'right',
      });

      let iy = y + 12.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(63, 63, 70);
      insightsLines.forEach((line) => {
        const wrapped = doc.splitTextToSize(`• ${line}`, contentWidth - 10);
        doc.text(wrapped[0], margin + 4, iy);
        iy += 5;
      });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(24, 24, 27);
      const tipText = doc.splitTextToSize(`Actionable Tip: ${aiInsights.actionableTip}`, contentWidth - 10);
      doc.text(tipText[0], margin + 4, y + boxH - 4.5);

      y += boxH + 5;
    }

    // ------------------------------------------------------------------
    // 6. TASK COMPLETION LEDGER TABLE
    // ------------------------------------------------------------------
    if (includeTaskLedger && tasks.length > 0) {
      if (y > pageHeight - 55) {
        doc.addPage();
        y = 16;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(24, 24, 27);
      doc.text(`TASK COMPLETION BREAKDOWN (${tasks.length})`, margin, y + 4);
      y += 7;

      const drawTableHeader = (ty: number) => {
        doc.setFillColor(24, 24, 27);
        doc.rect(margin, ty, contentWidth, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text('TASK TITLE', margin + 2.5, ty + 4.7);
        doc.text('CATEGORY', margin + 78, ty + 4.7);
        doc.text('PRIORITY', margin + 102, ty + 4.7);
        doc.text('DUE DATE', margin + 122, ty + 4.7);
        doc.text('STATUS', margin + 146, ty + 4.7);
        doc.text('FOCUS', margin + 170, ty + 4.7);
      };

      drawTableHeader(y);
      y += 7;

      tasks.forEach((task, idx) => {
        if (y > pageHeight - 18) {
          doc.addPage();
          y = 16;
          drawTableHeader(y);
          y += 7;
        }

        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y, contentWidth, 7, 'F');
        }
        doc.setDrawColor(228, 228, 231);
        doc.setLineWidth(0.2);
        doc.line(margin, y + 7, margin + contentWidth, y + 7);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(24, 24, 27);
        const titleTrimmed = task.title.length > 42 ? `${task.title.slice(0, 40)}...` : task.title;
        doc.text(titleTrimmed, margin + 2.5, y + 4.7);

        doc.setTextColor(82, 82, 91);
        doc.text(task.category, margin + 78, y + 4.7);
        doc.text(task.priority.toUpperCase(), margin + 102, y + 4.7);
        doc.text(task.dueDate, margin + 122, y + 4.7);

        const isDone = task.status === 'completed';
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(isDone ? 16 : 113, isDone ? 185 : 113, isDone ? 129 : 122);
        doc.text(task.status.replace('_', ' ').toUpperCase(), margin + 146, y + 4.7);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(63, 63, 70);
        doc.text(`${task.focusMinutesSpent || 0}m`, margin + 170, y + 4.7);

        y += 7;
      });
    }

    // ------------------------------------------------------------------
    // 7. FOOTER ON ALL PAGES
    // ------------------------------------------------------------------
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.25);
      doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(113, 113, 122);
      doc.text(
        'Task Genie · D1 TaskStore Performance Analytics Report',
        margin,
        pageHeight - 6.5
      );
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 6.5, {
        align: 'right',
      });
    }

    return doc;
  }

  static downloadPerformanceReport(input: PdfReportInput): string {
    const doc = this.buildPerformancePdf(input);
    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `TaskGenie_Performance_Report_${dateStamp}.pdf`;
    doc.save(filename);
    return filename;
  }
}
