import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  Switch,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MARKETPLACE_ISSUE_TYPES, normalizeAndCapitalize } from "@inspectly/shared";
import { DashboardSectionCard } from "./DashboardSectionCard";

const ROW_H = 40;

interface FilterSelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function FilterSelect({ label, value, options, onChange, disabled }: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? "Select";

  return (
    <>
      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </Text>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        style={{ height: ROW_H }}
        className={`flex-row items-center px-3 border border-border rounded-lg bg-muted ${
          disabled ? "opacity-50" : ""
        }`}
      >
        <Text className="text-sm text-foreground flex-1" numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#6B7280" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(false)}>
          <Pressable className="bg-white rounded-t-2xl max-h-[70%]" onPress={(e) => e.stopPropagation()}>
            <View className="px-4 py-4 border-b border-border flex-row items-center justify-between">
              <Text className="text-base font-semibold text-foreground">{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <TouchableOpacity
                    key={option.value || "all"}
                    className={`px-4 py-3.5 flex-row items-center justify-between border-b border-border/40 ${
                      active ? "bg-primary/10" : ""
                    }`}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Text className={`text-sm ${active ? "font-semibold text-primary" : "text-foreground"}`}>
                      {option.label}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={18} color="#D4A853" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View
      style={{ height: 32 }}
      className="flex-row items-center rounded-full bg-amber-50 border border-amber-200/80 pl-3 pr-2"
    >
      <Text className="text-xs font-medium text-foreground mr-1.5" numberOfLines={1}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
        className="items-center justify-center"
      >
        <Ionicons name="close" size={14} color="#92400E" />
      </TouchableOpacity>
    </View>
  );
}

export interface MarketplaceFilterPanelProps {
  searchTerm: string;
  selectedType: string;
  selectedCity: string;
  selectedState: string;
  groupByAddress: boolean;
  stateOptions: string[];
  cityOptions: string[];
  isLoadingLocations?: boolean;
  onSearchTermChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onGroupByAddressChange: (value: boolean) => void;
  onSearch: () => void;
  onClear: () => void;
}

export function MarketplaceFilterPanel({
  searchTerm,
  selectedType,
  selectedCity,
  selectedState,
  groupByAddress,
  stateOptions,
  cityOptions,
  isLoadingLocations,
  onSearchTermChange,
  onTypeChange,
  onCityChange,
  onStateChange,
  onGroupByAddressChange,
  onSearch,
  onClear,
}: MarketplaceFilterPanelProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const stateSelectOptions = [
    { label: isLoadingLocations ? "Loading states…" : "All States", value: "" },
    ...stateOptions.map((s) => ({ label: s, value: s })),
  ];
  const citySelectOptions = [
    { label: isLoadingLocations ? "Loading cities…" : "All Cities", value: "" },
    ...cityOptions.map((c) => ({ label: c, value: c })),
  ];

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (selectedType) n += 1;
    if (selectedState) n += 1;
    if (selectedCity) n += 1;
    if (groupByAddress) n += 1;
    return n;
  }, [selectedType, selectedState, selectedCity, groupByAddress]);

  const hasFilterChips = activeFilterCount > 0;

  return (
    <DashboardSectionCard className="mb-3">
      {/* Search + Filters — equal height row */}
      <View className="flex-row items-center gap-2 px-3 py-3">
        <View
          style={{ height: ROW_H }}
          className="flex-1 flex-row items-center bg-neutral-100 rounded-lg px-3 border border-border/50"
        >
          <Ionicons name="search-outline" size={17} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-foreground text-sm"
            style={Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : undefined}
            placeholder="Search jobs..."
            placeholderTextColor="#9CA3AF"
            value={searchTerm}
            onChangeText={onSearchTermChange}
            returnKeyType="search"
            onSubmitEditing={onSearch}
          />
          {searchTerm.length > 0 ? (
            <TouchableOpacity onPress={() => onSearchTermChange("")} className="ml-1">
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => setSheetOpen(true)}
          activeOpacity={0.7}
          style={{ height: ROW_H }}
          className={`flex-row items-center rounded-lg px-3 border ${
            activeFilterCount > 0
              ? "bg-amber-50 border-amber-200/80"
              : "bg-neutral-100 border-border/50"
          }`}
        >
          <Ionicons
            name="options-outline"
            size={17}
            color={activeFilterCount > 0 ? "#B45309" : "#6B7280"}
          />
          <Text
            className={`text-sm font-semibold ml-1.5 ${
              activeFilterCount > 0 ? "text-amber-800" : "text-muted-foreground"
            }`}
          >
            Filters
          </Text>
          {activeFilterCount > 0 ? (
            <View className="ml-1.5 w-[18px] h-[18px] rounded-full bg-primary items-center justify-center">
              <Text className="text-[10px] font-bold text-white leading-none">{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Active chips — inside same card, aligned with search row padding */}
      {hasFilterChips ? (
        <View className="border-t border-border/40 mx-3 pb-3">
          <View className="flex-row flex-wrap items-center gap-2 px-0 py-2.5">
          {selectedType ? (
            <FilterChip
              label={normalizeAndCapitalize(selectedType)}
              onRemove={() => onTypeChange("")}
            />
          ) : null}
          {selectedState ? (
            <FilterChip label={selectedState} onRemove={() => onStateChange("")} />
          ) : null}
          {selectedCity ? (
            <FilterChip label={selectedCity} onRemove={() => onCityChange("")} />
          ) : null}
          {groupByAddress ? (
            <FilterChip label="Grouped" onRemove={() => onGroupByAddressChange(false)} />
          ) : null}
          <TouchableOpacity
            onPress={onClear}
            style={{ height: 32 }}
            className="justify-center px-1"
          >
            <Text className="text-xs font-semibold text-muted-foreground">Clear all</Text>
          </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Filter sheet */}
      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setSheetOpen(false)}>
          <Pressable className="bg-white rounded-t-2xl" onPress={(e) => e.stopPropagation()}>
            <View className="px-4 py-4 border-b border-border/60 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">Filters</Text>
              <TouchableOpacity onPress={() => setSheetOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[70%] px-4 py-4" keyboardShouldPersistTaps="handled">
              <View className="gap-4">
                <FilterSelect
                  label="Type"
                  value={selectedType}
                  options={MARKETPLACE_ISSUE_TYPES}
                  onChange={onTypeChange}
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <FilterSelect
                      label="State"
                      value={selectedState}
                      options={stateSelectOptions}
                      onChange={onStateChange}
                      disabled={isLoadingLocations}
                    />
                  </View>
                  <View className="flex-1">
                    <FilterSelect
                      label="City"
                      value={selectedCity}
                      options={citySelectOptions}
                      onChange={onCityChange}
                      disabled={isLoadingLocations}
                    />
                  </View>
                </View>

                <View className="flex-row items-center justify-between py-1 border-t border-border/60 pt-4">
                  <Text className="text-sm font-medium text-foreground">Group by address</Text>
                  <Switch
                    value={groupByAddress}
                    onValueChange={onGroupByAddressChange}
                    trackColor={{ false: "#E5E7EB", true: "#D4A853" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </ScrollView>

            <View className="px-4 py-4 border-t border-border/60 flex-row gap-2">
              {activeFilterCount > 0 || searchTerm ? (
                <TouchableOpacity
                  className="px-4 rounded-xl border border-border bg-muted items-center justify-center"
                  style={{ height: 44 }}
                  onPress={() => {
                    onClear();
                    setSheetOpen(false);
                  }}
                >
                  <Text className="text-sm font-semibold text-foreground">Clear all</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                className="flex-1 rounded-xl bg-foreground items-center justify-center"
                style={{ height: 44 }}
                onPress={() => setSheetOpen(false)}
              >
                <Text className="text-sm font-semibold text-white">Show results</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DashboardSectionCard>
  );
}
