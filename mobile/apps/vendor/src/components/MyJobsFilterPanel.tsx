import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  MyJobsTab,
  MyJobsSort,
  MyJobsStats,
  MY_JOBS_TABS,
  MY_JOBS_SORT_OPTIONS,
  getMyJobsTabLabel,
} from "@inspectly/shared";
import { DashboardSectionCard } from "./DashboardSectionCard";

const ROW_H = 40;

interface SheetSelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

function SheetSelect({ label, value, options, onChange }: SheetSelectProps) {
  return (
    <View>
      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <TouchableOpacity
              key={option.value || "all"}
              onPress={() => onChange(option.value)}
              className={`px-3 rounded-full border ${
                active
                  ? "bg-foreground border-foreground"
                  : "bg-neutral-100 border-border/50"
              }`}
              style={{ height: 32, justifyContent: "center" }}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? "text-white" : "text-muted-foreground"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
        <Ionicons name="close" size={14} color="#92400E" />
      </TouchableOpacity>
    </View>
  );
}

export interface MyJobsFilterPanelProps {
  searchQuery: string;
  statusTab: MyJobsTab;
  sortBy: MyJobsSort;
  stats: MyJobsStats;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: MyJobsTab) => void;
  onSortChange: (value: MyJobsSort) => void;
  onClear: () => void;
}

export function MyJobsFilterPanel({
  searchQuery,
  statusTab,
  sortBy,
  stats,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onClear,
}: MyJobsFilterPanelProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const statusOptions = useMemo(
    () =>
      MY_JOBS_TABS.map((tab) => ({
        label: getMyJobsTabLabel(tab.value, stats),
        value: tab.value,
      })),
    [stats]
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (statusTab !== "all") n += 1;
    if (sortBy !== "date") n += 1;
    return n;
  }, [statusTab, sortBy]);

  const hasChips = activeFilterCount > 0 || searchQuery.length > 0;
  const statusLabel = MY_JOBS_TABS.find((t) => t.value === statusTab)?.label ?? statusTab;
  const sortLabel = MY_JOBS_SORT_OPTIONS.find((s) => s.value === sortBy)?.label ?? sortBy;

  return (
    <DashboardSectionCard className="mb-3">
      <View className="flex-row items-center gap-2 px-3 py-3">
        <View
          style={{ height: ROW_H }}
          className="flex-1 flex-row items-center bg-neutral-100 rounded-lg px-3 border border-border/50"
        >
          <Ionicons name="search-outline" size={17} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-foreground text-sm"
            style={Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : undefined}
            placeholder="Search by type or description..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => onSearchChange("")} className="ml-1">
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

      {hasChips ? (
        <View className="border-t border-border/40 mx-3 pb-3">
          <View className="flex-row flex-wrap items-center gap-2 py-2.5">
            {statusTab !== "all" ? (
              <FilterChip label={statusLabel} onRemove={() => onStatusChange("all")} />
            ) : null}
            {sortBy !== "date" ? (
              <FilterChip
                label={sortLabel.replace("Sort by ", "")}
                onRemove={() => onSortChange("date")}
              />
            ) : null}
            <TouchableOpacity onPress={onClear} style={{ height: 32 }} className="justify-center px-1">
              <Text className="text-xs font-semibold text-muted-foreground">Clear all</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setSheetOpen(false)}>
          <Pressable className="bg-white rounded-t-2xl" onPress={(e) => e.stopPropagation()}>
            <View className="px-4 py-4 border-b border-border/60 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">Filters</Text>
              <TouchableOpacity onPress={() => setSheetOpen(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[70%] px-4 py-4">
              <View className="gap-5">
                <SheetSelect
                  label="Status"
                  value={statusTab}
                  options={statusOptions}
                  onChange={(v) => onStatusChange(v as MyJobsTab)}
                />
                <SheetSelect
                  label="Sort"
                  value={sortBy}
                  options={MY_JOBS_SORT_OPTIONS.map((s) => ({ label: s.label, value: s.value }))}
                  onChange={(v) => onSortChange(v as MyJobsSort)}
                />
              </View>
            </ScrollView>

            <View className="px-4 py-4 border-t border-border/60 flex-row gap-2">
              {hasChips ? (
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
