<template>
  <div class="global-notification">
    <!-- 预约提醒弹窗 -->
    <el-dialog
      v-model="reminderVisible"
      title="⏰ 签到提醒"
      width="400px"
      :show-close="false"
      :close-on-click-modal="false"
      center
    >
      <div class="reminder-content">
        <el-icon class="reminder-icon"><Bell /></el-icon>
        <p>您预约的座位 <strong>{{ currentSeat }}</strong> 还有 <span class="highlight">{{ countdown }}分钟</span> 超时</p>
        <p class="sub-text">超时未签到将扣除10信用分</p>
      </div>
      <template #footer>
        <el-button @click="snooze">稍后提醒(5分钟)</el-button>
        <el-button type="primary" @click="goCheckIn">立即签到</el-button>
      </template>
    </el-dialog>

    <!-- 桌面通知权限提示 -->
    <el-alert
      v-if="showNotificationTip"
      title="开启桌面通知，不再错过重要提醒"
      type="info"
      show-icon
      closable
      @close="showNotificationTip = false"
    >
      <template #default>
        <el-button type="primary" size="small" @click="requestNotification">立即开启</el-button>
      </template>
    </el-alert>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const reminderVisible = ref(false)
const showNotificationTip = ref(false)
const currentSeat = ref('1F-A区-01')
const countdown = ref(5)
let reminderTimer = null
let checkInterval = null

// 检查是否需要提醒
const checkReminder = () => {
  const reservation = JSON.parse(localStorage.getItem('currentReservation') || '{}')
  if (reservation.status === 'PENDING' && reservation.startTime) {
    const startTime = new Date(reservation.startTime)
    const now = new Date()
    const diff = 30 * 60 * 1000 - (now - startTime) // 30分钟超时时间
    
    if (diff > 0 && diff <= 10 * 60 * 1000) { // 最后10分钟提醒
      countdown.value = Math.ceil(diff / 60000)
      currentSeat.value = reservation.seatNo
      reminderVisible.value = true
      showDesktopNotification('签到提醒', `您预约的${reservation.seatNo}即将超时，请尽快签到！`)
    }
  }
}

// 显示桌面通知
const showDesktopNotification = (title, body) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      requireInteraction: true
    })
  }
}

// 请求通知权限
const requestNotification = () => {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        ElMessage.success('已开启桌面通知')
        showNotificationTip.value = false
      }
    })
  }
}

const snooze = () => {
  reminderVisible.value = false
  setTimeout(() => {
    reminderVisible.value = true
  }, 5 * 60 * 1000) // 5分钟后再次提醒
}

const goCheckIn = () => {
  reminderVisible.value = false
  router.push('/seatmap')
}

onMounted(() => {
  // 检查通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    showNotificationTip.value = true
  }
  
  // 每分钟检查一次
  checkInterval = setInterval(checkReminder, 60000)
  checkReminder()
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
  if (reminderTimer) clearTimeout(reminderTimer)
})
</script>

<style scoped>
.global-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
}

.reminder-content {
  text-align: center;
  padding: 20px;
}

.reminder-icon {
  font-size: 48px;
  color: #e6a23c;
  margin-bottom: 15px;
  animation: swing 1s ease-in-out infinite;
}

@keyframes swing {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

.highlight {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
}

.sub-text {
  color: #909399;
  font-size: 13px;
  margin-top: 10px;
}
</style>
