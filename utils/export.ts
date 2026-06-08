import { Category, Transaction } from '../types';

export const generateCSVReport = (
  transactions: Transaction[],
  categories: Category[]
): string => {
  const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Wallet', 'Notes', 'Tags'];
  
  const rows = transactions.map((t) => {
    const cat = categories.find((c) => c.id === t.category_id);
    const catName = cat ? cat.name : 'Uncategorized';
    
    return [
      t.id,
      new Date(t.date).toLocaleDateString('en-IN'),
      t.type.toUpperCase(),
      catName,
      t.amount.toString(),
      t.payment_method,
      t.notes ? `"${t.notes.replace(/"/g, '""')}"` : '',
      `"${t.tags.join(', ')}"`,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
};
export default generateCSVReport;
