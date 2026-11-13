// utils/inventoryStore.js

// 1. Define the starting stock (This replaces your system_stock.csv)
const DEFAULT_INVENTORY = {
  methylated_spirits: { name: "Methylated Spirits", current: 1.0, max: 1.0, unit: "L" },
  shampoo: { name: "Shampoo", current: 5.0, max: 5.0, unit: "L" },
  razor_blades: { name: "Razor Blades", current: 100, max: 100, unit: "blades" }
};

// 2. Safely get the current inventory from the browser
export function getInventory() {
  // Next.js safety check: ensures this only runs in the browser, not the server
  if (typeof window === "undefined") return DEFAULT_INVENTORY;

  const storedData = localStorage.getItem("grok_inventory");
  
  if (storedData) {
    return JSON.parse(storedData); // Return the saved data
  } else {
    // If it's a new user, save and return the default data
    localStorage.setItem("grok_inventory", JSON.stringify(DEFAULT_INVENTORY));
    return DEFAULT_INVENTORY;
  }
}

// 3. Save updated inventory back to the browser
export function saveInventory(newInventoryObject) {
  if (typeof window !== "undefined") {
    localStorage.setItem("grok_inventory", JSON.stringify(newInventoryObject));
  }
}

// 4. Reset function (Crucial for live pitches!)
// You will want a hidden button to reset the app before presenting to the judges
export function resetInventory() {
  if (typeof window !== "undefined") {
    localStorage.setItem("grok_inventory", JSON.stringify(DEFAULT_INVENTORY));
  }
  return DEFAULT_INVENTORY;
}
