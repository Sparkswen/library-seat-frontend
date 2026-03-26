<template>
  <div class="statistics-container">
    <el-header class="header">
      <div class="header-left">
        <h2>📊 学习数据统计</h2>
      </div>
      <div class="header-right">
        <el-radio-group v-model="timeRange" size="small" @change="loadData">
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
          <el-radio-button label="semester">本学期</el-radio-button>
        </el-radio-group>
        <el-button @click="goBack">返回座位页</el-button>
      </div>
    </el-header>

    <div class="statistics-content">
      <!-- 核心指标卡片 -->
      <el-row :gutter="20" class="metric-cards">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="metric-card">
            <div class="metric-icon" style="background: #409eff;">⏰</div>
            <div class="metric-info">
              <div class="metric-value">{{ statistics.totalHours }}</div>
              <div class="metric-label">总学习时长(小时)</div>
              <div class="metric-trend" :class="statistics.hoursTrend > 0 ? 'up' : 'down'">
                {{ statistics.hoursTrend > 0 ? '↑' : '↓' }} {{ Math.abs(statistics.hoursTrend) }}% 环比
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="metric-card">
            <div class="metric-icon" style="background: #67c23a;">📅</div>
            <div class="metric-info">
              <div class="metric-value">{{ statistics.totalDays }}</div>
              <div class="metric-label">学习天数</div>
              <div class="metric-desc">共完成 {{ statistics.totalSessions }} 次学习</div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="metric-card">
            <div class="metric-icon" style="background: #e6a23c;">⭐</div>
            <div class="metric-info">
              <div class="metric-value">{{ statistics.avgHours }}</div>
              <div class="metric-label">日均学习(小时)</div>
              <div class="metric-desc">超过 {{ statistics.beatPercent }}% 的同学</div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="metric-card">
            <div class="metric-icon" style="background: #f56c6c;">🏆</div>
            <div class="metric-info">
              <div class="metric-value">{{ statistics.currentStreak }}</div>
              <div class="metric-label">连续学习(天)</div>
              <div class="metric-desc">最长纪录 {{ statistics.maxStreak }} 天</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="20" class="charts-row">
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <span>📈 学习时长趋势</span>
            </template>
            <v-chart class="chart" :option="trendOption" autoresize />
          </el-card>
        </el-col>
        
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <span>🕐 学习时段分布</span>
            </template>
            <v-chart class="chart" :option="timeOption" autoresize />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="charts-row">
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <span>📚 楼层偏好分析</span>
            </template>
            <v-chart class="chart" :option="floorOption" autoresize />
          </el-card>
        </el-col>
        
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <span>📅 学习打卡日历</span>
            </template>
            <div class="calendar-section">
              <el-calendar v-model="calendarDate">
                <template #date-cell="{ data }">
                  <div :class="['calendar-cell', getDateClass(data.day)]">
                    <span>{{ data.day.split('-').pop() }}</span>
                    <div v-if="getStudyHours(data.day)" class="study-dot">
                      {{ getStudyHours(data.day) }}h
                    </div>
                  </div>
                </template>
              </el-calendar>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 学习记录明细 -->
      <el-card class="record-card">
        <template #header>
          <div class="record-header">
            <span>📝 最近学习记录</span>
            <el-button link type="primary" @click="exportData">导出数据</el-button>
          </div>
        </template>
        <el-table :data="studyRecords" stripe>
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="seatNo" label="座位" width="120" />
          <el-table-column prop="floor" label="楼层" width="80">
            <template #default="{ row }">
              <el-tag size="small">{{ row.floor }}楼</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="学习时长" width="120">
            <template #default="{ row }">
              <span style="color: #409eff; font-weight: bold;">{{ row.duration }}分钟</span>
            </template>
          </el-table-column>
          <el-table-column prop="checkIn" label="签到时间" width="160" />
          <el-table-column prop="checkOut" label="签退时间" width="160" />
          <el-table-column prop="points" label="获得积分" width="100">
            <template #default="{ row }">
              <span style="color: #e6a23c;">+{{ row.points }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalRecords"
            layout="prev, pager, next"
            @current-change="loadRecords"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

const router = useRouter()
const timeRange = ref('week')
const calendarDate = ref(new Date())
const currentPage = ref(1)
const pageSize = ref(10)
const totalRecords = ref(50)

// 统计数据
const statistics = ref({
  totalHours: 24.5,
  hoursTrend: 15,
  totalDays: 12,
  totalSessions: 18,
  avgHours: 2.1,
  beatPercent: 68,
  currentStreak: 3,
  maxStreak: 7
})

// 学习记录
const studyRecords = ref([
  {
    date: '03-26',
    seatNo: '1F-A区-01',
    floor: 1,
    duration: 120,
    checkIn: '14:30',
    checkOut: '16:30',
    points: 12
  },
  {
    date: '03-25',
    seatNo: '2F-B区-05',
    floor: 2,
    duration: 180,
    checkIn: '09:00',
    checkOut: '12:00',
    points: 18
  },
  {
    date: '03-24',
    seatNo: '1F-C区-03',
    floor: 1,
    duration: 90,
    checkIn: '15:00',
    checkOut: '16:30',
    points: 9
  }
])

// 日历数据
const calendarData = ref({
  '2026-03-26': 2,
  '2026-03-25': 3,
  '2026-03-24': 1.5,
  '2026-03-22': 2.5,
  '2026-03-20': 4
})

// 学习时长趋势图
const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: { type: 'value', name: '小时' },
  series: [{
    data: [2, 3.5, 1.5, 4, 2.5, 5, 3],
    type: 'line',
    smooth: true,
    areaStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ]
      }
    },
    itemStyle: { color: '#409eff' }
  }]
}))

