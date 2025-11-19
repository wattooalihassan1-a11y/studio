"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingDown, CreditCard, Fuel, ShoppingCart } from "lucide-react";

import { Header } from "./header";
import { StatCard } from "./stat-card";
import { FuelStatus } from "./fuel-status";
import { RecentTransactions } from "./recent-transactions";
import { CreditManagement } from "./credit-management";
import { Skeleton } from "./ui/skeleton";

import type { Customer, FuelType, Transaction } from "@/lib/types";

// Helper for localStorage
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
};


const saleSchema = z.object({
  fuelType: z.enum(["petrol", "diesel"], { required_error: "You must select a fuel type." }),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  isCredit: z.boolean().default(false),
  customerName: z.string().optional(),
}).refine(data => !data.isCredit || (data.isCredit && data.customerName && data.customerName.trim().length > 0), {
  message: "Customer name is required for credit sales.",
  path: ["customerName"],
});

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
});

const DashboardSkeleton = () => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-1 p-4 sm:p-6 lg:p-8 container mx-auto">
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[400px] rounded-lg lg:col-span-1" />
          <Skeleton className="h-[400px] rounded-lg lg:col-span-2" />
        </div>
      </div>
    </main>
  </div>
);


export default function Dashboard() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("transactions", []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>("customers", []);
  const [fuelStock, setFuelStock] = useLocalStorage<{ petrol: number, diesel: number }>("fuelStock", { petrol: 0, diesel: 0 });
  const [fuelPrices, setFuelPrices] = useLocalStorage<{ petrol: number, diesel: number }>("fuelPrices", { petrol: 102.5, diesel: 95.8 });
  
  const [saleModalOpen, setSaleModalOpen] = React.useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = React.useState(false);
  const { toast } = useToast();

  const saleForm = useForm<z.infer<typeof saleSchema>>({ 
    resolver: zodResolver(saleSchema), 
    defaultValues: { 
      isCredit: false,
      quantity: 0,
      customerName: "",
    } 
  });
  const expenseForm = useForm<z.infer<typeof expenseSchema>>({ 
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: 0,
    }
  });

  const isCredit = saleForm.watch("isCredit");

  React.useEffect(() => {
    // Simulate loading time for better initial skeleton display
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    setTransactions(prev => [{ ...transaction, id: uuidv4(), timestamp: Date.now() }, ...prev]);
  };

  const onSaleSubmit = (values: z.infer<typeof saleSchema>) => {
    const price = fuelPrices[values.fuelType];
    const amount = values.quantity * price;

    if (fuelStock[values.fuelType] < values.quantity) {
      saleForm.setError("quantity", { type: "manual", message: "Not enough stock available." });
      return;
    }

    setFuelStock(prev => ({ ...prev, [values.fuelType]: prev[values.fuelType] - values.quantity }));

    let customerId: string | undefined;
    if (values.isCredit && values.customerName) {
      let customer = customers.find(c => c.name.toLowerCase() === values.customerName!.toLowerCase());
      if (customer) {
        customer.balance += amount;
        setCustomers(prev => prev.map(c => c.id === customer!.id ? customer! : c));
        customerId = customer.id;
      } else {
        const newCustomer: Customer = { id: uuidv4(), name: values.customerName, balance: amount };
        setCustomers(prev => [...prev, newCustomer]);
        customerId = newCustomer.id;
      }
    }

    addTransaction({
      type: 'sale',
      fuelType: values.fuelType,
      quantity: values.quantity,
      amount,
      isCredit: values.isCredit,
      customerId,
      customerName: values.customerName,
    });

    toast({ title: "Sale Recorded", description: `A sale of ${values.quantity}L of ${values.fuelType} has been recorded.` });
    saleForm.reset();
    setSaleModalOpen(false);
  };

  const onExpenseSubmit = (values: z.infer<typeof expenseSchema>) => {
    addTransaction({ type: 'expense', amount: values.amount, description: values.description, isCredit: false });
    toast({ title: "Expense Logged", description: `${values.description} for PKR ${values.amount} has been logged.` });
    expenseForm.reset();
    setExpenseModalOpen(false);
  };
  
  const addStock = (fuelType: FuelType, quantity: number) => {
    setFuelStock(prev => ({ ...prev, [fuelType]: prev[fuelType] + quantity }));
    addTransaction({
      type: 'stock',
      fuelType,
      quantity,
      amount: 0,
      description: `Added ${quantity}L of ${fuelType}`,
      isCredit: false,
    });
  };

  const updateStock = (newStock: { petrol: number; diesel: number }) => {
    const oldStock = fuelStock;
    setFuelStock(newStock);

    if (newStock.petrol !== oldStock.petrol) {
      addTransaction({
        type: 'stock',
        fuelType: 'petrol',
        quantity: newStock.petrol - oldStock.petrol,
        amount: 0,
        description: `Stock adjusted to ${newStock.petrol}L`,
        isCredit: false,
      });
    }
    if (newStock.diesel !== oldStock.diesel) {
        addTransaction({
        type: 'stock',
        fuelType: 'diesel',
        quantity: newStock.diesel - oldStock.diesel,
        amount: 0,
        description: `Stock adjusted to ${newStock.diesel}L`,
        isCredit: false,
      });
    }
  };

  const updatePrices = (prices: { petrol: number, diesel: number }) => {
    setFuelPrices(prices);
  };

  const recordRepayment = (customerId: string, amount: number) => {
    const customer = customers.find(c => c.id === customerId);
    if(customer) {
      customer.balance -= amount;
      setCustomers(prev => prev.map(c => c.id === customerId ? customer : c));
      addTransaction({
        type: 'repayment',
        amount,
        customerId,
        customerName: customer.name,
        isCredit: false,
      });
    }
  };

  const updateCustomerName = (customerId: string, newName: string) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, name: newName } : c));
    setTransactions(prev => prev.map(t => t.customerId === customerId ? { ...t, customerName: newName } : t));
  };
  
  const deleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    // Optionally, decide what to do with transactions linked to the deleted customer.
    // Here we're just removing the link, not the transaction itself.
    setTransactions(prev => prev.map(t => {
      if (t.customerId === customerId) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { customerId, customerName, ...rest } = t;
        return rest as Transaction;
      }
      return t;
    }));
  };

  const deleteTransaction = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    // Reverse the state changes caused by the transaction
    switch (transaction.type) {
      case 'sale':
        if (transaction.fuelType && transaction.quantity) {
          setFuelStock(prev => ({ ...prev, [transaction.fuelType!]: prev[transaction.fuelType!] + transaction.quantity! }));
        }
        if (transaction.isCredit && transaction.customerId) {
          setCustomers(prev => prev.map(c => 
            c.id === transaction.customerId ? { ...c, balance: c.balance - transaction.amount } : c
          ));
        }
        break;
      case 'repayment':
        if (transaction.customerId) {
          setCustomers(prev => prev.map(c =>
            c.id === transaction.customerId ? { ...c, balance: c.balance + transaction.amount } : c
          ));
        }
        break;
      case 'stock':
        if (transaction.fuelType && transaction.quantity) {
          // Reverting stock 'addition' or 'adjustment'
          setFuelStock(prev => ({ ...prev, [transaction.fuelType!]: prev[transaction.fuelType!] - transaction.quantity! }));
        }
        break;
      case 'expense':
        // No other state to reverse, just remove the transaction
        break;
    }

    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    toast({ title: "Transaction Deleted", description: "The transaction has been removed and its effects reversed." });
  };
  
  const updateTransaction = (transactionId: string, newValues: Partial<Transaction>) => {
     setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, ...newValues } : t));
     toast({ title: "Success", description: "Transaction updated." });
  };


  const { totalSales, totalExpenses, creditDue, netRevenue } = React.useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaysTransactions = transactions.filter(t => t.timestamp >= todayStart.getTime());

    const totalSales = todaysTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const todaysCreditSales = todaysTransactions
      .filter(t => t.type === 'sale' && t.isCredit)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = todaysTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const creditDue = customers.reduce((sum, c) => sum + c.balance, 0);
    
    const netRevenue = totalSales - todaysCreditSales - totalExpenses;

    return { totalSales, totalExpenses, creditDue, netRevenue };
  }, [transactions, customers]);
  
  const formatCurrency = (value: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR" }).format(value);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/20">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 container mx-auto">
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Today's Sales" value={formatCurrency(totalSales)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} description="Includes cash and credit sales" />
            <StatCard title="Today's Expenses" value={formatCurrency(totalExpenses)} icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="Net Revenue" value={formatCurrency(netRevenue)} icon={<Fuel className="h-4 w-4 text-muted-foreground" />} description="Total Cash Sales - Total Expenses" />
            <StatCard title="Total Credit Due" value={formatCurrency(creditDue)} icon={<CreditCard className="h-4 w-4 text-muted-foreground" />} description="Total outstanding from all customers" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <Card>
                <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                   <Dialog open={saleModalOpen} onOpenChange={setSaleModalOpen}>
                    <DialogTrigger asChild><Button className="w-full"><ShoppingCart className="mr-2 h-4 w-4"/>Record Sale</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Record New Sale</DialogTitle></DialogHeader>
                      <Form {...saleForm}>
                        <form onSubmit={saleForm.handleSubmit(onSaleSubmit)} className="space-y-4">
                          <FormField control={saleForm.control} name="fuelType" render={({ field }) => (
                            <FormItem><FormLabel>Fuel Type</FormLabel>
                              <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="petrol" id="petrol" /></FormControl><FormLabel htmlFor="petrol">Petrol</FormLabel></FormItem>
                                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="diesel" id="diesel" /></FormControl><FormLabel htmlFor="diesel">Diesel</FormLabel></FormItem>
                                </RadioGroup>
                              </FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={saleForm.control} name="quantity" render={({ field }) => (
                            <FormItem><FormLabel>Quantity (in Liters)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 10.5" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={saleForm.control} name="isCredit" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Credit Sale (Udhar)</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                          )} />
                          {isCredit && <FormField control={saleForm.control} name="customerName" render={({ field }) => (
                              <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="Enter customer name" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />}
                          <Button type="submit" className="w-full">Record Sale</Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
                     <DialogTrigger asChild><Button variant="secondary" className="w-full">Log Expense</Button></DialogTrigger>
                     <DialogContent>
                        <DialogHeader><DialogTitle>Log New Expense</DialogTitle></DialogHeader>
                        <Form {...expenseForm}>
                          <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4">
                            <FormField control={expenseForm.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g., Staff salary" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={expenseForm.control} name="amount" render={({ field }) => (
                                <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 500" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <Button type="submit" className="w-full">Log Expense</Button>
                          </form>
                        </Form>
                     </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <FuelStatus stock={fuelStock} prices={fuelPrices} addStock={addStock} updatePrices={updatePrices} updateStock={updateStock}/>
            </div>
            
            <div className="lg:col-span-2">
                <RecentTransactions 
                  transactions={transactions} 
                  deleteTransaction={deleteTransaction}
                  updateTransaction={updateTransaction}
                  />
            </div>
          </div>
          
          <div>
            <CreditManagement customers={customers} recordRepayment={recordRepayment} updateCustomerName={updateCustomerName} deleteCustomer={deleteCustomer} />
          </div>

        </div>
      </main>
    </div>
  );
}
