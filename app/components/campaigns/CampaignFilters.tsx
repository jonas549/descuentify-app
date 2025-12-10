import { Tabs } from "@shopify/polaris";
import { useState, useCallback } from "react";

interface CampaignFiltersProps {
  onFilterChange?: (filter: string) => void;
}

export function CampaignFilters({ onFilterChange }: CampaignFiltersProps) {
  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback((selectedTabIndex: number) => {
    setSelected(selectedTabIndex);
    const filters = ["all", "active", "scheduled", "expired"];
    onFilterChange?.(filters[selectedTabIndex]);
  }, [onFilterChange]);

  const tabs = [
    { id: "all", content: "Todas", accessibilityLabel: "Todas las campañas" },
    { id: "active", content: "Activas", accessibilityLabel: "Campañas activas" },
    { id: "scheduled", content: "Programadas", accessibilityLabel: "Campañas programadas" },
    { id: "expired", content: "Expiradas", accessibilityLabel: "Campañas expiradas" },
  ];

  return (
    <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange} />
  );
}