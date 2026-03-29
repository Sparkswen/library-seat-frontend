<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 class="login-title">📚 图书馆座位预约系统</h2>
      <el-tabs v-model="activeTab">
        <!-- 登录标签页 -->
        <el-tab-pane label="登录" name="login">
          <el-form 
            :model="loginForm" 
            label-position="top"
            @keyup.enter="handleLogin"
          >
            <el-form-item label="学号">
              <el-input 
                v-model="loginForm.studentNo" 
                placeholder="请输入学号"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="请输入密码"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                @click="handleLogin" 
                style="width: 100%"
                :loading="loading"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 注册标签页 -->
        <el-tab-pane label="注册" name="register">
          <el-form 
            :model="registerForm" 
            label-position="top"
            @keyup.enter="handleRegister"
          >
            <el-form-item label="学号">
              <el-input 
                v-model="registerForm.studentNo" 
                placeholder="请输入学号"
                @keyup.enter="handleRegister"
              />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input 
                v-model="registerForm.name" 
                placeholder="请输入姓名"
                @keyup.enter="handleRegister"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input 
                v-model="registerForm.password" 
                type="password" 
                placeholder="请输入密码"
                @keyup.enter="handleRegister"
              />
            </el-form-item>
            <el-form-item>
              <el-button 
                type="success" 
                @click="handleRegister" 
                style="width: 100%"
                :loading="loading"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      
      <!-- 悬停显示测试账号 -->
      <div class="test-account-wrapper">
        <el-tooltip 
          placement="top" 
          effect="dark"
          :show-after="100"
        >
          <template #content>
            <div class="account-tooltip">
              <p><strong>学生：</strong>2022001 / 123456</p>
              <p><strong>管理员：</strong>admin / admin123</p>
              <p><strong>馆员：</strong>librarian / lib123</p>
            </div>
          </template>
          <div class="test-account-trigger">
            <el-icon><Info-Filled /></el-icon>
            <span>查看测试账号</span>
          </div>
        </el-tooltip>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const activeTab = ref('login')
const loading = ref(false)

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
  // 表单验证
  if (!loginForm.value.studentNo.trim()) {
    ElMessage.warning('请输入学号')
    return
  }
  if (!loginForm.value.password) {
    ElMessage.warning('请输入密码')
    return
  }

  loading.value = true
  try {
    const res = await request.post('/user/login', loginForm.value)
    if (res.code === 200) {
      localStorage.setItem('user', JSON.stringify(res.data.user))
      ElMessage.success('登录成功')
      
      // 根据角色跳转
      if (res.data.user.role === 'ADMIN' || res.data.user.role === 'LIBRARIAN') {
        router.push('/admin/dashboard')
      } else {
        router.push('/seatmap')
      }
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('登录失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  // 表单验证
  if (!registerForm.value.studentNo.trim()) {
    ElMessage.warning('请输入学号')
    return
  }
  if (!registerForm.value.name.trim()) {
    ElMessage.warning('请输入姓名')
    return
  }
  if (!registerForm.value.password) {
    ElMessage.warning('请输入密码')
    return
  }

  loading.value = true
  try {
    const res = await request.post('/user/register', registerForm.value)
    if (res.code === 200) {
      ElMessage.success('注册成功，请登录')
      activeTab.value = 'login'
      // 清空注册表单
      registerForm.value = {
        studentNo: '',
        name: '',
        password: ''
      }
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('注册失败，请检查网络连接')
  } finally {
    loading.value = false
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

.test-account-wrapper {
  margin-top: 15px;
  text-align: center;
}

.test-account-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 13px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.3s;
}

.test-account-trigger:hover {
  color: #409eff;
  background-color: #f5f7fa;
}

.account-tooltip {
  line-height: 1.8;
}

.account-tooltip p {
  margin: 0;
  padding: 2px 0;
}

:deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
}

:deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
}
</style>
