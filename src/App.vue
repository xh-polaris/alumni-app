<script setup lang="ts">
import { onLaunch, onShow, onHide,onLoad } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("App Launch");
  const userInfo = uni.getStorageSync('userInfo');
  if (!userInfo) {
    // 如果没有用户信息，跳转到注册页面
    uni.showToast({title: '请先登录', icon: 'none'})
    uni.navigateTo({
      url: '/pages/login/index'
    });
  }
});
onLoad(() => {
  console.log("App Load");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style>
page {
  background-color: #f5f5fa;
}

</style>
