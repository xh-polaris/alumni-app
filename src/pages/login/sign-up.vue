<template>
  <Layout>
    <view class="signUp">
      <view class="item">
        <text>姓名</text>
        <input v-model="name" type="text" placeholder="请输入姓名" />
      </view>
      <view class="item">
        <text>手机号</text>
        <input v-model="phone" type="text" placeholder="请输入手机号" />
      </view>
      <view class="verifyCode">
        <view class="item" style="width: 60%">
          <text>验证码</text>
          <input v-model="code" type="text" placeholder="请输入验证码" />
        </view>
        <button
            style="width: 35%;font-size: 24rpx;line-height: 40px"
            :disabled="isSendingCode"
            @click="sendVerificationCode"
        >
          {{ isSendingCode ? `${countdown}秒后重新发送` : '发送验证码' }}
        </button>
      </view>
      <view class="item">
        <text>密码</text>
        <input v-model="password" type="password" placeholder="请输入密码" />
      </view>
      <button
          :disabled="!name || !phone || !code || !password"
          @click="register"
      >
        注册
      </button>
    </view>
  </Layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {signUp,sendVerifyCode} from "@/api/user/user";
import {SendVerifyCode,SignUpResponse,signUpData} from "@/api/user/user-interface";
import Layout from "@/components/Layout.vue";

// 注册相关的表单数据
const name = ref('');
const phone = ref('');
const code = ref('');
const password = ref('');

// 按钮状态
const isSendingCode = ref(false);  // 发送验证码按钮状态
const isDisabled = ref(false);     // 注册按钮禁用状态
const countdown = ref(60);         // 倒计时

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
  async function handleSendVerifyCode() {
    try {
      const response = await sendVerifyCode({
        authId: phone.value,
        authType: 'phone',
        type: 0,
      });
      console.log('发送验证码响应:', response);
      if (response.code === 0) {
        // 显示发送成功消息
        await uni.showToast({title: '发送成功', icon: 'success'});
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
      } else {
        await uni.showToast({title: '发送失败', icon: 'error'});
      }
    } catch (error) {
      console.error('发送验证码时发生错误:', error);
    }
  }
  handleSendVerifyCode()
};

// 注册逻辑
const register = () => {
  if (!validatePhone(phone.value)) {
    uni.showToast({
      title: '手机号格式不正确',
      icon: 'none',
    });
    return;
  }

  if (!code.value) {
    uni.showToast({
      title: '请输入验证码',
      icon: 'none',
    });
    return;
  }

  if (!password.value) {
    uni.showToast({
      title: '请输入密码',
      icon: 'none',
    });
    return;
  }

  async function handleSignUp() {
    const data: signUpData = {
      authType: 'phone',
      authid: phone.value,
      name: name.value,
      password: password.value,
      verifyCode: code.value,
    };

    try {
      const response:SignUpResponse = await signUp(data);
      console.log('注册响应:', response);
      if (response) {
        // 注册成功，进行后续操作，例如跳转到登录页面
        await uni.showToast({title: '注册成功', icon: 'success'});
        uni.setStorageSync('userInfo', response)
        await uni.navigateTo({
          url: '/pages/news/index',
        });
      }else{
        await uni.showToast({title: '注册失败', icon: 'error'});

      }
    }
    catch (error) {
      console.error('注册时发生错误:', error);
    }
  }
  handleSignUp()
};

</script>

<style scoped>
.signUp {
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
  padding: 10px 6px;
  background-color: #a2e494;
  color: white;
  border-radius: 10px;
  text-align: center;
  cursor: pointer;
  font-size: 18px;
  width: 60%;
  margin-left: auto;
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  font-size: 5px;
}
text {
  font-weight: bold;
}
.verifyCode {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: calc(80% + 20px);
}
</style>
