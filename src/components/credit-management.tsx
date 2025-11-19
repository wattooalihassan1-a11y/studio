"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";

const repaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive."),
});

interface CreditManagementProps {
  customers: Customer[];
  recordRepayment: (customerId: string, amount: number) => void;
}

export function CreditManagement({ customers, recordRepayment }: CreditManagementProps) {
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof repaymentSchema>>({
    resolver: zodResolver(repaymentSchema),
  });

  const creditCustomers = customers.filter(c => c.balance > 0);

  function onSubmit(values: z.infer<typeof repaymentSchema>) {
    if (selectedCustomer) {
      if (values.amount > selectedCustomer.balance) {
        form.setError("amount", { type: "manual", message: "Amount cannot exceed balance." });
        return;
      }
      recordRepayment(selectedCustomer.id, values.amount);
      toast({ title: "Success", description: `Repayment recorded for ${selectedCustomer.name}.` });
      setSelectedCustomer(null);
      form.reset();
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit (Udhar) Management</CardTitle>
        <CardDescription>Track and manage outstanding payments from credit customers.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead className="text-right">Outstanding Balance</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditCustomers.length > 0 ? (
                creditCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(customer.balance)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(customer)}>
                        Record Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No outstanding credit balances.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <Dialog open={!!selectedCustomer} onOpenChange={(isOpen) => !isOpen && setSelectedCustomer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Repayment for {selectedCustomer?.name}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Outstanding Balance: {formatCurrency(selectedCustomer?.balance || 0)}
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="Enter amount" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full">Record Payment</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
