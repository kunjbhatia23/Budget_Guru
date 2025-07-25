"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProfileSwitcher } from "@/components/profile/profile-switcher";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  PieChart,
  Target,
  Plus,
  List,
  Menu,
  X,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Scale,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  {
    id: "overview",
    label: "Overview",
    icon: BarChart3,
    description: "Dashboard & stats",
  },
  {
    id: "categories",
    label: "Categories",
    icon: PieChart,
    description: "Spending breakdown",
  },
  {
    id: "budget",
    label: "Budget",
    icon: Target,
    description: "Budget management",
  },
  {
    id: "add",
    label: "Add Transaction",
    icon: Plus,
    description: "Record new entry",
    highlight: false, // Set highlight to false to remove the "New" badge
    specialStyle: true, // Add a new property for persistent highlighting
  },
  {
    id: "transactions",
    label: "History",
    icon: List,
    description: "All transactions",
  },
  {
    id: "split",
    label: "Expense Split",
    icon: Scale,
    description: "Settle group debts",
  },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden shadow-lg bg-background/80 backdrop-blur-sm border border-border text-foreground hover:bg-accent"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? "Close menu" : "Open menu"}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
          role="button"
          aria-label="Close mobile sidebar"
          tabIndex={0}
        />
      )}

      {/* Fixed Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-screen bg-background/95 backdrop-blur-md border-r border-border z-50 transition-all duration-300 ease-in-out shadow-xl overflow-y-auto",
          "md:translate-x-0",
          isCollapsed ? "w-20" : "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-border flex-shrink-0">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => {
                onTabChange("overview");
                setIsMobileOpen(false);
              }}
              role="button"
              tabIndex={0}
              aria-label="Go to Overview"
            >
              <div className="p-3 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 rounded-xl shadow-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex-1">
                  <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Budget Guru
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium">
                    Personal Dashboard
                  </p>
                </div>
              )}
            </div>

            {/* Profile Switcher */}
            {!isCollapsed && (
              <div className="mt-4">
                <ProfileSwitcher />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <div key={item.id} className="relative">
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-12 transition-all duration-200 group relative overflow-hidden",
                      isCollapsed ? "px-3" : "px-4",
                      isActive &&
                        "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25",
                      !isActive &&
                        "hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] hover:shadow-sm",
                      // Apply special style if not active and has specialStyle flag
                      item.specialStyle && !isActive &&
                        "border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50"
                    )}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileOpen(false);
                    }}
                    aria-label={`Maps to ${item.label}`}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                        isActive
                          ? "text-white"
                          : "text-muted-foreground group-hover:text-foreground",
                        "group-hover:scale-110"
                      )}
                    />
                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <div
                          className={cn(
                            "font-medium text-sm",
                            isActive ? "text-white" : "text-foreground"
                          )}
                        >
                          {item.label}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            isActive ? "text-white/80" : "text-muted-foreground"
                          )}
                        >
                          {item.description}
                        </div>
                      </div>
                    )}
                    {/* The Badge component will only render if item.highlight is true */}
                    {item.highlight && !isActive && !isCollapsed && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      >
                        New
                      </Badge>
                    )}
                  </Button>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-r-full shadow-sm" />
                  )}
                </div>
              );
            })}
          </nav>

          <Separator className="mx-4" />

          {/* Collapse Toggle (Desktop only) */}
          <div className="p-4 hidden md:block flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span className="text-sm">Collapse</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}