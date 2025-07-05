"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, CreditCard, Clock } from "lucide-react";
import instance from "@/lib/axios";
import Header from "../header";

interface PaymentHistory {
  orderNo: string;
  amountInCents: number;
  channel: string;
  createTime: string;
  updateTime: string;
  state: string;
}


export default function BalanceBillPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [orderNo, setOrderNo] = useState<string>('');
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [current, setCurrent] = useState(1);
  const [pages, setPages] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const [error, setError] = useState<string | null>(null);
  const amounts = [0.01, 100, 200, 500, 700, 1000];

  useEffect(() => {
    // Load payment history
    setOrderNo("");
    loadPaymentHistory();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showPaymentPopup && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setShowPaymentPopup(false);
      setCountdown(600);
    }
    return () => clearTimeout(timer);
  }, [showPaymentPopup, countdown]);

  const loadPaymentHistory = async (pageNo = 1) => {
    let payload: any = {
      pageNo,
      pageSize: size
    }
    instance.post('/api/v1/credit-refill/search', payload).then(res => {
      setPaymentHistory(res.records || []);
      setCurrent(res.current || 1);
      setPages(res.pages || 1);
      setSize(res.size || 10);
      setTotal(res.total || 0);
    }).catch(err => {
      console.error('Failed to load payment history:', err);
    });
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
  };

  const handlePay = async (orderNo?: string, amount?: number) => {
    setError(null);
    //针对用户点击pay这种情况，则不合法
    if (!orderNo && !selectedAmount) {
      setError("Please select an amount to refill first");
      return
    };

    if(orderNo  && !amount){
      //大概率不会发生。
      return;
    }

    let payload: any = {
      amountInCents: amount || (selectedAmount || 0)*100,
      channel: 'WECHAT'
    }
    if (orderNo) {
      payload.orderNo = orderNo;
    }

    instance.post('/api/v1/credit-refill/prepay', payload).then(res => {
      const base64Data = res.base64Image;
      setQrCodeData(`${base64Data}`);
      setOrderNo(res.orderNo);
      setShowPaymentPopup(true);
      setCountdown(600);
    }).catch(err => {
      console.error('Failed to generate QR code:', err);
    });
    
  };

  const handleCompletePayment = async () => {

    instance.post('/api/v1/credit-refill/state', {
      orderNo: orderNo
    }).then(res => {
      setShowPaymentPopup(false);
      setSelectedAmount(null);
      // Reload payment history
      loadPaymentHistory();
    }).catch(err => {
      console.error('Failed to complete payment:', err);
    });
  };

  const handleClose = async (orderNo: string) => {
    instance.post('/api/v1/credit-refill/close', {
      orderNo: orderNo
    }).then(res => {
      loadPaymentHistory();
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'completed':
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
      case 'NOPAY':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{state}</Badge>;
    }
  };

  const getBeijingTime = (time: string) => {
    return new Date(time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  }

  return (
    <>
      <Header title="Refill Balance" />
      <div className="p-6 space-y-6">
        {/* Refill Balance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Refill Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row gap-2 items-center">
              {amounts.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount ? "default" : "outline"}
                  onClick={() => handleAmountSelect(amount)}
                  className="min-w-[80px]"
                >
                  ¥{amount}
                </Button>
              ))}
              <Button
                onClick={() => handlePay()}
                disabled={!selectedAmount}
                className="bg-green-600 hover:bg-green-700"
              >
                Pay
              </Button>
            </div>
            {error && <p className="text-red-500">{error}</p>}
          </CardContent>
        </Card>

        {/* Payment History Section */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order No</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>updateTime</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.orderNo}>
                    <TableCell>{getBeijingTime(payment.createTime)}</TableCell>
                    <TableCell>{payment.orderNo}</TableCell>
                    <TableCell>{payment.channel === 'WECHAT' ? '微信' : payment.channel}</TableCell>
                    <TableCell>¥{(payment.amountInCents / 100).toFixed(2)}</TableCell>
                    <TableCell>{getBeijingTime(payment.updateTime)}</TableCell>
                    <TableCell>{getStateBadge(payment.state)}</TableCell>
                    <TableCell>
                      {payment.state === 'NOTPAY' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePay(payment.orderNo, payment.amountInCents)}
                          >
                            Continue Payment
                          </Button>
                          <Button
                            size="sm"
                            variant="outline" 
                            onClick={() => handleClose(payment.orderNo)}
                          >
                            Close Payment
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {paymentHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      No payment history found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {/* Pagination Controls */}
            <div className="flex justify-end items-center gap-2 mt-4">
              <button
                className="px-2 py-1 border rounded disabled:opacity-50"
                disabled={current === 1}
                onClick={() => loadPaymentHistory(current - 1)}
              >
                Previous
              </button>
              <span>Page {current} of {pages}</span>
              <button
                className="px-2 py-1 border rounded disabled:opacity-50"
                disabled={current === pages}
                onClick={() => loadPaymentHistory(current + 1)}
              >
                Next
              </button>
              <span className="ml-4 text-gray-500">Total: {total}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Popup */}
      <Dialog open={showPaymentPopup} onOpenChange={setShowPaymentPopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>WeChat Payment</span>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <Clock className="h-4 w-4" />
                {formatTime(countdown)}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Amount: ¥{selectedAmount}</p>
              <p className="text-sm text-gray-600 mb-4">Scan QR code to complete payment</p>
            </div>
            
            {qrCodeData && (
              <div className="flex justify-center">
                <img 
                  src={qrCodeData} 
                  alt="WeChat QR Code" 
                  className="w-48 h-48 border rounded-lg"
                />
              </div>
            )}
            
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-4">
                Payment will expire in {formatTime(countdown)}
              </p>
              <Button 
                onClick={handleCompletePayment}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Complete Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 