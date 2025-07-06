'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Transaction } from '@/types';

interface LocalTransaction {
  _id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  type: 'expense' | 'income';
}
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

interface ExportProps {
  transactions: LocalTransaction[];
  summary: {
    totalExpenses: number;
    totalIncome: number;
    balance: number;
  };
}

export default function Export({ transactions, summary }: ExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'year'>('all');

  const exportToCSV = () => {
    const filteredTransactions = filterTransactions();
    
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        `"${t.description}"`,
        t.category,
        t.type,
        t.amount.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `finance-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportToPDF = () => {
    const filteredTransactions = filterTransactions();
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Personal Finance Report', 20, 20);
    
    // Summary
    doc.setFontSize(12);
    doc.text('Financial Summary', 20, 40);
    doc.setFontSize(10);
    doc.text(`Total Income: $${summary.totalIncome.toFixed(2)}`, 20, 50);
    doc.text(`Total Expenses: $${summary.totalExpenses.toFixed(2)}`, 20, 60);
    doc.text(`Current Balance: $${summary.balance.toFixed(2)}`, 20, 70);
    
    // Transactions table
    const tableData = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category,
      t.type,
      `$${t.amount.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: tableData,
      startY: 90,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
      },
    });
    
    doc.save(`finance-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filterTransactions = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      
      switch (dateRange) {
        case 'month':
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear;
        case 'year':
          return transactionDate.getFullYear() === currentYear;
        default:
          return true;
      }
    });
  };

  const handleExport = () => {
    if (exportType === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          📊 Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Financial Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <Select value={exportType} onValueChange={(value: 'csv' | 'pdf') => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="pdf">PDF (Report)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Select value={dateRange} onValueChange={(value: 'all' | 'month' | 'year') => setDateRange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">Current Month</SelectItem>
                <SelectItem value="year">Current Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              Export {exportType.toUpperCase()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 