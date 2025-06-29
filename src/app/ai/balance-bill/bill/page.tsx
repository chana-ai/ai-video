"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import instance from "@/lib/axios";
import Header from "@/app/ai/header";

interface BalanceUsage {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  balance_after: number;
}

export default function BillPage() {
  const [balanceUsage, setBalanceUsage] = useState<BalanceUsage[]>([]);
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    loadBalanceUsage();
  }, []);

  const loadBalanceUsage = async () => {
    try {
      const response = await instance.get('/api/balance/usage');
      const data = response.data || [];
      setBalanceUsage(data);
      
      // Calculate totals
      const credit = data.filter((item: BalanceUsage) => item.type === 'credit')
        .reduce((sum: number, item: BalanceUsage) => sum + item.amount, 0);
      const debit = data.filter((item: BalanceUsage) => item.type === 'debit')
        .reduce((sum: number, item: BalanceUsage) => sum + item.amount, 0);
      
      setTotalCredit(credit);
      setTotalDebit(debit);
      setCurrentBalance(data.length > 0 ? data[0].balance_after : 0);
    } catch (error) {
      console.error('Failed to load balance usage:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'credit' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'credit' ? (
      <Badge className="bg-green-100 text-green-800">Credit</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Debit</Badge>
    );
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'credit' ? '+' : '-';
    return `${sign}¥${amount.toFixed(2)}`;
  };

  return (
    <>
      <Header title="Bill Detail" />
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{currentBalance.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credit (2 months)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+¥{totalCredit.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debit (2 months)</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-¥{totalDebit.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Balance Usage Table */}
        <Card>
          <CardHeader>
            <CardTitle>Balance Usage (Last 2 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balanceUsage.map((usage) => (
                  <TableRow key={usage.id}>
                    <TableCell>{usage.date}</TableCell>
                    <TableCell>{usage.description}</TableCell>
                    <TableCell>{usage.category}</TableCell>
                    <TableCell className={usage.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                      {formatAmount(usage.amount, usage.type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(usage.type)}
                        {getTypeBadge(usage.type)}
                      </div>
                    </TableCell>
                    <TableCell>¥{usage.balance_after.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {balanceUsage.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      No balance usage found for the last 2 months
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
