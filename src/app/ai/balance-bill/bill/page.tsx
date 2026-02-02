"use client";

import { useEffect, useMemo, useState } from "react";
import { DollarSign, TrendingDown } from "lucide-react";

import Header from "@/app/ai/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import instance from "@/lib/axios";
import {DailyDetailFilters, 
   DailyBillingDetailRecord, 
   DailyUsageRecord, 
   MonthlyUsageRecord} from "../types";

type TabType =
  | "dailyDetail"
  | "dailyUsage"
  | "monthlyUsage"
  | "dailyDetailDynamic"
  | "dailyUsageDynamic";

interface TabInfo {
    id: string;
    title: string;
    type: TabType;
    closable?: boolean;
    meta?: {
      date?: string;
      year?: number;
      month?: number;
    };
  }

interface LoadingState {
  [key: string]: boolean;
}

const formatToDateInput = (value?: string | Date, suffix: boolean = false) => {
  if (!value) {
    return "";
  }

  if(!suffix){
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = `${value.getMonth() + 1}`.padStart(2, "0");
      const day = `${value.getDate()}`.padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  
    if (value.includes("T")) {
      return value.split("T")[0];
    }
  
    return value;
  }
  
  if (value.includes("T")) {
    return value.split("T")[1];
  }
  return value

};

const getDefaultDailyDetailFilters = (date?: string): DailyDetailFilters => ({
  date: date || formatToDateInput(new Date()),
  apiId: "",
  pageNo: 1,
  pageSize: 10,
});

const getDefaultDailyUsageParams = (year?: number, month?: number): DailyUsagPearams => {
  const now = new Date();
  return {
    year: year ?? now.getFullYear(),
    month: month ?? now.getMonth() + 1,
  };
};

const formatMonthInput = (year: number, month: number) =>
  `${year}-${`${month}`.padStart(2, "0")}`;