// 学习时段分布图
const timeOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: ['8-10点', '10-12点', '12-14点', '14-16点', '16-18点', '18-20点', '20-22点']
  },
  yAxis: { type: 'value', name: '次数' },
  series: [{
    data: [3, 5, 2, 8, 6, 4, 7],
    type: 'bar',
    itemStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#67c23a' },
          { offset: 1, color: '#95d475' }
        ]
      }
    }
  }]
}))

// 楼层偏好图
const floorOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: {
      borderRadius: 10,
      borderColor: '#fff',
      borderWidth: 2
    },
    label: { show: false },
    data: [
      { value: 12, name: '1楼', itemStyle: { color: '#409eff' } },
      { value: 8, name: '2楼', itemStyle: { color: '#67c23a' } },
      { value: 5, name: '3楼', itemStyle: { color: '#e6a23c' } }
    ]
  }]
}))

const getDateClass = (day) => {
  const hours = calendarData.value[day]
  if (!hours) return ''
  if (hours >= 3) return 'high-study'
  if (hours >= 2) return 'medium-study'
  return 'low-study'
}

const getStudyHours = (day) => {
  return calendarData.value[day] || 0
}

const loadData = () => {
  // 根据时间范围加载不同数据
  ElMessage.success(`已切换到${timeRange.value === 'week' ? '本周' : timeRange.value === 'month' ? '本月' : '本学期'}数据`)
}

const loadRecords = () => {
  // 加载分页记录
}

const exportData = () => {
  ElMessage.success('数据导出成功')
}

const goBack = () => {
  router.push('/seatmap')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.statistics-container {
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

.statistics-content {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.metric-cards {
  margin-bottom: 20px;
}

.metric-card {
  display: flex;
  align-items: center;
  padding: 10px;
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-right: 15px;
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.metric-trend {
  font-size: 12px;
  margin-top: 5px;
}

.metric-trend.up {
  color: #67c23a;
}

.metric-trend.down {
  color: #f56c6c;
}

.metric-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart {
  height: 300px;
}

.calendar-section {
  height: 300px;
  overflow: hidden;
}

.calendar-cell {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.calendar-cell.high-study {
  background-color: rgba(103, 194, 58, 0.2);
  border-radius: 4px;
}

.calendar-cell.medium-study {
  background-color: rgba(230, 162, 60, 0.2);
  border-radius: 4px;
}

.calendar-cell.low-study {
  background-color: rgba(64, 158, 255, 0.2);
  border-radius: 4px;
}

.study-dot {
  font-size: 12px;
  color: #67c23a;
  font-weight: bold;
}

.record-card {
  margin-top: 20px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

:deep(.el-calendar-day) {
  height: 50px;
  padding: 0;
}

:deep(.el-calendar-day > div) {
  height: 100%;
}
</style>
