<template>
  <div class="admin-layout">
    <el-aside class="sidebar" width="220px">
      <div class="logo">
        <h3>📚 管理后台</h3>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="admin-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        
        <el-menu-item index="/admin/seats">
          <el-icon><OfficeBuilding /></el-icon>
          <span>座位管理</span>
        </el-menu-item>
        
        <el-menu-item index="/admin/reservations">
          <el-icon><Calendar /></el-icon>
          <span>预约管理</span>
        </el-menu-item>
        
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        
        <el-menu-item index="/admin/violations">
          <el-icon><Warning /></el-icon>
          <span>违规处理</span>
        </el-menu-item>
        
        <el-menu-item index="/admin/reports">
          <el-icon><TrendCharts /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <div class="main-content">
      <el-header class="admin-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-dropdown">
              {{ userInfo.name }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToFrontend">返回前台</el-dropdown-item>
                <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <div class="page-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataLine, OfficeBuilding, Calendar, User, Warning, TrendCharts, ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userInfo = ref({ name: '管理员' })

const activeMenu = computed(() => route.path)

const currentTitle = computed(() => {
  const titles = {
    '/admin/dashboard': '数据概览',
    '/admin/seats': '座位管理',
    '/admin/reservations': '预约管理',
    '/admin/users': '用户管理',
    '/admin/violations': '违规处理',
    '/admin/reports': '数据统计'
  }
  return titles[route.path] || '管理后台'
})

const goToFrontend = () => {
  router.push('/seatmap')
}

const logout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.role !== 'ADMIN' && user.role !== 'LIBRARIAN') {
    ElMessage.error('无权访问')
    router.push('/login')
    return
  }
  userInfo.value = user
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  background-color: #304156;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-bottom: 1px solid #1f2d3d;
}

.admin-menu {
  border-right: none;
}

.main-content {
  flex: 1;
  margin-left: 220px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

.admin-header {
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}

.user-dropdown {
  cursor: pointer;
  color: #606266;
}

.page-content {
  padding: 20px;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}
</style>
