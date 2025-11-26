<template>
  <view class="layout">
    <view class="layout__glow layout__glow--primary"></view>
    <view class="layout__glow layout__glow--secondary"></view>
    <image class="layout__watermark" src="@/static/logo.png" mode="aspectFit" />
    <view class="layout__content">
      <slot />
    </view>
  </view>
</template>

<style scoped>
.layout {
  position: relative;
  min-height: 100vh;
  padding: 40rpx 24rpx 120rpx;
  overflow: hidden;
  background: linear-gradient(160deg, #e9f4ee 0%, #f6f8fb 55%, #eef4f0 100%);
}

.layout__content {
  position: relative;
  z-index: 3;
}

.layout__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.55;
  transform: translate(-50%, -50%);
}

.layout__glow--primary {
  width: 620rpx;
  height: 620rpx;
  top: 0;
  left: 70%;
  background: radial-gradient(circle, rgba(19, 113, 74, 0.35) 0%, rgba(19, 113, 74, 0) 70%);
  z-index: 1;
}

.layout__glow--secondary {
  width: 520rpx;
  height: 520rpx;
  top: 20%;
  left: 0%;
  background: radial-gradient(circle, rgba(246, 183, 86, 0.2) 0%, rgba(246, 183, 86, 0) 70%);
  z-index: 1;
}

.layout__watermark {
  position: absolute;
  width: 420rpx;
  height: 420rpx;
  right: -80rpx;
  bottom: 80rpx;
  opacity: 0.18;
  z-index: 2;
}
</style>
