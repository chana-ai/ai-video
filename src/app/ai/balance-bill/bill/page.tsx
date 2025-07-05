"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import instance from "@/lib/axios";
import Header from "@/app/ai/header";

interface DayBillRecord {
  id: number;
  date: string;
  total_consumption: number;
  recharged_consumption: number;
  gift_consumption: number;
}

interface DayDetailRecord {
  date: string;
  billing_type: string;
  api_id: string;
  amount: number;
  update_time: string;
}

// interface MonthUsage {
//   month: string;
//   usage: number;
//   amount: number;
//   balance_after: number;
// }

interface TabInfo {
  id: string;
  title: string;
  type: 'main' | 'detail';
  date?: string;
}

interface DayDetailState {
  records: DayDetailRecord[];
  current: number;
  pages: number;
  size: number;
  total: number;
}

export default function BillPage() {
  const [dayBillRecords, setDayBillRecords] = useState<DayBillRecord[]>([]);
  const [dayDetails, setDayDetails] = useState<{ [key: string]: DayDetailState }>({});
  const [tabs, setTabs] = useState<TabInfo[]>([
    { id: 'main', title: 'Last 30 Days', type: 'main' }
  ]);
  const [activeTab, setActiveTab] = useState('main');
  const [totalDebit, setTotalDebit] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    loadSummary();
    loadDayBillRecord();
    // Mock data for dayBillRecords
    setDayBillRecords([
      { id: 1, date: '2025-07-01', total_consumption: 30, recharged_consumption: 20, gift_consumption: 10 },
      { id: 2, date: '2025-06-30', total_consumption: 25, recharged_consumption: 15, gift_consumption: 10 },
      { id: 3, date: '2025-06-29', total_consumption: 40, recharged_consumption: 30, gift_consumption: 10 },
      { id: 4, date: '2025-06-28', total_consumption: 20, recharged_consumption: 10, gift_consumption: 10 },
      { id: 5, date: '2025-06-27', total_consumption: 35, recharged_consumption: 25, gift_consumption: 10 },
    ]);
  }, []);

  const loadSummary = async () => {
    instance.get('/user/getCredits').then(res => {
      setCurrentBalance(res.data.credit || 0);
    }).catch(err => {
      console.error('Failed to load balance usage:', err);
    });

    instance.get('/api/v1/bill/getDebit?months=2').then(res => {
      setTotalDebit(res.data.debit || 0);
    }).catch(err => {
      console.error('Failed to load balance usage:', err);
    });
  };

  const loadDayBillRecord = async () => {
    instance.get('/api/v1/bill/usage?interval=day').then(res => {
      setDayBillRecords(res.data.records || []);
    }).catch(err => {
      console.error('Failed to load day detail:', err);
    });
  }

  const loadDayDetail = async (date: string, page = 0) => {
    // Check if tab already exists
    const existingTab = tabs.find(tab => tab.date === date);
    if (!existingTab) {
      // Create new tab
      const newTab: TabInfo = {
        id: `detail-${date}`,
        title: date,
        type: 'detail',
        date: date
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTab(newTab.id);
    } else {
      setActiveTab(existingTab.id);
    }

    // Load data if not already loaded or if page changed
    const currentDetails = dayDetails[date];
    if (!currentDetails || currentDetails.current !== page) {
      instance.post('/api/v1/bill/day_detail', {
        date: date,
        page: page,
        pageSize: 20
      }).then(res => {
        setDayDetails(prev => ({
          ...prev,
          [date]: {
            records: res.data.records || [],
            current: res.data.current || 1,
            pages: res.data.pages || 1,
            size: res.data.size || 20,
            total: res.data.total || 0
          }
        }));
      }).catch(err => {
        console.error('Failed to load day detail:', err);
      });
    }
  };

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return; // Don't close the last tab
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    
    // If closing active tab, switch to main tab
    if (activeTab === tabId) {
      setActiveTab('main');
    }
  };

  const handlePageChange = (date: string, page: number) => {
    loadDayDetail(date, page);
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
            {/* Tab Headers */}
            <div className="mb-4 flex gap-2 border-b">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center gap-2 px-4 py-2 cursor-pointer border-b-2 ${
                    activeTab === tab.id ? 'border-black' : 'border-transparent'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.title}</span>
                  {tab.type === 'detail' && (
                    <button
                      className="ml-2 text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'main' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Consumption</TableHead>
                    <TableHead>Recharged</TableHead>
                    <TableHead>Gift</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayBillRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>¥{record.total_consumption.toFixed(2)}</TableCell>
                      <TableCell>¥{record.recharged_consumption.toFixed(2)}</TableCell>
                      <TableCell>¥{record.gift_consumption.toFixed(2)}</TableCell>
                      <TableCell>
                        <button
                          className="px-2 py-1 border rounded text-xs hover:bg-gray-100"
                          onClick={() => loadDayDetail(record.date)}
                        >
                          Detail
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Detail Tab Content */}
            {activeTab !== 'main' && dayDetails[activeTab.replace('detail-', '')] && (
              <div>
                <h4 className="font-semibold mb-4">
                  Daily Details for {activeTab.replace('detail-', '')}
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Billing Type</TableHead>
                      <TableHead>API ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Update Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayDetails[activeTab.replace('detail-', '')].records.map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell>{detail.date}</TableCell>
                        <TableCell>{detail.billing_type}</TableCell>
                        <TableCell>{detail.api_id}</TableCell>
                        <TableCell>¥{detail.amount.toFixed(2)}</TableCell>
                        <TableCell>{detail.update_time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination for detail tab */}
                <div className="flex justify-end items-center gap-2 mt-4">
                  <button
                    className="px-2 py-1 border rounded disabled:opacity-50"
                    disabled={dayDetails[activeTab.replace('detail-', '')].current === 1}
                    onClick={() => handlePageChange(activeTab.replace('detail-', ''), dayDetails[activeTab.replace('detail-', '')].current - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {dayDetails[activeTab.replace('detail-', '')].current} of {dayDetails[activeTab.replace('detail-', '')].pages}
                  </span>
                  <button
                    className="px-2 py-1 border rounded disabled:opacity-50"
                    disabled={dayDetails[activeTab.replace('detail-', '')].current === dayDetails[activeTab.replace('detail-', '')].pages}
                    onClick={() => handlePageChange(activeTab.replace('detail-', ''), dayDetails[activeTab.replace('detail-', '')].current + 1)}
                  >
                    Next
                  </button>
                  <span className="ml-4 text-gray-500">
                    Total: {dayDetails[activeTab.replace('detail-', '')].total}
                  </span>
                </div>
              </div>
            )}

            {/* Footer message */}
            <div className="mt-6 text-center text-sm text-gray-500">需要发票请联系客服微信</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
