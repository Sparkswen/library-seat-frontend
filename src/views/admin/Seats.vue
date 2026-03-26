<template>
  <div class="seats-management">
    <el-card>
      <template #header>
        <div class="header-actions">
          <div class="filter-group">
            <el-select v-model="filterFloor" placeholder="选择楼层" clearable>
              <el-option label="1楼" value="1" />
              <el-option label="2楼" value="2" />
              <el-option label="3楼" value="3" />
            </el-select>
            <el-select v-model="filterStatus" placeholder="座位状态" clearable>
              <el-option label="空闲" value="AVAILABLE" />
              <el-option label="已预约" value="RESERVED" />
              <el-option label="使用中" value="OCCUPIED" />
              <el-option label="维护中" value="MAINTENANCE" />
            </el-select>
            <el-button type="primary" @click="loadSeats">查询</el-button>
          </div>
          <div class="action-group">
            <el-button type="success" @click="showAddDialog">添加座位</el-button>
            <el-button type="warning" @click="batchMaintenance">批量维护</el-button>
          </div>
        </div>
      </template>

      <el-table :data="seats" stripe v-loading="loading">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="seatNo" label="座位编号" width="120" />
        <el-table-column prop="floor" label="楼层" width="80" />
        <el-table-column prop="area" label="区域" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentUser" label="当前用户" width="120" />
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button link type="warning" @click="setMaintenance(row)">维护</el-button>
            <el-button link type="danger" @click="forceRelease(row)">强制释放</el-button>
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const filterFloor = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(90)

const seats = ref([
  { seatNo: '1F-A-01', floor: 1, area: 'A区', status: 'OCCUPIED', currentUser: '张三', startTime: '2026-03-26 08:30' },
  { seatNo: '1F-A-02', floor: 1, area: 'A区', status: 'AVAILABLE', currentUser: '-', startTime: '-' },
  { seatNo: '1F-A-03', floor: 1, area: 'A区', status: 'RESERVED', currentUser: '李四', startTime: '2026-03-26 10:00' },
  { seatNo: '2F-B-05', floor: 2, area: 'B区', status: 'MAINTENANCE', currentUser: '-', startTime: '-' }
])

const getStatusType = (status) => {
  const types = { AVAILABLE: 'success', RESERVED: 'warning', OCCUPIED: 'danger', MAINTENANCE: 'info' }
  return types[status]
}

const getStatusLabel = (status) => {
  const labels = { AVAILABLE: '空闲', RESERVED: '已预约', OCCUPIED: '使用中', MAINTENANCE: '维护中' }
  return labels[status]
}

const loadSeats = () => {
  ElMessage.success('查询完成')
}

const showAddDialog = () => {
  ElMessage.info('添加座位功能')
}

const batchMaintenance = () => {
  ElMessageBox.confirm('确定将选中座位设为维护状态？', '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量维护成功')
  })
}

const viewDetail = (row) => {
  ElMessage.info(`查看座位 ${row.seatNo} 详情`)
}

const setMaintenance = (row) => {
  ElMessageBox.confirm(`确定将 ${row.seatNo} 设为维护状态？`, '提示').then(() => {
    row.status = 'MAINTENANCE'
    ElMessage.success('设置成功')
  })
}

const forceRelease = (row) => {
  ElMessageBox.confirm(`确定强制释放 ${row.seatNo}？`, '警告', {
    type: 'danger'
  }).then(() => {
    row.status = 'AVAILABLE'
    row.currentUser = '-'
    ElMessage.success('强制释放成功')
  })
}
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
}

.action-group {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
