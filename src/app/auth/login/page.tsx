"use client";

import React, { useState, ChangeEvent, useEffect } from 'react';
import instance from '@/lib/axios';
import { setUserId, setCredentials, setLoginPhone, getCredentials} from '@/lib/localcache';
import Link from "next/link";
import { Button } from "antd";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';

export default function Login() {
  const [activeTab, setActiveTab] = useState<'password' | 'sms'>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const credentials = getCredentials();
    if (credentials) {
      router.push('/ai/dashboard');
    }
    // Load captcha on component mount
    loadCaptcha();
  }, [router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const loadCaptcha = () => {
    instance.get('/api/captcha').then(res => {
      setCaptchaImage(res.data.image);
    }).catch(err => {
      console.error('Failed to load captcha:', err);
    });
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.startsWith('86')) {
      value = value.substring(2);
    }
    setPhone(value);
  };

  const getFullPhone = () => {
    return phone.startsWith('86') ? phone : '86' + phone;
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSmsCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSmsCode(e.target.value.replace(/\D/g, ''));
  };

  const handleCaptchaChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCaptcha(e.target.value);
  };

  const sendSmsCode = async () => {
    if (!phone) {
      setErrorMessage('请输入手机号');
      return;
    }
    if (!captcha) {
      setErrorMessage('请输入验证码');
      return;
    }

    try {
      await instance.post('/api/sms/send', {
        phoneNumber: getFullPhone(),
        captcha: captcha
      });
      setCountdown(60);
      setErrorMessage('');
      loadCaptcha(); // Refresh captcha
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || '发送失败');
      loadCaptcha(); // Refresh captcha on error
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setErrorMessage("请输入手机号和密码");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await instance.post('/user/login', {
        phoneNumber: getFullPhone(),
        password: password
      });

      const { phoneNumber: rPhone, userId: rUserId, token: rToken } = res.data;
      setCredentials(rToken);
      setUserId(rUserId);
      setLoginPhone(rPhone);
      router.push('/ai/dashboard');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !smsCode) {
      setErrorMessage("请输入手机号和验证码");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await instance.post('/user/login/sms', {
        phoneNumber: getFullPhone(),
        smsCode: smsCode
      });

      const { phoneNumber: rPhone, userId: rUserId, token: rToken } = res.data;
      setCredentials(rToken);
      setUserId(rUserId);
      setLoginPhone(rPhone);
      router.push('/ai/dashboard');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-start bg-white pl-16">
      <div className="w-full max-w-lg">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Chana视频生成系统</h1>
            <p className="text-gray-600 mt-2">请登录您的账户</p>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 border-b">
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'password'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('password')}
            >
              密码登录
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'sms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('sms')}
            >
              短信登录
            </button>
          </div>

          {/* Password Login Form */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <Label htmlFor="phone-password">手机号</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">+86</span>
                  <Input
                    id="phone-password"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="请输入手机号"
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">密码</Label>
                  {/* <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline" onClick={() => {
                    alert('请联系客服微信')
                  }}>
                    忘记密码?
                  </Link> */}
                  <div className="text-sm text-blue-600 hover:underline" onClick={() => {
                    alert('请联系客服微信')
                  }}>
                    忘记密码?
                  </div>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="请输入密码"
                  required
                />
              </div>

              {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}

              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                className="w-full h-10"
              >
                登录
              </Button>
            </form>
          )}

          {/* SMS Login Form */}
          {activeTab === 'sms' && (
            <form onSubmit={handleSmsLogin} className="space-y-4">
              <div>
                <Label htmlFor="phone-sms">手机号</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">+86</span>
                  <Input
                    id="phone-sms"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="请输入手机号"
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="captcha">图形验证码</Label>
                <div className="flex gap-2">
                  <Input
                    id="captcha"
                    value={captcha}
                    onChange={handleCaptchaChange}
                    placeholder="请输入验证码"
                    className="flex-1"
                    required
                  />
                  {captchaImage && (
                    <img
                      src={captchaImage}
                      alt="验证码"
                      className="h-10 w-20 border rounded cursor-pointer"
                      onClick={loadCaptcha}
                    />
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="sms-code">短信验证码</Label>
                <div className="flex gap-2">
                  <Input
                    id="sms-code"
                    value={smsCode}
                    onChange={handleSmsCodeChange}
                    placeholder="请输入验证码"
                    className="flex-1"
                    maxLength={6}
                    required
                  />
                  <Button
                    type="default"
                    onClick={sendSmsCode}
                    disabled={countdown > 0 || !phone || !captcha}
                    className="w-24"
                  >
                    {countdown > 0 ? `${countdown}s` : '发送'}
                  </Button>
                </div>
              </div>

              {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}

              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                className="w-full h-10"
              >
                登录
              </Button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            没有账号?{" "}
            <Link href="/auth/signup" className="text-blue-600 hover:underline">
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
