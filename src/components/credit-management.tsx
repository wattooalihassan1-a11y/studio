
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Customer, Transaction } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit, Info } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const repaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive."),
});

const customerNameSchema = z.object({
  name: z.string().min(1, "Customer name is required."),
});

interface CreditManagementProps {
  customers: Customer[];
  transactions: Transaction[];
  recordRepayment: (customerId: string, amount: number) => void;
  updateCustomerName: (customerId: string, newName: string) => void;
  deleteCustomer: (customerId: string) => void;
}

export function CreditManagement({ customers, transactions, recordRepayment, updateCustomerName, deleteCustomer }: CreditManagementProps) {
  const [repaymentCustomer, setRepaymentCustomer] = React.useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = React.useState<Customer | null>(null);
  const [detailsCustomer, setDetailsCustomer] = React.useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  const repaymentForm = useForm<z.infer<typeof repaymentSchema>>({
    resolver: zodResolver(repaymentSchema),
    defaultValues: { amount: 0 }
  });

  const customerNameForm = useForm<z.infer<typeof customerNameSchema>>({
    resolver: zodResolver(customerNameSchema),
    defaultValues: { name: "" }
  });

  React.useEffect(() => {
    if (editingCustomer) {
      customerNameForm.setValue("name", editingCustomer.name);
    }
  }, [editingCustomer, customerNameForm]);

  const creditCustomers = customers
    .filter(c => c.balance > 0)
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  function onRepaymentSubmit(values: z.infer<typeof repaymentSchema>) {
    if (repaymentCustomer) {
      if (values.amount > repaymentCustomer.balance) {
        repaymentForm.setError("amount", { type: "manual", message: "Amount cannot exceed balance." });
        return;
      }
      recordRepayment(repaymentCustomer.id, values.amount);
      toast({ title: "Success", description: `Repayment recorded for ${repaymentCustomer.name}.` });
      setRepaymentCustomer(null);
      repaymentForm.reset();
    }
  }

  function onEditSubmit(values: z.infer<typeof customerNameSchema>) {
    if (editingCustomer) {
      updateCustomerName(editingCustomer.id, values.name);
      toast({ title: "Success", description: "Customer name updated." });
      setEditingCustomer(null);
      customerNameForm.reset();
    }
  }

  function onDeleteConfirm() {
    if (deletingCustomer) {
      deleteCustomer(deletingCustomer.id);
      toast({ title: "Success", description: `Customer ${deletingCustomer.name} deleted.` });
      setDeletingCustomer(null);
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR" }).format(value);

  const customerCreditTransactions = detailsCustomer
    ? transactions.filter(
      (t) => t.customerId === detailsCustomer.id && t.type === 'sale' && t.isCredit
    )
    : [];

  const customerRepayments = detailsCustomer
    ? transactions.filter(
        (t) => t.customerId === detailsCustomer.id && t.type === 'repayment'
      )
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit (Udhar) Management</CardTitle>
        <CardDescription>Track and manage outstanding payments from credit customers.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search customers by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead className="text-right">Outstanding Balance</TableHead>
                <TableHead className="text-center">Details</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditCustomers.length > 0 ? (
                creditCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(customer.balance)}</TableCell>
                    <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => setDetailsCustomer(customer)}>
                            <Info className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                        </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setRepaymentCustomer(customer)}>
                          Record Payment
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Rename Customer</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingCustomer(customer)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete Customer</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No matching credit customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        {/* Repayment Dialog */}
        <Dialog open={!!repaymentCustomer} onOpenChange={(isOpen) => !isOpen && setRepaymentCustomer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Repayment for {repaymentCustomer?.name}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Outstanding Balance: {formatCurrency(repaymentCustomer?.balance || 0)}
            </p>
            <Form {...repaymentForm}>
              <form onSubmit={repaymentForm.handleSubmit(onRepaymentSubmit)} className="space-y-4">
                <FormField control={repaymentForm.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="Enter amount" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full">Record Payment</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        {/* Edit Customer Dialog */}
        <Dialog open={!!editingCustomer} onOpenChange={(isOpen) => !isOpen && setEditingCustomer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Customer</DialogTitle>
            </DialogHeader>
            <Form {...customerNameForm}>
              <form onSubmit={customerNameForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField control={customerNameForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Customer Name</FormLabel>
                    <FormControl><Input placeholder="Enter new name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full">Save Changes</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        {/* Delete Customer Alert */}
        <AlertDialog open={!!deletingCustomer} onOpenChange={(isOpen) => !isOpen && setDeletingCustomer(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the customer and all their associated transaction history will lose its customer link.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* Customer Details Dialog */}
        <Dialog open={!!detailsCustomer} onOpenChange={(isOpen) => !isOpen && setDetailsCustomer(null)}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Credit Details for {detailsCustomer?.name}</DialogTitle>
                    <DialogDescription>
                        View credit sales and repayment history for this customer.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="sales" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sales">Credit Sales</TabsTrigger>
                    <TabsTrigger value="repayments">Repayments</TabsTrigger>
                  </TabsList>
                  <TabsContent value="sales">
                    <ScrollArea className="h-96">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Fuel Type</TableHead>
                                    <TableHead className="text-right">Quantity (L)</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customerCreditTransactions.length > 0 ? (
                                    customerCreditTransactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                                            <TableCell className="capitalize">{tx.fuelType}</TableCell>
                                            <TableCell className="text-right font-mono">{tx.quantity?.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(tx.amount)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No credit transactions found for this customer.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="repayments">
                    <ScrollArea className="h-96">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount Paid</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customerRepayments.length > 0 ? (
                                    customerRepayments.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(tx.amount)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            No repayments found for this customer.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
