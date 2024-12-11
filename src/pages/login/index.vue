<script setup lang="ts">
import { ref } from 'vue';
import Layout from "@/components/Layout.vue";

// 登录相关的表单数据
const phone = ref('');
const password = ref('');
const code = ref('');
const loginMethodIndex = ref(0); // 0: 密码登录, 1: 验证码登录

// 按钮状态
const isSendingCode = ref(false);  // 发送验证码按钮状态
const countdown = ref(60);         // 验证码倒计时

// 检验手机号是否有效
const validatePhone = (phone: string) => {
  const phoneRegex = /^1[3-9]\d{9}$/;  // 简单的手机号格式验证
  return phoneRegex.test(phone);
};

// 发送验证码
const sendVerificationCode = () => {
  if (!validatePhone(phone.value)) {
    uni.showToast({
      title: '手机号格式不正确',
      icon: 'none',
    });
    return;
  }

  // TODO: 调用接口发送验证码

  // 启动倒计时
  isSendingCode.value = true;
  let timer = setInterval(() => {
    if (countdown.value <= 0) {
      clearInterval(timer);
      isSendingCode.value = false;
      countdown.value = 60;
    } else {
      countdown.value--;
    }
  }, 1000);
};

// 登录逻辑
const login = () => {
  if (!validatePhone(phone.value)) {
    uni.showToast({
      title: '手机号格式不正确',
      icon: 'none',
    });
    return;
  }

  if (loginMethodIndex.value === 1 && !code.value) {
    uni.showToast({
      title: '请输入验证码',
      icon: 'none',
    });
    return;
  }

  if (loginMethodIndex.value === 0 && !password.value) {
    uni.showToast({
      title: '请输入密码',
      icon: 'none',
    });
    return;
  }

  // TODO: 调用接口进行登录
  const result = { success: true, token: 'some-token' }; // 模拟接口返回值

  if (result.success) {
    // 将 token 存储到本地
    uni.setStorageSync('userInfo', { phone: phone.value, token: result.token });

    uni.showToast({
      title: '登录成功',
      icon: 'success',
    });

    // TODO: 登录成功后的跳转逻辑
    uni.redirectTo({
      url: '/pages/home/home' // 假设登录成功后跳转到首页
    });
  } else {
    uni.showToast({
      title: '登录失败',
      icon: 'none',
    });
  }
};
</script>

<template>
  <Layout>
    <view class="signIn">
      <view class="item">
        <text>手机号</text>
        <input v-model="phone" type="text" placeholder="请输入手机号" />
      </view>

      <view class="item">
        <text>选择登录方式</text>
        <picker :value="loginMethodIndex" :range="['密码登录', '验证码登录']" @change="e => loginMethodIndex.value = e.detail.value">
          <view>{{ loginMethodIndex.value === 0 ? '密码登录' : '验证码登录' }}</view>
        </picker>
      </view>

      <view class="toggle-login-method">
        <div class="login-method-option" :class="{ active: loginMethodIndex.value === 0 }" @click="loginMethodIndex.value = 0">
          密码登录
        </div>
        <div class="login-method-option" :class="{ active: loginMethodIndex.value === 1 }" @click="loginMethodIndex.value = 1">
          验证码登录
        </div>
      </view>

      <transition name="slide">
        <view class="item" v-if="loginMethodIndex.value === 0">
          <text>密码</text>
          <input v-model="password" type="password" placeholder="请输入密码" />
        </view>
      </transition>

      <transition name="slide">
        <view class="item" v-if="loginMethodIndex.value === 1">
          <text>验证码</text>
          <input v-model="code" type="text" placeholder="请输入验证码" />
          <button
              :disabled="isSendingCode"
              @click="sendVerificationCode"
          >
            {{ isSendingCode ? `${countdown.value}秒后重新发送` : '发送验证码' }}
          </button>
        </view>
      </transition>

      <button @click="login">登录</button>
    </view>
  </Layout>
</template>

<style scoped>
.signIn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 680px;
  min-height: 500px;
  width: 80%;
  padding: 20px;
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1;
  opacity: 0.8;
  margin-top: auto;
}

.item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 80%;
  margin: 10px 0;
  padding: 10px;
  border-radius: 10px;
  background: #f5f5f5;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
}

input {
  width: 60%;
  height: 40px;
  text-align: right;
}

button {
  padding: 8px;
  background-color: #a2e494;
  color: white;
  border-radius: 20px;
  text-align: center;
  cursor: pointer;
  font-size: 18px;
  width: 80%;
  margin-top: 10px;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

text {
  font-weight: bold;
}

.toggle-login-method {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
}

.login-method-option {
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 5px;
  cursor: pointer;
}

.login-method-option.active {
  background-color: #a2e494;
  color: white;
}

/* 滑动效果 */
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter, .slide-leave-to {
  transform: translateX(100%);
}
</style>
