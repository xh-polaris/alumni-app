<script setup lang="ts">
import { ref } from "vue";
import type { Employment } from "@/api/user/user-interface";

const model = defineModel<Employment[]>({ required: true });
const emit = defineEmits<{ save: [value: Employment[]] }>();
const isEditing = ref(false);
const backup = ref<Employment[]>([]);
const industryOptions = [
  "不填写",
  "农、林、牧、渔业",
  "采矿业",
  "制造业",
  "电力、热力、燃气及水生产和供应业",
  "建筑业",
  "批发和零售业",
  "交通运输、仓储和邮政业",
  "住宿和餐饮业",
  "信息传输、软件和信息技术服务业",
  "金融业",
  "房地产业",
  "租赁和商务服务业",
  "科学研究和技术服务业",
  "水利、环境和公共设施管理业",
  "居民服务、修理和其他服务业",
  "教育",
  "卫生和社会工作",
  "文化、体育和娱乐业",
  "公共管理、社会保障和社会组织",
  "国际组织",
];
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: currentYear - 1949 + 6 }, (_, index) => String(currentYear + 5 - index));
const departureOptions = ["至今", ...yearOptions];
const clone = (items: Employment[]) => items.map((item) => ({ ...item }));
const getPickerIndex = (options: string[], value: string | number) => {
  const index = options.findIndex((option) => option === String(value));
  return index >= 0 ? index : 0;
};
const getIndustryIndex = (industry: string) => {
  if (!industry) return 0;
  const index = industryOptions.indexOf(industry);
  return index >= 0 ? index : 0;
};
const getDepartureIndex = (departure: number) => {
  if (!departure) return 0;
  const index = departureOptions.findIndex((option) => option === String(departure));
  return index >= 0 ? index : 0;
};

const startEdit = () => {
  backup.value = clone(model.value);
  isEditing.value = true;
};
const cancelEdit = () => {
  model.value = clone(backup.value);
  isEditing.value = false;
};
const save = () => {
  if (model.value.some((item) => !item.organization.trim() || !item.position.trim() || !item.entry)) {
    uni.showToast({ title: "请完善工作经历后再保存", icon: "none" });
    return;
  }
  if (model.value.some((item) => item.departure && item.departure < item.entry)) {
    uni.showToast({ title: "离职年份不能早于入职年份", icon: "none" });
    return;
  }
  emit("save", clone(model.value));
  backup.value = clone(model.value);
  isEditing.value = false;
};
const addEmployment = () => {
  model.value = [...model.value, {
    organization: "",
    position: "",
    industry: "",
    entry: new Date().getFullYear(),
    departure: 0,
  }];
};
const removeEmployment = (index: number) => {
  uni.showModal({
    title: "删除工作经历",
    content: "删除后仍需点击保存才会生效。",
    confirmColor: "#C74B42",
    success: ({ confirm }) => {
      if (confirm) {
        model.value = model.value.filter((_, itemIndex) => itemIndex !== index);
      }
    },
  });
};
const onIndustryChange = (index: number, event: { detail: { value: string | number } }) => {
  const value = industryOptions[Number(event.detail.value)] ?? "";
  model.value[index].industry = value === "不填写" ? "" : value;
};
const onEntryChange = (index: number, event: { detail: { value: string | number } }) => {
  model.value[index].entry = Number(yearOptions[Number(event.detail.value)] ?? 0);
};
const onDepartureChange = (index: number, event: { detail: { value: string | number } }) => {
  const value = departureOptions[Number(event.detail.value)] ?? "至今";
  model.value[index].departure = value === "至今" ? 0 : Number(value);
};
</script>

