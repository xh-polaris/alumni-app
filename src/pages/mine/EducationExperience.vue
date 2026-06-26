<script setup lang="ts">
import { ref } from "vue";
import type { Education } from "@/api/user/user-interface";

const props = defineProps<{ title: string }>();
const model = defineModel<Education[]>({ required: true });
const emit = defineEmits<{ save: [value: Education[]] }>();

const isEditing = ref(false);
const backup = ref<Education[]>([]);
const phaseOptions = ["小学", "初中", "高中", "中专/职高", "大专", "本科", "硕士", "博士", "其他"];
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: currentYear - 1949 + 6 }, (_, index) => String(currentYear + 5 - index));
const clone = (items: Education[]) => items.map((item) => ({ ...item }));
const getPickerIndex = (options: string[], value: string | number) => {
  const index = options.findIndex((option) => option === String(value));
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
  if (model.value.some((item) => !item.phase.trim() || !item.school.trim() || !item.year)) {
    uni.showToast({ title: "请完善教育经历后再保存", icon: "none" });
    return;
  }
  emit("save", clone(model.value));
  backup.value = clone(model.value);
  isEditing.value = false;
};
const addEducation = () => {
  model.value = [...model.value, { phase: "", school: "", year: new Date().getFullYear() }];
};
const onPhaseChange = (index: number, event: { detail: { value: string | number } }) => {
  model.value[index].phase = phaseOptions[Number(event.detail.value)] ?? "";
};
const onYearChange = (index: number, event: { detail: { value: string | number } }) => {
  model.value[index].year = Number(yearOptions[Number(event.detail.value)] ?? 0);
};
const removeEducation = (index: number) => {
  uni.showModal({
    title: "删除教育经历",
    content: "删除后仍需点击保存才会生效。",
    confirmColor: "#C74B42",
    success: ({ confirm }) => {
      if (confirm) model.value = model.value.filter((_, itemIndex) => itemIndex !== index);
    },
  });
};
</script>

<template>
  <view class="surface-card experience-card">
    <view class="experience-card__header">
      <view>
        <view class="experience-card__title">{{ props.title }}</view>
        <view class="experience-card__count">{{ model.length }} 条记录</view>
      </view>
      <button v-if="!isEditing" class="text-button header-button" @click="startEdit">管理</button>
    </view>

    <view v-if="!isEditing">
      <view v-if="model.length" class="timeline">
        <view v-for="(item, index) in model" :key="`${item.school}-${item.year}-${index}`" class="timeline__item">
          <view class="timeline__dot" />
          <text class="timeline__year">{{ item.year || "年份未填" }}</text>
          <view class="timeline__school">{{ item.school || "学校未填写" }}</view>
          <view class="timeline__phase">{{ item.phase || "学段未填写" }}</view>
        </view>
      </view>
      <view v-else class="empty-copy">尚未添加{{ props.title }}</view>
    </view>

    <view v-else>
      <view v-for="(item, index) in model" :key="index" class="editor-item">
        <view class="editor-item__header"><text>教育经历 {{ index + 1 }}</text><button class="text-button remove-button" @click="removeEducation(index)">删除</button></view>
        <view class="form-row">
          <text class="form-label">学段</text>
          <picker mode="selector" :range="phaseOptions" :value="getPickerIndex(phaseOptions, item.phase)" @change="onPhaseChange(index, $event)">
            <view class="picker-field" :class="{ 'picker-field--placeholder': !item.phase }">{{ item.phase || "请选择学段" }}</view>
          </picker>
        </view>
        <view class="form-row"><text class="form-label">学校</text><input v-model="item.school" class="input-field" placeholder="请输入学校名称" /></view>
        <view class="form-row">
          <text class="form-label">毕业年份</text>
          <picker mode="selector" :range="yearOptions" :value="getPickerIndex(yearOptions, item.year)" @change="onYearChange(index, $event)">
            <view class="picker-field" :class="{ 'picker-field--placeholder': !item.year }">{{ item.year || "请选择毕业年份" }}</view>
          </picker>
        </view>
      </view>
      <button class="secondary-button add-button" @click="addEducation">添加教育经历</button>
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
.timeline__school { margin-top: 5rpx; color: var(--alumni-text); font-size: 27rpx; font-weight: 600; }
.timeline__phase { margin-top: 5rpx; color: var(--alumni-muted); font-size: 23rpx; }
.empty-copy { padding: 46rpx 0 16rpx; color: var(--alumni-muted); font-size: 24rpx; text-align: center; }
.editor-item { margin-top: 24rpx; padding: 24rpx; border-radius: var(--alumni-radius-md); background: var(--alumni-surface-muted); }
.editor-item__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; font-size: 24rpx; font-weight: 600; }
.remove-button { min-height: 48rpx; padding: 4rpx; color: var(--alumni-danger); font-size: 21rpx; }
.picker-field--placeholder { color: var(--alumni-muted); }
.add-button { width: 100%; margin-top: 20rpx; }
.editor-actions { margin-top: 16rpx; }
</style>
