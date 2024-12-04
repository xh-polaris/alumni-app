<script setup lang="ts">

import Layout from "@/components/Layout.vue";
</script>

<template>
<layout>
  <view class="temp">
    <text>暂无资讯</text>
  </view>
</layout>
</template>

<style scoped>
  .temp{
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  .temp text{
    color: #999;
    font-size: 60rpx;
  }
</style>