<template>
  <view class="surface-card experience-card">
    <view class="experience-card__header">
      <view><view class="experience-card__title">工作经历</view><view class="experience-card__count">{{ model.length }} 条记录</view></view>
      <button v-if="!isEditing" class="text-button header-button" @click="startEdit">管理</button>
    </view>

    <view v-if="!isEditing">
      <view v-if="model.length" class="timeline">
        <view v-for="(item, index) in model" :key="`${item.organization}-${item.entry}-${index}`" class="timeline__item">
          <view class="timeline__dot" />
          <text class="timeline__year">{{ item.entry || "年份未填" }} — {{ item.departure || "至今" }}</text>
          <view class="timeline__organization">{{ item.organization || "单位未填写" }}</view>
          <view class="timeline__position">{{ item.position || "职位未填写" }}<text v-if="item.industry"> · {{ item.industry }}</text></view>
        </view>
      </view>
      <view v-else class="empty-copy">尚未添加工作经历</view>
    </view>

    <view v-else>
      <view v-for="(item, index) in model" :key="index" class="editor-item">
        <view class="editor-item__header"><text>工作经历 {{ index + 1 }}</text><button class="text-button remove-button" @click="removeEmployment(index)">删除</button></view>
        <view class="form-row"><text class="form-label">工作单位</text><input v-model="item.organization" class="input-field" placeholder="请输入单位名称" /></view>
        <view class="form-row"><text class="form-label">职位</text><input v-model="item.position" class="input-field" placeholder="请输入职位" /></view>
        <view class="form-row">
          <text class="form-label">行业</text>
          <picker mode="selector" :range="industryOptions" :value="getIndustryIndex(item.industry)" @change="onIndustryChange(index, $event)">
            <view class="picker-field" :class="{ 'picker-field--placeholder': !item.industry }">{{ item.industry || "请选择国民经济行业分类（选填）" }}</view>
          </picker>
        </view>
        <view class="year-fields">
          <view class="form-row">
            <text class="form-label">入职年份</text>
            <picker mode="selector" :range="yearOptions" :value="getPickerIndex(yearOptions, item.entry)" @change="onEntryChange(index, $event)">
              <view class="picker-field" :class="{ 'picker-field--placeholder': !item.entry }">{{ item.entry || "请选择" }}</view>
            </picker>
          </view>
          <view class="form-row">
            <text class="form-label">离职年份</text>
            <picker mode="selector" :range="departureOptions" :value="getDepartureIndex(item.departure)" @change="onDepartureChange(index, $event)">
              <view class="picker-field">{{ item.departure || "至今" }}</view>
            </picker>
          </view>
        </view>
      </view>
      <button class="secondary-button add-button" @click="addEmployment">添加工作经历</button>
      <view class="button-row editor-actions"><button class="secondary-button" @click="cancelEdit">取消</button><button class="primary-button" @click="save">保存</button></view>
    </view>
  </view>
</template>

<style scoped>
.experience-card { padding: 30rpx; }
.experience-card__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; }
.experience-card__title { font-family: "Songti SC", serif; font-size: 31rpx; font-weight: 600; }
.experience-card__count { margin-top: 5rpx; color: var(--alumni-muted); font-size: 21rpx; }
.header-button { min-height: 52rpx; padding: 4rpx 8rpx; font-size: 22rpx; }
.timeline { margin: 26rpx 0 0 10rpx; padding-left: 26rpx; border-left: 1rpx solid var(--alumni-border); }
.timeline__item { position: relative; padding-bottom: 26rpx; }
.timeline__item:last-child { padding-bottom: 2rpx; }
.timeline__dot { position: absolute; top: 8rpx; left: -34rpx; width: 14rpx; height: 14rpx; border-radius: 50%; background: var(--alumni-accent); box-shadow: 0 0 0 8rpx var(--alumni-accent-soft); }
.timeline__year { color: var(--alumni-muted); font-size: 20rpx; }
.timeline__organization { margin-top: 5rpx; color: var(--alumni-text); font-size: 27rpx; font-weight: 600; }
.timeline__position { margin-top: 5rpx; color: var(--alumni-muted); font-size: 23rpx; }
.empty-copy { padding: 46rpx 0 16rpx; color: var(--alumni-muted); font-size: 24rpx; text-align: center; }
.editor-item { margin-top: 24rpx; padding: 24rpx; border-radius: var(--alumni-radius-md); background: var(--alumni-surface-muted); }
.editor-item__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; font-size: 24rpx; font-weight: 600; }
.remove-button { min-height: 48rpx; padding: 4rpx; color: var(--alumni-danger); font-size: 21rpx; }
.picker-field--placeholder { color: var(--alumni-muted); }
.year-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14rpx; }
.add-button { width: 100%; margin-top: 20rpx; }
.editor-actions { margin-top: 16rpx; }
</style>
