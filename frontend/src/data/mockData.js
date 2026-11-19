// Mock data simulating what the Python agent would return
export const businessProfile = {
  name: "So Convenient",
  type: "barbershop",
  owner: "Lebo Nkosi",
  location: "Soweto, Johannesburg",
  monthlyServices: 312,
};

export const stockItems = [
  { id: 1, sku: "MET001", name: "Methylated Spirits 500ml", category: "Chemicals", location: "Back Shelf", unit: "ml", currentStock: 1200, maxStock: 2000, unitCost: 18.5, reorderPoint: 500, estimatedUsagePerService: 10, status: "healthy" },
  { id: 2, sku: "COT001", name: "Cotton Pads (100 pack)", category: "Consumables", location: "Counter", unit: "pads", currentStock: 45, maxStock: 300, unitCost: 32.0, reorderPoint: 75, estimatedUsagePerService: 2, status: "critical" },
  { id: 3, sku: "RAZ001", name: "Disposable Razors", category: "Consumables", location: "Counter", unit: "units", currentStock: 180, maxStock: 500, unitCost: 2.5, reorderPoint: 125, estimatedUsagePerService: 1, status: "warning" },
  { id: 4, sku: "SHA001", name: "Shampoo 1L", category: "Hair Products", location: "Shelf A", unit: "ml", currentStock: 3200, maxStock: 5000, unitCost: 55.0, reorderPoint: 1250, estimatedUsagePerService: 15, status: "healthy" },
  { id: 5, sku: "GEL001", name: "Hair Gel 500g", category: "Hair Products", location: "Shelf A", unit: "g", currentStock: 620, maxStock: 2000, unitCost: 45.0, reorderPoint: 500, estimatedUsagePerService: 8, status: "warning" },
  { id: 6, sku: "CLO001", name: "Clippers Oil 150ml", category: "Equipment", location: "Counter", unit: "ml", currentStock: 480, maxStock: 600, unitCost: 85.0, reorderPoint: 150, estimatedUsagePerService: 2, status: "healthy" },
  { id: 7, sku: "TAL001", name: "Talcum Powder 200g", category: "Consumables", location: "Counter", unit: "g", currentStock: 95, maxStock: 400, unitCost: 28.0, reorderPoint: 100, estimatedUsagePerService: 5, status: "warning" },
  { id: 8, sku: "DIS001", name: "Disinfectant Spray 750ml", category: "Chemicals", location: "Back Shelf", unit: "ml", currentStock: 1800, maxStock: 3000, unitCost: 42.0, reorderPoint: 750, estimatedUsagePerService: 8, status: "healthy" },
];

export const alerts = [
  { id: 1, type: "confirm", sku: "MET001", name: "Methylated Spirits", message: "Agent estimates you're at ~60% capacity. Can you confirm this is accurate?", agentEstimate: 60, timestamp: "2 hours ago", priority: "medium" },
  { id: 2, type: "order", sku: "COT001", name: "Cotton Pads", message: "Stock is critically low (15%). Recommend ordering 300 packs for the next month.", suggestedQty: 300, estimatedCost: 96.0, timestamp: "30 minutes ago", priority: "high" },
  { id: 3, type: "confirm", sku: "RAZ001", name: "Disposable Razors", message: "Agent estimates razors at ~36%. Is this correct?", agentEstimate: 36, timestamp: "1 hour ago", priority: "medium" },
  { id: 4, type: "order", sku: "GEL001", name: "Hair Gel 500g", message: "Stock approaching reorder point (31%). Order now to avoid running out?", suggestedQty: 10, estimatedCost: 450.0, timestamp: "3 hours ago", priority: "medium" },
];

export const recentActivity = [
  { id: 1, action: "Haircut completed", impact: "-10ml spirits, -2 cotton pads, -1 razor", time: "10 min ago", icon: "scissors" },
  { id: 2, action: "Order approved", impact: "Disinfectant x5 ordered — R210.00", time: "2 hours ago", icon: "package" },
  { id: 3, action: "Stock confirmed", impact: "Clippers Oil confirmed at 80%", time: "3 hours ago", icon: "check" },
  { id: 4, action: "Alert dismissed", impact: "Shampoo recount scheduled", time: "5 hours ago", icon: "bell" },
  { id: 5, action: "Haircut completed", impact: "-10ml spirits, -2 cotton pads, -1 razor", time: "6 hours ago", icon: "scissors" },
];

export const weeklyUsageData = [
  { day: "Mon", haircuts: 42, stockUsed: 420 },
  { day: "Tue", haircuts: 38, stockUsed: 380 },
  { day: "Wed", haircuts: 55, stockUsed: 550 },
  { day: "Thu", haircuts: 61, stockUsed: 610 },
  { day: "Fri", haircuts: 78, stockUsed: 780 },
  { day: "Sat", haircuts: 94, stockUsed: 940 },
  { day: "Sun", haircuts: 20, stockUsed: 200 },
];

export const stockTrendData = [
  { week: "Wk 1", spirits: 100, cotton: 100, razors: 100 },
  { week: "Wk 2", spirits: 85, cotton: 72, razors: 80 },
  { week: "Wk 3", spirits: 72, cotton: 45, razors: 60 },
  { week: "Wk 4", spirits: 60, cotton: 15, razors: 36 },
];
