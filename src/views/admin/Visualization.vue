<template>
  <div class="visualization-container">
    <!-- 顶部筛选栏 -->
    <el-card class="filter-card">
      <div class="filter-row">
        <div class="filter-group">
          <el-date-picker
            v-model="selectedMonth"
            type="month"
            placeholder="选择月份"
            format="YYYY年MM月"
            value-format="YYYY-MM"
            @change="loadData"
          />
          <el-select v-model="selectedFloor" placeholder="选择楼层" clearable @change="loadData">
            <el-option label="全部楼层" value="" />
            <el-option label="1楼" :value="1" />
            <el-option label="2楼" :value="2" />
            <el-option label="3楼" :value="3" />
          </el-select>
          <el-select v-model="selectedArea" placeholder="选择区域" clearable @change="loadData">
            <el-option label="全部区域" value="" />
            <el-option label="A区" value="A区" />
            <el-option label="B区" value="B区" />
            <el-option label="C区" value="C区" />
          </el-select>
          <el-button type="primary" @click="loadData">刷新数据</el-button>
        </div>
        <div class="export-group">
          <el-button type="success" @click="exportData">导出报表</el-button>
        </div>
      </div>
    </el-card>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="metric-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="metric in metrics" :key="metric.label">
        <el-card class="metric-card" :body-style="{ padding: '20px' }">
          <div class="metric-content">
            <div class="metric-icon" :style="{ background: metric.bgColor }">
              {{ metric.icon }}
            </div>
            <div class="metric-info">
              <div class="metric-value" :style="{ color: metric.color }">{{ metric.value }}</div>
              <div class="metric-label">{{ metric.label }}</div>
              <div class="metric-trend" :class="metric.trend > 0 ? 'up' : 'down'">
                {{ metric.trend > 0 ? '↑' : '↓' }} {{ Math.abs(metric.trend) }}% 环比
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 月度预约趋势柱状图 -->
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>📊 月度预约趋势</span>
              <el-radio-group v-model="trendType" size="small" @change="updateTrendChart">
                <el-radio-button label="day">按日</el-radio-button>
                <el-radio-button label="week">按周</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart class="chart" :option="trendChartOption" autoresize />
        </el-card>
      </el-col>

      <!-- 座位状态分布饼图 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card">
          <template #header>
            <span>🥧 座位状态分布</span>
          </template>
          <v-chart class="chart" :option="statusPieOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <!-- 楼层使用率对比柱状图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <span>🏢 各楼层使用率对比</span>
          </template>
          <v-chart class="chart" :option="floorChartOption" autoresize />
        </el-card>
      </el-col>

      <!-- 区域预约热度饼图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <span>🔥 区域预约热度</span>
          </template>
          <v-chart class="chart" :option="areaPieOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 时段热力图 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <span>⏰ 时段预约热力图</span>
          </template>
          <v-chart class="chart heatmap-chart" :option="heatmapOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>📋 座位使用明细</span>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadTableData"
            @current-change="loadTableData"
          />
        </div>
      </template>
      <el-table :data="tableData" stripe v-loading="tableLoading">
        <el-table-column prop="seatNo" label="座位编号" width="120" />
        <el-table-column prop="floor" label="楼层" width="80" />
        <el-table-column prop="area" label="区域" width="80" />
        <el-table-column prop="totalReservations" label="总预约次数" width="120" sortable />
        <el-table-column prop="totalHours" label="累计使用时长(小时)" width="160" sortable />
        <el-table-column prop="avgDailyUsage" label="日均使用(小时)" width="140" sortable />
        <el-table-column prop="occupancyRate" label="利用率" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.occupancyRate" :color="getProgressColor" />
          </template>
        </el-table-column>
        <el-table-column prop="peakHour" label="高峰时段" width="100" />
        <el-table-column label="趋势" width="180">
          <template #default="{ row }">
            <v-chart class="mini-chart" :option="getMiniTrendOption(row.trendData)" autoresize />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart, LineChart, HeatmapChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  VisualMapComponent,
  ToolboxComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  BarChart,
  PieChart,
  LineChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  VisualMapComponent,
  ToolboxComponent,
  DataZoomComponent
])

