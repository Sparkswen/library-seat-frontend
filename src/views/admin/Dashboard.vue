<template>
  <div class="dashboard">
    <!-- 核心指标 -->
    <el-row :gutter="20" class="metric-row">
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-icon blue">👥</div>
          <div class="metric-info">
            <div class="metric-value">1,234</div>
            <div class="metric-label">今日到馆人数</div>
            <div class="metric-compare">↑ 12% 较昨日</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-icon green">📚</div>
          <div class="metric-info">
            <div class="metric-value">892</div>
            <div class="metric-label">当前在馆人数</div>
            <div class="metric-compare">座位利用率 68%</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-icon orange">📅</div>
          <div class="metric-info">
            <div class="metric-value">156</div>
            <div class="metric-label">今日预约数</div>
            <div class="metric-compare">↑ 8% 较昨日</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-icon red">⚠️</div>
          <div class="metric-info">
            <div class="metric-value">3</div>
            <div class="metric-label">待处理违规</div>
            <div class="metric-compare">需及时清理占座</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时座位状态 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>📊 各楼层实时 occupancy</span>
              <el-radio-group v-model="floorView" size="small">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="1">1楼</el-radio-button>
                <el-radio-button label="2">2楼</el-radio-button>
                <el-radio-button label="3">3楼</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="floor-status">
            <div v-for="floor in floorData" :key="floor.level" class="floor-item">
              <h4>{{ floor.level }}楼 - {{ floor.area }}</h4>
              <el-progress 
                :percentage="floor.occupancy" 
                :color="getProgressColor(floor.occupancy)"
                :stroke-width="20"
                striped
              />
              <div class="floor-detail">
                <span>总座位: {{ floor.total }}</span>
                <span>空闲: {{ floor.available }}</span>
                <span>使用中: {{ floor.occupied }}</span>
                <span>已预约: {{ floor.reserved }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>⏰ 今日高峰时段</span>
          </template>
          <v-chart class="peak-chart" :option="peakOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 异常预警 -->
    <el-card class="alert-card">
      <template #header>
        <div class="card-header">
          <span>🚨 实时异常监控</span>
          <el-button type="primary" size="small" @click="refreshAlerts">刷新</el-button>
        </div>
      </template>
      <el-table :data="alerts" stripe>
        <el-table-column prop="time" label="时间" width="100" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === '占座' ? 'danger' : 'warning'">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" width="150" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="handleAlert(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent])

const floorView = ref('all')

const floorData = ref([
  { level: 1, area: 'A区', total: 30, available: 5, occupied: 20, reserved: 5, occupancy: 83 },
  { level: 1, area: 'B区', total: 30, available: 8, occupied: 18, reserved: 4, occupancy: 73 },
  { level: 1, area: 'C区', total: 30, available: 12, occupied: 15, reserved: 3, occupancy: 60 },
  { level: 2, area: 'A区', total: 30, available: 3, occupied: 25, reserved: 2, occupancy: 90 },
  { level: 2, area: 'B区', total: 30, available: 6, occupied: 22, reserved: 2, occupancy: 80 },
  { level: 2, area: 'C区', total: 30, available: 10, occupied: 18, reserved: 2, occupancy: 67 },
  { level: 3, area: 'A区', total: 30, available: 15, occupied: 12, reserved: 3, occupancy: 50 },
  { level: 3, area: 'B区', total: 30, available: 18, occupied: 10, reserved: 2, occupancy: 40 },
  { level: 3, area: 'C区', total: 30, available: 20, occupied: 8, reserved: 2, occupancy: 33 }
])

const alerts = ref([
  { time: '10:23', type: '占座', location: '2F-A区-05', description: '预约超时30分钟未签到，座位被占用' },
  { time: '10:15', type: '占座', location: '1F-B区-12', description: '物品遗留超过2小时，无人使用' },
  { time: '09:58', type: '异常', location: '3F-C区-08', description: '检测到长时间无人但物品占用' }
])

const peakOption = ref({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['8点', '10点', '12点', '14点', '16点', '18点', '20点', '22点'] },
  yAxis: { type: 'value', name: '人数' },
  series: [{
    data: [120, 380, 450, 520, 480, 350, 280, 150],
    type: 'bar',
    itemStyle: { color: '#409eff' }
  }]
})

const getProgressColor = (percentage) => {
  if (percentage >= 90) return '#f56c6c'
  if (percentage >= 70) return '#e6a23c'
  return '#67c23a'
}

const refreshAlerts = () => {
  ElMessage.success('已刷新')
}

const handleAlert = (row) => {
  ElMessage.success(`已处理: ${row.location}`)
  alerts.value = alerts.value.filter(a => a !== row)
}
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.metric-row {
  margin-bottom: 20px;
}

.metric-card {
  display: flex;
  align-items: center;
  padding: 15px;
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

.metric-icon.blue { background: rgba(64, 158, 255, 0.1); }
.metric-icon.green { background: rgba(103, 194, 58, 0.1); }
.metric-icon.orange { background: rgba(230, 162, 60, 0.1); }
.metric-icon.red { background: rgba(245, 108, 108, 0.1); }

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.metric-label {
  color: #909399;
  margin-top: 5px;
}

.metric-compare {
  font-size: 12px;
  color: #67c23a;
  margin-top: 5px;
}

.chart-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.floor-status {
  max-height: 400px;
  overflow-y: auto;
}

.floor-item {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.floor-item:last-child {
  border-bottom: none;
}

.floor-item h4 {
  margin-bottom: 10px;
  color: #303133;
}

.floor-detail {
  display: flex;
  gap: 20px;
  margin-top: 10px;
  font-size: 13px;
  color: #606266;
}

.peak-chart {
  height: 300px;
}

.alert-card {
  margin-top: 20px;
}
</style>
