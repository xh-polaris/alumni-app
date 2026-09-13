<script setup lang="ts">
/**
 * 分会联络人卡片：展示本分会联络人、职责说明、微信/电话与微信二维码。
 *
 * 用在个人中心：身份为「待认证」或尚未选择分会时展示，
 * 让用户能看到该找谁核验、怎么联系 —— 注册结果弹层里「可稍后在个人中心查看」
 * 这句承诺由此兑现。
 */
import { computed, ref, watch } from "vue";
import type { Chapter } from "@/api/chapter/chapter-interface";

const props = withDefaults(
  defineProps<{
    chapter: Chapter | null;
    title?: string;
    description?: string;
  }>(),
  { title: "分会联络人", description: "" },
);

const qrCodeFailed = ref(false);

// 换分会或换二维码时重置失败标记，避免上一张的失败影响下一张
watch(
  () => props.chapter?.contact?.qrCodeUrl,
  () => {
    qrCodeFailed.value = false;
  },
);

const contact = computed(() => props.chapter?.contact ?? null);
const wechatHint = computed(() =>
  contact.value?.wechat ? `请添加微信号 ${contact.value.wechat}` : "请通过联络人电话联系分会",
);

const copyValue = (value: string, label: string) => {
  if (!value) return;
  uni.setClipboardData({
    data: value,
    success: () => uni.showToast({ title: `${label}已复制`, icon: "none" }),
  });
};
</script>

<template>
  <view class="surface-card contact-card">
    <view class="contact-card__header">
      <view class="contact-card__title">{{ props.title }}</view>
      <view v-if="chapter" class="contact-card__chapter">{{ chapter.name }}</view>
    </view>
    <view v-if="props.description" class="contact-card__lead">{{ props.description }}</view>

    <template v-if="contact">
      <view class="contact-card__row">
        <text class="contact-card__label">联络人</text>
        <text class="contact-card__value">{{ contact.name || "待补充" }}</text>
      </view>
      <view v-if="contact.description" class="contact-card__note">{{ contact.description }}</view>
      <view
        v-if="contact.wechat"
        class="contact-card__row contact-card__row--action"
        @click="copyValue(contact.wechat, '微信号')"
      >
        <text class="contact-card__label">微信号</text>
        <text class="contact-card__value">{{ contact.wechat }} · 点击复制</text>
      </view>
      <view
        v-if="contact.phone"
        class="contact-card__row contact-card__row--action"
        @click="copyValue(contact.phone, '电话')"
      >
        <text class="contact-card__label">联系电话</text>
        <text class="contact-card__value">{{ contact.phone }} · 点击复制</text>
      </view>

      <view class="contact-card__qr">
        <image
          v-if="contact.qrCodeUrl && !qrCodeFailed"
          class="contact-card__qr-image"
          :src="contact.qrCodeUrl"
          mode="aspectFit"
          @error="qrCodeFailed = true"
        />
        <view v-else class="contact-card__qr-fallback">
          <view class="contact-card__qr-placeholder">二维码待补充</view>
          <text class="contact-card__qr-hint">{{ wechatHint }}</text>
        </view>
      </view>
    </template>

    <view v-else class="contact-card__empty">该分会的联络人信息待管理员补充。</view>
  </view>
</template>

<style scoped>
.contact-card { padding: 30rpx; }
.contact-card__header { display: flex; align-items: baseline; justify-content: space-between; gap: 16rpx; }
.contact-card__title { font-family: "Songti SC", "STSong", serif; font-size: 31rpx; font-weight: 600; }
.contact-card__chapter { color: var(--alumni-muted); font-size: 23rpx; }
.contact-card__lead { margin-top: 12rpx; color: var(--alumni-muted); font-size: 22rpx; line-height: 1.6; }
.contact-card__row { display: flex; align-items: baseline; justify-content: space-between; gap: 20rpx; margin-top: 20rpx; font-size: 25rpx; }
.contact-card__row--action { padding: 8rpx 0; border-radius: var(--alumni-radius-sm); }
.contact-card__label { flex: none; color: var(--alumni-muted); }
.contact-card__value { text-align: right; word-break: break-all; }
.contact-card__note { margin-top: 10rpx; color: var(--alumni-muted); font-size: 22rpx; line-height: 1.6; }
.contact-card__qr { margin-top: 26rpx; padding-top: 24rpx; border-top: 1rpx solid var(--alumni-border); }
.contact-card__qr-image { width: 320rpx; height: 320rpx; margin: 0 auto; display: block; border-radius: var(--alumni-radius-sm); background: var(--alumni-background); }
.contact-card__qr-fallback { padding: 34rpx 20rpx; border-radius: var(--alumni-radius-sm); background: var(--alumni-background); text-align: center; }
.contact-card__qr-placeholder { color: var(--alumni-text); font-size: 24rpx; font-weight: 600; }
.contact-card__qr-hint { display: block; margin-top: 10rpx; color: var(--alumni-muted); font-size: 21rpx; line-height: 1.55; }
.contact-card__empty { margin-top: 18rpx; color: var(--alumni-muted); font-size: 23rpx; line-height: 1.6; }
</style>
