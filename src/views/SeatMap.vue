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
        
        <el-button 
          v-if="isAdminOrLibrarian" 
          type="danger" 
          size="small" 
          @click="goToAdmin"
        >
          ⚙️ 管理后台
        </el-button>
        
        <el-button type="primary" size="small" @click="goToProfile">👤 个人中心</el-button>
        <el-button type="success" size="small" @click="goToMyReservations">📋 我的预约</el-button>
        <el-button type="success" size="small" @click="goToStatistics">📊 统计</el-button>
        <el-button type="warning" size="small" @click="goToStore">🛒 商城</el-button>
        <el-button type="primary" size="small" @click="goToLeaderboard">🏆 排行榜</el-button>
        <el-button type="info" size="small" @click="goToNotifications">
          🔔 消息
          <el-badge v-if="unreadCount > 0" :value="unreadCount" class="msg-badge" />
        </el-button>
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

    <!-- 预约时段选择对话框 -->
    <el-dialog
      v-model="timeSlotDialogVisible"
      :title="'预约 ' + selectedSeat?.seatNo"
      width="600px"
    >
      <div class="reservation-form">
        <!-- 日期选择 -->
        <el-form label-width="100px">
          <el-form-item label="选择日期">
            <el-date-picker
              v-model="selectedDate"
              type="date"
              placeholder="选择日期"
              :disabled-date="disabledDate"
              @change="loadTimeSlots"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
        
        <!-- 时段选择 -->
        <div v-if="selectedDate" class="time-slots-section">
          <h4>选择时段（点击选择开始和结束时间）</h4>
          <div class="time-slots-grid">
            <div
              v-for="slot in timeSlots"
              :key="slot.startTime"
              :class="['time-slot', {
                'available': slot.available,
                'occupied': !slot.available,
                'expired': slot.expired,
                'selected': isSlotSelected(slot)
              }]"
              @click="handleSlotClick(slot)"
            >
              <div class="slot-time">{{ slot.startTime }} - {{ slot.endTime }}</div>
              <div class="slot-status">
                {{ slot.expired ? '已过期' : (slot.available ? '可预约' : '已占用') }}
              </div>
            </div>
          </div>
          
          <!-- 已选时段显示 -->
          <div v-if="selectedStartTime && selectedEndTime" class="selected-info">
            <el-alert
              :title="`已选择: ${selectedStartTime} - ${selectedEndTime}`"
              type="success"
              :closable="false"
            />
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="timeSlotDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmReservation"
          :disabled="!canSubmit"
          :loading="submitting"
        >
          确认预约
        </el-button>
      </template>
    </el-dialog>

    <!-- 当前预约状态 -->
    <el-card v-if="currentReservation" class="reservation-status">
      <h3>当前预约</h3>
      <p>座位: {{ currentReservation.seatNo }}</p>
      <p>日期: {{ currentReservation.date }}</p>
      <p>时段: {{ currentReservation.startTime }} - {{ currentReservation.endTime }}</p>
      <p>状态: {{ currentReservation.statusDisplay }}</p>
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
        <el-button 
          v-if="currentReservation.status === 'PENDING'" 
          type="warning" 
          @click="cancelReservation"
        >
          取消
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
const unreadCount = ref(2)

// 时段选择相关
const timeSlotDialogVisible = ref(false)
const selectedSeat = ref(null)
const selectedDate = ref(null)
const timeSlots = ref([])
const selectedStartTime = ref(null)
const selectedEndTime = ref(null)
const submitting = ref(false)

// 判断是否为管理员或馆员
const isAdminOrLibrarian = computed(() => {
  return userInfo.value.role === 'ADMIN' || userInfo.value.role === 'LIBRARIAN'
})

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

// 是否可以提交预约
const canSubmit = computed(() => {
  return selectedDate.value && selectedStartTime.value && selectedEndTime.value
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
    }
  } catch (error) {
    console.error('加载当前预约失败')
  }
}

// 点击座位
const handleSeatClick = async (seat) => {
  if (seat.status !== 'AVAILABLE') {
    ElMessage.warning('该座位不可用')
    return
  }
  
  if (currentReservation.value) {
    ElMessage.warning('您已有进行中的预约')
    return
  }

  selectedSeat.value = seat
  selectedDate.value = new Date()
  selectedStartTime.value = null
  selectedEndTime.value = null
  timeSlots.value = []
  timeSlotDialogVisible.value = true
  
  // 加载时段
  await loadTimeSlots()
}

// 禁用日期（过去日期和超过7天的日期）
const disabledDate = (time) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 7)
  return time.getTime() < today.getTime() || time.getTime() > maxDate.getTime()
}

