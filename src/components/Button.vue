<script setup lang="ts">
import { defineProps } from 'vue';
const props = defineProps<{onClick: () => void}>()
</script>

<template>
<view class="sign-button" @click="props.onClick">
  <slot></slot>
</view>
</template>

<style scoped>
.sign-button {
  width: 250px;
  padding: 2px;
  background-color: #a2e494;
  color: white;
  border: none;
  border-radius: 25px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>