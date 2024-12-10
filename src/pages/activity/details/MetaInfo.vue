<template>
  <view class="info">
    <view class="tile" style="width: 43vw">
      <view class="key">活动地点</view>
      <view class="value">
        {{ activity?.location}}
      </view>
    </view>
    <view class="tile" style="width: 42vw">
      <view class="key">报名情况</view>
      <view class="value">
        {{ activity?.status}}/{{activity?.limit}}
      </view>
    </view>
  </view>

  <view class="info">
    <view class="tile" style="width: 43vw">
      <view class="key">联系方式</view>
      <view class="value">
        {{ activity?.contact }}
      </view>
    </view>
    <view class="tile" style="width: 42vw">
      <view class="key">活动时间</view>
      <view class="value">
        {{ time }}
      </view>
    </view>
  </view>
  <view class="info">
    <view class="tile" style="width: 88vw">
      <view class="key">报名时间</view>
      <view class="value">
        {{ registerStart }}-{{ registerEnd }}
      </view>
    </view>
  </view>
  <view class="info">
    <view class="tile" style="width: 88vw">
      <view class="key">活动介绍</view>
      <view class="value">
        {{ activity?.description }}
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import {timestampToTime} from "@/utils/time";
import type {Activity} from "@/api/activity/activity-interface";
import { defineProps } from 'vue';
const {activity} = defineProps<{activity:Activity|null}>()
const registerStart = timestampToTime(activity.registerStart)
const registerEnd = timestampToTime(activity.registerEnd)
const time =timestampToTime(activity.start)

// 本页面每个tile的间距是3vw
</script>

<style scoped>
.info {
  margin-left: 6vw;
  margin-top: 3vw;
  width: 88vw;
  display: flex;
  justify-content: space-between;
}
.tile {
  border-radius: 2vw;
  background-color: #f7f8fc;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 15vw;
}
.key {
  color: #4faa84;
  font-size: 3.5vw;
  width: fit-content;
  margin-bottom: 2.5vw;
}
.value {
  font-size: 4vw;
  font-weight: bold;
  width: fit-content;
  min-height: 5vw;
}
</style>
