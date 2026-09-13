<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { PROVINCES } from "@/data/regions";
import type { ProvinceOption } from "@/data/regions";

/** 与教育/工作经历里的省市区字段结构一致 */
export interface RegionValue {
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
}

/**
 * 只要求字段可能存在（可选），这样 Education / Employment 这类
 * 「带额外字段且省市区可选」的对象可以直接用 v-model 绑定。
 */
export type RegionValueInput = Partial<RegionValue>;

const props = withDefaults(defineProps<{
  modelValue?: RegionValueInput;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}>(), {
  // 默认值必须是字面量：defineProps 会被提升到模块作用域，不能引用本地变量
  modelValue: () => ({}),
  label: "所在地区",
  placeholder: "请选择省 / 市",
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: RegionValue];
  change: [value: RegionValue];
}>();

const provinceNames = PROVINCES.map((item) => item.name);

const provinceIndex = ref(0);
const cityIndex = ref(0);

const currentProvince = computed<ProvinceOption>(() => PROVINCES[provinceIndex.value] ?? PROVINCES[0]);
const cityNames = computed<string[]>(() => currentProvince.value.cities.map((item) => item.name));
const pickerValue = computed<number[]>(() =>
  cityNames.value.length ? [provinceIndex.value, cityIndex.value] : [provinceIndex.value],
);

const regionText = computed(() => {
  const provinceName = props.modelValue.provinceName;
  if (!provinceName) return "";
  const cityName = props.modelValue.cityName;
  if (!cityName || cityName === provinceName) return provinceName;
  return `${provinceName} · ${cityName}`;
});

const resolveIndices = (value: RegionValueInput) => {
  const nextProvinceIndex = Math.max(0, PROVINCES.findIndex((item) => item.code === value.provinceCode));
  provinceIndex.value = nextProvinceIndex;
  const cities = PROVINCES[nextProvinceIndex]?.cities ?? [];
  const nextCityIndex = Math.max(0, cities.findIndex((item) => item.code === value.cityCode));
  cityIndex.value = nextCityIndex;
};

watch(
  () => [props.modelValue.provinceCode, props.modelValue.cityCode] as const,
  ([provinceCode, cityCode]) => resolveIndices({ provinceCode, cityCode }),
  { immediate: true },
);

const buildValue = (): RegionValue => {
  const province = currentProvince.value;
  const city = province.cities[cityIndex.value];
  return {
    provinceCode: province.code,
    provinceName: province.name,
    cityCode: city?.code ?? "",
    cityName: city?.name ?? "",
  };
};

const onPickerChange = (event: { detail: { value: number[] | string[] } }) => {
  const raw = event.detail.value ?? [];
  const nextProvinceIndex = Number(raw[0] ?? 0);
  if (nextProvinceIndex !== provinceIndex.value) {
    provinceIndex.value = nextProvinceIndex;
    cityIndex.value = 0;
    return;
  }
  if (currentProvince.value.cities.length > 1) {
    cityIndex.value = Number(raw[1] ?? 0);
  }
};

const onPickerConfirm = (event: { detail: { value: number[] | string[] } }) => {
  onPickerChange(event);
  const value = buildValue();
  emit("update:modelValue", value);
  emit("change", value);
};

const displayText = computed(() => regionText.value);
</script>

<template>
  <view class="form-row region-picker">
    <text class="form-label">{{ props.label }}</text>
    <picker
      mode="multiSelector"
      :range="[provinceNames, cityNames]"
      :value="pickerValue"
      :disabled="props.disabled"
      @change="onPickerConfirm"
      @columnchange="onPickerChange"
    >
      <view class="picker-field" :class="{ 'picker-field--placeholder': !displayText }">
        {{ displayText || props.placeholder }}
      </view>
    </picker>
  </view>
</template>

<style scoped>
.region-picker { min-width: 0; }
.picker-field--placeholder { color: var(--alumni-muted); }
</style>
