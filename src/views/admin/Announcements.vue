<template>
  <div class="admin-announcements">
    <div class="page-header">
      <h2>📢 公告管理</h2>
      <el-button type="primary" @click="openDialog()">发布公告</el-button>
    </div>
    
    <el-table :data="tableData" v-loading="loading" style="margin-top: 20px">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTypeTag(row.type)">{{ getTypeText(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getStatusTag(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="topFlag" label="置顶" width="80">
        <template #default="{ row }">
          <el-switch v-model="row.topFlag" @change="handleTopChange(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="publishTime" label="发布时间" width="170">
        <template #default="{ row }">
          {{ formatTime(row.publishTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 'DRAFT'" type="success" size="small" @click="handlePublish(row)">发布</el-button>
          <el-button v-if="row.status === 'PUBLISHED'" type="warning" size="small" @click="handleWithdraw(row)">撤回</el-button>
          <el-button type="primary" size="small" @click="openDialog(row)">编辑</el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="size"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="fetchData"
      style="margin-top: 20px; justify-content: flex-end"
    />
    
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑公告' : '发布公告'" width="700px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="系统公告" value="SYSTEM" />
            <el-option label="闭馆通知" value="CLOSURE" />
            <el-option label="维修通知" value="REPAIR" />
          </el-select>
        </el-form-item>
        <el-form-item label="置顶" prop="topFlag">
          <el-switch v-model="form.topFlag" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="8" placeholder="支持换行，发布后学生端可见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const tableData = ref([])
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({
  title: '',
  content: '',
  type: 'SYSTEM',
  topFlag: false
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/announcement', {
      params: { page: page.value - 1, size: size.value }
    })
    if (res.data.code === 200) {
      tableData.value = res.data.data.content
      total.value = res.data.data.totalElements
    }
  } catch (err) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const openDialog = (row = null) => {
  if (row) {
    isEdit.value = true
    form.value = { ...row }
  } else {
    isEdit.value = false
    form.value = { title: '', content: '', type: 'SYSTEM', topFlag: false }
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await axios.put(`/api/announcement/${form.value.id}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/announcement', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

const handlePublish = async (row) => {
  try {
    await axios.post(`/api/announcement/${row.id}/publish`)
    ElMessage.success('发布成功')
    fetchData()
  } catch (err) {
    ElMessage.error('发布失败')
  }
}

const handleWithdraw = async (row) => {
  try {
    await axios.post(`/api/announcement/${row.id}/withdraw`)
    ElMessage.success('撤回成功')
    fetchData()
  } catch (err) {
    ElMessage.error('撤回失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该公告？', '提示', { type: 'warning' })
    await axios.delete(`/api/announcement/${row.id}`)
    ElMessage.success('删除成功')
    fetchData()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleTopChange = async (row) => {
  try {
    await axios.put(`/api/announcement/${row.id}`, {
      title: row.title,
      content: row.content,
      type: row.type,
      topFlag: row.topFlag
    })
    ElMessage.success('设置成功')
    fetchData()
  } catch (err) {
    ElMessage.error('设置失败')
    row.topFlag = !row.topFlag
  }
}

const getTypeTag = (type) => {
  const map = { SYSTEM: 'primary', CLOSURE: 'warning', REPAIR: 'info' }
  return map[type] || 'info'
}

const getTypeText = (type) => {
  const map = { SYSTEM: '系统公告', CLOSURE: '闭馆通知', REPAIR: '维修通知' }
  return map[type] || '其他'
}

const getStatusTag = (status) => {
  const map = { DRAFT: 'info', PUBLISHED: 'success', WITHDRAWN: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { DRAFT: '草稿', PUBLISHED: '已发布', WITHDRAWN: '已撤回' }
  return map[status] || status
}

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}

onMounted(fetchData)
</script>

<style scoped>
.admin-announcements {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>