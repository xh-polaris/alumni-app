<template>
  <view class="surface-card">
    <view class="section-title">工作经历</view>
    <view v-if="localValue.length" class="experience-list">
      <view class="experience-item" v-for="(item, index) in localValue" :key="index">
        <view class="form-row">
          <text class="form-label">工作单位</text>
          <input class="input-field" v-model="item.organization" placeholder="公司名称" @input="sync" />
        </view>
        <view class="form-row">
          <text class="form-label">职位</text>
          <input class="input-field" v-model="item.position" placeholder="职位名称" @input="sync" />
        </view>
        <view class="form-row">
          <text class="form-label">行业</text>
          <input class="input-field" v-model="item.industry" placeholder="所在行业" @input="sync" />
        </view>
        <view class="inline-fields">
          <view class="form-row">
            <text class="form-label">入职年份</text>
            <input class="input-field" type="number" v-model.number="item.entry" placeholder="2020" @input="sync" />
          </view>
          <view class="form-row">
            <text class="form-label">离职年份</text>
            <input class="input-field" type="number" v-model.number="item.departure" placeholder="0 表示至今" @input="sync" />
          </view>
        </view>
        <view class="remove-link" @click="removeEmployment(index)">删除此经历</view>
      </view>
    </view>
    <view class="empty-state" v-else>尚未添加工作经历</view>
    <button class="secondary-button" @click="addEmployment">添加工作经历</button>
    <button class="primary-button" :disabled="!localValue.length" @click="emitSave">
      保存工作经历
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { Employment } from "@/api/user/user-interface";

const props = defineProps<{
  modelValue: Employment[];
}>();
const emit = defineEmits<{
  (e: "update:modelValue", value: Employment[]): void;
  (e: "save", value: Employment[]): void;
}>();

const localValue = ref<Employment[]>([]);

watch(
  () => props.modelValue,
  (val) => {
    localValue.value = val ? JSON.parse(JSON.stringify(val)) : [];
  },
  { immediate: true, deep: true }
);

const sync = () => {
  emit("update:modelValue", JSON.parse(JSON.stringify(localValue.value)));
};

const addEmployment = () => {
  localValue.value.push({
    organization: "",
    position: "",
    industry: "",
    entry: new Date().getFullYear(),
    departure: 0,
  });
  sync();
};

const removeEmployment = (index: number) => {
  localValue.value.splice(index, 1);
  sync();
};

const emitSave = () => {
  emit("save", localValue.value);
};
</script>

<style scoped>
.experience-list {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  margin-bottom: 24rpx;
}

.experience-item {
  padding: 24rpx;
  border-radius: 24rpx;
  background: var(--alumni-surface-muted);
}

.inline-fields {
  display: flex;
  gap: 16rpx;
}

.inline-fields .form-row {
  flex: 1;
}

.remove-link {
  text-align: right;
  color: #ff6347;
  font-size: 24rpx;
}
</style>

