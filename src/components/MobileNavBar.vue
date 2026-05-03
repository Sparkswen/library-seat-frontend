<template>
  <div class="mobile-nav-bar" v-if="isMobile">
    <div 
      v-for="item in navItems" 
      :key="item.path"
      :class="['nav-item', { active: isActive(item.path) }]"
      @click="router.push(item.path)"
    >
      <el-icon :size="20">
        <House v-if="item.icon === 'House'" />
        <Calendar v-else-if="item.icon === 'Calendar'" />
        <Trophy v-else-if="item.icon === 'Trophy'" />
        <User v-else-if="item.icon === 'User'" />
      </el-icon>
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { House, Calendar, Trophy, User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const isMobile = ref(window.innerWidth <= 768)

window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth <= 768
})

const navItems = [
  { path: '/seatmap', label: '预约', icon: 'House' },
  { path: '/my-reservations', label: '记录', icon: 'Calendar' },
  { path: '/leaderboard', label: '排行', icon: 'Trophy' },
  { path: '/profile', label: '我的', icon: 'User' }
]

const isActive = (path) => route.path === path
</script>

<style scoped>
.mobile-nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #fff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.08);
  z-index: 999;
  border-top: 1px solid #ebeef5;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #909399;
  font-size: 11px;
  cursor: pointer;
  padding: 4px 12px;
  transition: all 0.3s;
}

.nav-item.active {
  color: #409eff;
}

.nav-item:active {
  opacity: 0.7;
}
</style>