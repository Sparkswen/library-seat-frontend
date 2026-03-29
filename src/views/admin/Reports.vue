<template>
  <div class="reports-management">
    <!-- 核心指标 -->
    <el-row :gutter="20" class="metric-row">
      <el-col :span="4" v-for="metric in metrics" :key="metric.label">
        <el-card class="metric-card">
          <div class="metric-value" :style="{ color: metric.color }">{{ metric.value }}</div>
          <div class="metric-label">{{ metric.label }}</div>
          <div class="metric-compare" :class="metric.trend > 0 ? 'up' : 'down'">
            {{ metric.trend > 0 ? '↑' : '↓' }} {{ Math.abs(metric.trend) }}% 环比
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>📈 每日到馆人数趋势</span>
              <el-radio-group v-model="trendPeriod" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart class="chart" :option="attendanceOption" autoresize />
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>🕐 时段分布热力图</span>
            </div>
          </template>
          <v-chart class="chart" :option="heatmapOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>🏢 各楼层使用率</span>
          </template>
          <v-chart class="chart" :option="floorOption" autoresize />
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>👥 用户等级分布</span>
          </template>
          <v-chart class="chart" :option="levelOption" autoresize />
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>⚠️ 违规类型统计</span>
          </template>
          <v-chart class="chart" :option="violationOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据报表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📊 详细数据报表</span>
          <div>
            <el-date-picker
              v-model="reportDate"
              type="month"
              placeholder="选择月份"
              style="margin-right: 10px"
            />
            <el-button type="primary" @click="exportReport">导出报表</el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="reportData" stripe>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="visitors" label="到馆人数" width="100" />
        <el-table-column prop="reservations" label="预约数" width="100" />
        <el-table-column prop="checkIns" label="签到数" width="100" />
        <el-table-column prop="avgDuration" label="平均时长" width="100" />
        <el-table-column prop="peakHour" label="高峰时段" width="100" />
        <el-table-column prop="occupancyRate" label="座位利用率" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.occupancyRate" :color="getProgressColor" />
          </template>
        </el-table-column>
        <el-table-column prop="violations" label="违约数" width="80" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart, HeatmapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  VisualMapComponent
])

const trendPeriod = ref('week')
const reportDate = ref(new Date())

const metrics = ref([
  { label: '今日到馆', value: '1,234', color: '#409eff', trend: 12 },
  { label: '今日预约', value: '856', color: '#67c23a', trend: 8 },
  { label: '平均时长', value: '3.5h', color: '#e6a23c', trend: -5 },
  { label: '座位利用率', value: '78%', color: '#f56c6c', trend: 15 },
  { label: '活跃用户数', value: '567', color: '#8b5cf6', trend: 20 },
  { label: '违约率', value: '2.1%', color: '#909399', trend: -30 }
])

const attendanceOption = ref({
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: { type: 'value', name: '人数' },
  series: [{
    data: [1200, 1350, 1180, 1420, 1500, 980, 850],
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
})

const heatmapOption = ref({
  tooltip: { position: 'top' },
  grid: { height: '50%', top: '10%' },
  xAxis: {
    type: 'category',
    data: ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
    splitArea: { show: true }
  },
  yAxis: {
    type: 'category',
    data: ['1F', '2F', '3F'],
    splitArea: { show: true }
  },
  visualMap: {
    min: 0,
    max: 100,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: '15%',
    inRange: {
      color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
    }
  },
  series: [{
    name: '使用率',
    type: 'heatmap',
    data: [
      [0, 0, 85], [0, 1, 90], [0, 2, 60],
      [1, 0, 95], [1, 1, 98], [1, 2, 75],
      [2, 0, 70], [2, 1, 75], [2, 2, 50],
      [3, 0, 88], [3, 1, 92], [3, 2, 65],
      [4, 0, 82], [4, 1, 85], [4, 2, 55],
      [5, 0, 60], [5, 1, 65], [5, 2, 40],
      [6, 0, 45], [6, 1, 50], [6, 2, 30],
      [7, 0, 30], [7, 1, 35], [7, 2, 20]
    ],
    label: { show: true }
  }]
})

const floorOption = ref({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    data: [
      { value: 35, name: '1楼', itemStyle: { color: '#409eff' } },
      { value: 40, name: '2楼', itemStyle: { color: '#67c23a' } },
      { value: 25, name: '3楼', itemStyle: { color: '#e6a23c' } }
    ]
  }]
})

const levelOption = ref({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie',
    radius: '60%',
    data: [
      { value: 150, name: '学童', itemStyle: { color: '#909399' } },
      { value: 280, name: '学匠', itemStyle: { color: '#67c23a' } },
      { value: 180, name: '学师', itemStyle: { color: '#e6a23c' } },
      { value: 80, name: '学宗', itemStyle: { color: '#f56c6c' } },
      { value: 20, name: '学圣', itemStyle: { color: '#8b5cf6' } }
    ]
  }]
})

const violationOption = ref({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: ['预约超时', '物品占座', '恶意预约', '其他违规']
  },
  yAxis: { type: 'value' },
  series: [{
    data: [45, 32, 12, 8],
    type: 'bar',
    itemStyle: {
      color: (params) => {
        const colors = ['#f56c6c', '#e6a23c', '#409eff', '#909399']
        return colors[params.dataIndex]
      }
    }
  }]
})

const reportData = ref([
  { date: '03-28', visitors: 1234, reservations: 856, checkIns: 789, avgDuration: '3.2h', peakHour: '14:00', occupancyRate: 78, violations: 3 },
  { date: '03-27', visitors: 1156, reservations: 820, checkIns: 756, avgDuration: '3.5h', peakHour: '15:00', occupancyRate: 72, violations: 5 },
  { date: '03-26', visitors: 1320, reservations: 900, checkIns: 850, avgDuration: '3.1h', peakHour: '10:00', occupancyRate: 82, violations: 2 },
  { date: '03-25', visitors: 1089, reservations: 780, checkIns: 720, avgDuration: '3.8h', peakHour: '14:00', occupancyRate: 68, violations: 4 },
  { date: '03-24', visitors: 1456, reservations: 980, checkIns: 920, avgDuration: '2.9h', peakHour: '16:00', occupancyRate: 88, violations: 6 }
])

const getProgressColor = (percentage) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

const exportReport = () => {
  ElMessage.success('报表导出成功')
}

onMounted(() => {
  // 加载数据
})
</script>

<style scoped>
.metric-row {
  margin-bottom: 20px;
}

.metric-card {
  text-align: center;
  padding: 15px;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.metric-label {
  color: #909399;
  font-size: 13px;
  margin-bottom: 5px;
}

.metric-compare {
  font-size: 12px;
}

.metric-compare.up {
  color: #67c23a;
}

.metric-compare.down {
  color: #f56c6c;
}

.chart-row {
  margin-bottom: 20px;
}

.chart {
  height: 300px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
