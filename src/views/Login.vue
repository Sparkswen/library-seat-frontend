<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 class="login-title">📚 图书馆座位预约系统</h2>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" label-position="top">
            <el-form-item label="学号">
              <el-input v-model="loginForm.studentNo" placeholder="请输入学号" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleLogin" style="width: 100%">登录</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" label-position="top">
            <el-form-item label="学号">
              <el-input v-model="registerForm.studentNo" placeholder="请输入学号" />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input v-model="registerForm.name" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="handleRegister" style="width: 100%">注册</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      
      <div class="test-account">
        <el-tag type="info">测试账号：2022001 / 123456</el-tag>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const router = useRouter()
const activeTab = ref('login')

const loginForm = ref({
  studentNo: '',
  password: ''
})

const registerForm = ref({
  studentNo: '',
  name: '',
  password: ''
})

const handleLogin = async () => {
  try {
    const res = await request.post('/user/login', loginForm.value)
    if (res.code === 200) {
      localStorage.setItem('user', JSON.stringify(res.data.user))
      ElMessage.success('登录成功')
      router.push('/seatmap')
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('登录失败')
  }
}

const handleRegister = async () => {
  try {
    const res = await request.post('/user/register', registerForm.value)
    if (res.code === 200) {
      ElMessage.success('注册成功，请登录')
      activeTab.value = 'login'
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('注册失败')
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 20px;
}

.login-title {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.test-account {
  margin-top: 15px;
  text-align: center;
}
</style>
