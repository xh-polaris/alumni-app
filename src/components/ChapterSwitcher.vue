<script setup lang="ts">
import { computed } from "vue";
import type { Chapter } from "@/api/chapter/chapter-interface";
import { toChapterShortName } from "@/api/chapter/chapter-interface";

/**
 * 分会切换 chip 条。资讯页与活动页共用：
 * - `includeAll` 打开时最左侧是「全部分会」（`allLabel` 可覆盖文案），选中值 `""`；
 * - 默认样式为浅底胶囊（资讯页），`variant="onDark"` 供深色背景使用。
 */
const props = withDefaults(defineProps<{
  chapters: Chapter[];
  modelValue: string;
  includeAll?: boolean;
  allLabel?: string;
  variant?: "default" | "onDark";
  disabled?: boolean;
}>(), {
  includeAll: true,
  allLabel: "全部",
  variant: "default",
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string];
}>();

const chips = computed(() => [
  ...(props.includeAll ? [{ id: "", label: props.allLabel }] : []),
  ...props.chapters.map((chapter) => ({ id: chapter.id, label: toChapterShortName(chapter) })),
]);

const select = (id: string) => {
  if (props.disabled || id === props.modelValue) return;
  emit("update:modelValue", id);
  emit("change", id);
};
</script>

<template>
  <scroll-view class="chapter-switcher" scroll-x :show-scrollbar="false" :enhanced="false">
    <view class="chapter-switcher__track" :class="`chapter-switcher__track--${props.variant}`">
      <view
        v-for="chip in chips"
        :key="chip.id || 'all'"
        class="chapter-chip"
        :class="[
          `chapter-chip--${props.variant}`,
          { 'chapter-chip--active': chip.id === props.modelValue, 'chapter-chip--disabled': props.disabled },
        ]"
        hover-class="chapter-chip--pressed"
        hover-stay-time="80"
        @click="select(chip.id)"
      >
        {{ chip.label }}
      </view>
    </view>
  </scroll-view>
</template>

<style scoped>
.chapter-switcher { width: 100%; margin-bottom: 24rpx; white-space: nowrap; }
.chapter-switcher__track { display: inline-flex; align-items: center; gap: 14rpx; padding: 2rpx; }
.chapter-switcher__track--onDark { padding: 0; }
.chapter-chip { min-height: 64rpx; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; padding: 14rpx 28rpx; border: 1rpx solid var(--alumni-border); border-radius: 999rpx; background: var(--alumni-surface); color: var(--alumni-muted); font-size: 25rpx; line-height: 1.2; transition: background-color 180ms ease, color 180ms ease, border-color 180ms ease, transform 180ms ease; }
.chapter-chip--active { border-color: var(--alumni-primary); background: var(--alumni-primary); color: #fff; font-weight: 600; }
.chapter-chip--pressed { transform: scale(0.97); }
.chapter-chip--disabled { opacity: 0.55; }
.chapter-chip--onDark { border-color: rgba(255, 255, 255, 0.22); background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.78); }
.chapter-chip--onDark.chapter-chip--active { border-color: var(--alumni-accent); background: var(--alumni-accent); color: #16311f; }
@media (prefers-reduced-motion: reduce) { .chapter-chip { transition: none; } }
</style>
