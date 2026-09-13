<script setup lang="ts">
/**
 * 品牌 Hero：以校园体育馆正立面轮廓作为唯一主视觉。
 *
 * 线稿使用透明 PNG，贴底完整展示，文字留在上方；组件仍可通过 height 和 compact
 * 复用于需要缩短 Hero 的页面。
 */
const props = withDefaults(defineProps<{
  height?: number;
  compact?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
}>(), {
  height: 400,
  compact: false,
  eyebrow: "NINGBO LUNZHONG ALUMNI",
  title: "仑中校友",
  description: "",
});
</script>

<template>
  <view
    class="brand-hero"
    :class="{ 'brand-hero--compact': props.compact }"
    :style="{ height: `${props.height}rpx` }"
  >
    <view class="brand-hero__art" aria-hidden="true">
      <image
        class="brand-hero__outline"
        src="/static/campus-gymnasium-outline.png"
        mode="widthFix"
      />
    </view>

    <view class="brand-hero__copy">
      <text class="brand-hero__eyebrow">{{ props.eyebrow }}</text>
      <text class="brand-hero__title">{{ props.title }}</text>
      <text v-if="props.description" class="brand-hero__description">{{ props.description }}</text>
    </view>
  </view>
</template>

<style scoped>
.brand-hero {
  position: relative;
  width: 100%;
  overflow: hidden;
  margin-bottom: 24rpx;
  border: 1rpx solid rgba(244, 242, 210, 0.12);
  border-radius: var(--alumni-radius-lg);
  background:
    radial-gradient(circle at 82% 8%, rgba(148, 197, 47, 0.12), transparent 42%),
    var(--alumni-primary);
  box-shadow: 0 18rpx 46rpx rgba(21, 63, 50, 0.16);
}

.brand-hero__art {
  position: absolute;
  z-index: 1;
  right: 0;
  bottom: 16rpx;
  left: 0;
  pointer-events: none;
}

.brand-hero__outline {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0.86;
}

.brand-hero__copy {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 34rpx 36rpx 0;
  background: linear-gradient(
    180deg,
    rgba(21, 63, 50, 0.97) 0%,
    rgba(21, 63, 50, 0.78) 30%,
    rgba(21, 63, 50, 0.16) 57%,
    rgba(21, 63, 50, 0) 72%
  );
}

.brand-hero__eyebrow {
  display: block;
  max-width: 72%;
  color: rgba(255, 255, 255, 0.58);
  font-size: 19rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
}

.brand-hero__title {
  display: block;
  max-width: 62%;
  margin-top: 14rpx;
  color: #fff;
  font-family: "Songti SC", "STSong", serif;
  font-size: 58rpx;
  font-weight: 600;
  line-height: 1.22;
  letter-spacing: 4rpx;
}

.brand-hero__description {
  display: block;
  max-width: 58%;
  margin-top: 12rpx;
  color: rgba(255, 255, 255, 0.68);
  font-size: 22rpx;
  line-height: 1.55;
}

.brand-hero--compact .brand-hero__art {
  bottom: 10rpx;
}

.brand-hero--compact .brand-hero__copy {
  padding: 28rpx 30rpx 0;
}

.brand-hero--compact .brand-hero__title {
  margin-top: 10rpx;
  font-size: 46rpx;
}

.brand-hero--compact .brand-hero__eyebrow {
  font-size: 18rpx;
  letter-spacing: 3rpx;
}
</style>
