<template>
  <view class="surface-card">
    <view class="first-line">
      <view class="section-title">工作经历</view>
      <div v-if="!isEditing" class="primary-button" @click="startEditing">
        编辑
      </div>
      <view v-else class="primary-button" :disabled="!localValue.length" @click="saveEmployment">
          保存
        </view>
    </view>
    
    <view v-if="!isEditing" class="experience-list-display">
      <view v-if="localValue.length">
        <view class="experience-item-display" v-for="(item, index) in localValue" :key="index">
          <view class="form-row">
            <text class="form-label">工作单位：</text>
            <text class="display-value">{{ item.organization || '未填写' }}</text>
          </view>
          <view class="form-row">
            <text class="form-label">职位：</text>
            <text class="display-value">{{ item.position || '未填写' }}</text>
          </view>
          <view class="form-row">
            <text class="form-label">行业：</text>
            <text class="display-value">{{ item.industry || '未填写' }}</text>
          </view>
          <view class="display-inline-fields">
            <view class="display-row">
              <text class="form-label">入职：</text>
              <text class="display-value">{{ item.entry }}</text>
            </view>
            <view class="display-row">
              <text class="form-label">离职：</text>
              <text class="display-value">{{ item.departure === 0 ? '至今' : item.departure }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="empty-state" v-else>尚未添加工作经历</view>
    </view>
    
    <view v-if="isEditing">
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
        
      
    </view>
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

// 用于展示和编辑的本地数据
const localValue = ref<Employment[]>([]);
// 用于在编辑被取消时恢复数据的备份
const originalValue = ref<Employment[]>([]);
// 控制编辑状态
const isEditing = ref(false);

watch(
  () => props.modelValue,
  (val) => {
    // 监听外部数据变化时，更新本地数据和备份数据
    const safeVal = val ? JSON.parse(JSON.stringify(val)) : [];
    localValue.value = safeVal;
    originalValue.value = safeVal; // 确保在初始加载时有备份
  },
  { immediate: true, deep: true }
);

// 辅助函数：同步编辑中的数据到 v-model
const sync = () => {
  emit("update:modelValue", JSON.parse(JSON.stringify(localValue.value)));
};

// --- 编辑状态控制方法 ---

// 启用编辑模式，并备份当前数据
const startEditing = () => {
  originalValue.value = JSON.parse(JSON.stringify(localValue.value));
  isEditing.value = true;
};

// 取消编辑，并恢复到备份数据
const cancelEditing = () => {
  localValue.value = JSON.parse(JSON.stringify(originalValue.value));
  sync(); // 恢复数据后同步 v-model
  isEditing.value = false;
};

// 保存数据并退出编辑模式
const saveEmployment = () => {
  emit("save", localValue.value);
  isEditing.value = false;
  // 更新备份数据为当前保存的数据
  originalValue.value = JSON.parse(JSON.stringify(localValue.value));
};

// --- CRUD 方法 (仅在编辑模式下可用) ---

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
</script>

<style scoped>
.first-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24rpx;
}

.first-line .section-title {
  margin-top: 38rpx;
}

/* 保持原有的编辑模式样式 */
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
  color: #ff6347; /* 假设这是一个定义好的错误色 */
  font-size: 24rpx;
}

/* 新增：展示模式样式 */
.experience-list-display {
  margin-bottom: 24rpx;
}

.experience-item-display {
  padding: 20rpx 24rpx;

  border-bottom: 1rpx solid var(--alumni-border-color); /* 假设有边框变量 */
}

.experience-item-display:last-child {
  border-bottom: none;
}

.display-row {
  display: flex;
  margin-bottom: 8rpx;
  font-size: 28rpx;
}

.display-label {
  color: var(--alumni-text-muted); /* 假设有文本颜色变量 */
  min-width: 120rpx;
}

.display-value {
  color: var(--alumni-text-primary); /* 假设有文本颜色变量 */
  flex: 1;
}

.display-inline-fields {
  display: flex;
  gap: 40rpx;
}

.display-inline-fields .display-row {
  flex: 1;
  margin-bottom: 0;
}

/* 按钮组样式 */
.action-buttons {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.action-buttons .primary-button {
  flex: 1;
}
.action-buttons .secondary-button {
  flex: 1;
}
</style>