// ========== 响应式数据 ==========
const selectedMonth = ref('2026-03')
const selectedFloor = ref('')
const selectedArea = ref('')
const trendType = ref('day')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(90)
const tableLoading = ref(false)

// 核心指标
const metrics = ref([
  { icon: '📅', value: '1,234', label: '本月预约总数', color: '#409eff', bgColor: 'rgba(64,158,255,0.1)', trend: 12 },
  { icon: '⏰', value: '3,456', label: '累计学习时长(小时)', color: '#67c23a', bgColor: 'rgba(103,194,58,0.1)', trend: 8 },
  { icon: '📊', value: '78%', label: '平均座位利用率', color: '#e6a23c', bgColor: 'rgba(230,162,60,0.1)', trend: -5 },
  { icon: '👥', value: '567', label: '活跃用户数', color: '#f56c6c', bgColor: 'rgba(245,108,108,0.1)', trend: 15 }
])

// 表格数据
const tableData = ref([
  { seatNo: '1F-A-01', floor: 1, area: 'A区', totalReservations: 45, totalHours: 120, avgDailyUsage: 4.2, occupancyRate: 85, peakHour: '14:00', trendData: [30, 35, 40, 45, 42, 48, 50] },
  { seatNo: '1F-A-02', floor: 1, area: 'A区', totalReservations: 38, totalHours: 98, avgDailyUsage: 3.5, occupancyRate: 72, peakHour: '10:00', trendData: [25, 28, 32, 35, 38, 36, 40] },
  { seatNo: '2F-B-05', floor: 2, area: 'B区', totalReservations: 52, totalHours: 156, avgDailyUsage: 5.2, occupancyRate: 92, peakHour: '16:00', trendData: [40, 42, 45, 48, 50, 52, 55] },
  { seatNo: '3F-C-08', floor: 3, area: 'C区', totalReservations: 22, totalHours: 56, avgDailyUsage: 2.1, occupancyRate: 45, peakHour: '09:00', trendData: [15, 18, 20, 22, 21, 23, 25] }
])

// ========== 图表配置 ==========

