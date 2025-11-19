"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Droplet, Edit, Plus, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { FuelType } from "@/lib/types";

const MAX_STOCK = 50000; // Liters

const priceSchema = z.object({
  petrol: z.coerce.number().min(0.01, "Price must be positive."),
  diesel: z.coerce.number().min(0.01, "Price must be positive."),
});

const stockSchema = z.object({
  fuelType: z.enum(["petrol", "diesel"], { required_error: "Please select a fuel type." }),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1 liter."),
});

interface FuelStatusProps {
  stock: { petrol: number; diesel: number };
  prices: { petrol: number; diesel: number };
  addStock: (fuelType: FuelType, quantity: number) => void;
  updatePrices: (prices: { petrol: number; diesel: number }) => void;
}

export function FuelStatus({ stock, prices, addStock, updatePrices }: FuelStatusProps) {
  const [priceModalOpen, setPriceModalOpen] = React.useState(false);
  const [stockModalOpen, setStockModalOpen] = React.useState(false);
  const { toast } = useToast();

  const priceForm = useForm<z.infer<typeof priceSchema>>({
    resolver: zodResolver(priceSchema),
    defaultValues: prices,
  });

  const stockForm = useForm<z.infer<typeof stockSchema>>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      quantity: 0,
    },
  });

  React.useEffect(() => {
    priceForm.reset(prices);
  }, [prices, priceForm]);

  function onPriceSubmit(values: z.infer<typeof priceSchema>) {
    updatePrices(values);
    toast({ title: "Success", description: "Fuel prices have been updated." });
    setPriceModalOpen(false);
  }

  function onStockSubmit(values: z.infer<typeof stockSchema>) {
    addStock(values.fuelType, values.quantity);
    toast({ title: "Success", description: "New stock has been added." });
    stockForm.reset({ quantity: 0, fuelType: undefined });
    setStockModalOpen(false);
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR" }).format(value);

  const getProgressColor = (value: number) => {
    if (value < 20) return "bg-red-500";
    if (value < 50) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  const petrolStockPercentage = (stock.petrol / MAX_STOCK) * 100;
  const dieselStockPercentage = (stock.diesel / MAX_STOCK) * 100;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Fuel Status</CardTitle>
        <CardDescription>Live stock levels and current prices per liter.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-muted-foreground">Petrol</span>
              <span className="text-sm font-bold">{stock.petrol.toLocaleString()} L / {MAX_STOCK.toLocaleString()} L</span>
            </div>
            <Progress value={petrolStockPercentage} className="h-3 [&>div]:" indicatorClassName={getProgressColor(petrolStockPercentage)} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-muted-foreground">Diesel</span>
              <span className="text-sm font-bold">{stock.diesel.toLocaleString()} L / {MAX_STOCK.toLocaleString()} L</span>
            </div>
            <Progress value={dieselStockPercentage} className="h-3" indicatorClassName={getProgressColor(dieselStockPercentage)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
            <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Petrol Price</p>
                <p className="text-lg font-bold">{formatCurrency(prices.petrol)}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Diesel Price</p>
                <p className="text-lg font-bold">{formatCurrency(prices.diesel)}</p>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Stock</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Stock</DialogTitle></DialogHeader>
              <Form {...stockForm}>
                <form onSubmit={stockForm.handleSubmit(onStockSubmit)} className="space-y-4">
                  <FormField control={stockForm.control} name="fuelType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="petrol">Petrol</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={stockForm.control} name="quantity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity (in Liters)</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 5000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full">Add Stock</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={priceModalOpen} onOpenChange={setPriceModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Update Prices</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Update Fuel Prices</DialogTitle></DialogHeader>
              <Form {...priceForm}>
                <form onSubmit={priceForm.handleSubmit(onPriceSubmit)} className="space-y-4">
                  <FormField control={priceForm.control} name="petrol" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Petrol Price (/liter)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={priceForm.control} name="diesel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diesel Price (/liter)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full">Update Prices</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
