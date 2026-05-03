<template>
  <div class="announcements-page">
    <h2>📢 公告通知</h2>
    <div class="announcement-list">
      <div 
        v-for="item in list" 
        :key="item.id" 
        :class="['announcement-card', { 'is-top': item.topFlag }]"
        @click="showDetail(item)"
      >
        <div class="card-header">
          <el-tag :type="getTypeTag(item.type)" size="small">{{ getTypeText(item.type) }}</el-tag>
          <span class="card-title">{{ item.title }}</span>
          <el-tag v-if="item.topFlag" type="danger" size="small" effect="dark">置顶</el-tag>
        </div>
        <div class="card-time">{{ formatTime(item.publishTime) }}</div>
      </div>
    </div>
    
    <el-dialog v-model="dialogVisible" title="公告详情" width="600px">
      <div class="detail-box">
        <h3>{{ current.title }}</h3>
        <div class="detail-meta">
          <el-tag :type="getTypeTag(current.type)" size="small">{{ getTypeText(current.type) }}</el-tag>
          <span>{{ formatTime(current.publishTime) }}</span>
        </div>
        <div class="detail-body">{{ current.content }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const list = ref([])
const dialogVisible = ref(false)
const current = ref({})

const fetchList = async () => {
  try {
    const res = await axios.get('/api/announcement/published')
    if (res.data.code === 200) {
      list.value = res.data.data
    }
  } catch (err) {
    ElMessage.error('获取公告失败')
  }
}

const showDetail = (item) => {
  current.value = item
  dialogVisible.value = true
}

const getTypeTag = (type) => {
  const map = { SYSTEM: 'primary', CLOSURE: 'warning', REPAIR: 'info' }
  return map[type] || 'info'
}

const getTypeText = (type) => {
  const map = { SYSTEM: '系统公告', CLOSURE: '闭馆通知', REPAIR: '维修通知' }
  return map[type] || '其他'
}

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : ''
}

onMounted(fetchList)
</script>

<style scoped>
.announcements-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}
.announcement-list {
  margin-top: 20px;
}
.announcement-card {
  padding: 16px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: all 0.3s;
}
.announcement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
}
.is-top {
  border-left: 4px solid #f56c6c;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.card-title {
  font-weight: bold;
  font-size: 16px;
  flex: 1;
}
.card-time {
  color: #999;
  font-size: 13px;
}
.detail-box h3 {
  margin-bottom: 12px;
}
.detail-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  color: #666;
  font-size: 14px;
}
.detail-body {
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
}
</style>