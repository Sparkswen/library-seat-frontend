<template>
  <div class="reservations-management">
    <el-card>
      <template #header>
        <div class="header-actions">
          <div class="filter-group">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="loadReservations"
            />
            <el-select v-model="filterStatus" placeholder="预约状态" clearable>
              <el-option label="待签到" value="PENDING" />
              <el-option label="学习中" value="CHECKED_IN" />
              <el-option label="已完成" value="COMPLETED" />
              <el-option label="已取消" value="CANCELLED" />
              <el-option label="违约" value="NO_SHOW" />
            </el-select>
            <el-input v-model="searchKeyword" placeholder="搜索学号/姓名" style="width: 200px" />
            <el-button type="primary" @click="loadReservations">查询</el-button>
          </div>
          <el-button type="danger" @click="batchCancel">批量取消</el-button>
        </div>
      </template>

      <el-table :data="reservations" stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="预约ID" width="80" />
        <el-table-column prop="studentNo" label="学号" width="120" />
        <el-table-column prop="studentName" label="姓名" width="100" />
        <el-table-column prop="seatNo" label="座位" width="120" />
        <el-table-column prop="floor" label="楼层" width="80" />
        <el-table-column prop="startTime" label="预约时间" width="160" />
        <el-table-column prop="endTime" label="结束时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studyMinutes" label="学习时长" width="100">
          <template #default="{ row }">
            <span v-if="row.studyMinutes">{{ Math.floor(row.studyMinutes / 60) }}小时{{ row.studyMinutes % 60 }}分</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'PENDING'" link type="success" @click="forceCheckIn(row)">代签到</el-button>
            <el-button v-if="row.status === 'CHECKED_IN'" link type="warning" @click="forceCheckOut(row)">代退座</el-button>
            <el-button link type="danger" @click="cancelReservation(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadReservations"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="预约详情" width="600px">
      <el-descriptions :column="2" border v-if="selectedReservation">
        <el-descriptions-item label="预约ID">{{ selectedReservation.id }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ selectedReservation.studentNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ selectedReservation.studentName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ selectedReservation.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="座位编号">{{ selectedReservation.seatNo }}</el-descriptions-item>
        <el-descriptions-item label="楼层区域">{{ selectedReservation.floor }}楼-{{ selectedReservation.area }}</el-descriptions-item>
        <el-descriptions-item label="预约时间">{{ selectedReservation.startTime }}</el-descriptions-item>
        <el-descriptions-item label="预计结束">{{ selectedReservation.endTime }}</el-descriptions-item>
        <el-descriptions-item label="实际签到">{{ selectedReservation.actualCheckIn || '未签到' }}</el-descriptions-item>
        <el-descriptions-item label="实际签退">{{ selectedReservation.actualCheckOut || '未签退' }}</el-descriptions-item>
        <el-descriptions-item label="学习时长">{{ formatDuration(selectedReservation.studyMinutes) }}</el-descriptions-item>
        <el-descriptions-item label="获得积分">{{ selectedReservation.pointsEarned || 0 }}</el-descriptions-item>
        <el-descriptions-item label="当前状态" :span="2">
          <el-tag :type="getStatusType(selectedReservation.status)" size="large">
            {{ getStatusLabel(selectedReservation.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const dateRange = ref([])
const filterStatus = ref('')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(156)
const selectedReservations = ref([])
const detailVisible = ref(false)
const selectedReservation = ref(null)

const reservations = ref([
  {
    id: 1001,
    studentNo: '2022001',
    studentName: '张三',
    phone: '13800138000',
    seatNo: '1F-A区-01',
    floor: 1,
    area: 'A区',
    startTime: '2026-03-28 08:00',
    endTime: '2026-03-28 12:00',
    actualCheckIn: '2026-03-28 08:05',
    actualCheckOut: null,
    studyMinutes: null,
    pointsEarned: null,
    status: 'CHECKED_IN'
  },
  {
    id: 1002,
    studentNo: '2022002',
    studentName: '李四',
    phone: '13800138001',
    seatNo: '2F-B区-05',
    floor: 2,
    area: 'B区',
    startTime: '2026-03-28 10:00',
    endTime: '2026-03-28 14:00',
    actualCheckIn: null,
    actualCheckOut: null,
    studyMinutes: null,
    pointsEarned: null,
    status: 'PENDING'
  },
  {
    id: 1003,
    studentNo: '2022003',
    studentName: '王五',
    seatNo: '1F-C区-03',
    floor: 1,
    area: 'C区',
    startTime: '2026-03-27 14:00',
    endTime: '2026-03-27 18:00',
    actualCheckIn: '2026-03-27 14:10',
    actualCheckOut: '2026-03-27 17:30',
    studyMinutes: 200,
    pointsEarned: 20,
    status: 'COMPLETED'
  },
  {
    id: 1004,
    studentNo: '2022004',
    studentName: '赵六',
    seatNo: '3F-A区-08',
    floor: 3,
    area: 'A区',
    startTime: '2026-03-27 09:00',
    endTime: '2026-03-27 13:00',
    actualCheckIn: null,
    actualCheckOut: null,
    studyMinutes: null,
    pointsEarned: null,
    status: 'NO_SHOW'
  }
])

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

const getStatusLabel = (status) => {
  const labels = {
    PENDING: '待签到',
    CHECKED_IN: '学习中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    NO_SHOW: '违约'
  }
  return labels[status] || status
}

const formatDuration = (minutes) => {
  if (!minutes) return '-'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}小时${m}分钟`
}

const handleSelectionChange = (selection) => {
  selectedReservations.value = selection
}

const loadReservations = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('加载完成')
  }, 500)
}

const viewDetail = (row) => {
  selectedReservation.value = row
  detailVisible.value = true
}

const forceCheckIn = (row) => {
  ElMessageBox.confirm(`确定为 ${row.studentName} 代签到？`, '提示').then(() => {
    row.status = 'CHECKED_IN'
    row.actualCheckIn = new Date().toLocaleString()
    ElMessage.success('代签到成功')
  })
}

const forceCheckOut = (row) => {
  ElMessageBox.confirm(`确定为 ${row.studentName} 代退座？`, '提示').then(() => {
    row.status = 'COMPLETED'
    row.actualCheckOut = new Date().toLocaleString()
    row.studyMinutes = 240
    row.pointsEarned = 24
    ElMessage.success('代退座成功')
  })
}

const cancelReservation = (row) => {
  ElMessageBox.confirm(`确定取消预约 ${row.id}？`, '警告', { type: 'warning' }).then(() => {
    row.status = 'CANCELLED'
    ElMessage.success('取消成功')
  })
}

const batchCancel = () => {
  if (selectedReservations.value.length === 0) {
    ElMessage.warning('请选择要取消的预约')
    return
  }
  ElMessageBox.confirm(`确定批量取消 ${selectedReservations.value.length} 个预约？`, '警告', { type: 'warning' }).then(() => {
    selectedReservations.value.forEach(row => {
      row.status = 'CANCELLED'
    })
    ElMessage.success('批量取消成功')
  })
}

onMounted(() => {
  loadReservations()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
