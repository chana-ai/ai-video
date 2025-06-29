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
  id: string;
  date: string;
  channel: string;
  amount: number;
  state: 'pending' | 'completed' | 'failed';
}

export default function BalanceBillPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds

  const amounts = [100, 200, 500, 700, 1000];

  useEffect(() => {
    // Load payment history
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

  const loadPaymentHistory = async () => {
    try {
      const response = await instance.get('/api/payment/history');
      setPaymentHistory(response.data || []);
    } catch (error) {
      console.error('Failed to load payment history:', error);
    }
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
  };

  const handlePay = async () => {
    if (!selectedAmount) return;

    try {
      const response = await instance.post('/wechat-pay/qrcode', {
        amount: selectedAmount
      });
      
      // Convert byte array to base64 for display
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(response.data)));
      setQrCodeData(`data:image/png;base64,${base64Data}`);
      setShowPaymentPopup(true);
      setCountdown(600);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const handleCompletePayment = async () => {
    try {
      await instance.post('/wechat-pay/complete');
      setShowPaymentPopup(false);
      setSelectedAmount(null);
      setCountdown(600);
      // Reload payment history
      loadPaymentHistory();
    } catch (error) {
      console.error('Failed to complete payment:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{state}</Badge>;
    }
  };

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
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
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
              </div>
              <Button
                onClick={handlePay}
                disabled={!selectedAmount}
                className="bg-green-600 hover:bg-green-700"
              >
                Pay
              </Button>
            </div>
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
                  <TableHead>Channel</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>{payment.channel}</TableCell>
                    <TableCell>¥{payment.amount}</TableCell>
                    <TableCell>{getStateBadge(payment.state)}</TableCell>
                  </TableRow>
                ))}
                {paymentHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No payment history found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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