// 1. 月度预约趋势柱状图
const trendChartOption = computed(() => {
  const daysInMonth = 31
  const days = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`)
  const data = days.map(() => Math.floor(Math.random() * 50) + 20)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    toolbox: {
      feature: {
        dataZoom: { yAxisIndex: 'none' },
        restore: {},
        saveAsImage: {}
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: days,
      axisLabel: { rotate: 45 }
    },
    yAxis: {
      type: 'value',
      name: '预约次数'
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { start: 0, end: 100 }
    ],
    series: [{
      name: '预约次数',
      type: 'bar',
      data: data,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#188df0' }
        ])
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#2378f7' },
            { offset: 0.7, color: '#2378f7' },
            { offset: 1, color: '#83bff6' }
          ])
        }
      },
      barWidth: '60%'
    }]
  }
})

// 2. 座位状态分布饼图
const statusPieOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [{
    name: '座位状态',
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: {
      borderRadius: 10,
      borderColor: '#fff',
      borderWidth: 2
    },
    label: {
      show: true,
      formatter: '{b}\n{c}个 ({d}%)'
    },
    emphasis: {
      label: {
        show: true,
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    data: [
      { value: 35, name: '空闲', itemStyle: { color: '#67c23a' } },
      { value: 28, name: '已预约', itemStyle: { color: '#e6a23c' } },
      { value: 22, name: '使用中', itemStyle: { color: '#409eff' } },
      { value: 5, name: '维护中', itemStyle: { color: '#909399' } }
    ]
  }]
}))

// 3. 各楼层使用率对比柱状图
const floorChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  legend: {
    data: ['利用率', '预约次数']
  },
  xAxis: {
    type: 'category',
    data: ['1楼', '2楼', '3楼']
  },
  yAxis: [
    {
      type: 'value',
      name: '利用率(%)',
      max: 100
    },
    {
      type: 'value',
      name: '预约次数'
    }
  ],
  series: [
    {
      name: '利用率',
      type: 'bar',
      data: [85, 72, 45],
      itemStyle: { color: '#409eff' },
      barWidth: '30%'
    },
    {
      name: '预约次数',
      type: 'line',
      yAxisIndex: 1,
      data: [520, 380, 210],
      itemStyle: { color: '#e6a23c' },
      smooth: true
    }
  ]
}))

// 4. 区域预约热度饼图
const areaPieOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c}次 ({d}%)'
  },
  series: [{
    name: '预约热度',
    type: 'pie',
    radius: '65%',
    center: ['50%', '50%'],
    data: [
      { value: 450, name: '1F-A区', itemStyle: { color: '#5470c6' } },
      { value: 380, name: '1F-B区', itemStyle: { color: '#91cc75' } },
      { value: 320, name: '1F-C区', itemStyle: { color: '#fac858' } },
      { value: 420, name: '2F-A区', itemStyle: { color: '#ee6666' } },
      { value: 350, name: '2F-B区', itemStyle: { color: '#73c0de' } },
      { value: 280, name: '2F-C区', itemStyle: { color: '#3ba272' } },
      { value: 180, name: '3F-A区', itemStyle: { color: '#fc8452' } },
      { value: 150, name: '3F-B区', itemStyle: { color: '#9a60b4' } },
      { value: 120, name: '3F-C区', itemStyle: { color: '#ea7ccc' } }
    ].sort((a, b) => b.value - a.value),
    roseType: 'area',
    label: {
      formatter: '{b}\n{c}次'
    }
  }]
}))

// 5. 时段预约热力图
const heatmapOption = computed(() => {
  const hours = ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  
  const data = []
  for (let i = 0; i < days.length; i++) {
    for (let j = 0; j < hours.length; j++) {
      data.push([j, i, Math.floor(Math.random() * 100)])
    }
  }

  return {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        return `${days[params.value[1]]} ${hours[params.value[0]]}<br/>预约热度: ${params.value[2]}`
      }
    },
    grid: {
      height: '70%',
      top: '10%'
    },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: { show: true }
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
      }
    },
    series: [{
      name: '预约热度',
      type: 'heatmap',
      data: data,
      label: {
        show: true,
        formatter: (params) => params.value[2]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
})

// ========== 方法 ==========

const getProgressColor = (percentage) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

// 迷你趋势图
const getMiniTrendOption = (data) => ({
  grid: { top: 5, bottom: 5, left: 0, right: 0 },
  xAxis: { type: 'category', show: false, data: ['一', '二', '三', '四', '五', '六', '日'] },
  yAxis: { type: 'value', show: false },
  series: [{
    type: 'line',
    data: data,
    smooth: true,
    symbol: 'none',
    lineStyle: { width: 2, color: '#409eff' },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(64,158,255,0.3)' },
          { offset: 1, color: 'rgba(64,158,255,0.05)' }
        ]
      }
    }
  }]
})

const loadData = () => {
  ElMessage.success(`已加载 ${selectedMonth.value} 数据`)
  // TODO: 调用后端API获取真实数据
}

const loadTableData = () => {
  tableLoading.value = true
  setTimeout(() => {
    tableLoading.value = false
  }, 500)
}

const updateTrendChart = () => {
  // 切换按日/按周视图
  ElMessage.success(`已切换为${trendType.value === 'day' ? '按日' : '按周'}视图`)
}

const exportData = () => {
  ElMessage.success('数据导出成功')
  // TODO: 实现导出Excel功能
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.visualization-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.metric-row {
  margin-bottom: 20px;
}

.metric-card {
  transition: all 0.3s;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.metric-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 5px;
}

.metric-trend {
  font-size: 12px;
}

.metric-trend.up {
  color: #67c23a;
}

.metric-trend.down {
  color: #f56c6c;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart {
  height: 350px;
}

.heatmap-chart {
  height: 400px;
}

.table-card {
  margin-bottom: 20px;
}

.mini-chart {
  width: 100%;
  height: 50px;
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}
</style>