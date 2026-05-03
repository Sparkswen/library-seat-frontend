<template>
  <div class="my-reservations">
    <el-header class="header">
      <div class="header-left">
        <h2>📋 我的预约</h2>
      </div>
      <div class="header-right">
        <el-button @click="goBack">返回座位页</el-button>
      </div>
    </el-header>

    <div class="content">
      <!-- 当前预约 -->
      <el-card v-if="currentReservation" class="current-card">
        <template #header>
          <span>⏰ 当前进行中的预约</span>
        </template>
        <div class="reservation-detail">
          <div class="detail-item">
            <span class="label">座位：</span>
            <span class="value">{{ currentReservation.seatNo }}</span>
          </div>
          <div class="detail-item">
            <span class="label">日期：</span>
            <span class="value">{{ currentReservation.date }}</span>
          </div>
          <div class="detail-item">
            <span class="label">时段：</span>
            <span class="value">{{ currentReservation.startTime }} - {{ currentReservation.endTime }}</span>
          </div>
          <div class="detail-item">
            <span class="label">状态：</span>
            <el-tag :type="getStatusType(currentReservation.status)">
              {{ currentReservation.statusDisplay }}
            </el-tag>
          </div>
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
        </div>
      </el-card>

      <!-- 历史预约列表 -->
      <el-card>
        <template #header>
          <span>📚 预约记录</span>
        </template>
        
        <el-empty v-if="reservations.length === 0" description="暂无预约记录" />
        
        <el-timeline v-else>
          <el-timeline-item
            v-for="item in reservations"
            :key="item.id"
            :type="getTimelineType(item.status)"
            :timestamp="item.date + ' ' + item.startTime + '-' + item.endTime"
          >
            <el-card class="timeline-card">
              <div class="timeline-content">
                <div class="info">
                  <h4>{{ item.seatNo }}</h4>
                  <p>{{ item.floor }}楼 {{ item.area }}</p>
                  <p>学习时长: {{ item.studyMinutes ? item.studyMinutes + '分钟' : '-' }}</p>
                </div>
                <div class="status">
                  <el-tag :type="getStatusType(item.status)" size="small">
                    {{ item.statusDisplay }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const router = useRouter()
const currentReservation = ref(null)
const reservations = ref([])

const loadData = async () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (!user.studentNo) {
    router.push('/login')
    return
  }

  try {
    // 获取当前预约
    const currentRes = await request.get('/seat/current', {
      params: { studentNo: user.studentNo }
    })
    if (currentRes.code === 200) {
      currentReservation.value = currentRes.data
    }

    // 获取所有预约
    const allRes = await request.get('/seat/my-reservations', {
      params: { studentNo: user.studentNo }
    })
    if (allRes.code === 200) {
      reservations.value = allRes.data || []
    }
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const getStatusType = (status) => {
  const types = {
    PENDING: 'warning',
    CHECKED_IN: 'success',
    COMPLETED: 'info',
    CANCELLED: 'info',
    NO_SHOW: 'danger'
  }
  return types[status] || 'info'
}

const getTimelineType = (status) => {
  const types = {
    PENDING: 'warning',
    CHECKED_IN: 'success',
    COMPLETED: 'primary',
    CANCELLED: 'info',
    NO_SHOW: 'danger'
  }
  return types[status] || 'info'
}

const checkIn = async () => {
  try {
    const res = await request.post(`/seat/check-in/${currentReservation.value.reservationId}`)
    if (res.code === 200) {
      ElMessage.success('签到成功')
      loadData()
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
      ElMessage.success(`退座成功！获得积分：${res.data.pointsEarned}`)
      loadData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('退座失败')
  }
}

const cancelReservation = async () => {
  try {
    await ElMessageBox.confirm('确定取消该预约吗？', '提示', { type: 'warning' })
    const res = await request.post(`/seat/cancel/${currentReservation.value.reservationId}`)
    if (res.code === 200) {
      ElMessage.success('取消成功')
      loadData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

const goBack = () => {
  router.push('/seatmap')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.my-reservations {
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

.content {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.current-card {
  margin-bottom: 20px;
}

.reservation-detail {
  padding: 10px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.detail-item .label {
  color: #909399;
  width: 80px;
}

.detail-item .value {
  font-weight: bold;
  color: #303133;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.timeline-card {
  margin-bottom: 10px;
}

.timeline-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-content .info h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.timeline-content .info p {
  margin: 3px 0;
  color: #909399;
  font-size: 13px;
}
</style>

@media screen and (max-width: 768px) {
  .content {
    padding: 10px;
  }
  .timeline-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .action-buttons {
    flex-wrap: wrap;
  }
  .el-timeline {
    padding-left: 10px;
  }
}