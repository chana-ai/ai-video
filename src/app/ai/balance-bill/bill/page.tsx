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

interface MonthUsage {
  month: string;
  usage: number;
  amount: number;
  balance_after: number;
}

export default function BillPage() {
  const [balanceUsage, setBalanceUsage] = useState<BalanceUsage[]>([]);
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [tab, setTab] = useState("6months");
  const [monthUsage, setMonthUsage] = useState<MonthUsage[]>([]);
  const [dayUsage, setDayUsage] = useState<BalanceUsage[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    loadBalanceUsage();
    loadCurrentBalance();
    // Simulate month usage data
    setMonthUsage([
      { month: "2024-03", usage: 10, amount: 100, balance_after: 900 },
      { month: "2024-02", usage: 8, amount: 80, balance_after: 800 },
      { month: "2024-01", usage: 12, amount: 120, balance_after: 700 },
      { month: "2023-12", usage: 7, amount: 70, balance_after: 580 },
      { month: "2023-11", usage: 9, amount: 90, balance_after: 510 },
      { month: "2023-10", usage: 11, amount: 110, balance_after: 420 },
    ]);

    setDayUsage(balanceUsage);
  }, [balanceUsage.length]);

  const loadBalanceUsage = async () => {
    
    instance.get('/api/balance/usage').then(res => {
      const data = res.data || [];
      setBalanceUsage(data);
      
      // setTotalCredit(credit);
      setTotalDebit(res.debit);
      
    }).catch(err => {
      console.error('Failed to load balance usage:', err);
    });
  
  };

  const loadCurrentBalance = async () => {
    instance.get('/user/getCredits').then(res => {
      setCurrentBalance(res.data);
    }).catch(err => {
      console.error('Failed to load current balance:', err);
    });
  };

  const loadDayDetail = async (date: string) => {
    //Date: 2025-07-01
    instance.get('/api/bill/usage/day?date=' + date).then(res => {
      setDayUsage(res.data);
    }).catch(err => {
      console.error('Failed to load day detail:', err);
    });
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
          
          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credit (2 months)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+¥{totalCredit.toFixed(2)}</div>
            </CardContent>
          </Card> */}
          
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

        {/* Tabs for usage */}
        <Card>
          <CardHeader>
            <CardTitle>Balance Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <button
                className={`px-4 py-2 rounded ${tab === "6months" ? "bg-black text-white" : "bg-gray-200"}`}
                onClick={() => setTab("6months")}
              >
                Last 6 Months
              </button>
              <button
                className={`px-4 py-2 rounded ${tab === "30days" ? "bg-black text-white" : "bg-gray-200"}`}
                onClick={() => setTab("30days")}
              >
                Last 30 Days
              </button>
            </div>
            {tab === "6months" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthUsage.map((m) => (
                    <TableRow key={m.month}>
                      <TableCell>{m.month}</TableCell>
                      <TableCell>{m.usage}</TableCell>
                      <TableCell>¥{m.amount}</TableCell>
                      <TableCell>¥{m.balance_after}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {tab === "30days" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayUsage.map((usage) => (
                    <>
                      <TableRow key={usage.id}>
                        <TableCell>{usage.date}</TableCell>
                        <TableCell>{usage.description}</TableCell>
                        <TableCell>{formatAmount(usage.amount, usage.type)}</TableCell>
                        <TableCell>¥{usage.balance_after.toFixed(2)}</TableCell>
                        <TableCell>
                          <button
                            className="px-2 py-1 border rounded text-xs hover:bg-gray-100"
                            onClick={() => setDetailId(detailId === usage.id ? null : usage.id)}
                          >
                            Detail
                          </button>
                        </TableCell>
                      </TableRow>
                      {detailId === usage.id && (
                        <tr>
                          <td colSpan={5} className="bg-gray-50 p-4">
                            <div className="space-y-2">
                              <div><b>Date-Time:</b> {usage.date}</div>
                              <div><b>Description:</b> {usage.description}</div>
                              <div><b>Category:</b> {usage.category}</div>
                              <div><b>Type:</b> {usage.type}</div>
                              <div><b>Price:</b> ¥{usage.amount.toFixed(2)}</div>
                              <div><b>Amount:</b> {usage.amount}</div>
                              <div><b>Balance After:</b> ¥{usage.balance_after.toFixed(2)}</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            )}
            {/* Footer message */}
            <div className="mt-6 text-center text-sm text-gray-500">需要发票请联系客服微信</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
