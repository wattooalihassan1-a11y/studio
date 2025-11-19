"use client";
import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Transaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, ArrowDown, ArrowUp, RefreshCcw, Droplet, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


interface RecentTransactionsProps {
  transactions: Transaction[];
  deleteTransaction: (transactionId: string) => void;
  updateTransaction: (transactionId: string, newValues: Partial<Transaction>) => void;
}

const expenseEditSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
});

export function RecentTransactions({ transactions, deleteTransaction, updateTransaction }: RecentTransactionsProps) {
  const [deletingTransaction, setDeletingTransaction] = React.useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const { toast } = useToast();

  const expenseForm = useForm<z.infer<typeof expenseEditSchema>>({
    resolver: zodResolver(expenseEditSchema),
    defaultValues: {
      description: "",
      amount: 0,
    }
  });

  React.useEffect(() => {
    if (editingTransaction && editingTransaction.type === 'expense') {
      expenseForm.reset({
        description: editingTransaction.description,
        amount: editingTransaction.amount,
      });
    }
  }, [editingTransaction, expenseForm]);


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

  const handleDeleteConfirm = () => {
    if (deletingTransaction) {
      deleteTransaction(deletingTransaction.id);
      setDeletingTransaction(null);
    }
  };

  const handleEditSubmit = (values: z.infer<typeof expenseEditSchema>) => {
    if (editingTransaction) {
      // Find the original transaction to calculate the difference if amount changes
      const originalTransaction = transactions.find(t => t.id === editingTransaction.id);
      if (!originalTransaction) return;

      // For expenses, updating amount doesn't affect other logic like stock.
      // If we were editing sales, we'd need to adjust balances/stock here.
      updateTransaction(editingTransaction.id, {
        description: values.description,
        amount: values.amount,
      });
      
      setEditingTransaction(null);
    }
  };


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
                <TableHead className="text-right">Actions</TableHead>
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
                      {transaction.isCredit && transaction.type === 'sale' && <Badge variant="destructive" className="mt-1">Credit</Badge>}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {transaction.type === 'expense' && (
                               <DropdownMenuItem onClick={() => setEditingTransaction(transaction)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeletingTransaction(transaction)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>

         {/* Edit Expense Dialog */}
        <Dialog open={!!editingTransaction} onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
             <Form {...expenseForm}>
              <form onSubmit={expenseForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={expenseForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Staff salary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={expenseForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Save Changes</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Transaction Alert */}
        <AlertDialog open={!!deletingTransaction} onOpenChange={(isOpen) => !isOpen && setDeletingTransaction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the transaction and reverse its effects on stock and credit balances.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Transaction
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </CardContent>
    </Card>
  );
}
