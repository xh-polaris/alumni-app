<template>
<view class="surface-card">
  <view class="first-line"> 
    <view class="section-title">{{ title }}</view>
  <div v-if="!isEditing" class="primary-button" @click="toggleEdit">
    {{ "编辑"  }}
  </div>
    <div v-if="isEditing" class="primary-button" @click="toggleEdit">
    {{"保存"}}
  </div>
  </view>
  <view v-if="localValue.length" class="experience-list">
    <view class="experience-item" v-for="(item, index) in localValue" :key="index">

      <!-- 学段 -->
      <view class="form-row">
        <text class="form-label">学段</text>
        <template v-if="isEditing">
          <input class="input-field" v-model="item.phrase" placeholder="例：高中/本科" @input="sync" />
        </template>
        <template v-else>
          <text>{{ item.phrase || "未填写" }}</text>
        </template>
      </view>

      <!-- 学校 -->
      <view class="form-row">
        <text class="form-label">学校</text>
        <template v-if="isEditing">
          <input class="input-field" v-model="item.school" placeholder="学校名称" @input="sync" />
        </template>
        <template v-else>
          <text>{{ item.school || "未填写" }}</text>
        </template>
      </view>

      <!-- 毕业年份 -->
      <view class="form-row">
        <text class="form-label">毕业年份</text>
        <template v-if="isEditing">
          <input class="input-field" type="number" v-model.number="item.year" placeholder="2024" @input="sync" />
        </template>
        <template v-else>
          <text>{{ item.year }}</text>
        </template>
      </view>

      <view v-if="isEditing" class="remove-link" @click="removeEducation(index)">删除此经历</view>
    </view>
  </view>

  <view class="empty-state" v-else>尚未添加{{ title }}</view>

  <button
    class="secondary-button"
    @click="addEducation"
    v-if="isEditing"
  >
    添加教育经历
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
const isEditing = ref(false);

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
  if (!isEditing.value) return; // 非编辑状态禁止添加
  localValue.value.push({
    phrase: "",
    school: "",
    year: new Date().getFullYear(),
  });
  sync();
};

const removeEducation = (index: number) => {
  if (!isEditing.value) return;
  localValue.value.splice(index, 1);
  sync();
};

const toggleEdit = () => {
  isEditing.value = !isEditing.value;
  
  // 退出编辑就保存
  if (!isEditing.value) {
    emit("save", localValue.value);
  }
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
