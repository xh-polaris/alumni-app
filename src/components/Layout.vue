<template>
  <view class="layout">
    <view class="overlay"></view>
    <view class="background-container">
      <slot></slot>
    </view>
    <image class="background-image" src="@/static/logo.png"/>
  </view>
</template>

<style scoped>
.layout {
  position: relative;
  overflow: auto;
  overflow-x: hidden;
  height: 100vh;
  display: flex;
  justify-content: center;
}

.overlay {
  position: absolute;
  top: -230px;
  left: calc(50% - 350px);
  width: 700px;
  height: 300px;
  background-color: #13714a;
  border-radius: 50% / 150px;
  z-index: 10;
}

.background-image {
  position: absolute;
  top: 100px;
  right: -200px;
  width: 500px;
  height: 510px;
  object-fit: contain;
  opacity: 0.3;
  z-index: 0;
}

</style>
