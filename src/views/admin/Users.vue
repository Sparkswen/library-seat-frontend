<template>
  <div class="users-management">
    <el-card>
      <template #header>
        <div class="header-actions">
          <div class="filter-group">
            <el-input v-model="searchKeyword" placeholder="搜索学号/姓名" style="width: 200px" />
            <el-select v-model="filterRole" placeholder="角色" clearable style="width: 120px">
              <el-option label="学生" value="STUDENT" />
              <el-option label="馆员" value="LIBRARIAN" />
              <el-option label="管理员" value="ADMIN" />
            </el-select>
            <el-select v-model="filterLevel" placeholder="等级" clearable style="width: 120px">
              <el-option label="学童" value="XUETONG" />
              <el-option label="学匠" value="XUEJIANG" />
              <el-option label="学师" value="XUESHI" />
              <el-option label="学宗" value="XUEZONG" />
              <el-option label="学圣" value="XUESHENG" />
            </el-select>
            <el-button type="primary" @click="loadUsers">查询</el-button>
          </div>
          <div>
            <el-button type="success" @click="showAddDialog">添加用户</el-button>
            <el-button type="warning" @click="exportUsers">导出数据</el-button>
          </div>
        </div>
      </template>

      <el-table :data="users" stripe v-loading="loading">
        <el-table-column prop="studentNo" label="学号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ getRoleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="levelTitle" label="等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.levelTitle)" effect="dark">
              {{ getLevelLabel(row.levelTitle) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creditScore" label="信用分" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.creditScore < 60 ? '#f56c6c' : row.creditScore < 80 ? '#e6a23c' : '#67c23a' }">
              {{ row.creditScore }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="totalStudyMinutes" label="总学习时长" width="120">
          <template #default="{ row }">
            {{ Math.floor(row.totalStudyMinutes / 60) }}小时
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100" />
        <el-table-column prop="violationCount" label="违约次数" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.violationCount > 0 ? '#f56c6c' : '#67c23a' }">{{ row.violationCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="160" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button link type="warning" @click="editUser(row)">编辑</el-button>
            <el-button link type="danger" @click="resetPassword(row)">重置密码</el-button>
            <el-button v-if="row.role === 'STUDENT'" link type="info" @click="adjustCredit(row)">调整信用</el-button>
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

    <!-- 用户详情对话框 -->
    <el-dialog v-model="detailVisible" title="用户详情" width="700px">
      <el-row :gutter="20" v-if="selectedUser">
        <el-col :span="12">
          <el-card>
            <template #header>基本信息</template>
            <p><strong>学号：</strong>{{ selectedUser.studentNo }}</p>
            <p><strong>姓名：</strong>{{ selectedUser.name }}</p>
            <p><strong>角色：</strong>{{ getRoleLabel(selectedUser.role) }}</p>
            <p><strong>注册时间：</strong>{{ selectedUser.createTime }}</p>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>学习数据</template>
            <p><strong>当前等级：</strong>{{ getLevelLabel(selectedUser.levelTitle) }}</p>
            <p><strong>总学习时长：</strong>{{ Math.floor(selectedUser.totalStudyMinutes / 60) }}小时{{ selectedUser.totalStudyMinutes % 60 }}分钟</p>
            <p><strong>当前积分：</strong>{{ selectedUser.points }}</p>
            <p><strong>学习次数：</strong>{{ selectedUser.studyCount }}次</p>
          </el-card>
        </el-col>
      </el-row>
      <el-card style="margin-top: 20px" v-if="selectedUser">
        <template #header>信用记录</template>
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in selectedUser.creditRecords"
            :key="index"
            :type="record.change > 0 ? 'success' : 'danger'"
            :timestamp="record.time"
          >
            {{ record.reason }} {{ record.change > 0 ? '+' : '' }}{{ record.change }}分
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="editVisible" title="编辑用户" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="学号">
          <el-input v-model="editForm.studentNo" disabled />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role">
            <el-option label="学生" value="STUDENT" />
            <el-option label="馆员" value="LIBRARIAN" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
        <el-form-item label="积分">
          <el-input-number v-model="editForm.points" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const searchKeyword = ref('')
const filterRole = ref('')
const filterLevel = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(234)
const detailVisible = ref(false)
const editVisible = ref(false)
const selectedUser = ref(null)
const editForm = ref({})

const users = ref([
  {
    studentNo: '2022001',
    name: '张三',
    role: 'STUDENT',
    levelTitle: 'XUESHI',
    creditScore: 95,
    totalStudyMinutes: 3600,
    points: 360,
    violationCount: 0,
    studyCount: 25,
    createTime: '2026-01-15 10:30:00',
    creditRecords: [
      { time: '2026-03-28 10:00', reason: '完成学习', change: +10 },
      { time: '2026-03-25 14:30', reason: '预约超时', change: -10 }
    ]
  },
  {
    studentNo: '2022002',
    name: '李四',
    role: 'STUDENT',
    levelTitle: 'XUEJIANG',
    creditScore: 80,
    totalStudyMinutes: 1800,
    points: 180,
    violationCount: 1,
    studyCount: 15,
    createTime: '2026-01-20 09:00:00',
    creditRecords: [
      { time: '2026-03-20 16:00', reason: '违约未签到', change: -10 }
    ]
  },
  {
    studentNo: 'admin',
    name: '系统管理员',
    role: 'ADMIN',
    levelTitle: 'XUETONG',
    creditScore: 100,
    totalStudyMinutes: 0,
    points: 0,
    violationCount: 0,
    studyCount: 0,
    createTime: '2026-01-01 00:00:00',
    creditRecords: []
  }
])

const getRoleType = (role) => {
  const types = { STUDENT: '', LIBRARIAN: 'warning', ADMIN: 'danger' }
  return types[role]
}

const getRoleLabel = (role) => {
  const labels = { STUDENT: '学生', LIBRARIAN: '馆员', ADMIN: '管理员' }
  return labels[role]
}

const getLevelType = (level) => {
  const types = {
    XUETONG: '',
    XUEJIANG: 'success',
    XUESHI: 'warning',
    XUEZONG: 'danger',
    XUESHENG: 'danger'
  }
  return types[level]
}

const getLevelLabel = (level) => {
  const labels = {
    XUETONG: '学童',
    XUEJIANG: '学匠',
    XUESHI: '学师',
    XUEZONG: '学宗',
    XUESHENG: '学圣'
  }
  return labels[level]
}

const loadUsers = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

const viewDetail = (row) => {
  selectedUser.value = row
  detailVisible.value = true
}

const editUser = (row) => {
  editForm.value = { ...row }
  editVisible.value = true
}

const saveEdit = () => {
  const index = users.value.findIndex(u => u.studentNo === editForm.value.studentNo)
  if (index !== -1) {
    users.value[index] = { ...users.value[index], ...editForm.value }
  }
  editVisible.value = false
  ElMessage.success('保存成功')
}

const resetPassword = (row) => {
  ElMessageBox.confirm(`确定重置 ${row.name} 的密码为 123456？`, '提示').then(() => {
    ElMessage.success('密码重置成功')
  })
}

const adjustCredit = (row) => {
  ElMessageBox.prompt('请输入调整分值（正数加分，负数减分）', '调整信用分', {
    inputPattern: /^-?\d+$/,
    inputErrorMessage: '请输入数字'
  }).then(({ value }) => {
    row.creditScore += parseInt(value)
    row.creditRecords.unshift({
      time: new Date().toLocaleString(),
      reason: '管理员调整',
      change: parseInt(value)
    })
    ElMessage.success('信用分调整成功')
  })
}

const showAddDialog = () => {
  ElMessage.info('添加用户功能')
}

const exportUsers = () => {
  ElMessage.success('用户数据导出成功')
}

onMounted(() => {
  loadUsers()
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
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
