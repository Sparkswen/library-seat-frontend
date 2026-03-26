<template>
  <div class="leaderboard-container">
    <el-header class="header">
      <div class="header-left">
        <h2>🏆 学习排行榜</h2>
      </div>
      <div class="header-right">
        <el-button @click="goBack">返回座位页</el-button>
      </div>
    </el-header>

    <div class="content">
      <!-- 我的排名卡片 -->
      <el-card class="my-rank-card">
        <div class="my-info">
          <div class="rank-avatar">
            <el-avatar :size="80" :src="getAvatarUrl(myRank.levelTitle)" />
            <div class="level-badge">{{ myRank.levelDisplayName }}</div>
          </div>
          <div class="rank-details">
            <h3>{{ userInfo.name }} ({{ userInfo.studentNo }})</h3>
            <p>当前排名: <span class="highlight">第 {{ myRank.rank }} 名</span></p>
            <p>总学习时长: <span class="highlight">{{ formatMinutes(myRank.totalStudyMinutes) }}</span></p>
            <p>当前积分: <span class="highlight">{{ myRank.points }} 分</span></p>
          </div>
          <div class="level-progress">
            <h4>等级进度</h4>
            <el-progress :percentage="levelProgress" :color="levelColors" />
            <p class="next-level">距离下一等级还需 {{ nextLevelNeed }} 小时</p>
          </div>
        </div>
      </el-card>

      <!-- 榜单切换 -->
      <el-tabs v-model="activeTab" type="border-card" @tab-change="loadLeaderboard">
        <el-tab-pane label="周榜" name="week">
          <LeaderboardTable :data="leaderboardData" :loading="loading" />
        </el-tab-pane>
        <el-tab-pane label="月榜" name="month">
          <LeaderboardTable :data="leaderboardData" :loading="loading" />
        </el-tab-pane>
        <el-tab-pane label="学期榜" name="semester">
          <LeaderboardTable :data="leaderboardData" :loading="loading" />
        </el-tab-pane>
      </el-tabs>

      <!-- 等级说明 -->
      <el-card class="level-info">
        <template #header>
          <span>📜 等级称号说明</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="4" v-for="level in levels" :key="level.name">
            <div class="level-item" :class="{ active: myRank.levelTitle === level.key }">
              <el-avatar :size="60" :src="level.icon" />
              <h4>{{ level.name }}</h4>
              <p>{{ level.condition }}</p>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import LeaderboardTable from '../components/LeaderboardTable.vue'

const router = useRouter()
const activeTab = ref('week')
const loading = ref(false)
const leaderboardData = ref([])
const userInfo = ref({})
const myRank = ref({
  rank: 1,
  levelTitle: 'XUETONG',
  levelDisplayName: '学童',
  totalStudyMinutes: 0,
  points: 0
})

const levels = [
  { key: 'XUETONG', name: '学童', condition: '0-9小时', icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
  { key: 'XUEJIANG', name: '学匠', condition: '10-49小时', icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
  { key: 'XUESHI', name: '学师', condition: '50-99小时', icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
  { key: 'XUEZONG', name: '学宗', condition: '100-199小时', icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
  { key: 'XUESHENG', name: '学圣', condition: '200+小时', icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' }
]

const levelColors = [
  { color: '#909399', percentage: 20 },
  { color: '#67c23a', percentage: 40 },
  { color: '#e6a23c', percentage: 60 },
  { color: '#f56c6c', percentage: 80 },
  { color: '#8b5cf6', percentage: 100 }
]

const levelProgress = computed(() => {
  const hours = (myRank.value.totalStudyMinutes || 0) / 60
  if (hours >= 200) return 100
  if (hours >= 100) return (hours - 100) / 100 * 100
  if (hours >= 50) return (hours - 50) / 50 * 100
  if (hours >= 10) return (hours - 10) / 40 * 100
  return hours / 10 * 100
})

const nextLevelNeed = computed(() => {
  const hours = (myRank.value.totalStudyMinutes || 0) / 60
  if (hours >= 200) return 0
  if (hours >= 100) return Math.ceil(200 - hours)
  if (hours >= 50) return Math.ceil(100 - hours)
  if (hours >= 10) return Math.ceil(50 - hours)
  return Math.ceil(10 - hours)
})

const getAvatarUrl = (level) => {
  const seed = { 'XUETONG': 1, 'XUEJIANG': 2, 'XUESHI': 3, 'XUEZONG': 4, 'XUESHENG': 5 }[level] || 1
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
}

const formatMinutes = (minutes) => {
  if (!minutes) return '0小时0分钟'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}小时${m}分钟`
}

const loadUserInfo = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  userInfo.value = user
  myRank.value = {
    rank: 1,
    levelTitle: user.levelTitle || 'XUETONG',
    levelDisplayName: user.levelDisplayName || '学童',
    totalStudyMinutes: user.totalStudyMinutes || 0,
    points: user.points || 0
  }
}

const loadLeaderboard = async () => {
  loading.value = true
  // 模拟数据，实际应从后端获取
  setTimeout(() => {
    leaderboardData.value = [
      { rank: 1, name: '张三', studentNo: '2022002', level: '学圣', hours: 250, points: 1500 },
      { rank: 2, name: '李四', studentNo: '2022003', level: '学宗', hours: 180, points: 1200 },
      { rank: 3, name: '王五', studentNo: '2022004', level: '学师', hours: 85, points: 850 },
      { rank: 4, name: '赵六', studentNo: '2022005', level: '学匠', hours: 35, points: 400 },
      { rank: 5, name: '测试学生', studentNo: '2022001', level: myRank.value.levelDisplayName, hours: Math.floor((myRank.value.totalStudyMinutes || 0) / 60), points: myRank.value.points }
    ]
    loading.value = false
  }, 500)
}

const goBack = () => {
  router.push('/seatmap')
}

onMounted(() => {
  loadUserInfo()
  loadLeaderboard()
})
</script>

<style scoped>
.leaderboard-container {
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

.content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.my-rank-card {
  margin-bottom: 20px;
}

.my-info {
  display: flex;
  align-items: center;
  gap: 30px;
}

.rank-avatar {
  text-align: center;
}

.level-badge {
  margin-top: 10px;
  padding: 5px 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-weight: bold;
}

.rank-details {
  flex: 1;
}

.rank-details h3 {
  margin-bottom: 10px;
  color: #303133;
}

.highlight {
  color: #409eff;
  font-weight: bold;
  font-size: 18px;
}

.level-progress {
  width: 300px;
}

.level-progress h4 {
  margin-bottom: 10px;
}

.next-level {
  margin-top: 10px;
  color: #909399;
  font-size: 14px;
}

.level-info {
  margin-top: 20px;
}

.level-item {
  text-align: center;
  padding: 15px;
  border-radius: 8px;
  transition: all 0.3s;
}

.level-item.active {
  background-color: #ecf5ff;
  border: 2px solid #409eff;
}

.level-item h4 {
  margin: 10px 0 5px;
  color: #303133;
}

.level-item p {
  font-size: 12px;
  color: #909399;
}
</style>
