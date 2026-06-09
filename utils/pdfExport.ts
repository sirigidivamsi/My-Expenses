import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Category, Transaction } from '../types';

export const exportTransactionsToPDF = async (
  transactions: Transaction[],
  categories: Category[],
  reportTitle: string = 'Financial Transactions Report'
) => {
  // Sort transactions by date (latest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate summaries
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpense;

  // Generate table rows HTML
  const tableRowsHtml = sortedTransactions
    .map((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const catName = cat ? cat.name : 'Uncategorized';
      const formattedDate = new Date(t.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const typeLabel = t.type.toUpperCase();
      const amountStyle = t.type === 'income' ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;';
      const typeBadgeClass = t.type === 'income' ? 'badge-income' : 'badge-expense';

      return `
        <tr>
          <td>${formattedDate}</td>
          <td><span class="badge ${typeBadgeClass}">${typeLabel}</span></td>
          <td>${catName}</td>
          <td>${t.payment_method}</td>
          <td class="notes-cell">${t.notes || '<span class="empty">-</span>'}</td>
          <td style="${amountStyle}; text-align: right;">₹${Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    })
    .join('');

  // Complete HTML template
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${reportTitle}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Inter', sans-serif;
          color: #1e293b;
          background-color: #ffffff;
          padding: 40px;
          font-size: 12px;
          line-height: 1.5;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .header-left h1 {
          font-size: 24px;
          font-weight: 800;
          color: #4f46e5;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .header-left p {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .header-right {
          text-align: right;
          color: #64748b;
        }

        .header-right .date {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        /* Summary Cards */
        .summary-container {
          display: flex;
          gap: 20px;
          margin-bottom: 35px;
        }

        .summary-card {
          flex: 1;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
        }

        .summary-card.accent {
          background: #f5f3ff;
          border-color: #ddd6fe;
        }

        .summary-card .label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .summary-card .value {
          font-size: 20px;
          font-weight: 700;
        }

        .income-val { color: #10b981; }
        .expense-val { color: #ef4444; }
        .balance-val-pos { color: #4f46e5; }
        .balance-val-neg { color: #ef4444; }

        /* Table Styles */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }

        th {
          background-color: #f1f5f9;
          color: #475569;
          font-weight: 700;
          text-align: left;
          padding: 12px 14px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #cbd5e1;
        }

        td {
          padding: 12px 14px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
          vertical-align: middle;
        }

        tr:nth-child(even) {
          background-color: #f8fafc;
        }

        /* Badges */
        .badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          text-align: center;
        }

        .badge-income {
          background-color: #ecfdf5;
          color: #065f46;
        }

        .badge-expense {
          background-color: #fef2f2;
          color: #991b1b;
        }

        .notes-cell {
          max-width: 200px;
          word-wrap: break-word;
          font-style: italic;
          color: #475569;
        }

        .empty {
          color: #cbd5e1;
          font-style: normal;
        }

        .footer {
          margin-top: 50px;
          text-align: center;
          color: #94a3b8;
          font-size: 10px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <h1>My Expenses</h1>
          <p>${reportTitle}</p>
        </div>
        <div class="header-right">
          <div class="date">Report Date</div>
          <div>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div class="summary-container">
        <div class="summary-card">
          <div class="label">Total Income</div>
          <div class="value income-val">₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
          <div class="label">Total Expenses</div>
          <div class="value expense-val">₹${totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card accent">
          <div class="label">Net Balance</div>
          <div class="value ${netBalance >= 0 ? 'balance-val-pos' : 'balance-val-neg'}">
            ₹${netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Wallet / Account</th>
            <th>Notes</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml || '<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No transactions recorded in this period.</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        <p>Generated automatically via My Expenses app on Android/iOS. Keep tracking your financial progress!</p>
      </div>
    </body>
    </html>
  `;

  try {
    // 1. Compile HTML to PDF file in local app cache
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    
    // 2. Share/Download PDF using standard sharing dialog
    const pdfName = reportTitle.replace(/\s+/g, '_') + '.pdf';
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: reportTitle,
      UTIType: 'com.adobe.pdf',
    });
    return true;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw new Error('Failed to generate and share the PDF report.');
  }
};
export default exportTransactionsToPDF;
