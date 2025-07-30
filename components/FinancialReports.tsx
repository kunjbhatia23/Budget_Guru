'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  FileText,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
// Import the new MonthYearPicker
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useProfileStore } from '@/store/profile-store';
import { profileApi } from '@/lib/profile-api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/finance-utils';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ... (keep the rest of the component as it was)

export function FinancialReports() {
  const { currentProfile, isGroupView, currentGroup } = useProfileStore();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async () => {
    if (!currentGroup) {
      toast({
        title: 'Error',
        description: 'Please select a group to generate reports.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedDate) {
      toast({
        title: 'Error',
        description: 'Please select a month for the report.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setReportData(null);

    const monthString = format(selectedDate, 'yyyy-MM');
    const groupId = currentGroup._id!;
    const profileId = isGroupView() ? undefined : currentProfile?._id;

    try {
      const data = await profileApi.getFinancialReport({
        groupId,
        month: monthString,
        profileId: profileId || undefined,
      });

      if (!data || Object.keys(data).length === 0) {
        setError('No financial data found for the selected month and scope.');
        toast({
          title: 'No Data',
          description: 'No financial data found for the selected period.',
          variant: 'default',
        });
        setReportData(null);
      } else {
        setReportData(data);
        toast({
          title: 'Report Generated',
          description: `Financial report for ${monthString} generated successfully.`,
        });
      }
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report. Please try again.');
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate report.',
        variant: 'destructive',
      });
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [currentGroup, selectedDate, isGroupView, currentProfile, toast]);

    const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    // You might want to close the popover here if you have control over its open/closed state
  };


  const downloadCSV = useCallback(() => {
    if (!reportData) {
      toast({
        title: 'No Data',
        description: 'Generate a report first before downloading.',
        variant: 'destructive',
      });
      return;
    }

    let csvContent = '\uFEFF';
    csvContent += `Financial Report for ${reportData.reportMonth} - ${reportData.scope}\n\n`;

    // Summary
    csvContent += 'Summary\n';
    csvContent += `Total Income,${reportData.summary.totalIncome.toFixed(2)}\n`;
    csvContent += `Total Expenses,${reportData.summary.totalExpenses.toFixed(2)}\n\n`;

    // Category Spending
    if (reportData.categorySpending && reportData.categorySpending.length > 0) {
      csvContent += 'Category Spending\n';
      csvContent += 'Category,Amount\n';
      reportData.categorySpending.forEach((item: any) => {
        csvContent += `${item.category},${item.amount.toFixed(2)}\n`;
      });
      csvContent += '\n';
    }

    // Budget vs Actual
    if (reportData.budgetVsActual && reportData.budgetVsActual.length > 0) {
      csvContent += 'Budget vs Actual\n';
      csvContent += 'Category,Budgeted,Spent,Remaining,Percentage\n';
      reportData.budgetVsActual.forEach((item: any) => {
        csvContent += `${item.category},${item.budgeted.toFixed(2)},${item.spent.toFixed(2)},${item.remaining.toFixed(2)},${item.percentage.toFixed(2)}%\n`;
      });
      csvContent += '\n';
    }

    // Transactions
    if (reportData.transactions && reportData.transactions.length > 0) {
      csvContent += 'Transactions\n';
      csvContent += 'Date,Description,Category,Type,Amount\n';
      reportData.transactions.forEach((t: any) => {
        const type =
          t.type === 'income'
            ? 'Income'
            : t.type === 'expense'
              ? 'Expense'
              : t.type === 'settlement_paid'
                ? 'Settlement Paid'
                : 'Settlement Received';
        const amountPrefix =
          t.type === 'expense' || t.type === 'settlement_paid' ? '-' : '';
        csvContent += `${t.date},"${t.description.replace(/"/g, '""')}",${t.category},${type},${amountPrefix}${t.amount.toFixed(2)}\n`;
      });
      csvContent += '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute(
        'download',
        `financial_report_${reportData.reportMonth}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [reportData, toast]);

  const downloadPDF = useCallback(() => {
    if (!reportData) {
      toast({
        title: 'No Data',
        description: 'Generate a report first before downloading.',
        variant: 'destructive',
      });
      return;
    }

    const doc = new jsPDF();
    let yPos = 15;
    const margin = 10;
    
    // Header
    doc.setFontSize(18);
    doc.text('Monthly Financial Report', margin, yPos);
    yPos += 8;
    doc.setFontSize(12);
    doc.text(
      `For: ${reportData.reportMonth} (${reportData.scope})`,
      margin,
      yPos
    );
    yPos += 15;

    // Summary
    doc.setFontSize(14);
    doc.text('Summary', margin, yPos);
    yPos += 7;
    doc.setFontSize(12);
    doc.text(
      `Total Income: ${formatCurrency(reportData.summary.totalIncome)}`,
      margin,
      yPos
    );
    yPos += 7;
    doc.text(
      `Total Expenses: ${formatCurrency(reportData.summary.totalExpenses)}`,
      margin,
      yPos
    );
    yPos += 12;

    // Category Spending
    if (reportData.categorySpending && reportData.categorySpending.length > 0) {
      doc.setFontSize(14);
      doc.text('Category Spending', margin, yPos);
      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Amount']],
        body: reportData.categorySpending.map((item: any) => [
          item.category,
          formatCurrency(item.amount),
        ]),
        margin: { left: margin, right: margin },
        headStyles: { fillColor: '#8B5CF6' },
        styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
          1: { halign: 'right' },
        },
      });
      yPos = (doc as any).lastAutoTable.finalY + 12;
    }

    // Budget vs Actual
    if (reportData.budgetVsActual && reportData.budgetVsActual.length > 0) {
      doc.setFontSize(14);
      doc.text('Budget vs Actual', margin, yPos);
      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Budgeted', 'Spent', 'Remaining', 'Percentage']],
        body: reportData.budgetVsActual.map((item: any) => [
          item.category,
          formatCurrency(item.budgeted),
          formatCurrency(item.spent),
          formatCurrency(item.remaining),
          `${item.percentage.toFixed(1)}%`,
        ]),
        margin: { left: margin, right: margin },
        headStyles: { fillColor: '#06B6D4' },
        styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
        },
      });
      yPos = (doc as any).lastAutoTable.finalY + 12;
    }

    // Transactions
    if (reportData.transactions && reportData.transactions.length > 0) {
      doc.setFontSize(14);
      doc.text('All Transactions', margin, yPos);
      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
        body: reportData.transactions.map((t: any) => {
          const type =
            t.type === 'income'
              ? 'Income'
              : t.type === 'expense'
                ? 'Expense'
                : t.type === 'settlement_paid'
                  ? 'Settlement Paid'
                  : 'Settlement Received';
          const displayAmount =
            t.type === 'expense' || t.type === 'settlement_paid'
              ? -t.amount
              : t.amount;
          return [
            t.date,
            t.description,
            t.category,
            type,
            formatCurrency(displayAmount),
          ];
        }),
        margin: { left: margin, right: margin },
        headStyles: { fillColor: '#10B981' },
        styles: { fontSize: 9, cellPadding: 1, overflow: 'linebreak' },
        columnStyles: {
          4: { halign: 'right' },
        },
      });
    }

    doc.save(`financial_report_${reportData.reportMonth}.pdf`);
  }, [reportData, toast]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Monthly Financial Report
          </CardTitle>
          <CardDescription>
            Generate and download a comprehensive financial report for your
            selected group/profile and month.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex-1 w-full space-y-1">
              <p className="text-sm font-medium">Current Profile:</p>
              <div className="p-2 border rounded-md bg-muted/30 h-10 flex items-center">
                {isGroupView()
                  ? `Group: ${currentGroup?.name}`
                  : `Profile: ${currentProfile?.name}`}
              </div>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full sm:w-[280px] justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'MMMM yyyy')
                  ) : (
                    <span>Pick a month</span>
                  )}
                </Button>
              </PopoverTrigger>
               <PopoverContent className="w-auto p-0" align="start">
                <MonthYearPicker
                  date={selectedDate || new Date()}
                  onChange={handleDateChange}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={generateReport}
            className="w-full"
            disabled={!currentGroup || !selectedDate || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* ... The rest of your report display JSX remains the same ... */}
       {reportData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>
                Report for {reportData.reportMonth} ({reportData.scope})
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={downloadPDF} variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={downloadCSV} variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Detailed financial overview for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/50 rounded-md">
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(reportData.summary.totalIncome)}
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Total Expenses
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(reportData.summary.totalExpenses)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {reportData.categorySpending &&
              reportData.categorySpending.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    Category Spending
                  </h3>
                  <div className="space-y-2">
                    {reportData.categorySpending.map((item: any) => (
                      <div
                        key={item.category}
                        className="flex justify-between items-center p-2 border rounded-md"
                      >
                        <span className="font-medium">{item.category}</span>
                        <span className="text-right">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {reportData.budgetVsActual &&
              reportData.budgetVsActual.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    Budget vs Actual
                  </h3>
                  <div className="space-y-2">
                    {reportData.budgetVsActual.map((item: any) => (
                      <div key={item.category} className="p-2 border rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.category}</span>
                          <span className="text-sm text-muted-foreground">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-3 text-xs text-muted-foreground mt-1">
                          <span>
                            Budgeted: {formatCurrency(item.budgeted)}
                          </span>
                          <span>Spent: {formatCurrency(item.spent)}</span>
                          <span>
                            Remaining: {formatCurrency(item.remaining)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {reportData.transactions && reportData.transactions.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    All Transactions
                  </h3>
                  <div className="space-y-2">
                    {reportData.transactions.map((t: any) => (
                      <div
                        key={t.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-md"
                      >
                        <div>
                          <p className="font-medium">{t.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.date} • {t.category} • {t.type}
                          </p>
                        </div>
                        <p
                          className={`font-semibold ${
                            t.type === 'income' ||
                            t.type === 'settlement_received'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(
                             (t.type === 'expense' || t.type === 'settlement_paid') ? -t.amount : t.amount
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}