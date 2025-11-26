<template>
  <view class="surface-card">
    <view class="section-title">{{ title }}</view>
    <view v-if="localValue.length" class="experience-list">
      <view class="experience-item" v-for="(item, index) in localValue" :key="index">
        <view class="form-row">
          <text class="form-label">学段</text>
          <input class="input-field" v-model="item.phrase" placeholder="例：高中/本科" @input="sync" />
        </view>
        <view class="form-row">
          <text class="form-label">学校</text>
          <input class="input-field" v-model="item.school" placeholder="学校名称" @input="sync" />
        </view>
        <view class="form-row">
          <text class="form-label">毕业年份</text>
          <input class="input-field" type="number" v-model.number="item.year" placeholder="2024" @input="sync" />
        </view>
        <view class="remove-link" @click="removeEducation(index)">删除此经历</view>
      </view>
    </view>
    <view class="empty-state" v-else>尚未添加{{ title }}</view>
    <button class="secondary-button" @click="addEducation">添加教育经历</button>
    <button class="primary-button" :disabled="!localValue.length" @click="emitSave">
      保存{{ title }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { Education } from "@/api/user/user-interface";

const props = defineProps<{
  title: string;
  modelValue: Education[];
}>();
const emit = defineEmits<{
  (e: "update:modelValue", value: Education[]): void;
  (e: "save", value: Education[]): void;
}>();

const localValue = ref<Education[]>([]);

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

const addEducation = () => {
  localValue.value.push({
    phrase: "",
    school: "",
    year: new Date().getFullYear(),
  });
  sync();
};

const removeEducation = (index: number) => {
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

.remove-link {
  text-align: right;
  color: #ff6347;
  font-size: 24rpx;
}
</style>
