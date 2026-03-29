<template>
  <div class="violations-management">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value" style="color: #f56c6c;">{{ todayViolations }}</div>
          <div class="stat-label">今日违约</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value" style="color: #e6a23c;">{{ weekViolations }}</div>
          <div class="stat-label">本周违约</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value" style="color: #409eff;">{{ pendingClean }}</div>
          <div class="stat-label">待清理占座</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value" style="color: #67c23a;">{{ resolvedToday }}</div>
          <div class="stat-label">今日已处理</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="main-card">
      <template #header>
        <div class="header-actions">
          <div class="filter-group">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
            <el-select v-model="filterStatus" placeholder="处理状态" clearable>
              <el-option label="待处理" value="PENDING" />
              <el-option label="已通知" value="NOTIFIED" />
              <el-option label="已清理" value="RESOLVED" />
              <el-option label="已豁免" value="EXEMPTED" />
            </el-select>
            <el-button type="primary" @click="loadViolations">查询</el-button>
          </div>
          <el-button type="success" @click="batchResolve">批量处理</el-button>
        </div>
      </template>

      <el-table :data="violations" stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="记录ID" width="80" />
        <el-table-column prop="type" label="违规类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'NO_SHOW' ? 'danger' : 'warning'">
              {{ row.type === 'NO_SHOW' ? '预约超时' : '物品占座' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studentNo" label="学号" width="120" />
        <el-table-column prop="studentName" label="姓名" width="100" />
        <el-table-column prop="seatNo" label="座位" width="120" />
        <el-table-column prop="violationTime" label="违规时间" width="160" />
        <el-table-column prop="description" label="违规描述" min-width="200" />
        <el-table-column prop="deductPoints" label="扣分" width="80">
          <template #default="{ row }">
            <span style="color: #f56c6c;">-{{ row.deductPoints }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'PENDING'" link type="primary" @click="notifyStudent(row)">通知学生</el-button>
            <el-button v-if="row.status !== 'RESOLVED'" link type="success" @click="resolveViolation(row)">确认清理</el-button>
            <el-button v-if="row.status === 'PENDING'" link type="warning" @click="exemptViolation(row)">豁免</el-button>
            <el-button link type="danger" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="违规详情" width="600px">
      <el-timeline v-if="selectedViolation">
        <el-timeline-item type="primary" :timestamp="selectedViolation.violationTime">
          <h4>违规发生</h4>
          <p>{{ selectedViolation.description }}</p>
        </el-timeline-item>
        <el-timeline-item v-if="selectedViolation.notifyTime" type="warning" :timestamp="selectedViolation.notifyTime">
          <h4>通知学生</h4>
          <p>已通过{{ selectedViolation.notifyChannel }}通知学生</p>
        </el-timeline-item>
        <el-timeline-item v-if="selectedViolation.resolveTime" type="success" :timestamp="selectedViolation.resolveTime">
          <h4>处理完成</h4>
          <p>管理员 {{ selectedViolation.resolver }} 完成清理</p>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const dateRange = ref([])
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(45)
const selectedViolations = ref([])
const detailVisible = ref(false)
const selectedViolation = ref(null)

const todayViolations = ref(3)
const weekViolations = ref(12)
const pendingClean = ref(2)
const resolvedToday = ref(5)

const violations = ref([
  {
    id: 1,
    type: 'NO_SHOW',
    studentNo: '2022005',
    studentName: '钱七',
    seatNo: '2F-A区-03',
    violationTime: '2026-03-28 10:30:00',
    description: '预约后30分钟未签到，系统自动判定违约',
    deductPoints: 10,
    status: 'PENDING',
    notifyTime: null,
    resolveTime: null,
    resolver: null,
    notifyChannel: null
  },
  {
    id: 2,
    type: 'OCCUPY',
    studentNo: '2022006',
    studentName: '孙八',
    seatNo: '1F-B区-07',
    violationTime: '2026-03-28 09:00:00',
    description: '物品遗留占座超过2小时，无人使用',
    deductPoints: 5,
    status: 'NOTIFIED',
    notifyTime: '2026-03-28 09:05:00',
    resolveTime: null,
    resolver: null,
    notifyChannel: '微信'
  },
  {
    id: 3,
    type: 'NO_SHOW',
    studentNo: '2022007',
    studentName: '周九',
    seatNo: '3F-C区-02',
    violationTime: '2026-03-27 14:00:00',
    description: '预约后未签到，且未取消预约',
    deductPoints: 10,
    status: 'RESOLVED',
    notifyTime: '2026-03-27 14:05:00',
    resolveTime: '2026-03-27 14:35:00',
    resolver: '管理员',
    notifyChannel: '短信'
  }
])

const getStatusType = (status) => {
  const types = {
    PENDING: 'danger',
    NOTIFIED: 'warning',
    RESOLVED: 'success',
    EXEMPTED: 'info'
  }
  return types[status]
}

const getStatusLabel = (status) => {
  const labels = {
    PENDING: '待处理',
    NOTIFIED: '已通知',
    RESOLVED: '已清理',
    EXEMPTED: '已豁免'
  }
  return labels[status]
}

const handleSelectionChange = (selection) => {
  selectedViolations.value = selection
}

const loadViolations = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

const notifyStudent = (row) => {
  ElMessageBox.confirm(`确定通知 ${row.studentName} ？`, '提示').then(() => {
    row.status = 'NOTIFIED'
    row.notifyTime = new Date().toLocaleString()
    row.notifyChannel = '微信'
    ElMessage.success('通知已发送')
  })
}

const resolveViolation = (row) => {
  ElMessageBox.confirm(`确定已完成 ${row.seatNo} 的清理？`, '提示').then(() => {
    row.status = 'RESOLVED'
    row.resolveTime = new Date().toLocaleString()
    row.resolver = '当前管理员'
    ElMessage.success('处理完成')
    resolvedToday.value++
    pendingClean.value = Math.max(0, pendingClean.value - 1)
  })
}

const exemptViolation = (row) => {
  ElMessageBox.prompt('请输入豁免原因', '豁免违规', {
    confirmButtonText: '确认豁免',
    cancelButtonText: '取消'
  }).then(({ value }) => {
    row.status = 'EXEMPTED'
    ElMessage.success('已豁免该违规记录')
  })
}

const viewDetail = (row) => {
  selectedViolation.value = row
  detailVisible.value = true
}

const batchResolve = () => {
  if (selectedViolations.value.length === 0) {
    ElMessage.warning('请选择要处理的记录')
    return
  }
  ElMessageBox.confirm(`确定批量处理 ${selectedViolations.value.length} 条记录？`, '提示').then(() => {
    selectedViolations.value.forEach(row => {
      if (row.status !== 'RESOLVED') {
        row.status = 'RESOLVED'
        row.resolveTime = new Date().toLocaleString()
        row.resolver = '当前管理员'
      }
    })
    ElMessage.success('批量处理完成')
  })
}

onMounted(() => {
  loadViolations()
})
</script>

<style scoped>
.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 10px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.main-card {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
