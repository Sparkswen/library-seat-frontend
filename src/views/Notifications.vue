<template>
  <div class="notifications-container">
    <el-header class="header">
      <div class="header-left">
        <h2>🔔 消息中心</h2>
        <el-badge :value="unreadCount" class="unread-badge" v-if="unreadCount > 0" />
      </div>
      <div class="header-right">
        <el-button type="primary" size="small" @click="markAllRead">全部已读</el-button>
        <el-button @click="goBack">返回座位页</el-button>
      </div>
    </el-header>

    <div class="notifications-content">
      <!-- 消息筛选 -->
      <div class="filter-tabs">
        <el-radio-group v-model="filterType" size="large">
          <el-radio-button label="all">全部消息</el-radio-button>
          <el-radio-button label="unread">
            未读消息
            <el-tag v-if="unreadCount > 0" type="danger" size="small" effect="dark" class="count-tag">
              {{ unreadCount }}
            </el-tag>
          </el-radio-button>
          <el-radio-button label="system">系统通知</el-radio-button>
          <el-radio-button label="reservation">预约提醒</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 消息列表 -->
      <div class="message-list" v-loading="loading">
        <el-empty v-if="filteredMessages.length === 0" description="暂无消息" />
        
        <el-card
          v-for="msg in filteredMessages"
          :key="msg.id"
          :class="['message-card', msg.isRead ? 'read' : 'unread']"
          shadow="hover"
        >
          <div class="message-header">
            <div class="message-type">
              <el-tag :type="getMsgType(msg.type)" effect="dark" size="small">
                {{ getTypeLabel(msg.type) }}
              </el-tag>
              <span v-if="!msg.isRead" class="unread-dot"></span>
            </div>
            <span class="message-time">{{ msg.time }}</span>
          </div>
          
          <div class="message-body" @click="handleRead(msg)">
            <h4 class="message-title">{{ msg.title }}</h4>
            <p class="message-content">{{ msg.content }}</p>
            
            <!-- 快捷操作按钮 -->
            <div class="message-actions" v-if="msg.actions">
              <el-button
                v-for="action in msg.actions"
                :key="action.type"
                :type="action.type"
                size="small"
                @click.stop="handleAction(action, msg)"
              >
                {{ action.label }}
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 加载更多 -->
        <div class="load-more" v-if="hasMore">
          <el-button link type="primary" @click="loadMore">加载更多</el-button>
        </div>
      </div>

      <!-- 通知设置 -->
      <el-card class="settings-card">
        <template #header>
          <span>⚙️ 通知设置</span>
        </template>
        <el-form label-position="left" label-width="200px">
          <el-form-item label="预约成功通知">
            <el-switch v-model="settings.reservationSuccess" />
          </el-form-item>
          <el-form-item label="签到提醒（预约后25分钟）">
            <el-switch v-model="settings.checkInReminder" />
          </el-form-item>
          <el-form-item label="违约预警（超时前5分钟）">
            <el-switch v-model="settings.violationWarning" />
          </el-form-item>
          <el-form-item label="每日学习报告">
            <el-switch v-model="settings.dailyReport" />
          </el-form-item>
          <el-form-item label="积分变动通知">
            <el-switch v-model="settings.pointsChange" />
          </el-form-item>
          <el-form-item label="等级升级通知">
            <el-switch v-model="settings.levelUp" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveSettings">保存设置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 消息详情对话框 -->
    <el-dialog v-model="detailVisible" title="消息详情" width="500px">
      <div class="message-detail">
        <div class="detail-header">
          <el-tag :type="getMsgType(selectedMsg?.type)" effect="dark">
            {{ getTypeLabel(selectedMsg?.type) }}
          </el-tag>
          <span class="detail-time">{{ selectedMsg?.time }}</span>
        </div>
        <h3>{{ selectedMsg?.title }}</h3>
        <p class="detail-content">{{ selectedMsg?.content }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const filterType = ref('all')
const detailVisible = ref(false)
const selectedMsg = ref(null)
const hasMore = ref(true)

// 消息列表
const messages = ref([
  {
    id: 1,
    type: 'reservation',
    title: '预约成功提醒',
    content: '您已成功预约 1F-A区-01 座位，请在30分钟内（22:54前）完成签到，否则将视为违约并扣除信用分。',
    time: '22:24',
    isRead: false,
    actions: [
      { type: 'success', label: '立即签到', action: 'checkIn' },
      { type: 'danger', label: '取消预约', action: 'cancel' }
    ]
  },
  {
    id: 2,
    type: 'system',
    title: '等级提升恭喜',
    content: '恭喜您！累计学习时长达到10小时，等级提升至【学匠】，继续加油！',
    time: '昨天 18:30',
    isRead: false
  },
  {
    id: 3,
    type: 'points',
    title: '积分到账通知',
    content: '您今日学习2小时，获得积分12分，当前积分余额：156分。',
    time: '昨天 16:30',
    isRead: true
  },
  {
    id: 4,
    type: 'warning',
    title: '违约预警',
    content: '您预约的座位即将超时，请尽快签到，否则将扣除10信用分。',
    time: '昨天 09:20',
    isRead: true
  },
  {
    id: 5,
    type: 'reservation',
    title: '预约取消通知',
    content: '您预约的 2F-B区-05 座位已取消，座位已释放给其他同学。',
    time: '03-24 15:00',
    isRead: true
  }
])

// 通知设置
const settings = ref({
  reservationSuccess: true,
  checkInReminder: true,
  violationWarning: true,
  dailyReport: false,
  pointsChange: true,
  levelUp: true
})

const unreadCount = computed(() => {
  return messages.value.filter(m => !m.isRead).length
})

const filteredMessages = computed(() => {
  if (filterType.value === 'all') return messages.value
  if (filterType.value === 'unread') return messages.value.filter(m => !m.isRead)
  return messages.value.filter(m => m.type === filterType.value)
})

const getMsgType = (type) => {
  const types = {
    reservation: 'primary',
    system: 'success',
    points: 'warning',
    warning: 'danger',
    violation: 'danger'
  }
  return types[type] || 'info'
}

const getTypeLabel = (type) => {
  const labels = {
    reservation: '预约',
    system: '系统',
    points: '积分',
    warning: '预警',
    violation: '违约'
  }
  return labels[type] || '其他'
}

const handleRead = (msg) => {
  msg.isRead = true
  selectedMsg.value = msg
  detailVisible.value = true
}

const handleAction = (action, msg) => {
  if (action.action === 'checkIn') {
    ElMessage.success('正在跳转签到...')
    router.push('/seatmap')
  } else if (action.action === 'cancel') {
    ElMessageBox.confirm('确定取消该预约吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      ElMessage.success('预约已取消')
      msg.isRead = true
    })
  }
}

