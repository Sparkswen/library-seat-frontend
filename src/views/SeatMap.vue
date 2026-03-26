<template>
  <div class="seat-container">
    <!-- 顶部信息栏 -->
    <el-header class="header">
      <div class="header-left">
        <h2>📚 图书馆座位预约系统</h2>
      </div>
      <div class="header-right">
        <el-tag :type="levelType" effect="dark" size="large">
          {{ userInfo.levelDisplayName || '学童' }}
        </el-tag>
        <span class="user-info">积分: {{ userInfo.points || 0 }}</span>
        <span class="user-info">信用: {{ userInfo.creditScore || 100 }}</span>
        <el-button type="info" size="small" @click="goToNotifications">
          🔔 消息
          <el-badge v-if="unreadCount > 0" :value="unreadCount" class="msg-badge" />
        </el-button>
        <el-button type="success" size="small" @click="goToStatistics">📊 统计</el-button>
        <el-button type="warning" size="small" @click="goToStore">🛒 商城</el-button>
        <el-button type="primary" size="small" @click="goToLeaderboard">🏆 排行榜</el-button>
        <el-button type="danger" size="small" @click="logout">退出</el-button>
      </div>
    </el-header>

    <!-- 楼层选择 -->
    <div class="floor-selector">
      <el-radio-group v-model="currentFloor" size="large" @change="loadSeats">
        <el-radio-button :label="1">1楼</el-radio-button>
        <el-radio-button :label="2">2楼</el-radio-button>
        <el-radio-button :label="3">3楼</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 图例 -->
    <div class="legend">
      <el-tag type="success">🟢 空闲</el-tag>
      <el-tag type="warning">🟡 已预约</el-tag>
      <el-tag type="danger">🔴 使用中</el-tag>
      <el-tag type="info">⚫ 维护中</el-tag>
    </div>

    <!-- 座位区域 -->
    <div class="seat-area" v-loading="loading">
      <div v-for="(seats, area) in areaSeats" :key="area" class="area-section">
        <h3 class="area-title">{{ area }}</h3>
        <div class="seat-grid">
          <el-card
            v-for="seat in seats"
            :key="seat.id"
            :class="['seat-card', seat.status.toLowerCase()]"
            shadow="hover"
            @click="handleSeatClick(seat)"
          >
            <div class="seat-content">
              <div class="seat-no">{{ seat.seatNo }}</div>
              <div class="seat-status">{{ seat.statusDisplay }}</div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 当前预约状态 -->
    <el-card v-if="currentReservation" class="reservation-status">
      <h3>当前预约</h3>
      <p>座位: {{ currentReservation.seatNo }}</p>
      <p>状态: {{ currentReservation.statusDisplay }}</p>
      <p>开始时间: {{ formatTime(currentReservation.startTime) }}</p>
      <div class="action-buttons">
        <el-button 
          v-if="currentReservation.status === 'PENDING'" 
          type="success" 
          @click="checkIn"
        >
          签到
        </el-button>
        <el-button 
          v-if="currentReservation.status === 'CHECKED_IN'" 
          type="danger" 
          @click="checkOut"
        >
          退座
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const router = useRouter()
const loading = ref(false)
const currentFloor = ref(1)
const seats = ref([])
const currentReservation = ref(null)
const userInfo = ref({})
const unreadCount = ref(2) // 未读消息数量

const levelType = computed(() => {
  const level = userInfo.value.levelTitle
  const types = {
    'XUETONG': '',
    'XUEJIANG': 'success',
    'XUESHI': 'warning',
    'XUEZONG': 'danger',
    'XUESHENG': 'danger'
  }
  return types[level] || ''
})

const areaSeats = computed(() => {
  const grouped = {}
  const floorSeats = seats.value[currentFloor.value] || []
  floorSeats.forEach(seat => {
    if (!grouped[seat.area]) {
      grouped[seat.area] = []
    }
    grouped[seat.area].push(seat)
  })
  return grouped
})

const loadUserInfo = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  userInfo.value = user
}

