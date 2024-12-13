<script setup lang="ts">
import { ref } from 'vue';
import Layout from "@/components/Layout.vue";
import {sendVerifyCode,signIn} from "@/api/user/user";
import type{signInData,SignInResponse} from "@/api/user/user-interface";
// 登录相关的表单数据
const phone = ref('');
const password = ref('');
const code = ref('');
const loginMethods = ref(['验证码登录','密码登录' ]);

// 当前选中的登录方式索引
const loginMethodIndex = ref(0);

// 修改登录方式的事件处理函数
const onLoginMethodChange = (event: Event) => {
  const picker = event.target as HTMLInputElement;
  loginMethodIndex.value = Number(picker.value);
};

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

  //调用接口发送验证码
  async function handleSendVerifyCode() {
    try {
      const response = await sendVerifyCode({
        authId: phone.value,
        authType: 'phone',
        type: 1,
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

// 登录逻辑
const login = () => {
  if (!validatePhone(phone.value)) {
    uni.showToast({
      title: '手机号格式不正确',
      icon: 'none',
    });
    return;
  }

  if (loginMethodIndex.value === 0 && !code.value) {
    uni.showToast({
      title: '请输入验证码',
      icon: 'none',
    });
    return;
  }

  if (loginMethodIndex.value === 1 && !password.value) {
    uni.showToast({
      title: '请输入密码',
      icon: 'none',
    });
    return;
  }

  //调用接口进行登录
  console.log('登录参数:', phone.value, loginMethodIndex.value === 0 ? code.value : password.value);
  handleLogin()
  async function handleLogin(){
    let data:signInData={
      authId: phone.value,
      authType: 'phone'
    }
    try {
      if(loginMethodIndex.value === 1)
      {
        data ={
          authId: phone.value,
          authType: 'phone',
          password: password.value
        }
      }else if(loginMethodIndex.value === 0)
      {
        data = {
          authId: phone.value,
          authType: 'phone',
          verifyCode: code.value
        }
      }
      console.log(data)
      const res = await signIn(data)
      if(res){
        console.log("登录返回值：",res)
        uni.setStorageSync('UserInfo',res)
        await uni.showToast({title:"登录成功",icon:"success"})
        await uni.switchTab({url: '/pages/news/index'})
      }else{
        await uni.showToast({title:"登录失败",icon:"error"})
      }
    }
    catch (e) {
      await uni.showToast({title:"登录失败",icon:"error"})
      console.log(e)
    }
  }

};

const jump2register = () => {
  uni.navigateTo({
    url: '/pages/login/sign-up',
  });
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
        <picker
            mode="selector"
            :value="loginMethodIndex"
            :range="loginMethods"
            @change="onLoginMethodChange"
        >
          <view>{{ loginMethodIndex === 0 ? '验证码登录' : '密码登录' }}</view>
        </picker>
      </view>

      <view class="verifyCode" v-if="loginMethodIndex === 0">
        <view class="item">
          <text>验证码</text>
          <input v-model="code" type="text" placeholder="请输入验证码" />
        </view>
        <button :disabled="isSendingCode" @click="sendVerificationCode">{{ isSendingCode ? `${countdown}s` : '发送验证码' }}</button>
      </view>

      <view class="item" v-if="loginMethodIndex === 1">
        <text>密码</text>
        <input v-model="password" type="password" placeholder="请输入密码" />
      </view>

      <button @click="login">登录</button>
      <view class="register">
        <text>没有账号？</text>
        <text @click="jump2register">注册</text>
      </view>
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

.verifyCode {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.register > text {
  font-weight: normal;
  color: grey;
}
</style>