// 加载时段
const loadTimeSlots = async () => {
  if (!selectedDate.value || !selectedSeat.value) return
  
  const dateStr = selectedDate.value.toISOString().split('T')[0]
  
  try {
    const res = await request.get('/seat/time-slots', {
      params: {
        seatId: selectedSeat.value.id,
        date: dateStr
      }
    })
    
    if (res.code === 200) {
      timeSlots.value = res.data.timeSlots
    }
  } catch (error) {
    ElMessage.error('加载时段失败')
  }
}

// 判断时段是否被选中
const isSlotSelected = (slot) => {
  if (!selectedStartTime.value || !selectedEndTime.value) return false
  const slotStart = slot.startTime
  return slotStart >= selectedStartTime.value && slotStart < selectedEndTime.value
}

// 点击时段
const handleSlotClick = (slot) => {
  if (!slot.available || slot.expired) {
    ElMessage.warning('该时段不可选择')
    return
  }
  
  // 如果没有选择开始时间，或点击的时间早于开始时间，则设置为开始时间
  if (!selectedStartTime.value || slot.startTime < selectedStartTime.value) {
    selectedStartTime.value = slot.startTime
    selectedEndTime.value = null
    return
  }
  
  // 如果已选择开始时间，则设置为结束时间
  if (selectedStartTime.value && !selectedEndTime.value) {
    // 检查中间是否有不可用的时段
    const startIndex = timeSlots.value.findIndex(s => s.startTime === selectedStartTime.value)
    const endIndex = timeSlots.value.findIndex(s => s.startTime === slot.startTime)
    
    if (startIndex === -1 || endIndex === -1) return
    
    // 检查中间时段是否都可用
    for (let i = startIndex; i <= endIndex; i++) {
      if (!timeSlots.value[i].available || timeSlots.value[i].expired) {
        ElMessage.warning('所选时段范围内包含不可预约时段')
        return
      }
    }
    
    selectedEndTime.value = slot.endTime
  } else {
    // 重新选择
    selectedStartTime.value = slot.startTime
    selectedEndTime.value = null
  }
}

// 确认预约
const confirmReservation = async () => {
  if (!canSubmit.value) return
  
  submitting.value = true
  try {
    const dateStr = selectedDate.value.toISOString().split('T')[0]
    
    const res = await request.post('/seat/reserve', {
      seatId: selectedSeat.value.id,
      studentNo: userInfo.value.studentNo,
      date: dateStr,
      startTime: selectedStartTime.value,
      endTime: selectedEndTime.value
    })
    
    if (res.code === 200) {
      ElMessage.success(res.data.message)
      timeSlotDialogVisible.value = false
      loadSeats()
      loadCurrentReservation()
      
      // 跳转到我的预约页面
      setTimeout(() => {
        router.push('/my-reservations')
      }, 1000)
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('预约失败')
  } finally {
    submitting.value = false
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
      loadSeats()
      loadCurrentReservation()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('退座失败')
  }
}

const cancelReservation = async () => {
  try {
    await ElMessageBox.confirm('确定取消该预约吗？', '提示', {
      type: 'warning'
    })
    
    const res = await request.post(`/seat/cancel/${currentReservation.value.reservationId}`)
    if (res.code === 200) {
      ElMessage.success('取消成功')
      loadSeats()
      loadCurrentReservation()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

// 导航方法
const goToAdmin = () => {
  router.push('/admin/dashboard')
}

const goToProfile = () => {
  router.push('/profile')
}

const goToMyReservations = () => {
  router.push('/my-reservations')
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

const goToNotifications = () => {
  router.push('/notifications')
}

const logout = () => {
  localStorage.removeItem('user')
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

/* 时段选择样式 */
.reservation-form {
  padding: 10px;
}

.time-slots-section {
  margin-top: 20px;
}

.time-slots-section h4 {
  margin-bottom: 15px;
  color: #303133;
}

.time-slots-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.time-slot {
  padding: 10px;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.time-slot.available {
  border-color: #67c23a;
  background-color: #f0f9eb;
}

.time-slot.available:hover {
  background-color: #67c23a;
  color: white;
}

.time-slot.occupied {
  border-color: #f56c6c;
  background-color: #fef0f0;
  cursor: not-allowed;
  opacity: 0.6;
}

.time-slot.expired {
  border-color: #909399;
  background-color: #f4f4f5;
  cursor: not-allowed;
  opacity: 0.5;
}

.time-slot.selected {
  border-color: #409eff;
  background-color: #409eff;
  color: white;
}

.slot-time {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 5px;
}

.slot-status {
  font-size: 11px;
}

.selected-info {
  margin-top: 15px;
}

.reservation-status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  z-index: 100;
}

.action-buttons {
  margin-top: 15px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>