const markAllRead = () => {
  messages.value.forEach(m => m.isRead = true)
  ElMessage.success('已全部标记为已读')
}

const loadMore = () => {
  // 加载更多历史消息
  hasMore.value = false
}

const saveSettings = () => {
  ElMessage.success('设置已保存')
}

const goBack = () => {
  router.push('/seatmap')
}

// 模拟WebSocket实时通知
const initWebSocket = () => {
  // 模拟收到新消息
  setTimeout(() => {
    messages.value.unshift({
      id: Date.now(),
      type: 'warning',
      title: '签到提醒',
      content: '您预约的座位还有5分钟超时，请尽快签到！',
      time: '刚刚',
      isRead: false,
      actions: [
        { type: 'success', label: '立即签到', action: 'checkIn' }
      ]
    })
    ElMessage.warning('您有一条新的签到提醒')
  }, 30000) // 30秒后模拟提醒
}

onMounted(() => {
  initWebSocket()
})
</script>

<style scoped>
.notifications-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.unread-badge {
  margin-left: 10px;
}

.notifications-content {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.filter-tabs {
  text-align: center;
  margin-bottom: 20px;
}

.count-tag {
  margin-left: 5px;
}

.message-list {
  margin-bottom: 20px;
}

.message-card {
  margin-bottom: 15px;
  transition: all 0.3s;
}

.message-card.unread {
  border-left: 4px solid #409eff;
  background-color: #f0f9ff;
}

.message-card.read {
  border-left: 4px solid #dcdfe6;
  opacity: 0.8;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.message-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background-color: #f56c6c;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}

.message-time {
  color: #909399;
  font-size: 13px;
}

.message-body {
  cursor: pointer;
}

.message-title {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
}

.message-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.message-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

.settings-card {
  margin-top: 20px;
}

.message-detail {
  padding: 10px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.detail-time {
  color: #909399;
}

.detail-content {
  color: #606266;
  line-height: 1.8;
  margin-top: 15px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}
</style>