const truncateData = (value: unknown) => {
  if (!value) {
    return "-";
  }

  try {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);

    if (!serialized) {
      return "-";
    }

    return serialized.length > 64
      ? `${serialized.slice(0, 61)}...`
      : serialized;
  } catch {
    return "-";
  }
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export default function BillPage() {
  const [tabs, setTabs] = useState<TabInfo[]>([
    { id: "daily-detail", title: "Daily Detail", type: "dailyDetail" },
    { id: "daily-usage", title: "Daily Usage", type: "dailyUsage" },
    { id: "monthly-usage", title: "Monthly Usage", type: "monthlyUsage" },
  ]);
  const [activeTab, setActiveTab] = useState("daily-detail");

  const [dailyDetailFilters, setDailyDetailFilters] = useState<
    Record<string, DailyDetailFilters>
  >({
    "daily-detail": getDefaultDailyDetailFilters(),
  });
  const [dailyDetailData, setDailyDetailData] = useState<
    Record<string, DailyDetailState>
  >({});

  const [dailyUsageParams, setDailyUsageParams] = useState<
    Record<string, DailyUsageParams>
  >({
    "daily-usage": getDefaultDailyUsageParams(),
  });
  const [dailyUsageData, setDailyUsageData] = useState<
    Record<string, DailyUsageRecord[]>
  >({});

  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsageRecord[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({});
  const [currentBalance, setCurrentBalance] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);

  const setLoadingFor = (key: string, value: boolean) => {
    setLoadingState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const loadSummary = async () => {
    try {
      const res = await instance.get("/user/getCredits");
      const balance = res?.data?.credit ?? res?.data?.data?.credit ?? 0;
      setCurrentBalance(toNumber(balance));
    } catch (error) {
      console.error("Failed to load current balance:", error);
    }

    try {
      const res = await instance.get("/api/v1/bill/getDebit", {
        params: { months: 2 },
      });
      const debit = res?.data?.debit ?? res?.data?.data?.debit ?? 0;
      setTotalDebit(toNumber(debit));
    } catch (error) {
      console.error("Failed to load total debit:", error);
    }
  };

  const fetchDailyDetail = async (
    tabId: string,
    updates?: Partial<DailyDetailFilters>,
    defaults?: DailyDetailFilters,
  ) => {
    const baseFilters =
      dailyDetailFilters[tabId] ??
      defaults ??
      getDefaultDailyDetailFilters(
        tabs.find((tab) => tab.id === tabId)?.meta?.date,
      );
    const nextFilters = {
      ...baseFilters,
      ...updates,
    };

    setDailyDetailFilters((prev) => ({
      ...prev,
      [tabId]: nextFilters,
    }));

    setLoadingFor(tabId, true);
    try {
    
      const response = await instance.get(
        "/api/v1/bill/getDailyBillingDetail",
        {
          params: {
            date: nextFilters.date,
            pageNo: nextFilters.pageNo,
            pageSize: nextFilters.pageSize
          },
        },
      );
      
      const records: DailyBillingDetailRecord[] = response?.records
        
      const pageNo =
        toNumber(response?.pageNo ?? response?.current ?? response?.pageNoIndex) ||
        nextFilters.pageNo;
      const pageSize =
        toNumber(response?.pageSize ?? response?.size) || nextFilters.pageSize;
      const total =
        toNumber(response?.total ?? response?.totalCount ?? response?.totalElements) ||
        records.length;
      const totalPages =
        toNumber(response?.pages ?? response?.totalPages) ||
        (pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1);

      setDailyDetailData((prev) => ({
        ...prev,
        [tabId]: {
          records,
          pageNo,
          pageSize,
          total,
          totalPages,
        },
      }));
    } catch (error) {
      console.error("Failed to load daily billing detail:", error);
    } finally {
      setLoadingFor(tabId, false);
    }
  };

  const fetchDailyUsage = async (
    tabId: string,
    updates?: Partial<DailyUsageParams>,
    defaults?: DailyUsageParams,
  ) => {
    const baseParams =
      dailyUsageParams[tabId] ??
      defaults ??
      getDefaultDailyUsageParams(
        tabs.find((tab) => tab.id === tabId)?.meta?.year,
        tabs.find((tab) => tab.id === tabId)?.meta?.month,
      );
    const nextParams: DailyUsageParams = {
      ...baseParams,
      ...updates,
    };

    setDailyUsageParams((prev) => ({
      ...prev,
      [tabId]: nextParams,
    }));

    setLoadingFor(tabId, true);
    try {
      const response = await instance.get("/api/v1/bill/daily-usage", {
        params: {
          year: nextParams.year,
          month: nextParams.month,
        },
      });

    
      setDailyUsageData((prev) => ({
        ...prev,
        [tabId]: response,
      }));
    } catch (error) {
      console.error("Failed to load daily usage:", error);
    } finally {
      setLoadingFor(tabId, false);
    }
  };

  const fetchMonthlyUsage = async () => {
    const tabKey = "monthly-usage";
    setLoadingFor(tabKey, true);
    try {
      const response = await instance.get("/api/v1/bill/monthly-usage");
     
      // const records: MonthlyUsageRecord[] = response;
      setMonthlyUsage(response);
    } catch (error) {
      console.error("Failed to load monthly usage:", error);
    } finally {
      setLoadingFor(tabKey, false);
    }
  };

  useEffect(() => {
    loadSummary();
    const defaultDetail = getDefaultDailyDetailFilters();
    const defaultDailyUsage = getDefaultDailyUsageParams();
    fetchDailyDetail("daily-detail", undefined, defaultDetail);
    fetchDailyUsage("daily-usage", undefined, defaultDailyUsage);
    fetchMonthlyUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDailyDetailFilterChange = (
    tabId: string,
    field: keyof DailyDetailFilters,
    value: string,
  ) => {
    setDailyDetailFilters((prev) => {
      const next = prev[tabId] ?? getDefaultDailyDetailFilters();
      return {
        ...prev,
        [tabId]: {
          ...next,
          [field]: field === "pageNo" || field === "pageSize" ? Number(value) : value,
        },
      };
    });
  };

  const handleDailyDetailSearch = (tabId: string) => {
    fetchDailyDetail(tabId);
  };

  const handleDailyDetailReset = (tabId: string, defaultDate?: string) => {
    const defaults = getDefaultDailyDetailFilters(defaultDate);
    fetchDailyDetail(tabId, defaults, defaults);
  };

  const handleDailyDetailPageChange = (tabId: string, direction: "prev" | "next") => {
    const data = dailyDetailData[tabId];
    if (!data) {
      return;
    }

    const target =
      direction === "prev"
        ? Math.max(1, data.pageNo - 1)
        : Math.min(data.totalPages, data.pageNo + 1);

    if (target === data.pageNo) {
      return;
    }

    fetchDailyDetail(tabId, { pageNo: target });
  };

  const handleDailyUsageInputChange = (
    tabId: string,
    value: string,
  ) => {
    if (!value) {
      return;
    }

    const [year, month] = value.split("-").map(Number);

    if (Number.isFinite(year) && Number.isFinite(month)) {
      setDailyUsageParams((prev) => ({
        ...prev,
        [tabId]: {
          year,
          month,
        },
      }));
    }
  };

  const handleDailyUsageSearch = (tabId: string) => {
    const params =
      dailyUsageParams[tabId] ??
      getDefaultDailyUsageParams(
        tabs.find((tab) => tab.id === tabId)?.meta?.year,
        tabs.find((tab) => tab.id === tabId)?.meta?.month,
      );
    fetchDailyUsage(tabId, params, params);
  };

  const openDailyUsageTab = (year: number, month: number) => {
    const monthLabel = formatMonthInput(year, month);
    const id = `daily-usage-${monthLabel}`;

    setTabs((prev) => {
      if (prev.some((tab) => tab.id === id)) {
        return prev;
      }

      return [
        ...prev,
        {
          id,
          title: `Daily Usage ${monthLabel}`,
          type: "dailyUsageDynamic",
          closable: true,
          meta: { year, month },
        },
      ];
    });

    const defaults = getDefaultDailyUsageParams(year, month);
    setDailyUsageParams((prev) => ({
      ...prev,
      [id]: defaults,
    }));
    fetchDailyUsage(id, defaults, defaults);
    setActiveTab(id);
  };

  const openDailyDetailTab = (date?: string) => {
    const targetDate = formatToDateInput(date) || formatToDateInput(new Date());
    const id = `daily-detail-${targetDate}`;

    setTabs((prev) => {
      if (prev.some((tab) => tab.id === id)) {
        return prev;
      }

      return [
        ...prev,
        {
          id,
          title: `Daily Detail ${targetDate}`,
          type: "dailyDetailDynamic",
          closable: true,
          meta: { date: targetDate },
        },
      ];
    });

    const defaults = getDefaultDailyDetailFilters(targetDate);
    setDailyDetailFilters((prev) => ({
      ...prev,
      [id]: defaults,
    }));
    fetchDailyDetail(id, defaults, defaults);
    setActiveTab(id);
  };

  const closeTab = (tabId: string) => {
    const targetTab = tabs.find((tab) => tab.id === tabId);
    if (!targetTab || !targetTab.closable) {
      return;
    }

    setTabs((prev) => prev.filter((tab) => tab.id !== tabId));

    setDailyDetailFilters((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setDailyDetailData((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setDailyUsageParams((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setDailyUsageData((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setLoadingState((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });

    if (activeTab === tabId) {
      setActiveTab("daily-detail");
    }
  };

  const activeTabInfo = useMemo(
    () => tabs.find((tab) => tab.id === activeTab),
    [activeTab, tabs],
  );

  const dailyDetailContent = (tabId: string, metaDate?: string) => {
    const filters =
      dailyDetailFilters[tabId] ??
      getDefaultDailyDetailFilters(metaDate);
    const data = dailyDetailData[tabId];
    const isLoading = loadingState[tabId];

    return (
      <div className="space-y-6">
        <form
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleDailyDetailSearch(tabId);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={`date-${tabId}`}>Billing Date</Label>
            <Input
              id={`date-${tabId}`}
              type="date"
              value={filters.date}
              onChange={(event) =>
                handleDailyDetailFilterChange(tabId, "date", event.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`api-${tabId}`}>API ID</Label>
            <Input
              id={`api-${tabId}`}
              placeholder="Enter API ID"
              value={filters.apiId}
              onChange={(event) =>
                handleDailyDetailFilterChange(tabId, "apiId", event.target.value)
              }
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">Search</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDailyDetailReset(tabId, metaDate)}
            >
              Reset
            </Button>
          </div>
        </form>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>

                <TableHead>Billing Type</TableHead>
                <TableHead>API ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Project / Scene</TableHead>
                <TableHead>Task Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                    Loading daily billing detail...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && (!data || data.records.length === 0) && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                    No billing detail for the selected filters.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                data?.records.map((record, index) => {
                  const project =
                    record.projectId !== undefined
                      ? `P${record.projectId}`
                      : "-";
                  const scene =
                    record.sceneId !== undefined
                      ? `S${record.sceneId}`
                      : "-";
                  const projectScene =
                    project === "-" && scene === "-"
                      ? "-"
                      : `${project}${scene === "-" ? "" : ` / ${scene}`}`;

                  return (
                    <TableRow key={`${record.time}-${record.apiId}-${index}`}>
                      <TableCell>{formatToDateInput(record.time, true)}</TableCell>
                      <TableCell>{record.billingType ?? "-"}</TableCell>
                      <TableCell>{record.apiId ?? "-"}</TableCell>
                      <TableCell>{toNumber(record.amount).toFixed(2)}</TableCell>

                      <TableCell>{toNumber(record.bonusAmount).toFixed(2)}</TableCell>
                      <TableCell>{projectScene}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {truncateData(record.data)}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span className="text-sm text-muted-foreground">
            Total records: {data?.total ?? 0}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!data || data.pageNo <= 1 || isLoading}
              onClick={() => handleDailyDetailPageChange(tabId, "prev")}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {data?.pageNo ?? filters.pageNo} of {data?.totalPages ?? 1}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={
                !data || data.pageNo >= data.totalPages || isLoading
              }
              onClick={() => handleDailyDetailPageChange(tabId, "next")}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const dailyUsageContent = (tabId: string, meta?: { year?: number; month?: number }) => {
    const params =
      dailyUsageParams[tabId] ??
      getDefaultDailyUsageParams(meta?.year, meta?.month);
    const records = dailyUsageData[tabId] ?? [];
    const isLoading = loadingState[tabId];

    return (
      <div className="space-y-6">
        <form
          className="flex flex-col gap-4 md:flex-row md:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            handleDailyUsageSearch(tabId);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={`month-${tabId}`}>Month</Label>
            <Input
              id={`month-${tabId}`}
              type="month"
              value={formatMonthInput(params.year, params.month)}
              onChange={(event) =>
                handleDailyUsageInputChange(tabId, event.target.value)
              }
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Search</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDailyUsageSearch(tabId)}
            >
              Refresh
            </Button>
          </div>
        </form>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Total Usage</TableHead>
                {/* <TableHead>Recharged Amount</TableHead> */}
                <TableHead>Bonus Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Loading daily usage...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No daily usage found for this month.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                records.map((record, index) => {
                  const dateValue = formatToDateInput(record.date);
                  return (
                    <TableRow
                      key={`${dateValue}-${index}`}
                      className="cursor-pointer transition-colors hover:bg-muted/60"
                      // onClick={() => openDailyDetailTab(dateValue)}
                    >
                      <TableCell>{dateValue || "-"}</TableCell>
                      <TableCell>{toNumber(record.totalConsumed).toFixed(2)}</TableCell>
                      {/* <TableCell>{toNumber(record.rechargedAmount).toFixed(2)}</TableCell> */}
                      <TableCell>{toNumber(record.bonusAmount).toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const monthlyUsageContent = () => {
    const isLoading = loadingState["monthly-usage"];

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Total Consumed</TableHead>
              <TableHead>Total Recharged</TableHead>
              <TableHead>Total Bonus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  Loading monthly usage...
                </TableCell>
              </TableRow>
            )}

            {!isLoading && monthlyUsage.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  No monthly usage available.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              monthlyUsage.map((record, index) => {
                const year =
                  record.year ??
                  (record.date ? new Date(record.date).getFullYear() : undefined);
                const month =
                  record.month ??
                  (record.date
                    ? new Date(record.date).getMonth() + 1
                    : undefined);

                if (!year || !month) {
                  return null;
                }

                const monthLabel = formatMonthInput(year, month);

                return (
                  <TableRow
                    key={`${monthLabel}-${index}`}
                    className="cursor-pointer transition-colors hover:bg-muted/60"
                    onClick={() => openDailyUsageTab(year, month)}
                  >
                    <TableCell>{monthLabel}</TableCell>
                    <TableCell>{toNumber(record.totalConsumed).toFixed(2)}</TableCell>
                    <TableCell>{toNumber(record.totalRecharged).toFixed(2)}</TableCell>
                    <TableCell>{toNumber(record.totalBounced).toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderActiveTab = () => {
    if (!activeTabInfo) {
      return null;
    }

    if (
      activeTabInfo.type === "dailyDetail" ||
      activeTabInfo.type === "dailyDetailDynamic"
    ) {
      return dailyDetailContent(activeTabInfo.id, activeTabInfo.meta?.date);
    }

    if (
      activeTabInfo.type === "dailyUsage" ||
      activeTabInfo.type === "dailyUsageDynamic"
    ) {
      return dailyUsageContent(activeTabInfo.id, activeTabInfo.meta);
    }

    return monthlyUsageContent();
  };

  return (
    <>
      <Header title="Bill Detail" />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <CardTitle className="text-sm font-medium">
                Total Debit (Last 2 Months)
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -¥{totalDebit.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Balance Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-wrap items-center gap-2 border-b">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <div
                    key={tab.id}
                    className={`flex items-center border-b-2 ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                  >
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium"
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.title}
                    </button>
                    {tab.closable && (
                      <button
                        type="button"
                        className="px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        onClick={(event) => {
                          event.stopPropagation();
                          closeTab(tab.id);
                        }}
                        aria-label={`Close ${tab.title}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {renderActiveTab()}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              需要发票请联系客服微信
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
