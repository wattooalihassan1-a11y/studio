"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Transaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, ArrowDown, ArrowUp, RefreshCcw, Droplet } from "lucide-react";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR" }).format(value);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'sale': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'expense': return <ArrowDown className="h-4 w-4 text-red-500" />;
      case 'repayment': return <RefreshCcw className="h-4 w-4 text-blue-500" />;
      case 'stock': return <Droplet className="h-4 w-4 text-yellow-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTransactionDescription = (transaction: Transaction) => {
    switch (transaction.type) {
        case 'sale':
            return `Sold ${transaction.quantity}L of ${transaction.fuelType}`;
        case 'expense':
            return transaction.description;
        case 'repayment':
            return `Payment from ${transaction.customerName}`;
        case 'stock':
            return `Added ${transaction.quantity}L of ${transaction.fuelType}`;
        default:
            return 'N/A';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>A log of your most recent sales, expenses, and repayments.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        <span className="capitalize font-medium">{transaction.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{getTransactionDescription(transaction)}</div>
                      {transaction.isCredit && <Badge variant="destructive" className="mt-1">Credit</Badge>}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