const loadSeats = async () => {
  loading.value = true
  try {
    const res = await request.get('/seat/list')
    if (res.code === 200) {
      seats.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载座位失败')
  } finally {
    loading.value = false
  }
}

const loadCurrentReservation = async () => {
  try {
    const res = await request.get('/seat/current', {
      params: { studentNo: userInfo.value.studentNo }
    })
    if (res.code === 200) {
      currentReservation.value = res.data
      // 保存到localStorage用于消息提醒
      if (res.data) {
        localStorage.setItem('currentReservation', JSON.stringify(res.data))
      }
    }
  } catch (error) {
    console.error('加载当前预约失败')
  }
}

const handleSeatClick = async (seat) => {
  if (seat.status !== 'AVAILABLE') {
    ElMessage.warning('该座位不可用')
    return
  }
  
  if (currentReservation.value) {
    ElMessage.warning('您已有进行中的预约')
    return
  }

  try {
    await ElMessageBox.confirm(`确定预约座位 ${seat.seatNo} 吗？`, '确认预约')
    const res = await request.post('/seat/reserve', {
      seatId: seat.id,
      studentNo: userInfo.value.studentNo
    })
    if (res.code === 200) {
      ElMessage.success(res.data.message)
      loadSeats()
      loadCurrentReservation()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('预约失败')
    }
  }
}

const checkIn = async () => {
  try {
    const res = await request.post(`/seat/check-in/${currentReservation.value.reservationId}`)
    if (res.code === 200) {
      ElMessage.success('签到成功')
      loadSeats()
      loadCurrentReservation()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('签到失败')
  }
}

const checkOut = async () => {
  try {
    const res = await request.post(`/seat/check-out/${currentReservation.value.reservationId}`)
    if (res.code === 200) {
      ElMessage.success(`退座成功！学习时长：${res.data.studyMinutes}分钟，获得积分：${res.data.pointsEarned}`)
      userInfo.value.levelDisplayName = res.data.currentLevel
      // 更新localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      user.totalStudyMinutes = (user.totalStudyMinutes || 0) + res.data.studyMinutes
      user.points = (user.points || 0) + res.data.pointsEarned
      user.levelDisplayName = res.data.currentLevel
      localStorage.setItem('user', JSON.stringify(user))
      loadUserInfo()
      loadSeats()
      loadCurrentReservation()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('退座失败')
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

const goToNotifications = () => {
  router.push('/notifications')
}

const goToStatistics = () => {
  router.push('/statistics')
}

const goToStore = () => {
  router.push('/store')
}

const goToLeaderboard = () => {
  router.push('/leaderboard')
}

const logout = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('currentReservation')
  router.push('/login')
}

onMounted(() => {
  loadUserInfo()
  loadSeats()
  loadCurrentReservation()
})
</script>

<style scoped>
.seat-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info {
  color: #606266;
  font-size: 14px;
}

.msg-badge {
  margin-left: 5px;
}

:deep(.el-badge__content) {
  top: -5px;
  right: -5px;
}

.floor-selector {
  text-align: center;
  padding: 20px;
  background-color: #fff;
  margin: 20px;
  border-radius: 8px;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.seat-area {
  padding: 0 20px;
}

.area-section {
  margin-bottom: 30px;
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
}

.area-title {
  margin-bottom: 15px;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.seat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.seat-card:hover {
  transform: translateY(-2px);
}

.seat-card.available {
  border-top: 4px solid #67c23a;
}

.seat-card.reserved {
  border-top: 4px solid #e6a23c;
  opacity: 0.7;
}

.seat-card.occupied {
  border-top: 4px solid #f56c6c;
  opacity: 0.7;
  cursor: not-allowed;
}

.seat-card.maintenance {
  border-top: 4px solid #909399;
  opacity: 0.5;
  cursor: not-allowed;
}

.seat-content {
  text-align: center;
}

.seat-no {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}

.seat-status {
  font-size: 12px;
  color: #909399;
}

.reservation-status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 300px;
  z-index: 100;
}

.action-buttons {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}
</style>
